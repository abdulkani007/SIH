import os
import json
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf

def main():
    print("=" * 70)
    print("Kolkata ConvLSTM True 0-6 Hour Weather Nowcasting Pipeline")
    print("=" * 70)

    # 1. Load X and Y from NPZ file
    dataset_path = 'Kolkata_FINAL_CONVLSTM_2023_2025.npz'
    if not os.path.exists(dataset_path):
        dataset_path = os.path.join(os.path.dirname(__file__), 'Kolkata_FINAL_CONVLSTM_2023_2025.npz')
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file {dataset_path} not found.")

    print(f"\nLoading dataset from {dataset_path}...")
    data = np.load(dataset_path)
    X = data['X']  # Shape: (52608, 4, 4, 4) - 30-min frames
    Y = data['Y']  # Shape: (52608, 4, 4, 5) - [thunderstorm, hail, hail_prob, cloudburst, downburst_vel]

    print(f"Loaded X shape: {X.shape}")
    print(f"Loaded Y shape: {Y.shape}")

    # Clean NaNs/Infs if any were present
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    Y = np.nan_to_num(Y, nan=0.0, posinf=0.0, neginf=0.0)

    # 2. Extract Trainable Targets Only
    # Channel 0: Thunderstorm (binary: 0 or 1)
    # Channel 1: Downburst Velocity (continuous: 0 to 40 m/s)
    # Note: Hail (Y[..., 1]) and Cloudburst (Y[..., 3]) have 0 positive samples across all 841,728 points.
    # We strictly exclude them from training to avoid training on empty classes.
    Y_trainable = np.stack([Y[..., 0], Y[..., 4]], axis=-1)  # Shape: (52608, 4, 4, 2)
    print(f"Trainable target tensor shape: {Y_trainable.shape} (Channels: [Thunderstorm, Downburst Velocity])")

    # 3. Chronological splitting by Year
    # Total frames: 52,608 (30-min intervals)
    # 2023 + 2024 = 35,088 frames
    # 2025 = 17,520 frames (test)
    split_2023_2024_end = 35088

    X_train_val_raw = X[:split_2023_2024_end]
    Y_train_val_raw = Y_trainable[:split_2023_2024_end]

    X_test_raw = X[split_2023_2024_end:]
    Y_test_raw = Y_trainable[split_2023_2024_end:]

    # Chronologically split 2023-2024 into Training (80%) and Validation (20%)
    val_split_idx = int(len(X_train_val_raw) * 0.8)

    X_train_raw = X_train_val_raw[:val_split_idx]
    Y_train_raw = Y_train_val_raw[:val_split_idx]

    X_val_raw = X_train_val_raw[val_split_idx:]
    Y_val_raw = Y_train_val_raw[val_split_idx:]

    print(f"\nRaw chronological split counts (30-min frames):")
    print(f"  Train:      {len(X_train_raw):6d} frames (Jan 2023 to Aug 2024)")
    print(f"  Validation: {len(X_val_raw):6d} frames (Aug 2024 to Dec 2024)")
    print(f"  Test:       {len(X_test_raw):6d} frames (Jan 2025 to Dec 2025 - Completely Unseen)")

    # 4. Normalization computed STRICTLY on training data
    channel_names = [
        "Radar Reflectivity (dBZ)",
        "Radar Velocity (m/s)",
        "Satellite IR Temperature (K)",
        "Satellite Cloud Fraction"
    ]

    channel_mins = np.min(X_train_raw, axis=(0, 1, 2)).astype(float)
    channel_maxs = np.max(X_train_raw, axis=(0, 1, 2)).astype(float)
    channel_diffs = np.where(channel_maxs - channel_mins == 0, 1.0, channel_maxs - channel_mins)

    print("\n--- Normalization Parameters (Computed STRICTLY on Train Set) ---")
    for c in range(4):
        print(f"  Channel {c} [{channel_names[c]}]: Min = {channel_mins[c]:.4f}, Max = {channel_maxs[c]:.4f}")

    def normalize_channels(data_arr):
        norm = np.empty_like(data_arr, dtype=np.float32)
        for c in range(4):
            norm[..., c] = (data_arr[..., c] - channel_mins[c]) / channel_diffs[c]
        return norm

    X_train_norm = normalize_channels(X_train_raw)
    X_val_norm = normalize_channels(X_val_raw)
    X_test_norm = normalize_channels(X_test_raw)

    # Save Normalization Parameters to JSON
    norm_params = {
        "channel_names": channel_names,
        "mins": channel_mins.tolist(),
        "maxs": channel_maxs.tolist()
    }
    norm_params_path = os.path.join(os.path.dirname(__file__), "normalization_params.json")
    with open(norm_params_path, "w") as f:
        json.dump(norm_params, f, indent=4)
    print(f"Saved verified normalization parameters to {norm_params_path}")

    # 5. Leak-Free Multi-Horizon Sequence Creation
    # Input:  6 hourly steps [T-5, T-4, T-3, T-2, T-1, T] (step=2 frames = 1 hour)
    # Target: 6 future hourly horizons [T+1, T+2, T+3, T+4, T+5, T+6] (step=2 frames = 1 hour)
    # Total window needed per sequence: 5 hours past + 6 hours future = 11 hours (22 half-hour frames)
    INPUT_STEPS = 6    # T-5 to T (hourly)
    OUTPUT_STEPS = 6   # T+1 to T+6 (hourly)
    FRAME_STRIDE = 2   # 2 frames * 30 min = 1 hour

    def create_multi_horizon_sequences(X_data, Y_data, input_steps=6, output_steps=6, stride=2):
        total_frame_span = (input_steps - 1) * stride + output_steps * stride
        n_samples = len(X_data) - total_frame_span
        if n_samples <= 0:
            raise ValueError("Dataset length is smaller than required multi-horizon sequence window.")

        X_seq = np.zeros((n_samples, input_steps, 4, 4, 4), dtype=np.float32)
        Y_seq = np.zeros((n_samples, output_steps, 4, 4, 2), dtype=np.float32)

        for i in range(n_samples):
            input_indices = [i + s * stride for s in range(input_steps)]
            t_current = input_indices[-1]
            target_indices = [t_current + (h + 1) * stride for h in range(output_steps)]

            X_seq[i] = X_data[input_indices]
            Y_seq[i] = Y_data[target_indices]

        return X_seq, Y_seq

    print(f"\nConstructing leak-free multi-horizon sequence windows...")
    print(f"  Input:  {INPUT_STEPS} hourly history steps (T-5, ..., T)")
    print(f"  Target: {OUTPUT_STEPS} future forecast horizons (T+1, ..., T+6)")

    X_train, Y_train = create_multi_horizon_sequences(X_train_norm, Y_train_raw, INPUT_STEPS, OUTPUT_STEPS, FRAME_STRIDE)
    X_val, Y_val = create_multi_horizon_sequences(X_val_norm, Y_val_raw, INPUT_STEPS, OUTPUT_STEPS, FRAME_STRIDE)
    X_test, Y_test = create_multi_horizon_sequences(X_test_norm, Y_test_raw, INPUT_STEPS, OUTPUT_STEPS, FRAME_STRIDE)

    print(f"Sequence Tensors Constructed:")
    print(f"  X_train: {X_train.shape} | Y_train: {Y_train.shape}")
    print(f"  X_val:   {X_val.shape}   | Y_val:   {Y_val.shape}")
    print(f"  X_test:  {X_test.shape}  | Y_test:  {Y_test.shape}")

    # 6. Build Multi-Horizon ConvLSTM Architecture
    print("\n--- Building Multi-Horizon ConvLSTM Architecture ---")
    inputs = tf.keras.Input(shape=(INPUT_STEPS, 4, 4, 4), name="input_history_sequence")

    # Encoder: ConvLSTM2D
    x = tf.keras.layers.ConvLSTM2D(
        filters=32,
        kernel_size=(3, 3),
        padding='same',
        return_sequences=True,
        activation='tanh',
        name='encoder_convlstm_1'
    )(inputs)
    x = tf.keras.layers.BatchNormalization(name='encoder_bn_1')(x)

    x, state_h, state_c = tf.keras.layers.ConvLSTM2D(
        filters=32,
        kernel_size=(3, 3),
        padding='same',
        return_sequences=False,
        return_state=True,
        activation='tanh',
        name='encoder_convlstm_2'
    )(x)
    x = tf.keras.layers.BatchNormalization(name='encoder_bn_2')(x)

    # Multi-Horizon Projection: Expand state_h to 6 horizons using native Keras layers
    flat_features = tf.keras.layers.Reshape((4 * 4 * 32,), name='spatial_flatten')(x)
    repeated_features = tf.keras.layers.RepeatVector(OUTPUT_STEPS, name='horizon_repeat')(flat_features)
    horizon_features = tf.keras.layers.Reshape((OUTPUT_STEPS, 4, 4, 32), name='horizon_reshape')(repeated_features)

    # Forecaster ConvLSTM across the 6 horizons
    forecaster = tf.keras.layers.ConvLSTM2D(
        filters=32,
        kernel_size=(3, 3),
        padding='same',
        return_sequences=True,
        activation='tanh',
        name='forecaster_convlstm'
    )(horizon_features, initial_state=[state_h, state_c])
    forecaster = tf.keras.layers.BatchNormalization(name='forecaster_bn')(forecaster)

    # Dense Spatial Refinement
    feat = tf.keras.layers.TimeDistributed(
        tf.keras.layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
        name='spatial_refinement'
    )(forecaster)

    # Output Heads:
    # 1. Thunderstorm: Sigmoid activation for true calibrated probability in [0, 1]
    ts_head = tf.keras.layers.TimeDistributed(
        tf.keras.layers.Conv2D(1, (1, 1), padding='same', activation='sigmoid'),
        name='thunderstorm_prob_head'
    )(feat)

    # 2. Downburst Velocity: ReLU activation for non-negative wind speed (m/s)
    vel_head = tf.keras.layers.TimeDistributed(
        tf.keras.layers.Conv2D(1, (1, 1), padding='same', activation='relu'),
        name='downburst_velocity_head'
    )(feat)

    # Concatenate into unified multi-horizon output: Shape (B, 6, 4, 4, 2)
    output_tensor = tf.keras.layers.Concatenate(axis=-1, name='forecast_output')([ts_head, vel_head])

    model = tf.keras.Model(inputs=inputs, outputs=output_tensor, name="Kolkata_MultiHorizon_ConvLSTM")

    # Custom Multi-Task Loss: Binary Cross-Entropy (Thunderstorm) + Scaled Huber Loss (Velocity)
    def multi_task_nowcast_loss(y_true, y_pred):
        y_true_ts = y_true[..., 0:1]
        y_pred_ts = tf.clip_by_value(y_pred[..., 0:1], 1e-7, 1.0 - 1e-7)
        bce = tf.keras.losses.binary_crossentropy(y_true_ts, y_pred_ts)

        y_true_vel = y_true[..., 1:2]
        y_pred_vel = y_pred[..., 1:2]
        huber = tf.keras.losses.huber(y_true_vel, y_pred_vel)

        return tf.reduce_mean(bce) + 0.1 * tf.reduce_mean(huber)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss=multi_task_nowcast_loss,
        metrics=['mae']
    )

    model.summary()

    # 7. Train the Model
    print("\n--- Training Model ---")
    epochs = 12
    batch_size = 256

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-5)
    ]

    history = model.fit(
        X_train, Y_train,
        validation_data=(X_val, Y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1
    )

    # 8. Save Updated Model
    model_filename = os.path.join(os.path.dirname(__file__), 'kolkata_convlstm_nowcasting.keras')
    model.save(model_filename)
    print(f"\nSaved updated true 0-6h multi-horizon model to {model_filename}")

    # 9. Generate Updated Training/Validation Loss Graphs
    plot_filename = os.path.join(os.path.dirname(__file__), 'training_validation_loss.png')
    plt.figure(figsize=(10, 4))
    plt.plot(history.history['loss'], label='Train Multi-Task Loss', linewidth=2)
    plt.plot(history.history['val_loss'], label='Val Multi-Task Loss', linewidth=2)
    plt.title('Multi-Horizon ConvLSTM Training & Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss (BCE + 0.1 * Huber)')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plot_filename, dpi=300)
    plt.close()
    print(f"Saved updated loss plot to {plot_filename}")

    # 10. Horizon-by-Horizon Evaluation on 2025 Test Set
    print("\n" + "=" * 70)
    print("HORIZON-BY-HORIZON EVALUATION REPORT (2025 UNSEEN TEST SET)")
    print("=" * 70)

    test_preds = model.predict(X_test, batch_size=batch_size, verbose=1)

    horizons = ["T+1 (1h)", "T+2 (2h)", "T+3 (3h)", "T+4 (4h)", "T+5 (5h)", "T+6 (6h)"]

    for h_idx, h_name in enumerate(horizons):
        print(f"\n------------------------------------------------------------")
        print(f"FORECAST HORIZON: {h_name}")
        print(f"------------------------------------------------------------")

        # --- Thunderstorm Probability (Channel 0) ---
        ts_true = Y_test[:, h_idx, :, :, 0].flatten()
        ts_pred = test_preds[:, h_idx, :, :, 0].flatten()

        pos_count = int(np.sum(ts_true == 1))
        neg_count = int(np.sum(ts_true == 0))
        total = len(ts_true)

        thresh = 0.25
        bin_pred = (ts_pred >= thresh).astype(int)

        tp = int(np.sum((ts_true == 1) & (bin_pred == 1)))
        tn = int(np.sum((ts_true == 0) & (bin_pred == 0)))
        fp = int(np.sum((ts_true == 0) & (bin_pred == 1)))
        fn = int(np.sum((ts_true == 1) & (bin_pred == 0)))

        acc = (tp + tn) / total
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        csi = tp / (tp + fp + fn) if (tp + fp + fn) > 0 else 0.0
        brier = float(np.mean((ts_pred - ts_true) ** 2))

        print(f"1. THUNDERSTORM OCCURRENCE (Probability):")
        print(f"   Ground Truth:     Positive={pos_count} ({pos_count/total*100:.2f}%), Negative={neg_count}")
        print(f"   Predicted Range:  Min={ts_pred.min():.4f}, Max={ts_pred.max():.4f}, Mean={ts_pred.mean():.4f}")
        print(f"   Confusion Matrix: [TN={tn:6d}, FP={fp:6d}] / [FN={fn:6d}, TP={tp:6d}] (Threshold >= {thresh})")
        print(f"   Accuracy:         {acc * 100:6.2f}%")
        print(f"   Precision:        {prec * 100:6.2f}%")
        print(f"   Recall (POD):     {rec * 100:6.2f}%")
        print(f"   F1-Score:         {f1:6.4f}")
        print(f"   Critical Success Index (CSI): {csi:6.4f}")
        print(f"   Brier Score:      {brier:6.4f}")

        # --- Downburst Wind Velocity (Channel 1) ---
        vel_true = Y_test[:, h_idx, :, :, 1].flatten()
        vel_pred = test_preds[:, h_idx, :, :, 1].flatten()

        vel_mae = float(np.mean(np.abs(vel_true - vel_pred)))
        vel_rmse = float(np.sqrt(np.mean((vel_true - vel_pred) ** 2)))
        ss_res = np.sum((vel_true - vel_pred) ** 2)
        ss_tot = np.sum((vel_true - np.mean(vel_true)) ** 2)
        r2 = float(1.0 - (ss_res / (ss_tot + 1e-12)))

        print(f"\n2. DOWNBURST WIND VELOCITY (m/s):")
        print(f"   Actual Range:     Min={vel_true.min():.2f}, Max={vel_true.max():.2f}, Mean={vel_true.mean():.2f} m/s")
        print(f"   Predicted Range:  Min={vel_pred.min():.2f}, Max={vel_pred.max():.2f}, Mean={vel_pred.mean():.2f} m/s")
        print(f"   MAE:              {vel_mae:.4f} m/s")
        print(f"   RMSE:             {vel_rmse:.4f} m/s")
        print(f"   R² Score:         {r2:+.4f}")

    print("\n" + "=" * 70)
    print("HAZARD AVAILABILITY STATUS")
    print("=" * 70)
    print("  [x] Thunderstorm:       TRAINED & AVAILABLE (Horizons T+1 to T+6, Sigmoid [0, 1])")
    print("  [x] Downburst Velocity: TRAINED & AVAILABLE (Horizons T+1 to T+6, Non-negative m/s)")
    print("  [-] Hail:               UNAVAILABLE (0 positive samples in dataset; requires DWR 3D radar echo tops)")
    print("  [-] Cloudburst:         UNAVAILABLE (0 positive samples in dataset; max rain 81 mm/h < 100 mm/h threshold)")
    print("=" * 70)
    print("Pipeline Execution Completed Successfully!")

if __name__ == "__main__":
    main()
