"""
Seed demo data for the PISA Performance app.

Creates a demo teacher, sample students with filled profiles,
predictions, explanations, and notes. For demo/presentation purposes.

Usage:
    python scripts/seed_demo_data.py

Requires:
    - SUPABASE_URL and SUPABASE_KEY in backend/.env
    - The ML pipeline data files in data/raw/
"""

import sys
import os

# Add paths so we can import from backend and src
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Demo teacher ──────────────────────────────────────────────────────────────

DEMO_EMAIL = "demo@pisaperformance.com"
DEMO_PASSWORD = "demo123456"
DEMO_NAME = "Demo Teacher"


def create_demo_teacher() -> str:
    """Create a demo teacher via Supabase Auth and teachers table. Returns teacher UUID."""
    # Check if already exists
    existing_resp = (
        sb.table("teachers")
        .select("id")
        .eq("email", DEMO_EMAIL)
        .maybe_single()
        .execute()
    )
    existing = existing_resp.data if existing_resp else None
    if existing:
        print(f"Demo teacher already exists: {existing['id']}")
        return existing["id"]

    # Create auth user
    auth_resp = sb.auth.admin.create_user(
        {
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
            "email_confirm": True,
        }
    )
    uid = auth_resp.user.id

    # Create teachers row
    sb.table("teachers").insert(
        {"id": uid, "email": DEMO_EMAIL, "display_name": DEMO_NAME}
    ).execute()

    print(f"Created demo teacher: {uid} ({DEMO_EMAIL} / {DEMO_PASSWORD})")
    return uid


# ── Sample students ───────────────────────────────────────────────────────────

SAMPLE_STUDENTS = [
    {
        "first_name": "Aylin",
        "last_name": "Demir",
        "student_code": "STU-001",
        "profile": {
            "ST004D01T": 1, "AGE": 15.5, "GRADE": 10, "IMMIG": 1, "LANGN": 1,
            "REPEAT": 0, "ESCS": 0.8, "HOMEPOS": 0.9, "ICTRES": 0.7, "HISEI": 65,
            "MISCED": 14, "FISCED": 16, "HISCED": 16, "PAREDINT": 0.5,
            "SKIPPING": -0.3, "TARDYSD": -0.2, "MISSSC": 0, "WORKPAY": 0, "WORKHOME": 0,
            "DISCLIM": 0.6, "TEACHSUP": 0.7, "RELATST": 0.8, "SCHRISK": -0.5,
            "BELONG": 0.9, "BULLIED": -0.8, "FEELSAFE": 0.7, "CURSUPP": 0.5,
            "MATHMOT": 0.8, "MATHEFF": 0.9, "ANXMAT": -0.6, "MATHPERS": 0.7,
            "PERSEVAGR": 0.6, "CURIOAGR": 0.7,
            "ICTHOME": 3, "ICTAVHOM": 0.5, "ICTSCH": 2, "ICTAVSCH": 0.3,
            "ICTQUAL": 0.4, "ICTENQ": 0.2, "ICTFEED": 0.3,
            "SCHLTYPE": 1, "SCHSIZE": 800, "STRATIO": 18, "SCMATEDU": 0.5,
            "SCHCLIM": 0.6, "TCSHORT": -0.3, "STAFFSHORT": -0.2,
            "LEADINST": 0.5, "SCHAUTON": 0.4, "SCREADRES": 0.3,
        },
        "notes": ["Strong in math self-efficacy. Consider for advanced track."],
    },
    {
        "first_name": "Emre",
        "last_name": "Yilmaz",
        "student_code": "STU-002",
        "profile": {
            "ST004D01T": 2, "AGE": 16.2, "GRADE": 10, "IMMIG": 1, "LANGN": 1,
            "REPEAT": 1, "ESCS": -0.5, "HOMEPOS": -0.3, "ICTRES": -0.2, "HISEI": 35,
            "MISCED": 9, "FISCED": 9, "HISCED": 9, "PAREDINT": -0.3,
            "SKIPPING": 0.8, "TARDYSD": 0.6, "MISSSC": 4, "WORKPAY": 10, "WORKHOME": 5,
            "DISCLIM": -0.4, "TEACHSUP": -0.2, "RELATST": -0.1, "SCHRISK": 0.3,
            "BELONG": -0.5, "BULLIED": 0.4, "FEELSAFE": -0.3, "CURSUPP": -0.2,
            "MATHMOT": -0.6, "MATHEFF": -0.7, "ANXMAT": 0.9, "MATHPERS": -0.5,
            "PERSEVAGR": -0.4, "CURIOAGR": -0.2,
            "ICTHOME": 1, "ICTAVHOM": 0.2, "ICTSCH": 1, "ICTAVSCH": 0.1,
            "ICTQUAL": -0.3, "ICTENQ": 0.1, "ICTFEED": 0.1,
            "SCHLTYPE": 1, "SCHSIZE": 1200, "STRATIO": 25, "SCMATEDU": -0.3,
            "SCHCLIM": -0.2, "TCSHORT": 0.5, "STAFFSHORT": 0.4,
            "LEADINST": -0.2, "SCHAUTON": 0.2, "SCREADRES": -0.4,
        },
        "notes": [
            "Frequent absences — needs attendance intervention.",
            "Math anxiety is high. Refer for support.",
        ],
    },
    {
        "first_name": "Zeynep",
        "last_name": "Kaya",
        "student_code": "STU-003",
        "profile": {
            "ST004D01T": 1, "AGE": 15.8, "GRADE": 10, "IMMIG": 2, "LANGN": 2,
            "REPEAT": 0, "ESCS": 0.1, "HOMEPOS": 0.2, "ICTRES": 0.3, "HISEI": 48,
            "MISCED": 12, "FISCED": 11, "HISCED": 12, "PAREDINT": 0.2,
            "SKIPPING": 0.1, "TARDYSD": 0.1, "MISSSC": 1, "WORKPAY": 2, "WORKHOME": 0,
            "DISCLIM": 0.3, "TEACHSUP": 0.4, "RELATST": 0.5, "SCHRISK": -0.1,
            "BELONG": 0.4, "BULLIED": -0.2, "FEELSAFE": 0.4, "CURSUPP": 0.3,
            "MATHMOT": 0.3, "MATHEFF": 0.4, "ANXMAT": 0.1, "MATHPERS": 0.3,
            "PERSEVAGR": 0.4, "CURIOAGR": 0.5,
            "ICTHOME": 2, "ICTAVHOM": 0.4, "ICTSCH": 2, "ICTAVSCH": 0.3,
            "ICTQUAL": 0.2, "ICTENQ": 0.3, "ICTFEED": 0.2,
            "SCHLTYPE": 1, "SCHSIZE": 600, "STRATIO": 20, "SCMATEDU": 0.2,
            "SCHCLIM": 0.3, "TCSHORT": 0.1, "STAFFSHORT": 0.0,
            "LEADINST": 0.3, "SCHAUTON": 0.3, "SCREADRES": 0.2,
        },
        "notes": ["Second-generation immigrant. Good curiosity levels."],
    },
    {
        "first_name": "Burak",
        "last_name": "Ozturk",
        "student_code": "STU-004",
        "profile": {
            "ST004D01T": 2, "AGE": 15.3, "GRADE": 9, "IMMIG": 1, "LANGN": 1,
            "REPEAT": 0, "ESCS": 1.2, "HOMEPOS": 1.1, "ICTRES": 1.0, "HISEI": 75,
            "MISCED": 16, "FISCED": 18, "HISCED": 18, "PAREDINT": 0.8,
            "SKIPPING": -0.5, "TARDYSD": -0.4, "MISSSC": 0, "WORKPAY": 0, "WORKHOME": 0,
            "DISCLIM": 0.8, "TEACHSUP": 0.9, "RELATST": 0.9, "SCHRISK": -0.7,
            "BELONG": 1.0, "BULLIED": -1.0, "FEELSAFE": 0.9, "CURSUPP": 0.7,
            "MATHMOT": 1.0, "MATHEFF": 1.1, "ANXMAT": -0.9, "MATHPERS": 0.9,
            "PERSEVAGR": 0.8, "CURIOAGR": 0.9,
            "ICTHOME": 4, "ICTAVHOM": 0.6, "ICTSCH": 3, "ICTAVSCH": 0.5,
            "ICTQUAL": 0.6, "ICTENQ": 0.4, "ICTFEED": 0.4,
            "SCHLTYPE": 2, "SCHSIZE": 400, "STRATIO": 12, "SCMATEDU": 0.8,
            "SCHCLIM": 0.7, "TCSHORT": -0.6, "STAFFSHORT": -0.5,
            "LEADINST": 0.7, "SCHAUTON": 0.6, "SCREADRES": 0.7,
        },
        "notes": ["High achiever. Very supportive home environment."],
    },
]


