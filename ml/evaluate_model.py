from pathlib import Path
import joblib
import json
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, ConfusionMatrixDisplay, roc_auc_score, RocCurveDisplay

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "ml" / "saved_model" / "pr_hazard_models.joblib"
TEST = ROOT / "ml" / "reports" / "test_attempts.csv"
OUTPUT = ROOT / "ml" / "reports"

def main():
    if not MODEL.exists() or not TEST.exists():
        raise FileNotFoundError("Run train_model.py first")
    bundle = joblib.load(MODEL)
    df = pd.read_csv(TEST)
    X_test = df[bundle["features"]]
    y_test = df[bundle["target"]].astype(int)
    results = {}
    for name, model in bundle["models"].items():
        threshold = bundle["thresholds"][name]
        probabilities = model.predict_proba(X_test)[:, 1]
        predictions = (probabilities >= threshold).astype(int)
        accuracy = accuracy_score(y_test, predictions)
        precision = precision_score(y_test, predictions, zero_division=0)
        recall = recall_score(y_test, predictions, zero_division=0)
        f1 = f1_score(y_test, predictions, zero_division=0)
        auc = roc_auc_score(y_test, probabilities)
        results[name] = {"accuracy": float(accuracy), "precision": float(precision), "recall": float(recall), "f1_score": float(f1), "roc_auc": float(auc), "threshold": float(threshold)}
        print("\nMODEL:", name)
        print("Accuracy:", accuracy, "Precision:", precision, "Recall:", recall, "F1:", f1, "AUC:", auc)
        print(classification_report(y_test, predictions, target_names=["Successful", "Failed"], zero_division=0))
        cm = confusion_matrix(y_test, predictions, labels=[0, 1])
        display = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Successful", "Failed"])
        display.plot(values_format="d")
        plt.title(f"Confusion Matrix - {name}")
        plt.tight_layout()
        plt.savefig(OUTPUT / f"confusion_matrix_{name}.png")
        plt.close()
        RocCurveDisplay.from_predictions(y_test, probabilities, name=name)
        plt.title(f"ROC Curve - {name} (AUC={auc:.3f})")
        plt.tight_layout()
        plt.savefig(OUTPUT / f"roc_curve_{name}.png")
        plt.close()
    with open(OUTPUT / "evaluation_metrics.json", "w") as f:
        json.dump(results, f, indent=4)
    print("\nEvaluation completed! Reports saved in:", OUTPUT)

if __name__ == "__main__":
    main()