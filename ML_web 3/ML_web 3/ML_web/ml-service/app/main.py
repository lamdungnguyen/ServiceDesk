from fastapi import FastAPI

from app.schemas.payloads import AnalyzePayload, EmployeePredictionPayload
from app.pipelines.sentiment_pipeline import score_sentiment, label_sentiment
from app.pipelines.summary_pipeline import summarize_conversation
from app.models.performance_model import predict_effectiveness

app = FastAPI(title="ML Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ml-service"}


@app.post("/analyze")
def analyze(payload: AnalyzePayload) -> dict:
    texts = [message.text for message in payload.messages]
    sentiment_score = score_sentiment(texts)

    return {
        "summary": summarize_conversation(payload.messages, payload.language),
        "sentimentScore": sentiment_score,
        "sentimentLabel": label_sentiment(sentiment_score),
    }


@app.post("/predict/employee")
def predict_employee(payload: EmployeePredictionPayload) -> dict:
    return predict_effectiveness(payload.model_dump())
