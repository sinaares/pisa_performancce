import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "src"))

from ml_interface import REQUIRED_FIELDS
from ..database import get_supabase, safe_data
from .models import StudentCreate, StudentUpdate


def create_student(teacher_id: str, data: StudentCreate) -> dict:
    """Insert a new student row and an empty student_profiles row."""
    sb = get_supabase()

    student_row = {
        "teacher_id": teacher_id,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "student_code": data.student_code,
    }
    student = sb.table("students").insert(student_row).execute().data[0]

    # create the companion profile with empty data
    sb.table("student_profiles").insert({
        "student_id": student["id"],
        "profile_data": {},
        "updated_by": teacher_id,
    }).execute()

    return student


def get_student(teacher_id: str, student_id: str) -> dict | None:
    """Fetch a student with their profile, latest prediction, and latest explanation."""
    sb = get_supabase()

    student = safe_data(
        sb.table("students")
        .select("*")
        .eq("id", student_id)
        .eq("teacher_id", teacher_id)
        .maybe_single()
        .execute()
    )
    if not student:
        return None

    # profile
    profile = safe_data(
        sb.table("student_profiles")
        .select("profile_data, updated_at")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    student["profile"] = profile.get("profile_data", {}) if profile else {}

    # latest prediction
    prediction = safe_data(
        sb.table("predictions")
        .select("*")
        .eq("student_id", student_id)
        .eq("created_by", teacher_id)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    student["latest_prediction"] = prediction

    # latest explanation (via prediction)
    if prediction:
        explanation = safe_data(
            sb.table("explanations")
            .select("*")
            .eq("prediction_id", prediction["id"])
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        student["latest_explanation"] = explanation
    else:
        student["latest_explanation"] = None

    return student


def update_student(teacher_id: str, student_id: str, data: StudentUpdate) -> dict:
    """Update student name/code fields."""
    sb = get_supabase()
    updates = data.model_dump(exclude_none=True)
    if not updates:
        # nothing to update, just return the current row
        return safe_data(
            sb.table("students")
            .select("*")
            .eq("id", student_id)
            .eq("teacher_id", teacher_id)
            .maybe_single()
            .execute()
        )

    result = (
        sb.table("students")
        .update(updates)
        .eq("id", student_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0]


def _validate_profile_fields(profile_data: dict) -> list[str]:
    """Validate field types — return list of error messages for bad values."""
    errors = []
    for key, value in profile_data.items():
        if key not in REQUIRED_FIELDS:
            continue
        if not isinstance(value, (int, float)):
            spec = REQUIRED_FIELDS[key]
            errors.append(
                f"Field '{key}' ({spec.get('description', key)}) "
                f"expects a number but got {type(value).__name__}."
            )
    return errors


def _get_range_warnings(profile_data: dict) -> list[str]:
    """Return warnings for values that look out of range."""
    warnings = []
    rules = {
        "AGE": (5, 25, "Age"),
        "GRADE": (1, 15, "Grade"),
        "ST004D01T": (1, 2, "Gender"),
        "IMMIG": (1, 3, "Immigration status"),
        "REPEAT": (0, 1, "Repeated a grade"),
        "SCHLTYPE": (1, 2, "School type"),
        "SCHSIZE": (1, 50000, "School size"),
        "STRATIO": (0.5, 100, "Student-teacher ratio"),
    }
    for key, (low, high, label) in rules.items():
        val = profile_data.get(key)
        if val is not None and isinstance(val, (int, float)):
            if val < low or val > high:
                warnings.append(
                    f"{label} value ({val}) seems unusual (expected {low}–{high})."
                )
    return warnings


def update_student_profile(
    teacher_id: str, student_id: str, profile_data: dict[str, float]
) -> dict:
    """Upsert the PISA indicator values for a student."""
    sb = get_supabase()

    # validate field types
    errors = _validate_profile_fields(profile_data)
    if errors:
        raise ValueError("; ".join(errors))

    # verify the student belongs to this teacher
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

    # check if profile exists
    existing = safe_data(
        sb.table("student_profiles")
        .select("id, profile_data")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )

    if existing:
        # merge new data into existing profile so partial updates work
        merged = {**existing["profile_data"], **profile_data}
        result = (
            sb.table("student_profiles")
            .update({"profile_data": merged, "updated_by": teacher_id})
            .eq("id", existing["id"])
            .execute()
        )
        return result.data[0]
    else:
        result = (
            sb.table("student_profiles")
            .insert({
                "student_id": student_id,
                "profile_data": profile_data,
                "updated_by": teacher_id,
            })
            .execute()
        )
        return result.data[0]


def list_students(teacher_id: str) -> list[dict]:
    """Return a lightweight list of students with prediction status."""
    sb = get_supabase()

    students = (
        sb.table("students")
        .select("id, first_name, last_name, student_code, updated_at")
        .eq("teacher_id", teacher_id)
        .eq("archived", False)
        .order("updated_at", desc=True)
        .execute()
    ).data

    if not students:
        return []

    # batch-check which students have at least one prediction
    student_ids = [s["id"] for s in students]
    predictions = (
        sb.table("predictions")
        .select("student_id")
        .in_("student_id", student_ids)
        .execute()
    ).data
    ids_with_predictions = {p["student_id"] for p in predictions}

    return [
        {
            "id": s["id"],
            "first_name": s["first_name"],
            "last_name": s["last_name"],
            "student_code": s.get("student_code"),
            "has_prediction": s["id"] in ids_with_predictions,
            "last_updated": s["updated_at"],
        }
        for s in students
    ]


def delete_student(student_id: str, teacher_id: str) -> None:
    """Hard-delete a student and all related data (cascades via FK)."""
    sb = get_supabase()
    sb.table("students").delete().eq("id", student_id).eq("teacher_id", teacher_id).execute()


def validate_student_profile(teacher_id: str, student_id: str) -> dict:
    """Check which REQUIRED_FIELDS are filled vs missing in the student's profile."""
    sb = get_supabase()

    # verify ownership
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

    profile_data = profile.get("profile_data", {}) if profile else {}

    all_fields = list(REQUIRED_FIELDS.keys())
    filled = [f for f in all_fields if f in profile_data and profile_data[f] is not None]
    missing = [f for f in all_fields if f not in filled]
    warnings = _get_range_warnings(profile_data)

    return {
        "is_valid": len(missing) == 0,
        "is_ready": len(missing) == 0,
        "filled_fields": filled,
        "missing_fields": missing,
        "missing_required": missing,
        "warnings": warnings,
        "filled_count": len(filled),
        "total_required": len(all_fields),
    }
