from groq import Groq

from ..config import get_settings
from ..database import get_supabase
from .prompt_builder import build_student_context, build_messages

TABLE = "chat_messages"
AUTO_SUMMARY_INTERVAL = 10  # generate summary every N messages


def get_history(student_id: str, teacher_id: str, limit: int = 50) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table(TABLE)
        .select("*")
        .eq("student_id", student_id)
        .eq("teacher_id", teacher_id)
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return result.data


def _get_profile_data(sb, student_id: str, teacher_id: str) -> dict:
    """Get profile_data from student_profiles table."""
    profile = (
        sb.table("student_profiles")
        .select("profile_data")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    ).data
    return profile.get("profile_data", {}) if profile else {}


def send_message(student_id: str, teacher_id: str, message: str) -> dict:
    """Store user message, call Groq LLM, store reply, auto-summarize."""
    sb = get_supabase()
    settings = get_settings()

    # verify student exists
    student = (
        sb.table("students")
        .select("id")
        .eq("id", student_id)
        .eq("teacher_id", teacher_id)
        .maybe_single()
        .execute()
    ).data
    if not student:
        raise ValueError("Student not found")

    # load profile data
    indicators = _get_profile_data(sb, student_id, teacher_id)

    # latest prediction + explanation
    prediction = (
        sb.table("predictions")
        .select("prediction_result")
        .eq("student_id", student_id)
        .eq("created_by", teacher_id)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    ).data

    explanation = None
    if prediction:
        explanation = (
            sb.table("explanations")
            .select("explanation_data")
            .eq("prediction_id", prediction.get("id", ""))
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        ).data
        if explanation:
            explanation = explanation.get("explanation_data")

    # build grounded prompt
    context = build_student_context(
        indicators,
        prediction.get("prediction_result") if prediction else None,
        explanation,
    )
    history = get_history(student_id, teacher_id)
    llm_messages = build_messages(context, history, message)

    # store user message
    sb.table(TABLE).insert({
        "student_id": student_id,
        "teacher_id": teacher_id,
        "role": "user",
        "content": message,
    }).execute()

    # call Groq LLM
    if settings.groq_api_key:
        try:
            client = Groq(api_key=settings.groq_api_key)
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=llm_messages,
                temperature=0.4,
                max_tokens=1024,
                timeout=30,
            )
            reply_text = resp.choices[0].message.content
        except Exception as exc:
            reply_text = (
                "I'm sorry, I'm having trouble responding right now. "
                "Please try again in a moment."
            )
    else:
        reply_text = (
            "[LLM integration pending] "
            "Configure GROQ_API_KEY in .env to enable AI chat responses."
        )

    # store assistant reply
    saved = sb.table(TABLE).insert({
        "student_id": student_id,
        "teacher_id": teacher_id,
        "role": "assistant",
        "content": reply_text,
    }).execute()

    # auto-summarize every N messages
    _maybe_auto_summarize(sb, student_id, teacher_id)

    return saved.data[0]


def _maybe_auto_summarize(sb, student_id: str, teacher_id: str):
    """Generate a summary if the message count hit the interval threshold."""
    try:
        count_result = (
            sb.table(TABLE)
            .select("id", count="exact")
            .eq("student_id", student_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )
        count = count_result.count or 0
        if count > 0 and count % AUTO_SUMMARY_INTERVAL == 0:
            from ..summaries.service import generate_summary_from_chat

            messages = (
                sb.table(TABLE)
                .select("role, content")
                .eq("student_id", student_id)
                .eq("teacher_id", teacher_id)
                .order("created_at")
                .limit(50)
                .execute()
            ).data
            if messages:
                generate_summary_from_chat(teacher_id, student_id, messages)
    except Exception:
        pass  # summary failure should never block the chat response
