from pydantic import BaseModel, Field
from typing import List, Optional

class SLARiskRequest(BaseModel):

    ticket_priority: str

    ticket_channel: str

    customer_tier: str

    intent: str

    created_hour: int = Field(
        ge=0,
        le=23
    )

    created_day: int = Field(
        ge=0,
        le=6
    )

    is_weekend: int = Field(
        ge=0,
        le=1
    )

    outside_business_hours: int = Field(
        ge=0,
        le=1
    )

    previous_contacts: int = Field(
        ge=0
    )

    recent_tickets_30d: int = Field(
        ge=0
    )

    message_length: int = Field(
        ge=0
    )

    sentiment_score: float = Field(
        ge=-1,
        le=1
    )

    queue_load: float = Field(
        ge=0,
        le=100
    )

    agent_utilization: float = Field(
        ge=0,
        le=1
    )

    account_age_days: int = Field(
        ge=0
    )

class IntentRequest(BaseModel):
    ticket_text: str = Field(
        min_length=1,
        max_length=5000
    )


class RAGRequest(BaseModel):

    question: str = Field(
        min_length=1,
        max_length=5000
    )

    top_k: int = Field(
        default=3,
        ge=1,
        le=5
    )

class AnalyzeTicketRequest(BaseModel):
    ticket_text: str = Field(
        min_length=1,
        max_length=5000
    )

    ticket_priority: str

    ticket_channel: str

    customer_tier: str

    created_hour: int = Field(
        ge=0,
        le=23
    )

    created_day: int = Field(
        ge=0,
        le=6
    )

    previous_contacts: int = Field(
        ge=0
    )

    recent_tickets_30d: int = Field(
        ge=0
    )

    sentiment_score: float = Field(
        ge=-1,
        le=1
    )

    queue_load: float = Field(
        ge=0,
        le=100
    )

    agent_utilization: float = Field(
        ge=0,
        le=1
    )

    account_age_days: int = Field(
        ge=0
    )

class IntentPrediction(BaseModel):
    intent: str
    confidence: float
    confidence_percentage: float


class IntentResponse(BaseModel):
    intent: str
    confidence: float
    confidence_percentage: float
    top_predictions: List[IntentPrediction]


class SLARiskResponse(BaseModel):
    sla_breach_probability: float
    sla_breach_percentage: float
    breach_alert: bool
    decision_threshold: float


class RAGSource(BaseModel):
    rank: int
    source: str
    chunk_id: str
    text: str
    distance: float
    similarity: float


class RAGResponse(BaseModel):
    question: str
    answer: str
    sources: List[RAGSource]
    top_similarity: float
    status: str

class IntentAnalysisResponse(IntentResponse):
    sla_category: str


class SupportRecommendationResponse(BaseModel):
    status: str
    answer: str
    top_similarity: float
    sources: List[RAGSource]


class AnalyzeTicketResponse(BaseModel):
    ticket_text: str
    intent_analysis: IntentAnalysisResponse
    sla_analysis: SLARiskResponse
    support_recommendation: SupportRecommendationResponse