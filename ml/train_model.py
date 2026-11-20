from pathlib import Path
import joblib
import json
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import recall_score, precision_score, f1_score

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "ml" / "processed" / "lifting_attempts.csv"
MODEL_DIR = ROOT / "ml" / "saved_model"
REPORT_DIR = ROOT / "ml" / "reports"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

NUMERIC = ["Age", "BodyweightKg", "attempt_number", "target_weight_kg", "prior_successful_weight_kg", "weight_to_bodyweight", "jump_pct"]
CATEGORICAL = ["Sex", "Event", "Equipment", "lift_type"]
FEATURES = NUMERIC + CATEGORICAL

def make_preprocessor():
    numeric_pipe = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])
    categorical_pipe = Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("encoder", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer([("numeric", numeric_pipe, NUMERIC), ("categorical", categorical_pipe, CATEGORICAL)])

def main():
    if not DATA.exists():
        raise FileNotFoundError("Run data_cleaning.py first")
    df = pd.read_csv(DATA)
    df = df.dropna(subset=["Name", "failed"])
    X = df[FEATURES]
    y = df["failed"].astype(int)
    groups = df["Name"].astype(str)
    split1 = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_val_idx, test_idx = next(split1.split(X, y, groups))
    X_train_val = X.iloc[train_val_idx]
    y_train_val = y.iloc[train_val_idx]
    groups_train_val = groups.iloc[train_val_idx]
    split2 = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, val_idx = next(split2.split(X_train_val, y_train_val, groups_train_val))
    X_train = X_train_val.iloc[train_idx]
    y_train = y_train_val.iloc[train_idx]
    X_val = X_train_val.iloc[val_idx]
    y_val = y_train_val.iloc[val_idx]

    models = {
        "logistic_regression": Pipeline([("preprocess", make_preprocessor()), ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))]),
        "decision_tree": Pipeline([("preprocess", make_preprocessor()), ("classifier", DecisionTreeClassifier(max_depth=10, min_samples_leaf=50, class_weight="balanced", random_state=42))])
    }
    results = {}
    for name, model in models.items():
        print("\nTraining:", name)
        model.fit(X_train, y_train)
        probabilities = model.predict_proba(X_val)[:, 1]
        candidates = np.arange(0.10, 0.91, 0.05)
        best_f1 = -1
        best_threshold = 0.5
        best_recall = 0
        best_precision = 0
        for threshold in candidates:
            predictions = (probabilities >= threshold).astype(int)
            f1 = f1_score(y_val, predictions, zero_division=0)
            rec = recall_score(y_val, predictions, zero_division=0)
            prec = precision_score(y_val, predictions, zero_division=0)
            print(f"  thr={threshold:.2f} recall={rec:.3f} prec={prec:.3f} f1={f1:.3f}")
            if f1 > best_f1:
                best_f1 = f1
                best_threshold = float(threshold)
                best_recall = float(rec)
                best_precision = float(prec)
        results[name] = {"model": model, "threshold": best_threshold, "validation_recall": best_recall, "validation_precision": best_precision, "validation_f1": best_f1}
        print("Best threshold:", best_threshold, "recall:", best_recall, "precision:", best_precision, "f1:", best_f1)

    bundle = {"models": {n: i["model"] for n, i in results.items()}, "thresholds": {n: i["threshold"] for n, i in results.items()}, "features": FEATURES, "target": "failed", "target_meaning": "1 = failed, 0 = successful"}
    joblib.dump(bundle, MODEL_DIR / "pr_hazard_models.joblib")
    test_df = df.iloc[test_idx].copy()
    test_df.to_csv(REPORT_DIR / "test_attempts.csv", index=False)
    with open(REPORT_DIR / "validation_results.json", "w") as f:
        json.dump({n: {"threshold": i["threshold"], "validation_recall": i["validation_recall"], "validation_precision": i["validation_precision"], "validation_f1": i["validation_f1"]} for n, i in results.items()}, f, indent=4)
    print("\nTraining completed! Models saved!")

if __name__ == "__main__":
    main()