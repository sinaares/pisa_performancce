from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NoteCreate(BaseModel):
    content: str


class NoteUpdate(BaseModel):
    content: str


class NoteOut(BaseModel):
    id: str
    student_id: str
    teacher_id: str
    content: str
    created_at: datetime
    updated_at: datetime
