# Combined build integration notes

## Source material used

- Brutalist UI archive: frontend visual system, barbell visualizer concept, and HUD-inspired layout.
- Original PR-or-Hospital archive: processed lifting-attempt CSV, serialized model bundle, ML source files, model reports, and project documentation.

## Important schema reconciliation

The original trained bundle expects these ten features: `Age`, `BodyweightKg`, `attempt_number`, `target_weight_kg`, `prior_successful_weight_kg`, `weight_to_bodyweight`, `Sex`, `Event`, `Equipment`, and `lift_type`.

The original project data and saved bundle do not include `sleep_hours`, `soreness`, or `rest_days`. The combined frontend therefore uses the exact trained feature schema and does not generate simulated readiness scores or safe-weight recommendations. `weight_to_bodyweight` is calculated as target weight divided by bodyweight, matching the data preparation logic.

## API routes

- `GET /` — service and file health
- `GET /overview` — processed dataset row count, model availability, feature count, and included metrics report
- `POST /predict` — inference using the selected saved Decision Tree or Logistic Regression model
- `GET /docs` — FastAPI interactive documentation

## Verification performed during integration

- JavaScript syntax check: passed (when Node.js is available in the build environment).
- API tests: 3 passed (health, overview, and saved-model prediction).
- The build environment had scikit-learn 1.8.0 while the serialized estimators record 1.9.1; test execution emitted compatibility warnings. The supplied requirements pin scikit-learn 1.9.1 to match the artifact's recorded version. Use that version when running the project locally.

## Evaluation caution

The supplied evaluation report shows high recall at threshold 0.10 but low accuracy and precision. These values are displayed as reported and should not be presented as evidence of injury prevention or reliable real-world readiness assessment.
