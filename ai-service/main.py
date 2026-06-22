from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict
import logging

from ai_logic import classify_category, detect_impact, predict_priority, analyze_sentiment

MODEL_VERSION = "hybrid-v2.1"

app = FastAPI(
    title="SmartDesk AI Microservice",
    description="AI service for ticket classification, priority, sentiment, and assistant summaries",
    version="2.1.0",
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    category: str
    priority: str
    sentiment: str
    impact: str
    impact_reason: str
    urgency_signals: list[str]
    reason: str
    prediction_source: str
    confidence_score: float
    model_version: str


class SummaryComment(BaseModel):
    userId: int | None = None
    authorName: str | None = None
    content: str = ""
    createdAt: str | None = None


class TicketSummaryRequest(BaseModel):
    title: str = ""
    description: str = ""
    category: str | None = None
    priority: str | None = None
    comments: list[SummaryComment] = []


class TicketSummaryResponse(BaseModel):
    summary: str
    customer_problem: str
    attempted_steps: list[str]
    suggested_next_steps: list[str]
    suggested_reply: str
    source: str


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_ticket(request: AnalyzeRequest):
    text = request.text
    logger.info("[AI] Received ticket: %s...", text[:120])

    sentiment, sent_reason = analyze_sentiment(text)
    impact, impact_reason, urgency_signals = detect_impact(text)
    priority, prio_reason = predict_priority(text, sentiment, impact)
    category, cat_reason, prediction_source, confidence_score = classify_category(text)

    combined_reason = (
        f"Category: {cat_reason} | "
        f"Priority: {prio_reason} | "
        f"Impact: {impact_reason} | "
        f"Sentiment: {sent_reason}"
    )

    logger.info(
        "[AI] Result -> Cat=%s(%s/%.2f), Prio=%s, Impact=%s, Sent=%s",
        category,
        prediction_source,
        confidence_score,
        priority,
        impact,
        sentiment,
    )

    return AnalyzeResponse(
        category=category,
        priority=priority,
        sentiment=sentiment,
        impact=impact,
        impact_reason=impact_reason,
        urgency_signals=urgency_signals,
        reason=combined_reason,
        prediction_source=prediction_source,
        confidence_score=confidence_score,
        model_version=MODEL_VERSION,
    )


@app.post("/summarize-ticket", response_model=TicketSummaryResponse)
def summarize_ticket(request: TicketSummaryRequest):
    comments = [comment.content.strip() for comment in request.comments if comment.content.strip()]
    latest_comment = comments[-1] if comments else ""
    combined_text = " ".join([request.title or "", request.description or "", latest_comment]).lower()

    attempted_steps = []
    if any(word in combined_text for word in ["restart", "reboot", "khoi dong", "khởi động"]):
        attempted_steps.append("User or agent mentioned restarting/rebooting.")
    if any(word in combined_text for word in ["password", "login", "account", "mat khau", "mật khẩu"]):
        attempted_steps.append("Account/login context was identified.")
    if any(word in combined_text for word in ["vpn", "wifi", "network", "internet"]):
        attempted_steps.append("Network connectivity context was identified.")
    if not attempted_steps:
        attempted_steps.append("No concrete troubleshooting steps were found in the ticket text.")

    suggested_next_steps = [
        "Validate the current impact and whether the issue is still active.",
        "Check the relevant service, device, or account logs before changing status.",
    ]
    if (request.priority or "").upper() in {"HIGH", "URGENT"}:
        suggested_next_steps.insert(0, "Prioritize immediate acknowledgement because the ticket has elevated priority.")

    summary = f"{request.title or 'Ticket'}: {request.description or 'No description provided.'}"
    if latest_comment:
        summary += f" Latest comment: {latest_comment}"

    return TicketSummaryResponse(
        summary=summary[:900],
        customer_problem=request.description or request.title or "No customer problem provided.",
        attempted_steps=attempted_steps,
        suggested_next_steps=suggested_next_steps,
        suggested_reply="Thanks for the details. I am checking the issue now and will update you with the next steps shortly.",
        source="RULE_BASED",
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SmartDesk AI v2.1", "model_version": MODEL_VERSION}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
