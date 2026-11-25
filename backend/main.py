# ============================================================
# PR OR HOSPITAL - BACKEND main.py - FINAL v5
# Uses REAL ML data: ml/processed/lifting_attempts.csv (148,326 rows)
# Fail rate: 24.1% | Best Threshold: 0.55 | AUC: 0.742
# Run: python -m uvicorn main:app --reload --port 8000
# ============================================================
import pickle
import os
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "ml" / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
DATASET_DIR = BASE_DIR / "dataset"
DEFAULT_THRESHOLD = 0.55  # FIXED: ML best F1 threshold

app = FastAPI(title="PR or Hospital API", version="3.0")

# Set CORS_ALLOW_ORIGINS on Render to your Vercel URL, e.g.
# https://pr-or-hospital.vercel.app
_allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOW_ORIGINS",
        "https://pr-or-hospital.vercel.app,https://pr-or-hospital.vercel.app/,http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    Age: float = Field(..., ge=10, le=100)
    BodyweightKg: float = Field(..., ge=20, le=300)
    Sex: str = "M"
    Event: str = "SBD"
    Equipment: str = "Raw"
    lift_type: str = "Squat"
    attempt_number: int = 2
    target_weight_kg: float = Field(..., gt=0, le=1000)
    prior_successful_weight_kg: float = Field(..., ge=0, le=1000)
    sleep_hours: float = 7
    soreness: float = 5
    rest_days: float = 1
    energy: float = 7

log_model = None
tree_model = None
joblib_model = None
X_test_global = None
y_test_global = None
total_records = 0
model_available = False

# FIXED: Matches ml/train_model.py exactly - no sleep/soreness in ML model
NUMERIC_FEATURES = ["Age", "BodyweightKg", "attempt_number", "target_weight_kg", "prior_successful_weight_kg", "weight_to_bodyweight", "jump_pct"]
CATEGORICAL_FEATURES = ["Sex", "Event", "Equipment", "lift_type"]

def build_pipeline(model):
    num_pipe = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])
    cat_pipe = Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("encoder", OneHotEncoder(handle_unknown="ignore"))])
    pre = ColumnTransformer([("num", num_pipe, NUMERIC_FEATURES), ("cat", cat_pipe, CATEGORICAL_FEATURES)])
    return Pipeline([("pre", pre), ("clf", model)])

def make_features(df: pd.DataFrame):
    df = df.copy()
    df = df.loc[:, ~df.columns.duplicated()]
    prior = df["prior_successful_weight_kg"].replace(0, np.nan)
    # FIXED: Same features as ml/data_cleaning.py
    df["weight_to_bodyweight"] = (df["target_weight_kg"] / df["BodyweightKg"].replace(0, np.nan)).fillna(1.8)
    df["jump_pct"] = ((df["target_weight_kg"] - prior) / prior * 100).fillna(0).clip(0, 100)
    # Recovery cols kept for frontend adjustment only, NOT for ML
    for c in ["sleep_hours", "soreness", "rest_days", "energy"]:
        if c not in df.columns:
            df[c] = {"sleep_hours": 7, "soreness": 5, "rest_days": 1, "energy": 7}[c]
    return df

