import logging
from typing import Optional
from model import classifier, sentiment_model

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ──────────────────────────────────────────────────────────────────────────────

CANDIDATE_CATEGORIES = ["GENERAL", "NETWORK", "INFRASTRUCTURE", "ACCOUNT", "SOFTWARE", "HARDWARE"]
CONFIDENCE_THRESHOLD = 0.5

# Prediction sources
SOURCE_RULE_BASED = "RULE_BASED"
SOURCE_ZERO_SHOT  = "ZERO_SHOT"
SOURCE_FALLBACK   = "FALLBACK"

# Business impact labels
IMPACT_NONE = "NONE"
IMPACT_SINGLE_USER = "SINGLE_USER"
IMPACT_MULTIPLE_USERS = "MULTIPLE_USERS"
IMPACT_BUSINESS_BLOCKING = "BUSINESS_BLOCKING"
IMPACT_SYSTEM_OUTAGE = "SYSTEM_OUTAGE"

# ──────────────────────────────────────────────────────────────────────────────
# CATEGORY KEYWORD DICTIONARY
# ──────────────────────────────────────────────────────────────────────────────
# Triết lý: Rule-based chỉ bắt case RÕ RÀNG, mỏng và nhanh.
# Không biến thành hàng trăm if/else.
# ML fallback xử lý phần còn lại.
# ──────────────────────────────────────────────────────────────────────────────

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "NETWORK": [
        "wifi", "wi-fi",
        "mạng", "internet",
        "mất mạng", "mất kết nối",
        "không vào được mạng",
        "mạng chậm", "lag mạng",
        "vpn", "network", "connection",
        "không có mạng", "rớt mạng",
    ],
    "ACCOUNT": [
        "đăng nhập", "login", "log in",
        "quên mật khẩu", "password", "mật khẩu",
        "không vào được tài khoản",
        "access denied", "tài khoản",
        "account", "unlock account",
        "reset password", "forgot password",
    ],
    "INFRASTRUCTURE": [
        "server down", "server",
        "máy chủ", "database", "db",
        "outage", "sập hệ thống",
        "máy chủ lỗi", "hệ thống sập",
        "infrastructure", "dịch vụ không hoạt động",
    ],
    "HARDWARE": [
        "laptop", "máy tính", "pc",
        "màn hình", "monitor",
        "keyboard", "bàn phím",
        "chuột", "mouse",
        "máy không lên", "màn hình đen",
        "printer", "máy in", "headset",
        "usb", "sạc", "charger",
    ],
    "SOFTWARE": [
        "phần mềm", "ứng dụng",
        "app lỗi", "app",
        "bug", "crash", "lỗi",
        "không mở được", "cài đặt",
        "install", "update", "cập nhật",
        "software", "application",
    ],
}


# ──────────────────────────────────────────────────────────────────────────────
# PRIVATE HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def _rule_based_classify(text_lower: str) -> Optional[str]:
    """
    Fast path: duyệt CATEGORY_KEYWORDS dictionary.
    Trả về category nếu khớp, None nếu không match.

    Thứ tự duyệt có ý nghĩa — category được định nghĩa trước
    có độ ưu tiên cao hơn khi có overlap keyword.
    """
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return category
    return None


# ──────────────────────────────────────────────────────────────────────────────
# PUBLIC FUNCTIONS
# ──────────────────────────────────────────────────────────────────────────────

