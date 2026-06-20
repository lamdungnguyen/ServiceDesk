from main import app
from fastapi.testclient import TestClient
import json

client = TestClient(app)

texts = [
    "Mạng công ty lại sập rồi, bực mình thật sự!",
    "The software crashed again and I lost all my work, this is urgent!",
    "Can you help me reset my password?",
    "Cho mình hỏi thủ tục xin nghỉ phép."
]

for text in texts:
    print(f"\n--- Text: {text}")
    resp = client.post("/analyze", json={"text": text})
    print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
