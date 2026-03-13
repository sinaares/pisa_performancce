from pydantic import BaseModel
from datetime import datetime


class ChatMessage(BaseModel):
    role: str       # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    student_id: str
    message: str


class ChatOut(BaseModel):
    id: str
    student_id: str
    teacher_id: str
    role: str
    content: str
    created_at: datetime
