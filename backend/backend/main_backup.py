"""FastAPI service for the PR-or-Hospital academic prototype."""

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_PATH = BASE_DIR / "model" / "readiness_model.joblib"


def _model_path() -> Path:
    """Allow deployments to store the trained model outside the source tree."""
    configured = os.getenv("READINESS_MODEL_PATH")
    return Path(configured).expanduser() if configured else DEFAULT_MODEL_PATH


def _allowed_origins() -> list[str]:
    """Read comma-separated frontend origins; use localhost defaults for development."""
    value = os.getenv("CORS_ALLOW_ORIGINS")
    if value is None:
        return [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:5501",
            "http://localhost:5501",
        ]
    return [origin.strip() for origin in value.split(",") if origin.strip()]


app = FastAPI(
    title="PR-or-Hospital API",
    description="Academic prototype API for a gym lifting-readiness project.",
    version="1.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

class PredictionInput(BaseModel):
    sleep_hours: float = Field(ge=0, le=24, description="Hours slept in the last night")
    soreness: int = Field(ge=0, le=10, description="Perceived soreness from 0 to 10")
    rest_days: int = Field(ge=0, le=30, description="Days since the last workout")
    target_weight_kg: float = Field(gt=0, le=1000, description="Planned lifting weight in kg")

    def as_features(self) -> np.ndarray:
        """Keep the feature order explicit and consistent with model training."""
        return np.asarray(
            [[self.sleep_hours, self.soreness, self.rest_days, self.target_weight_kg]],
            dtype=float,
        )


class PredictionOutput(BaseModel):
    prediction: str
    result: str
    label: str


@lru_cache(maxsize=1)
def _load_model(path: str, modified_time: float) -> Any:
    """Load once per model file version; a file change invalidates the cache key."""
    del modified_time
    return joblib.load(path)


def _get_model() -> Any:
    path = _model_path()
    if not path.is_file():
        raise HTTPException(
            status_code=503,
            detail=(
                "No trained model is available. Set READINESS_MODEL_PATH to a valid "
                "model file, or train and approve a model first."
            ),
        )
    try:
        return _load_model(str(path.resolve()), path.stat().st_mtime)
    except (OSError, ValueError, EOFError, ImportError) as exc:
        logger.exception("Could not load readiness model at %s", path)
        raise HTTPException(status_code=503, detail="The configured model could not be loaded.") from exc


@app.get("/")
def root():
    path = _model_path()
    return {"message": "PR-or-Hospital API is running", "docs": "/docs", "model_available": path.is_file()}


@app.get("/health")
def health():
    return {"status": "ok", "model_available": _model_path().is_file()}


@app.post("/predict", response_model=PredictionOutput)
def predict(data: PredictionInput):
    model = _get_model()
    features = data.as_features()
    expected_features = getattr(model, "n_features_in_", None)
    if expected_features is not None and int(expected_features) != features.shape[1]:
        logger.error("Model expects %s features; API provides %s", expected_features, features.shape[1])
        raise HTTPException(
            status_code=503,
            detail="The configured model does not match this API's four input fields.",
        )

    try:
        predicted = str(model.predict(features)[0])
    except Exception as exc:
        logger.exception("Readiness prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed. Check the model and its training features.") from exc

    # Keep the three existing keys so current frontend clients continue to work.
    return {"prediction": predicted, "result": predicted, "label": predicted}