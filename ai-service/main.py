from fastapi import FastAPI
from pydantic import BaseModel
import logging

from ai_logic import classify_category, predict_priority, analyze_sentiment

app = FastAPI(
    title="SmartDesk AI Microservice",
    description="AI service cho Service Desk — phân loại ticket, ưu tiên, cảm xúc",
    version="2.0.0",
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    category: str
    priority: str
    sentiment: str
    reason: str
    prediction_source: str   # RULE_BASED | ZERO_SHOT
    confidence_score: float  # 1.0 nếu rule-based, model score nếu zero-shot


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_ticket(request: AnalyzeRequest):
    """
    Phân tích ticket IT support.
    Trả về category, priority, sentiment + metadata (source, confidence).
    """
    text = request.text
    logger.info(f"[AI] Received ticket: {text[:120]}...")

    # 1. Sentiment (cần trước để ảnh hưởng priority)
    sentiment, sent_reason = analyze_sentiment(text)

    # 2. Priority (dùng sentiment)
    priority, prio_reason = predict_priority(text, sentiment)

    # 3. Category — giờ trả 4 giá trị
    category, cat_reason, prediction_source, confidence_score = classify_category(text)

    combined_reason = (
        f"Category: {cat_reason} | "
        f"Priority: {prio_reason} | "
        f"Sentiment: {sent_reason}"
    )

    logger.info(
        f"[AI] Result → Cat={category}({prediction_source}/{confidence_score:.2f}), "
        f"Prio={priority}, Sent={sentiment}"
    )

    return AnalyzeResponse(
        category=category,
        priority=priority,
        sentiment=sentiment,
        reason=combined_reason,
        prediction_source=prediction_source,
        confidence_score=confidence_score,
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SmartDesk AI v2.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
