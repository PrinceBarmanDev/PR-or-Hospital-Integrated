# PR OR HOSPITAL — Integrated Build

This build combines the NS visual design with the original project backend and machine-learning assets.

## What is included

- `frontend/` — NS design, responsive layout fixes, restored barbell renderer, API-connected result flow.
- `backend/` — original FastAPI service, prediction routes, model files, and backend dataset.
- `ml/` — original model-training/evaluation source, saved models, reports, and processed lifting data.
- `dataset/` — original source notebooks and project datasets.
- `tests/`, `docs/`, and the original project notes.
- `docs/source_reference/` — original frontend and NS design source snapshots for reference.

## Run on Windows

1. Install Python 3.10+.
2. Open a terminal in this project folder.
3. Install the dependencies:

   ```powershell
   python -m pip install -r requirements.txt
   ```

4. Double-click `START_PR_OR_HOSPITAL.bat`.

The website opens at `http://127.0.0.1:5500`. The API runs at `http://127.0.0.1:8000`; interactive API documentation is at `/docs`.

If the batch file is blocked, run the two commands manually in separate terminals from the project root:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
python -m http.server 5500 --directory frontend
```

## Barbell loading logic

The renderer is restored from the original frontend's `renderBarbell(totalKg)` implementation. It subtracts the 20 kg bar, calculates the load per side, then loads matching plates on both sides using the original plate denominations and original CSS colors/heights. Target weights are constrained to 2.5 kg increments from 20 kg so every displayed total can be represented by the available plate set.

## Result behavior

The frontend now waits for a real `/predict` response. It does not manufacture a fallback score if the API is offline or returns an error. In that case, the result panel shows an explicit unavailable state and keeps the result values blank.

The date field is populated from the browser's local calendar date, avoiding UTC date rollover.

## Important model note

The prediction is an experimental project estimate based on the included dataset and trained model. It is not a medical assessment, a guarantee of lift safety, or a substitute for coaching, appropriate equipment, and stopping when unwell or in pain. A high score must not be treated as permission to attempt a maximal lift.

## Validation performed for this package

- JavaScript syntax check (`node --check`).
- Python syntax check for `backend/main.py`.
- Static HTML-to-JavaScript ID reference check.
- Duplicate HTML ID check.
- File presence and archive inventory check against the separately uploaded `backend.rar`.

The full live prediction test still depends on installing the listed Python packages and running the backend in the user's environment.
