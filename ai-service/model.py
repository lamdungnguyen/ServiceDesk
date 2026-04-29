from transformers import pipeline

# Load models once at startup to keep API fast
print("Loading HuggingFace models...")

# For fallback category classification
# Using zero-shot classification to easily map text to custom categories
classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")

# For sentiment analysis
sentiment_model = pipeline("sentiment-analysis")

print("Models loaded successfully!")
