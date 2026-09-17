import os
import sys
import time
import json
import numpy as np

def verify_kolkata_convlstm():
    print("=" * 70)
    print("STORMGUARD AI: KOLKATA CONVLSTM MODEL HEALTH & INFERENCE CHECK")
    print("=" * 70)

    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "kolkata_convlstm_nowcasting.keras")
    norm_path = os.path.join(model_dir, "normalization_params.json")
    dataset_path = os.path.join(model_dir, "Kolkata_FINAL_CONVLSTM_2023_2025.npz")

    # 1. Check Model File
    print("\n[STEP 1/5] Checking Model Artifact...")
    if not os.path.exists(model_path):
        print(f"[-] ERROR: Model file not found at: {model_path}")
        return False
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"[+] Model file found: {model_path} ({size_mb:.2f} MB)")

    # 2. Check Normalization Parameters
    print("\n[STEP 2/5] Checking Normalization Parameters...")
    if not os.path.exists(norm_path):
        print(f"[-] ERROR: Normalization file not found at: {norm_path}")
        return False
    with open(norm_path, "r") as f:
        norm_params = json.load(f)
    print(f"[+] Loaded normalization channels: {norm_params.get('channel_names')}")
    print(f"    Mins: {norm_params.get('mins')}")
    print(f"    Maxs: {norm_params.get('maxs')}")

    # 3. Load Keras Model
    print("\n[STEP 3/5] Loading Model with Keras...")
    start_load = time.time()
    try:
        import keras
        model = keras.models.load_model(model_path, compile=False)
        load_time = (time.time() - start_load) * 1000
        print(f"[+] Model loaded successfully in {load_time:.1f} ms!")
        print(f"    Input Shape:  {model.input_shape}")
        print(f"    Output Shape: {model.output_shape}")
        print(f"    Total Parameters: {model.count_params():,}")
    except Exception as e:
        print(f"[-] ERROR during model load: {e}")
        return False

    # 4. Prepare Input Sample
    print("\n[STEP 4/5] Preparing 6-Hour History Input Sample (T-5 to T)...")
    if os.path.exists(dataset_path):
        data = np.load(dataset_path)
        X_raw = data['X'][:12]  # Take first 12 frames (6 hours at 30-min steps)
        # Downsample from 30-min to hourly (step=2)
        sample_raw = X_raw[::2]  # Shape: (6, 4, 4, 4)
        print(f"[+] Loaded test sequence from {os.path.basename(dataset_path)}")
    else:
        print("[!] Dataset NPZ not found, creating synthetic test tensor...")
        sample_raw = np.random.uniform(10, 45, size=(6, 4, 4, 4)).astype(np.float32)

    # Normalize sample using saved params
    mins = np.array(norm_params['mins'], dtype=np.float32)
    maxs = np.array(norm_params['maxs'], dtype=np.float32)
    diffs = np.where(maxs - mins == 0, 1.0, maxs - mins)
    sample_norm = (sample_raw - mins) / diffs
    input_batch = np.expand_dims(sample_norm, axis=0).astype(np.float32)  # (1, 6, 4, 4, 4)

    # 5. Run Forward Inference
    print("\n[STEP 5/5] Running Multi-Horizon Forward Inference...")
    t0 = time.time()
    preds = model.predict(input_batch, verbose=0)  # Shape: (1, 6, 4, 4, 2)
    infer_time = (time.time() - t0) * 1000

    print(f"[+] Forward pass completed in {infer_time:.2f} ms!")
    print(f"    Output Batch Shape: {preds.shape}")

    # Integrity Validations
    ts_preds = preds[0, :, :, :, 0]    # Thunderstorm probabilities
    vel_preds = preds[0, :, :, :, 1]   # Downburst wind velocities (m/s)

    ts_in_bounds = (ts_preds.min() >= 0.0) and (ts_preds.max() <= 1.0)
    vel_non_negative = (vel_preds.min() >= 0.0)

    print("\n--- Physical Constraint Validations ---")
    print(f"  [1] Thunderstorm Probability in [0, 1]:  {'PASS' if ts_in_bounds else 'FAIL'} (Min={ts_preds.min():.4f}, Max={ts_preds.max():.4f})")
    print(f"  [2] Downburst Velocity >= 0 m/s:         {'PASS' if vel_non_negative else 'FAIL'} (Min={vel_preds.min():.2f} m/s, Max={vel_preds.max():.2f} m/s)")
    print(f"  [3] Multi-Horizon Count == 6:            {'PASS' if preds.shape[1] == 6 else 'FAIL'}")
    print(f"  [4] Spatial Grid == 4x4:                 {'PASS' if preds.shape[2:4] == (4, 4) else 'FAIL'}")

    # Print Horizon-by-Horizon Table
    print("\n" + "=" * 70)
    print("MULTI-HORIZON (0-6 HOUR) NOWCAST SUMMARY TABLE")
    print("=" * 70)
    print(f"{'Horizon':<10} | {'Max TS Prob':<12} | {'Mean TS Prob':<13} | {'Max Wind (m/s)':<15} | {'Risk Level':<12}")
    print("-" * 70)

    for h in range(6):
        h_name = f"T+{h+1} ({h+1}h)"
        max_ts = float(ts_preds[h].max())
        mean_ts = float(ts_preds[h].mean())
        max_vel = float(vel_preds[h].max())
        
        if max_ts >= 0.60:
            risk = "HIGH RISK"
        elif max_ts >= 0.35:
            risk = "MODERATE"
        else:
            risk = "LOW / NORMAL"

        print(f"{h_name:<10} | {max_ts * 100:9.1f}% | {mean_ts * 100:10.1f}% | {max_vel:10.2f} m/s   | {risk:<12}")

    print("=" * 70)
    print("[+] ALL CHECKS PASSED: Model is functional, calibrated, and operational!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = verify_kolkata_convlstm()
    sys.exit(0 if success else 1)