def seed_student(teacher_id: str, student_data: dict) -> None:
    """Create a student, profile, prediction, explanation, and notes."""
    name = f"{student_data['first_name']} {student_data['last_name']}"

    # Create student
    student = (
        sb.table("students")
        .insert({
            "teacher_id": teacher_id,
            "first_name": student_data["first_name"],
            "last_name": student_data["last_name"],
            "student_code": student_data.get("student_code"),
        })
        .execute()
    ).data[0]
    student_id = student["id"]
    print(f"  Created student: {name} ({student_id})")

    # Create profile
    sb.table("student_profiles").insert({
        "student_id": student_id,
        "profile_data": student_data["profile"],
        "updated_by": teacher_id,
    }).execute()

    # Run prediction via ML pipeline
    try:
        from ml_interface import run_prediction, run_explanation

        pred_result = run_prediction(student_data["profile"])
        prediction = (
            sb.table("predictions")
            .insert({
                "student_id": student_id,
                "prediction_result": pred_result,
                "model_version": "v1",
                "status": "completed",
                "created_by": teacher_id,
            })
            .execute()
        ).data[0]
        print(f"    Prediction: XGB={pred_result['xgb_score']}, Ridge={pred_result['ridge_score']}")

        # Explanation
        expl_result = run_explanation(student_data["profile"], pred_result)
        top_positive = [f for f in expl_result["feature_impacts"] if f["impact"] > 0][:5]
        top_negative = [f for f in expl_result["feature_impacts"] if f["impact"] < 0][:5]
        sb.table("explanations").insert({
            "prediction_id": prediction["id"],
            "explanation_data": expl_result,
            "top_positive_factors": top_positive,
            "top_negative_factors": top_negative,
        }).execute()
        print(f"    Explanation generated")
    except Exception as e:
        print(f"    WARNING: ML pipeline not available, skipping prediction ({e})")

    # Notes
    for note_text in student_data.get("notes", []):
        sb.table("teacher_notes").insert({
            "student_id": student_id,
            "teacher_id": teacher_id,
            "content": note_text,
        }).execute()
    if student_data.get("notes"):
        print(f"    Added {len(student_data['notes'])} note(s)")


def main():
    print("=== Seeding demo data ===\n")

    teacher_id = create_demo_teacher()
    print()

    for s in SAMPLE_STUDENTS:
        seed_student(teacher_id, s)
        print()

    print("=== Done ===")
    print(f"\nLogin with: {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
