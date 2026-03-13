from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# -- Request models -----------------------------------------------------------

class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    student_code: Optional[str] = None


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    student_code: Optional[str] = None


class StudentProfileUpdate(BaseModel):
    profile_data: dict[str, float]  # PISA feature name -> value


# -- Response models ----------------------------------------------------------

class StudentListItem(BaseModel):
    id: str
    first_name: str
    last_name: str
    student_code: Optional[str] = None
    has_prediction: bool
    last_updated: datetime


class StudentListResponse(BaseModel):
    students: list[StudentListItem]
    count: int


class StudentResponse(BaseModel):
    id: str
    teacher_id: str
    first_name: str
    last_name: str
    student_code: Optional[str] = None
    archived: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[dict] = None              # profile_data from student_profiles
    latest_prediction: Optional[dict] = None    # most recent prediction row
    latest_explanation: Optional[dict] = None   # most recent explanation row


class ValidationResponse(BaseModel):
    is_valid: bool
    filled_fields: list[str]
    missing_fields: list[str]
