from pydantic import BaseModel
from datetime import datetime


class FeatureImpact(BaseModel):
    name: str
    value: float
    impact: float


class ExplanationResponse(BaseModel):
    id: str
    prediction_id: str
    explanation_data: dict              # full SHAP output
    top_positive_factors: list[dict]    # [{name, impact}, ...]
    top_negative_factors: list[dict]    # [{name, impact}, ...]
    created_at: datetime


class ExplanationHistoryResponse(BaseModel):
    explanations: list[ExplanationResponse]
    count: int
