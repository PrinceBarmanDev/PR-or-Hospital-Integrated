import pandas as pd

df = pd.read_csv(
    "dataset/openipf.csv",
    low_memory=False
)

print("DATA TYPES")
print(df.dtypes)

print("\nNUMERICAL SUMMARY")
print(df.describe())

print("\nEVENT DISTRIBUTION")
print(df["Event"].value_counts())

print("\nEQUIPMENT DISTRIBUTION")
print(df["Equipment"].value_counts())

print("\nUNIQUE VALUES IN PLACE")
print(df["Place"].value_counts().head(15))