from typing import List
from transformers import pipeline

print("Loading Summarization Model (BART)...")
summarizer = pipeline(
    "summarization",
    model="sshleifer/distilbart-cnn-12-6",
    device=-1
)

def _build_transcript(messages: List[object]) -> str:
    lines: List[str] = []
    for item in messages:
        sender = getattr(item, "senderType", None) or item.get("senderType")
        text = getattr(item, "text", None) or item.get("text")
        if not text:
            continue
        speaker = "Customer" if sender == "customer" else "Agent"
        lines.append(f"{speaker}: {str(text).strip()}")
    return "\n".join(lines)


def summarize_conversation(messages: List[object], language: str) -> str:
    if not messages:
        return ""

    transcript = _build_transcript(messages)
    if not transcript:
        return ""

    words = transcript.split()
    if len(words) < 24:
        preview = " ".join(words[:40])
        return f"Customer support interaction summary: {preview}".strip()

    prompt = (
        "Summarize this customer support conversation in professional English. "
        "Include issue, support action, and current status.\n\n"
        f"{transcript}"
    )
    input_text = prompt[:1300]

    try:
        summary = summarizer(input_text, max_length=90, min_length=25, do_sample=False)
        return summary[0]["summary_text"].strip()
    except Exception:
        excerpt = " ".join(words[:60])
        return f"Customer support interaction summary: {excerpt}".strip()
