from ..database import get_supabase, safe_data

TABLE = "teacher_notes"


def _verify_student(sb, teacher_id: str, student_id: str):
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


def create_note(teacher_id: str, student_id: str, content: str) -> dict:
    sb = get_supabase()
    _verify_student(sb, teacher_id, student_id)
    row = {
        "student_id": student_id,
        "teacher_id": teacher_id,
        "content": content,
    }
    result = sb.table(TABLE).insert(row).execute()
    return result.data[0]


def list_notes(
    teacher_id: str, student_id: str, limit: int = 50, offset: int = 0
) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table(TABLE)
        .select("*")
        .eq("student_id", student_id)
        .eq("teacher_id", teacher_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


def update_note(teacher_id: str, note_id: str, content: str) -> dict:
    sb = get_supabase()
    result = (
        sb.table(TABLE)
        .update({"content": content})
        .eq("id", note_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    if not result.data:
        raise ValueError("Note not found")
    return result.data[0]


def delete_note(teacher_id: str, note_id: str) -> None:
    sb = get_supabase()
    sb.table(TABLE).delete().eq("id", note_id).eq("teacher_id", teacher_id).execute()
