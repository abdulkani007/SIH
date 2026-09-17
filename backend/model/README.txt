KOLKATA CONVLSTM TRUE 0–6 HOUR NOWCASTING MODEL (2023–2025)

==================================================
PROJECT OVERVIEW & ROLE IN STORMGUARD ARCHITECTURE
==================================================
1. Kolkata Region: Evaluated with this ConvLSTM multi-horizon nowcasting model.
2. Other Regions (Tamil Nadu, Salem, Pollachi, Cuddalore, etc.): Real-time Tomorrow.io API + atmospheric convective engine.

==================================================
MANDATORY SYNTHETIC DATA WARNING
==================================================
"Current model was trained/evaluated using synthetic or partially synthetic data and requires validation on real observational/radar data before operational deployment."
Do not claim operational accuracy based only on synthetic data.
- The dataset values are simulated/synthetic.
- It is NOT real IMD Doppler Weather Radar (DWR) or INSAT satellite observations.
- The spatial domain is a prototype 4x4 grid covering ~12 km x 12 km over central Kolkata.

==================================================
MODEL ARCHITECTURE & HORIZON STRUCTURE
==================================================
Input Sequence:
- 6 Hourly History Frames: [T-5, T-4, T-3, T-2, T-1, T]
- Input Shape: (batch_size, 6, 4, 4, 4)
- 4 Channels:
  0: Radar Reflectivity (dBZ)
  1: Radar Velocity (m/s)
  2: Satellite IR Temperature (K)
  3: Satellite Cloud Fraction

Forecast Horizons (Output Sequence):
- 6 Future Hourly Horizons: [T+1, T+2, T+3, T+4, T+5, T+6] (1 to 6 hours into future)
- Output Shape: (batch_size, 6, 4, 4, 2)
- 2 Output Channels:
  0: Thunderstorm Probability [Sigmoid activation, range 0.0 to 1.0]
  1: Downburst Wind Velocity (m/s) [ReLU activation, non-negative]

==================================================
HAZARD TARGET CAPABILITIES
==================================================
1. Thunderstorm:
   - STATUS: TRAINED & OPERATIONAL for horizons T+1 to T+6.
   - Outputs true calibrated probabilities in [0, 1] using Sigmoid activation.
   - Evaluated with Precision, Recall (POD), F1, CSI, and Brier Score.

2. Downburst Wind Velocity (m/s):
   - STATUS: TRAINED & OPERATIONAL for horizons T+1 to T+6.
   - Outputs continuous non-negative wind velocity using ReLU activation.

3. Hail:
   - STATUS: UNAVAILABLE / NOT TRAINED.
   - Reason: The dataset contains 0 positive hail samples across all 841,728 rows (100% negative).
   - The model does not attempt to predict hail until real volumetric radar echo tops are integrated.

4. Cloudburst / Extreme Rainfall:
   - STATUS: UNAVAILABLE / NOT TRAINED.
   - Reason: The dataset contains 0 cloudburst events (rainfall > 100 mm/h).
   - The model does not claim cloudburst prediction without labeled ground truth.

==================================================
DATA LEAKAGE SAFEGUARDS
==================================================
1. Chronological Split:
   - Training:   Jan 2023 – Aug 2024 (80% of 2023–2024)
   - Validation: Aug 2024 – Dec 2024 (20% of 2023–2024)
   - Test:       Jan 2025 – Dec 2025 (Completely unseen test year)
2. Normalization:
   - Min-Max scaling parameters are computed strictly on the training set.
   - Saved to normalization_params.json.
3. Sequence Generation:
   - Sequences are generated within each split boundary without crossing train/val/test splits.
   - Future target frames (T+1 to T+6) are strictly future relative to input frame T.
