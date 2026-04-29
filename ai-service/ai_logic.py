import logging
from model import classifier, sentiment_model

logger = logging.getLogger(__name__)

CANDIDATE_CATEGORIES = ["GENERAL", "NETWORK", "INFRASTRUCTURE", "ACCOUNT", "SOFTWARE", "HARDWARE"]
CONFIDENCE_THRESHOLD = 0.5

def analyze_sentiment(text: str) -> tuple[str, str]:
    """
    Returns (sentiment, reason)
    """
    try:
        sent_result = sentiment_model(text)[0]
        sentiment = sent_result["label"].upper()
        score = sent_result["score"]
        reason = f"Sentiment model score: {score:.2f}"
        return sentiment, reason
    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        return "NEUTRAL", "Fallback due to sentiment model error"

def classify_category(text: str) -> tuple[str, str]:
    """
    Returns (category, reason)
    Rule-based first, ML fallback with context and confidence score next.
    """
    text_lower = text.lower()
    
    # 1. Rule-based fast path
    if any(kw in text_lower for kw in ["wifi", "network", "internet", "connection"]):
        return "NETWORK", "Matched network keywords"
    elif any(kw in text_lower for kw in ["server", "down", "outage", "database"]):
        return "INFRASTRUCTURE", "Matched infrastructure keywords"
    elif any(kw in text_lower for kw in ["login", "account", "password", "access"]):
        return "ACCOUNT", "Matched account keywords"
    elif any(kw in text_lower for kw in ["hardware", "mouse", "keyboard", "monitor", "pc", "laptop"]):
        return "HARDWARE", "Matched hardware keywords"
        
    # 2. ML Fallback
    try:
        context_text = f"This is an IT support ticket: {text}"
        result = classifier(context_text, candidate_labels=CANDIDATE_CATEGORIES)
        
        top_category = result["labels"][0]
        top_score = result["scores"][0]
        
        if top_score < CONFIDENCE_THRESHOLD:
            return "GENERAL", f"AI score {top_score:.2f} below threshold, defaulted to GENERAL"
            
        return top_category.upper(), f"AI classification score: {top_score:.2f}"
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return "GENERAL", "Fallback due to classification model error"

def predict_priority(text: str, sentiment: str) -> tuple[str, str]:
    """
    Returns (priority, reason)
    Combines rule-based keyword matching with sentiment analysis.
    """
    text_lower = text.lower()
    priority = "LOW"
    reason = "Default low priority"
    
    high_keywords = ["down", "urgent", "cannot work", "critical", "broken", "fail"]
    medium_keywords = ["slow", "delay", "issue", "error", "bug"]
    
    has_high = any(kw in text_lower for kw in high_keywords)
    has_medium = any(kw in text_lower for kw in medium_keywords)
    
    if has_high:
        if sentiment == "NEGATIVE":
            return "HIGH", "High-severity keywords + NEGATIVE sentiment"
        return "HIGH", "Matched high-severity keywords"
        
    if has_medium:
        priority = "MEDIUM"
        reason = "Matched medium-severity keywords"
        
    # Enhance via sentiment
    if priority == "LOW" and sentiment == "NEGATIVE":
        return "MEDIUM", "Upgraded from LOW to MEDIUM due to NEGATIVE sentiment"
        
    return priority, reason
