from transformers import pipeline
import torch

# Load models once at startup to keep API fast
print("Loading HuggingFace models...")

# Auto-detect GPU (0) or CPU (-1)
device = 0 if torch.cuda.is_available() else -1
print(f"Using device: {'GPU (0)' if device == 0 else 'CPU (-1)'}")

# For fallback category classification
# Using zero-shot classification to easily map text to custom categories
# Changed to Multilingual model (mDeBERTa) for English & Vietnamese support
classifier = pipeline("zero-shot-classification", model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli", device=device)

# For sentiment analysis
# Changed to Multilingual sentiment model
sentiment_model = pipeline("sentiment-analysis", model="lxyuan/distilbert-base-multilingual-cased-sentiments-student", device=device)

print("Models loaded successfully!")
