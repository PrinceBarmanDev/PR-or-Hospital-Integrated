from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "ml" / "processed" / "lifting_attempts.csv"
OUTPUT = ROOT / "ml" / "reports"
OUTPUT.mkdir(parents=True, exist_ok=True)

def main():
    if not INPUT.exists():
        raise FileNotFoundError("Run data_cleaning.py first")
    df = pd.read_csv(INPUT)
    print("\nDATASET SHAPE")
    print(df.shape)
    print("\nDATA TYPES")
    print(df.dtypes)
    print("\nNUMERICAL SUMMARY")
    print(df.describe())
    print("\nMISSING VALUES")
    print(df.isnull().sum())
    print("\nSUCCESS / FAILURE DISTRIBUTION")
    print(df["failed"].value_counts())
    print("\nFAILURE RATE BY LIFT")
    print(df.groupby("lift_type")["failed"].mean())
    print("\nFAILURE RATE BY ATTEMPT")
    print(df.groupby("attempt_number")["failed"].mean())
    if "jump_pct" in df.columns:
        print("\nCORRELATION WITH FAILED")
        numeric = df[["Age", "BodyweightKg", "target_weight_kg", "prior_successful_weight_kg", "jump_pct", "weight_to_bodyweight", "failed"]]
        print(numeric.corr()["failed"].sort_values())

    sns.set_theme(style="whitegrid")
    plt.figure(figsize=(7, 5))
    sns.countplot(data=df, x="failed")
    plt.title("Successful vs Failed Lifting Attempts")
    plt.xlabel("0 = Successful, 1 = Failed")
    plt.savefig(OUTPUT / "outcome_distribution.png")
    plt.close()

    plt.figure(figsize=(8, 5))
    sns.histplot(data=df, x="target_weight_kg", bins=40)
    plt.title("Lifting Weight Distribution")
    plt.savefig(OUTPUT / "weight_distribution.png")
    plt.close()

    plt.figure(figsize=(8, 5))
    sns.countplot(data=df, x="lift_type", hue="failed")
    plt.title("Lift Type vs Outcome")
    plt.savefig(OUTPUT / "lift_comparison.png")
    plt.close()

    plt.figure(figsize=(8, 5))
    sns.boxplot(data=df, x="failed", y="weight_to_bodyweight")
    plt.title("Weight Ratio vs Failed Attempts")
    plt.savefig(OUTPUT / "weight_ratio.png")
    plt.close()

    if "jump_pct" in df.columns:
        plt.figure(figsize=(8, 5))
        sns.boxplot(data=df, x="failed", y="jump_pct")
        plt.title("Jump % vs Failed Attempts (Key Feature)")
        plt.ylabel("Jump % from Last Best")
        plt.savefig(OUTPUT / "jump_pct_vs_failed.png")
        plt.close()

        plt.figure(figsize=(7, 5))
        sns.barplot(data=df, x="attempt_number", y="failed", errorbar=None)
        plt.title("Failure Rate by Attempt Number")
        plt.ylabel("Failure Rate")
        plt.savefig(OUTPUT / "failure_by_attempt.png")
        plt.close()

        plt.figure(figsize=(8, 6))
        sns.heatmap(numeric.corr(), annot=True, cmap="coolwarm", fmt=".2f")
        plt.title("Correlation Heatmap")
        plt.savefig(OUTPUT / "correlation.png")
        plt.close()

    print("\nEDA completed! Charts saved in:", OUTPUT)

if __name__ == "__main__":
    main()