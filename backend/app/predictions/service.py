import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "src"))

from ml_interface import run_prediction, validate_student_input
from ..config import get_settings
from ..database import get_supabase, safe_data
from ..explanations.service import generate_explanation

TABLE = "predictions"


class MissingFieldsError(Exception):
    """Raised when the student profile is missing required fields."""

    def __init__(self, missing_fields: list[str]):
        self.missing_fields = missing_fields
        super().__init__(
            f"Cannot run prediction — {len(missing_fields)} required fields are missing."
        )


def _load_profile_data(sb, teacher_id: str, student_id: str) -> dict:
    """Load and return the profile_data dict for a student, or raise."""
    # verify student ownership
    student = safe_data(
        sb.table("students")
        .select("id")
        .eq("id", student_id)
        .eq("teacher_id", teacher_id)
        .maybe_single()
        .execute()
    )
    if not student:
        raise ValueError("Student not found")

    profile = safe_data(
        sb.table("student_profiles")
        .select("profile_data")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    if not profile or not profile.get("profile_data"):
        raise MissingFieldsError(list(validate_student_input({})[1]))

    return profile["profile_data"]


def run_student_prediction(teacher_id: str, student_id: str) -> dict:
    """Load profile, validate, predict, store, auto-generate explanation."""
    sb = get_supabase()
    settings = get_settings()

    profile_data = _load_profile_data(sb, teacher_id, student_id)

    # validate completeness
    ok, missing = validate_student_input(profile_data)
    if not ok:
        raise MissingFieldsError(missing)

    # run ML prediction
    result = run_prediction(profile_data)

    prediction_result = {
        "ridge_score": result["ridge_score"],
        "xgb_score": result["xgb_score"],
        "features_used": result["features_used"],
    }

    row = {
        "student_id": student_id,
        "prediction_result": prediction_result,
        "model_version": settings.ml_model_version,
        "status": "completed",
        "created_by": teacher_id,
    }
    saved = sb.table(TABLE).insert(row).execute().data[0]

    # auto-trigger explanation generation
    try:
        generate_explanation(teacher_id, student_id, saved["id"])
    except Exception:
        pass  # explanation failure should not block the prediction response

    return saved


def get_latest_prediction(teacher_id: str, student_id: str) -> dict | None:
    sb = get_supabase()
    return safe_data(
        sb.table(TABLE)
        .select("*")
        .eq("student_id", student_id)
        .eq("created_by", teacher_id)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )


def list_predictions(teacher_id: str, student_id: str) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table(TABLE)
        .select("*")
        .eq("student_id", student_id)
        .eq("created_by", teacher_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
