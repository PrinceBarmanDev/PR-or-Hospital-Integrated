from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "dataset" / "openipf.csv"
OUTPUT_DIR = ROOT / "ml" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = OUTPUT_DIR / "lifting_attempts.csv"

BASE_COLS = ["Name", "Sex", "Event", "Equipment", "Age", "BodyweightKg"]
LIFTS = {
    "squat": ["Squat1Kg", "Squat2Kg", "Squat3Kg"],
    "bench": ["Bench1Kg", "Bench2Kg", "Bench3Kg"],
    "deadlift": ["Deadlift1Kg", "Deadlift2Kg", "Deadlift3Kg"]
}

def main():
    print("Loading dataset...")
    if not INPUT.exists():
        raise FileNotFoundError(f"Dataset not found: {INPUT}")
    columns = BASE_COLS + [c for values in LIFTS.values() for c in values]
    df = pd.read_csv(INPUT, usecols=lambda c: c in columns, low_memory=False)
    print("Original shape:", df.shape)
    numeric_cols = ["Age", "BodyweightKg"] + [c for values in LIFTS.values() for c in values]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    frames = []
    for lift_name, attempt_cols in LIFTS.items():
        raw = df[attempt_cols].to_numpy(dtype="float32")
        for i, col in enumerate(attempt_cols):
            current = raw[:, i]
            valid = np.isfinite(current) & (current != 0)
            if not valid.any():
                continue
            previous_success = np.full(len(df), np.nan, dtype="float32")
            if i > 0:
                previous = raw[:, :i]
                prev_success_only = np.where(previous > 0, previous, np.nan)
                with np.errstate(all='ignore'):
                    previous_success = np.nanmax(prev_success_only, axis=1)
                previous_success = np.where(np.isfinite(previous_success), previous_success, np.nan)
            part = df.loc[valid, BASE_COLS].copy()
            part["lift_type"] = lift_name
            part["attempt_number"] = i + 1
            part["target_weight_kg"] = np.abs(current[valid])
            part["prior_successful_weight_kg"] = previous_success[valid]
            part["weight_to_bodyweight"] = part["target_weight_kg"] / part["BodyweightKg"].replace(0, np.nan)
            part["failed"] = (current[valid] < 0).astype(int)
            frames.append(part)

    if not frames:
        raise ValueError("No valid attempts found.")
    result = pd.concat(frames, ignore_index=True)
    print("After melt (attempts):", result.shape)

    before = len(result)
    result = result.dropna(subset=["Age", "BodyweightKg", "Sex", "Event", "Equipment", "target_weight_kg", "failed"])
    print(f"Dropped {before - len(result)} rows with missing values")

    result = result[
        (result["target_weight_kg"] > 0) & (result["target_weight_kg"] <= 1000) &
        (result["BodyweightKg"] > 30) & (result["BodyweightKg"] <= 300) &
        (result["Age"] >= 12) & (result["Age"] <= 100)
    ]
    result = result[result["Sex"].isin(["M", "F"])]
    result = result[result["Equipment"].isin(["Raw", "Wraps", "Single-ply", "Multi-ply"])]

    before = len(result)
    result = result[(result["attempt_number"] == 1) | (result["prior_successful_weight_kg"].notna())]
    print(f"Dropped {before - len(result)} rows with no prior success (attempt 2/3)")

    mask1 = result["attempt_number"] == 1
    result.loc[mask1, "prior_successful_weight_kg"] = result.loc[mask1, "target_weight_kg"]
    result["weight_to_bodyweight"] = result["target_weight_kg"] / result["BodyweightKg"]
    result["jump_pct"] = (result["target_weight_kg"] - result["prior_successful_weight_kg"]) / result["prior_successful_weight_kg"] * 100
    result = result[(result["jump_pct"] >= -50) & (result["jump_pct"] <= 100)]
    result = result.replace([np.inf, -np.inf], np.nan).dropna()
    result = result.drop_duplicates()
    if len(result) > 500000:
        result = result.sample(n=500000, random_state=42)
    result.to_csv(OUTPUT, index=False)
    print("\nCleaning completed!")
    print("Final shape:", result.shape)
    print("\nTarget distribution:")
    print(result["failed"].value_counts())
    print("\nFailure percentage:")
    print(result["failed"].mean() * 100)
    print("\nBy lift:")
    print(result.groupby("lift_type")["failed"].mean() * 100)
    print("\nSaved:", OUTPUT)

if __name__ == "__main__":
    main()