def normalize_columns(df: pd.DataFrame):
    df = df.copy()
    col_map = {}
    for c in df.columns:
        lc = str(c).lower().strip().replace(" ", "").replace("_", "")
        if lc in ["age"]: col_map[c] = "Age"
        elif lc in ["bodyweightkg", "bodyweight"]: col_map[c] = "BodyweightKg"
        elif lc in ["sex"]: col_map[c] = "Sex"
        elif lc in ["event"]: col_map[c] = "Event"
        elif lc in ["equipment"]: col_map[c] = "Equipment"
        elif lc in ["lifttype", "lift", "exercise", "targetlifttype"]: col_map[c] = "lift_type"
        elif lc in ["attemptnumber", "attempt"]: col_map[c] = "attempt_number"
        elif lc in ["targetweightkg", "targetweight", "weightkg", "attemptweightkg"]: col_map[c] = "target_weight_kg"
        elif lc in ["priorsuccessfulweightkg", "priorbestkg", "bestkg", "previousbest", "previoussuccessfulkg"]: col_map[c] = "prior_successful_weight_kg"
        elif lc in ["sleephours", "sleep", "sleepdurationhours", "sleepduration"]: col_map[c] = "sleep_hours"
        elif lc in ["soreness", "musclesoreness"]: col_map[c] = "soreness"
        elif lc in ["restdays", "rest"]: col_map[c] = "rest_days"
        elif lc in ["energy", "freshnessscore", "freshness"]: col_map[c] = "energy"
        elif lc in ["failed", "isfailed", "fail"]: col_map[c] = "Failed"
        elif lc in ["painflag"]: col_map[c] = "PainFlag"
        elif lc in ["intensitypercentage"]: col_map[c] = "IntensityPercentage"
        elif lc in ["weighttobodyweight"]: col_map[c] = "weight_to_bodyweight"
        elif lc in ["jumppct", "jumppercent", "jump"]: col_map[c] = "jump_pct"
    df = df.rename(columns=col_map)
    df = df.loc[:, ~df.columns.duplicated()]
    if "lift_type" in df.columns:
        df["lift_type"] = df["lift_type"].astype(str).str.strip().str.title()
        df["lift_type"] = df["lift_type"].replace({"S": "Squat", "B": "Bench", "D": "Deadlift", "Squat": "Squat", "Bench": "Bench", "Deadlift": "Deadlift"})
        # Fix: OpenPowerlifting uses lowercase squat/bench/deadlift -> Title() already handles
    defaults = {"Age": 25, "BodyweightKg": 85, "Sex": "M", "Event": "SBD", "Equipment": "Raw", "lift_type": "Squat", "attempt_number": 2, "target_weight_kg": 100, "prior_successful_weight_kg": 95, "sleep_hours": 7, "soreness": 5, "rest_days": 1, "energy": 7}
    for k, v in defaults.items():
        if k not in df.columns:
            df[k] = v
    return df

def get_csv_path():
    # FIXED: Real ML cleaned data FIRST
    csv_candidates = [
        BASE_DIR.parent / "ml" / "processed" / "lifting_attempts.csv",
        BASE_DIR / "dataset" / "lifting_attempts.csv",
        BASE_DIR / "dataset" / "group_h_recovery_dataset_50000.csv",
        BASE_DIR.parent / "dataset" / "processed" / "openpowerlifting_50000.csv",
    ]
    for p in csv_candidates:
        if p.exists():
            print(f"Checking: {p} -> exists")
            return p
    return None

def load_or_train():
    global log_model, tree_model, joblib_model, X_test_global, y_test_global, total_records, model_available
    csv_path = get_csv_path()
    if csv_path:
        print(f"📊 Found CSV: {csv_path}")
        try:
            df = pd.read_csv(csv_path)
            total_records = len(df)
            print(f"📊 Raw rows: {len(df)}")
            df = normalize_columns(df)
            df = df.loc[:, ~df.columns.duplicated()]
            df = df.copy()
            age = pd.to_numeric(df["Age"], errors="coerce")
            target = pd.to_numeric(df["target_weight_kg"], errors="coerce")
            prior = pd.to_numeric(df["prior_successful_weight_kg"], errors="coerce")
            bw = pd.to_numeric(df["BodyweightKg"], errors="coerce")
            mask = (age >= 14) & (age <= 80) & (target > 20) & (prior > 20) & (bw >= 30) & (df["Sex"].astype(str).isin(["M", "F"]))
            df = df[mask].copy()
            if "attempt_number" not in df.columns:
                df["attempt_number"] = 2
            if "Event" not in df.columns:
                df["Event"] = "SBD"
            print(f"📊 After cleaning: {len(df)} rows")
            # NO FAKE Failed creation - use REAL label from ml/data_cleaning.py
            if "Failed" not in df.columns:
                # This repository's bundled CSV has no Failed label. Do not
                # stop startup here: fall through and load the committed .pkl models.
                print("⚠️ CSV has no 'Failed' label; skipping training and trying saved models.")
            else:
                print(f"📊 REAL Fail rate: {df['Failed'].mean()*100:.1f}%")
                print("📊 Training Logistic + Tree from REAL CSV...")
                train_from_df(df)
                return
        except Exception as e:
            print(f"⚠️ CSV training failed: {e}")
            import traceback; traceback.print_exc()

    # Fallback: load saved pkl
    log_path = MODEL_DIR / "logistic_regression.pkl"
    tree_path = MODEL_DIR / "decision_tree.pkl"
    if log_path.exists() and tree_path.exists():
        try:
            with open(log_path, "rb") as f: log_model = pickle.load(f)
            with open(tree_path, "rb") as f: tree_model = pickle.load(f)
            model_available = True
            print("✅ Loaded saved pkl models")
            try_load_csv_for_metrics()
            return
        except Exception as e:
            print(f"⚠️ Failed to load pkl models: {e}")

    print("⚠️ No CSV / No model found")

