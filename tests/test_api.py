from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "PR or Hospital" in data["status"]
    assert data["model_available"] == True
    assert data["threshold"] == 0.55

def test_overview_endpoint():
    response = client.get("/overview")
    assert response.status_code == 200
    data = response.json()
    # REAL keys from your backend
    assert data["total_records"] == 148326
    assert data["model_available"] == True
    assert data["threshold"] == 0.55
    assert data["features"] == 11
    assert "logistic_regression" in data["models"]
    assert "decision_tree" in data["models"]
    assert data["models"]["logistic_regression"]["accuracy"] > 70
    assert data["models"]["decision_tree"]["accuracy"] > 70

def test_prediction_with_saved_model():
    response = client.post("/predict", json={
        "Age": 25, "BodyweightKg": 80, "Sex": "M", "Event": "SBD", "Equipment": "Raw",
        "lift_type": "Squat", "attempt_number": 2,
        "target_weight_kg": 110, "prior_successful_weight_kg": 100,
        "sleep_hours": 8, "soreness": 2, "rest_days": 2, "energy": 9
    })
    assert response.status_code == 200, response.text
    data = response.json()
    # REAL keys from your backend
    assert 0 <= data["fail_probability"] <= 1
    assert data["prediction"] in ("GO", "NO-GO")
    assert data["label"] in ("GO", "NO-GO")
    assert "recovery_score" in data
    assert "recovery_adjustment" in data

def test_prediction_green_case():
    green = client.post("/predict", json={
        "Age": 22, "BodyweightKg": 80, "Sex": "M", "Event": "SBD", "Equipment": "Raw",
        "lift_type": "Squat", "attempt_number": 1,
        "target_weight_kg": 95, "prior_successful_weight_kg": 100,
        "sleep_hours": 8, "soreness": 2, "rest_days": 2, "energy": 9
    }).json()
    red = client.post("/predict", json={
        "Age": 25, "BodyweightKg": 80, "Sex": "M", "Event": "SBD", "Equipment": "Raw",
        "lift_type": "Squat", "attempt_number": 2,
        "target_weight_kg": 130, "prior_successful_weight_kg": 100,
        "sleep_hours": 4, "soreness": 9, "rest_days": 0, "energy": 3
    }).json()
    # Fresh + small jump MUST be safer
    assert green["fail_probability"] < red["fail_probability"]
    assert green["recovery_score"] > red["recovery_score"]

def test_prediction_invalid_age():
    response = client.post("/predict", json={
        "Age": 5, "BodyweightKg": 80, "Sex": "M", "Event": "SBD", "Equipment": "Raw",
        "lift_type": "Squat", "attempt_number": 1,
        "target_weight_kg": 100, "prior_successful_weight_kg": 100,
        "sleep_hours": 7, "soreness": 5, "rest_days": 1, "energy": 7
    })
    assert response.status_code in (200, 422)