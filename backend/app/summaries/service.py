from groq import Groq

from ..config import get_settings
from ..database import get_supabase, safe_data

TABLE = "student_summaries"

SUMMARIZE_PROMPT = (
    "Summarize the key takeaways and action items from this conversation "
    "about the student. Be concise (3-5 bullet points). "
    "Focus on what the teacher should know and do next."
)


def _call_groq(messages: list[dict]) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)
    resp = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages,
        temperature=0.3,
        max_tokens=512,
    )
    return resp.choices[0].message.content


def generate_summary_from_chat(
    teacher_id: str, student_id: str, chat_messages: list[dict]
) -> dict:
    """Summarize a list of chat messages and store the result."""
    transcript = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in chat_messages
    )
    messages = [
        {"role": "system", "content": SUMMARIZE_PROMPT},
        {"role": "user", "content": transcript},
    ]
    summary_text = _call_groq(messages)

    sb = get_supabase()
    row = {
        "student_id": student_id,
        "summary_text": summary_text,
        "generated_from": "chat",
    }
    saved = sb.table(TABLE).insert(row).execute()
    return saved.data[0]


def regenerate_summary(teacher_id: str, student_id: str) -> dict:
    """Pull the latest chat history and generate a fresh summary."""
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

    # get recent chat messages
    messages = (
        sb.table("chat_messages")
        .select("role, content")
        .eq("student_id", student_id)
        .eq("teacher_id", teacher_id)
        .order("created_at")
        .limit(50)
        .execute()
    ).data

    if not messages:
        raise ValueError("No chat messages to summarize")

    return generate_summary_from_chat(teacher_id, student_id, messages)


def list_summaries(teacher_id: str, student_id: str) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table(TABLE)
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