def analyze_sentiment(text: str) -> tuple[str, str]:
    """
    Returns (sentiment, reason)
    Labels: POSITIVE | NEGATIVE | NEUTRAL
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


def classify_category(text: str) -> tuple[str, str, str, float]:
    """
    Returns (category, reason, prediction_source, confidence_score)

    Flow:
      1. Rule-based fast path  → SOURCE_RULE_BASED, confidence=1.0
      2. Zero-shot ML fallback → SOURCE_ZERO_SHOT,  confidence=model score
      3. Error fallback        → GENERAL, confidence=0.0

    API contract không thay đổi về category/reason.
    Thêm source + confidence để tracking.
    """
    text_lower = text.lower()

    # 1. Rule-based fast path
    rule_result = _rule_based_classify(text_lower)
    if rule_result is not None:
        return rule_result, f"Matched rule-based keywords for {rule_result}", SOURCE_RULE_BASED, 1.0

    # 2. Zero-shot ML fallback
    try:
        context_text = f"This is an IT support ticket: {text}"
        result = classifier(context_text, candidate_labels=CANDIDATE_CATEGORIES)

        top_category = result["labels"][0]
        top_score    = float(result["scores"][0])

        if top_score < CONFIDENCE_THRESHOLD:
            return (
                "GENERAL",
                f"AI score {top_score:.2f} below threshold {CONFIDENCE_THRESHOLD}, defaulted to GENERAL",
                SOURCE_ZERO_SHOT,
                top_score,
            )

        return (
            top_category.upper(),
            f"Zero-shot classification score: {top_score:.2f}",
            SOURCE_ZERO_SHOT,
            top_score,
        )

    except Exception as e:
        logger.error(f"Classification error: {e}")
        return "GENERAL", "Fallback due to classification model error", SOURCE_ZERO_SHOT, 0.0


def detect_impact(text: str) -> tuple[str, str, list[str]]:
    """
    Returns (impact, reason, urgency_signals).
    Impact is a business/technical severity signal and should carry more weight
    than sentiment when deciding priority.
    """
    text_lower = text.lower()
    signals: list[str] = []

    system_outage_keywords = [
        "system down", "server down", "production down", "prod down",
        "outage", "service unavailable", "database down", "db down",
        "all users cannot work", "everyone cannot work", "entire system",
        "sap he thong", "sập hệ thống", "he thong sap", "hệ thống sập",
        "toan bo he thong", "toàn bộ hệ thống",
    ]
    business_blocking_keywords = [
        "cannot work", "can't work", "unable to work", "business stopped",
        "blocked", "blocking", "cannot sell", "cannot invoice",
        "khong lam duoc viec", "không làm được việc",
        "khong the lam viec", "không thể làm việc",
        "khong xuat hoa don", "không xuất hóa đơn",
        "dung hoat dong", "dừng hoạt động",
    ]
    multiple_user_keywords = [
        "all users", "everyone", "many users", "multiple users",
        "whole team", "entire team", "department", "office",
        "tat ca nguoi dung", "tất cả người dùng",
        "nhieu nguoi", "nhiều người", "ca phong", "cả phòng",
        "toan bo phong", "toàn bộ phòng",
    ]
    single_user_keywords = [
        "my account", "my laptop", "my computer", "i cannot", "i can't",
        "toi khong", "tôi không", "may cua toi", "máy của tôi",
        "tai khoan cua toi", "tài khoản của tôi",
    ]

    def collect_matches(keywords: list[str]) -> list[str]:
        return [kw for kw in keywords if kw in text_lower]

    matched = collect_matches(system_outage_keywords)
    if matched:
        signals.extend(matched[:4])
        return IMPACT_SYSTEM_OUTAGE, "Matched system outage impact keywords", signals

    matched = collect_matches(business_blocking_keywords)
    if matched:
        signals.extend(matched[:4])
        return IMPACT_BUSINESS_BLOCKING, "Matched business blocking impact keywords", signals

    matched = collect_matches(multiple_user_keywords)
    if matched:
        signals.extend(matched[:4])
        return IMPACT_MULTIPLE_USERS, "Matched multiple-user impact keywords", signals

    matched = collect_matches(single_user_keywords)
    if matched:
        signals.extend(matched[:4])
        return IMPACT_SINGLE_USER, "Matched single-user impact keywords", signals

    return IMPACT_NONE, "No explicit business impact detected", signals


def predict_priority(text: str, sentiment: str, impact: str = IMPACT_NONE) -> tuple[str, str]:
    """
    Returns (priority, reason)
    Combines rule-based keyword matching with sentiment analysis.
    API contract không thay đổi.
    """
    text_lower = text.lower()

    urgent_keywords = [
        "system down", "server down", "production down", "prod down",
        "outage", "critical", "cannot work", "can't work", "unable to work",
        "all users", "everyone affected", "business stopped",
        "sập hệ thống", "sap he thong", "khẩn cấp", "khan cap",
        "không làm được việc", "khong lam duoc viec",
        "toàn bộ", "toan bo", "ngừng hoạt động", "ngung hoat dong",
    ]
    high_keywords   = ["down", "urgent", "cannot work", "critical", "broken", "fail",
                       "sập", "khẩn cấp", "không làm được việc", "hỏng"]
    medium_keywords = ["slow", "delay", "issue", "error", "bug",
                       "chậm", "lỗi", "trễ", "vấn đề"]

    has_urgent = any(kw in text_lower for kw in urgent_keywords)
    has_high   = any(kw in text_lower for kw in high_keywords)
    has_medium = any(kw in text_lower for kw in medium_keywords)

    if impact == IMPACT_SYSTEM_OUTAGE:
        return "URGENT", "System outage impact detected"

    if impact == IMPACT_BUSINESS_BLOCKING:
        return "URGENT" if has_urgent else "HIGH", "Business blocking impact detected"

    if impact == IMPACT_MULTIPLE_USERS and (has_high or has_medium):
        return "HIGH", "Multiple users affected with issue keywords"

    if has_urgent:
        return "URGENT", "Matched urgent business-impact keywords"

    if has_high:
        if sentiment == "NEGATIVE":
            return "HIGH", "High-severity keywords + NEGATIVE sentiment"
        return "HIGH", "Matched high-severity keywords"

    if has_medium:
        priority = "MEDIUM"
        reason   = "Matched medium-severity keywords"
    else:
        priority = "LOW"
        reason   = "Default low priority"

    # Sentiment upgrade
    if priority == "LOW" and sentiment == "NEGATIVE":
        return "MEDIUM", "Upgraded from LOW to MEDIUM due to NEGATIVE sentiment"

    return priority, reason
