import pandas as pd

df = pd.read_csv("dataset/openipf.csv", low_memory=False)

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)

print("\nFirst 5 records:")
print(df.head())

print("\nColumn names:")
print(df.columns.tolist())

print("\nMissing values:")
print(df.isnull().sum())