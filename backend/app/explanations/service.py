import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "src"))

from ml_interface import run_explanation
from ..database import get_supabase

TABLE = "explanations"
TOP_N = 5  # number of top factors to pre-compute


def generate_explanation(
    teacher_id: str, student_id: str, prediction_id: str
) -> dict:
    """Load student profile + prediction, run SHAP, parse and store."""
    sb = get_supabase()

    # load profile data
    profile = (
        sb.table("student_profiles")
        .select("profile_data")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    ).data
    if not profile:
        raise ValueError("Student profile not found")

    # load prediction
    prediction = (
        sb.table("predictions")
        .select("prediction_result, created_by")
        .eq("id", prediction_id)
        .eq("created_by", teacher_id)
        .maybe_single()
        .execute()
    ).data
    if not prediction:
        raise ValueError("Prediction not found")

    prediction_result = prediction["prediction_result"]
    profile_data = profile["profile_data"]

    # run SHAP explanation
    explanation = run_explanation(profile_data, prediction_result)

    # parse into top positive / negative factors
    impacts = explanation.get("feature_impacts", [])
    top_positive = [
        {"name": f["name"], "impact": f["impact"]}
        for f in impacts if f["impact"] > 0
    ][:TOP_N]
    top_negative = [
        {"name": f["name"], "impact": f["impact"]}
        for f in impacts if f["impact"] < 0
    ][:TOP_N]

    row = {
        "prediction_id": prediction_id,
        "explanation_data": explanation,
        "top_positive_factors": top_positive,
        "top_negative_factors": top_negative,
    }
    saved = sb.table(TABLE).insert(row).execute().data[0]
    return saved


def get_latest_explanation(teacher_id: str, student_id: str) -> dict | None:
    """Get the most recent explanation for a student (via their predictions)."""
    sb = get_supabase()

    # get the student's latest prediction id
    prediction = (
        sb.table("predictions")
        .select("id")
        .eq("student_id", student_id)
        .eq("created_by", teacher_id)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    ).data
    if not prediction:
        return None

    result = (
        sb.table(TABLE)
        .select("*")
        .eq("prediction_id", prediction["id"])
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return result.data


def list_explanations(teacher_id: str, student_id: str) -> list[dict]:
    """List all explanations for a student's predictions."""
    sb = get_supabase()

    # get all prediction ids for this student
    predictions = (
        sb.table("predictions")
        .select("id")
        .eq("student_id", student_id)
        .eq("created_by", teacher_id)
        .execute()
    ).data
    if not predictions:
        return []

    prediction_ids = [p["id"] for p in predictions]
    result = (
        sb.table(TABLE)
        .select("*")
        .in_("prediction_id", prediction_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
