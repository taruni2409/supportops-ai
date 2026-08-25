from fastapi import FastAPI, HTTPException

from api.schemas import (
    SLARiskRequest,
    IntentRequest,
    RAGRequest,
    AnalyzeTicketRequest
)
from fastapi.middleware.cors import CORSMiddleware

from ml.inference.intent_mapping import (
    map_intent_to_sla_category
)

from api.schemas import (
    SLARiskRequest,
    SLARiskResponse,
    IntentRequest,
    IntentResponse,
    RAGRequest,
    RAGResponse,
    AnalyzeTicketRequest,
    AnalyzeTicketResponse
)

from rag.pipeline import (
    answer_with_rag
)

from ml.training.sla_risk import (
    predict_sla_risk
)

from ml.inference.intent_classifier import (
    predict_intent
)


app = FastAPI(
    title="SupportOps AI API",
    description=(
        "Backend API for SupportOps AI — "
        "intent classification, SLA risk prediction "
        "and grounded RAG support recommendations."
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "message": "SupportOps AI API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "components": {
            "intent_classifier": "ready",
            "sla_risk_model": "ready",
            "rag_pipeline": "ready"
        }
    }


@app.post(
    "/predict-sla-risk",
    response_model=SLARiskResponse
)
def predict_sla(
    request: SLARiskRequest
):
    try:
        return predict_sla_risk(
            request.model_dump()
        )

    except Exception as exc:
        print(
            "SLA prediction error:",
            type(exc).__name__,
            str(exc)
        )

        raise HTTPException(
            status_code=500,
            detail="SLA risk prediction failed."
        )

@app.post(
    "/predict-intent",
    response_model=IntentResponse
)
def classify_intent(
    request: IntentRequest
):
    try:
        return predict_intent(
            request.ticket_text
        )

    except Exception as exc:
        print(
            "Intent prediction error:",
            type(exc).__name__,
            str(exc)
        )

        raise HTTPException(
            status_code=500,
            detail="Intent prediction failed."
        )


@app.post(
    "/rag",
    response_model=RAGResponse
)
def generate_support_recommendation(
    request: RAGRequest
):

    result = answer_with_rag(
        question=request.question,
        top_k=request.top_k
    )

    return result

@app.post(
    "/analyze-ticket",
    response_model=AnalyzeTicketResponse
)
def analyze_ticket(
    request: AnalyzeTicketRequest
):

    # --------------------------------------------------
    # STEP 1: Predict ticket intent
    # --------------------------------------------------

    intent_result = predict_intent(
        request.ticket_text
    )

    predicted_intent = (
        intent_result["intent"]
    )
    sla_intent = (
    map_intent_to_sla_category(
        predicted_intent
    )
)


    # --------------------------------------------------
    # STEP 2: Derive operational features
    # --------------------------------------------------

    is_weekend = int(
        request.created_day >= 5
    )

    outside_business_hours = int(
        request.created_hour < 8
        or request.created_hour >= 18
    )

    message_length = len(
        request.ticket_text
    )


    # --------------------------------------------------
    # STEP 3: Construct SLA model input
    # --------------------------------------------------

    sla_ticket = {
        "ticket_priority":
            request.ticket_priority,

        "ticket_channel":
            request.ticket_channel,

        "customer_tier":
            request.customer_tier,

        "intent":
            sla_intent,

        "created_hour":
            request.created_hour,

        "created_day":
            request.created_day,

        "is_weekend":
            is_weekend,

        "outside_business_hours":
            outside_business_hours,

        "previous_contacts":
            request.previous_contacts,

        "recent_tickets_30d":
            request.recent_tickets_30d,

        "message_length":
            message_length,

        "sentiment_score":
            request.sentiment_score,

        "queue_load":
            request.queue_load,

        "agent_utilization":
            request.agent_utilization,

        "account_age_days":
            request.account_age_days
    }


    # --------------------------------------------------
    # STEP 4: SLA risk prediction
    # --------------------------------------------------

    sla_result = predict_sla_risk(
        sla_ticket
    )


    # --------------------------------------------------
    # STEP 5: RAG recommendation
    # --------------------------------------------------

    rag_result = answer_with_rag(
        question=request.ticket_text,
        top_k=3
    )


    # --------------------------------------------------
    # STEP 6: Unified response
    # --------------------------------------------------

    return {
        "ticket_text":
            request.ticket_text,

        "intent_analysis":
            intent_result,

        "sla_analysis":
            sla_result,

        "support_recommendation": {
            "status":
                rag_result["status"],

            "answer":
                rag_result["answer"],

            "top_similarity":
                rag_result[
                    "top_similarity"
                ],

            "sources":
                rag_result["sources"]
        }
    }