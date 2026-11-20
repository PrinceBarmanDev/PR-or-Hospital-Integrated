import joblib, pandas as pd
from sklearn.metrics import classification_report, roc_auc_score

d = joblib.load('backend/model/readiness_model.joblib')
df = pd.read_csv('ml/processed/lifting_attempts.csv')
feats = d['features']
X = df[feats]
y = df['failed']

print('ROWS:', len(df))
print('FAIL RATE:', round(y.mean()*100, 1), '%')
print('FEATURES:', feats)

for name, m in d['models'].items():
    print('\n---', name, '---')
    y_pred = m.predict(X)
    y_proba = m.predict_proba(X)[:, 1]
    print(classification_report(y, y_pred))
    print('ROC-AUC:', round(roc_auc_score(y, y_proba), 3))
    print('THRESHOLD in file:', d['thresholds'][name])