def try_load_csv_for_metrics():
    global X_test_global, y_test_global, total_records
    csv_path = get_csv_path()
    if csv_path is None:
        return
    try:
        df = pd.read_csv(csv_path)
        total_records = len(df)
        df = normalize_columns(df)
        if "Failed" in df.columns:
            df = make_features(df)
            df = df.dropna(subset=["Failed"])
            X_test_global = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
            y_test_global = df["Failed"].astype(int)
            print(f"✅ Loaded test set: {len(df)} rows")
    except Exception as e:
        print(f"⚠️ CSV metrics load failed: {e}")

def train_from_df(df: pd.DataFrame):
    global log_model, tree_model, X_test_global, y_test_global, model_available
    df = make_features(df)
    df = df.loc[:, ~df.columns.duplicated()]
    if "Failed" not in df.columns:
        raise ValueError("CSV must have 'Failed' column")
    df = df.dropna(subset=["Failed"])
    df["Failed"] = df["Failed"].astype(int)
    for c in NUMERIC_FEATURES:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    df[NUMERIC_FEATURES] = df[NUMERIC_FEATURES].fillna(df[NUMERIC_FEATURES].median(numeric_only=True))
    df[CATEGORICAL_FEATURES] = df[CATEGORICAL_FEATURES].fillna("Unknown")
    print(f"📊 Clean rows: {len(df)}, Failed rate: {df['Failed'].mean():.3f}")
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["Failed"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    X_test_global = X_test
    y_test_global = y_test
    print("Training Logistic Regression...")
    log_model = build_pipeline(LogisticRegression(max_iter=1000, class_weight="balanced"))
    log_model.fit(X_train, y_train)
    print("Training Decision Tree...")
    tree_model = build_pipeline(DecisionTreeClassifier(max_depth=8, min_samples_leaf=50, random_state=42, class_weight="balanced"))
    tree_model.fit(X_train, y_train)
    with open(MODEL_DIR / "logistic_regression.pkl", "wb") as f: pickle.dump(log_model, f)
    with open(MODEL_DIR / "decision_tree.pkl", "wb") as f: pickle.dump(tree_model, f)
    model_available = True
    print("✅ Models trained + saved")
    compute_metrics()

def compute_metrics(threshold: float = DEFAULT_THRESHOLD):
    if log_model is None or X_test_global is None:
        return {}
    out = {}
    for name, model in [("logistic_regression", log_model), ("decision_tree", tree_model)]:
        try:
            probs = model.predict_proba(X_test_global)[:, 1]
        except Exception:
            continue
        pred = (probs >= threshold).astype(int)
        cm = confusion_matrix(y_test_global, pred).tolist()
        out[name] = {"accuracy": round(accuracy_score(y_test_global, pred)*100, 2), "precision": round(precision_score(y_test_global, pred, zero_division=0)*100, 2), "recall": round(recall_score(y_test_global, pred, zero_division=0)*100, 2), "f1": round(f1_score(y_test_global, pred, zero_division=0)*100, 2), "roc_auc": round(roc_auc_score(y_test_global, probs)*100, 2), "threshold": threshold, "confusion_matrix": cm, "tn": int(cm[0][0]), "fp": int(cm[0][1]), "fn": int(cm[1][0]), "tp": int(cm[1][1])}
    return out

def recovery_adjustment(req: PredictRequest):
    score = (min(req.sleep_hours, 9)/9*35) + ((10-req.soreness)/9*30) + (min(req.rest_days, 3)/3*15) + (req.energy/10*20)
    score = max(0, min(100, score))
    if score >= 75: adj = -0.08
    elif score >= 50: adj = 0.05
    elif score >= 30: adj = 0.12
    else: adj = 0.18
    return adj, round(score, 1)

load_or_train()

@app.get("/")
def root():
    return {"status": "PR or Hospital API running", "model_available": model_available, "threshold": DEFAULT_THRESHOLD}

@app.get("/overview")
def overview():
    metrics = compute_metrics(DEFAULT_THRESHOLD)
    return {"total_records": int(total_records), "model_available": model_available, "threshold": DEFAULT_THRESHOLD, "models": metrics, "features": len(NUMERIC_FEATURES + CATEGORICAL_FEATURES)}

@app.get("/metrics")
def metrics(threshold: float = DEFAULT_THRESHOLD):
    return compute_metrics(threshold)

@app.get("/test-thresholds")
def test_thresholds():
    if log_model is None or X_test_global is None:
        raise HTTPException(status_code=503, detail="Model / test set not loaded")
    results_log = []
    results_tree = []
    for th in [0.10, 0.20, 0.30, 0.40, 0.50, 0.55, 0.60, 0.70, 0.80]:
        m = compute_metrics(th)
        if "logistic_regression" in m: results_log.append({"threshold": th, **m["logistic_regression"]})
        if "decision_tree" in m: results_tree.append({"threshold": th, **m["decision_tree"]})
    return {"message": "Best threshold is 0.55 - balanced Precision/Recall. At 0.10 model over-predicts FAIL.", "logistic_regression": results_log, "decision_tree": results_tree, "best_logistic": max(results_log, key=lambda x: x["f1"]) if results_log else None, "best_tree": max(results_tree, key=lambda x: x["f1"]) if results_tree else None, "recommended_threshold": 0.55}

@app.post("/predict")
def predict(req: PredictRequest):
    if log_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        row = pd.DataFrame([{"Age": req.Age, "BodyweightKg": req.BodyweightKg, "Sex": req.Sex, "Event": req.Event, "Equipment": req.Equipment, "lift_type": req.lift_type, "attempt_number": req.attempt_number, "target_weight_kg": req.target_weight_kg, "prior_successful_weight_kg": req.prior_successful_weight_kg, "sleep_hours": req.sleep_hours, "soreness": req.soreness, "rest_days": req.rest_days, "energy": req.energy}])
        row = make_features(row)
        X = row[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
        ml_prob = float(log_model.predict_proba(X)[0][1])
        try: tree_prob = float(tree_model.predict_proba(X)[0][1])
        except Exception: tree_prob = ml_prob
        adj, recovery_score = recovery_adjustment(req)
        final_prob = max(0.0, min(1.0, ml_prob + adj))
        failed = final_prob >= DEFAULT_THRESHOLD

        # ✅ FIXED: Safe Weight - Must be LESS than Target when Risk HIGH
        target = req.target_weight_kg
        if final_prob >= 0.55:
            safe_weight = round(target * 0.85)
            recommendation = "DON'T LIFT THIS - Drop to safe weight"
        elif final_prob >= 0.30:
            safe_weight = round(target * 0.92)
            recommendation = "CAUTION - Try safe weight first"
        else:
            safe_weight = round(target * 1.02)
            recommendation = "GO FOR PR - You are ready"

        return {"fail_probability": round(final_prob, 4), "ml_probability": round(ml_prob, 4), "tree_probability": round(tree_prob, 4), "recovery_adjustment": round(adj, 4), "recovery_score": recovery_score, "prediction": "FAIL_RISK" if failed else "GO", "label": "FAIL_RISK" if failed else "GO", "threshold": DEFAULT_THRESHOLD, "model": "LOGISTIC REGRESSION + RECOVERY", "jump_pct": round(float(row["jump_pct"].iloc[0]), 2), "weight_to_bodyweight": round(float(row["weight_to_bodyweight"].iloc[0]), 3), "safe_weight_kg": safe_weight, "recommendation": recommendation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
    