from fastapi import FastAPI
from pydantic import BaseModel
import logging

# Import the refactored AI logic module
from ai_logic import classify_category, predict_priority, analyze_sentiment

app = FastAPI(title="SmartDesk AI Microservice")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    category: str
    priority: str
    sentiment: str
    reason: str

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_ticket(request: AnalyzeRequest):
    text = request.text
    logger.info(f"Received ticket text: {text}")
    
    # 1. Analyze sentiment first (needed for priority)
    sentiment, sent_reason = analyze_sentiment(text)
    
    # 2. Predict priority with sentiment awareness
    priority, prio_reason = predict_priority(text, sentiment)
    
    # 3. Classify category (rules + ML fallback)
    category, cat_reason = classify_category(text)
    
    # Combine reasons for explainability
    combined_reason = f"Category: {cat_reason} | Priority: {prio_reason} | Sentiment: {sent_reason}"
    logger.info(f"Analysis result -> Cat: {category}, Prio: {priority}, Sent: {sentiment}")
    logger.info(f"Reasoning: {combined_reason}")

    return AnalyzeResponse(
        category=category,
        priority=priority,
        sentiment=sentiment,
        reason=combined_reason
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
