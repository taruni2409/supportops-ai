from fastapi.testclient import TestClient

from api.main import app


client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "SupportOps AI API"


def test_health():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["components"]["intent_classifier"] == "ready"
    assert data["components"]["sla_risk_model"] == "ready"
    assert data["components"]["rag_pipeline"] == "ready"


def test_invalid_sla_created_hour():

    payload = {
        "ticket_priority": "High",
        "ticket_channel": "Email",
        "customer_tier": "Premium",
        "intent": "bank_transfer",
        "created_hour": 40,
        "created_day": 2,
        "is_weekend": 0,
        "outside_business_hours": 0,
        "previous_contacts": 1,
        "recent_tickets_30d": 2,
        "message_length": 100,
        "sentiment_score": -0.2,
        "queue_load": 60,
        "agent_utilization": 0.70,
        "account_age_days": 500
    }

    response = client.post(
        "/predict-sla-risk",
        json=payload
    )

    assert response.status_code == 422


def test_invalid_intent_empty_text():

    payload = {
        "ticket_text": ""
    }

    response = client.post(
        "/predict-intent",
        json=payload
    )

    assert response.status_code == 422