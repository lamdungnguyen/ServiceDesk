from typing import List
import re
from transformers import pipeline

print("Loading Sentiment Model (DistilBERT)...")
sentiment_analyzer = pipeline(
    "sentiment-analysis", 
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
    device=-1
)

def _normalize_text(text: str) -> str:
    cleaned = re.sub(r"https?://\S+", " ", text or "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _to_positive_score(item: dict) -> float:
    label = str(item.get("label", "")).upper()
    score = float(item.get("score", 0.5))
    if label == "POSITIVE":
        return score
    if label == "NEGATIVE":
        return 1 - score
    return 0.5


def _chunk_text(text: str, chunk_size: int = 420) -> List[str]:
    if len(text) <= chunk_size:
        return [text]

    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start = end
    return chunks


def score_sentiment(texts: List[str]) -> float:
    normalized = [_normalize_text(item) for item in texts if _normalize_text(item)]
    if not normalized:
        return 0.5

    # Keep more context from support conversations and bias toward recent turns.
    text = " ".join(normalized)
    chunks = _chunk_text(text, chunk_size=420)[:6]
    
    try:
        results = [sentiment_analyzer(chunk)[0] for chunk in chunks]
        scores = [_to_positive_score(item) for item in results]

        # Give slight priority to recent chunks for customer-support context.
        weights = [1 + (idx / max(1, len(scores) - 1)) * 0.35 for idx in range(len(scores))]
        weighted = sum(score * weight for score, weight in zip(scores, weights)) / sum(weights)
        return round(float(weighted), 3)
    except Exception:
        return 0.5


def label_sentiment(score: float) -> str:
    if score >= 0.6:
        return "positive"
    if score <= 0.4:
        return "negative"
    return "neutral"
