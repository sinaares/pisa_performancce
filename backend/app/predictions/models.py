from pydantic import BaseModel
from datetime import datetime


class PredictionResponse(BaseModel):
    id: str
    student_id: str
    prediction_result: dict       # {ridge_score, xgb_score, features_used}
    model_version: str
    status: str                   # pending | completed | failed
    created_at: datetime
    created_by: str


class PredictionHistoryResponse(BaseModel):
    predictions: list[PredictionResponse]
    count: int
