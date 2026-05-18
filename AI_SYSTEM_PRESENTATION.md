# AI SERVICE - SMARTDESK TICKET MANAGEMENT SYSTEM

---

## 1. TỔNG QUAN

AI Service là một Python Microservice độc lập, chạy bằng **FastAPI**, phơi ra endpoint `POST /analyze`. Khi Backend Java gửi text nội dung ticket đến, service này trả về 3 kết quả: **Category** (danh mục), **Priority** (độ ưu tiên), và **Sentiment** (cảm xúc), kèm theo `reason` giải thích tại sao lại ra kết quả đó.

---

## 2. CÁC MODEL ĐANG SỬ DỤNG

Có **2 model HuggingFace** được nạp sẵn vào RAM khi service khởi động (`model.py`), tránh mất thời gian load lại mỗi lần nhận request:

| Model | Loại | Mục đích |
|---|---|---|
| `typeform/distilbert-base-uncased-mnli` | Zero-shot Classification | Phân loại **Category** khi Rule-based không khớp |
| `distilbert-base-uncased-finetuned-sst-2-english` (default) | Sentiment Analysis | Phân tích **Sentiment** của nội dung ticket |

---

## 3. PIPELINE XỬ LÝ (3 BƯỚC TUẦN TỰ)

Mỗi request đến endpoint `/analyze` sẽ chạy qua 3 bước theo thứ tự cố định:

```
Input text
    │
    ▼
[Bước 1] analyze_sentiment(text)
    → Xác định cảm xúc: POSITIVE / NEGATIVE / NEUTRAL
    │
    ▼
[Bước 2] predict_priority(text, sentiment)
    → Dùng kết quả Sentiment từ Bước 1 để tính Priority: LOW / MEDIUM / HIGH
    │
    ▼
[Bước 3] classify_category(text)
    → Rule-based trước, ML fallback sau: GENERAL / NETWORK / INFRASTRUCTURE / ACCOUNT / SOFTWARE / HARDWARE
    │
    ▼
Output: { category, priority, sentiment, reason }
```

Sentiment được phân tích **trước** Priority vì kết quả Sentiment ảnh hưởng trực tiếp đến cách tính Priority (xem Bước 2).

---

## 4. CHI TIẾT TỪNG BƯỚC XỬ LÝ

### Bước 1 — Phân tích Sentiment (`analyze_sentiment`)

Gọi thẳng Sentiment Analysis model của HuggingFace. Model trả về label (`POSITIVE`/`NEGATIVE`) kèm score (0–1).
- Nếu model lỗi → fallback về `NEUTRAL`.
- Output: `(sentiment, reason)` — ví dụ: `("NEGATIVE", "Sentiment model score: 0.94")`

### Bước 2 — Dự đoán Priority (`predict_priority`)

**Kết hợp Rule-based keywords + kết quả Sentiment từ Bước 1:**

| Điều kiện | Priority |
|---|---|
| Có từ khóa HIGH severity (`down`, `urgent`, `broken`, `critical`, `fail`) | `HIGH` |
| Có từ khóa HIGH + Sentiment là NEGATIVE | `HIGH` (xác nhận) |
| Có từ khóa MEDIUM severity (`slow`, `delay`, `error`, `bug`) | `MEDIUM` |
| Không khớp từ khóa nào, nhưng Sentiment là NEGATIVE | Nâng từ `LOW` → `MEDIUM` |
| Không có gì | `LOW` |

→ Đây là điểm quan trọng: **Sentiment NEGATIVE có thể tự động nâng bậc Priority** dù nội dung không có từ khóa nguy hiểm.

### Bước 3 — Phân loại Category (`classify_category`)

Chạy 2 lớp theo thứ tự:

**Lớp 1 — Rule-based (ưu tiên, nhanh):**

| Từ khóa phát hiện trong text | Category trả về |
|---|---|
| `wifi`, `network`, `internet`, `connection` | `NETWORK` |
| `server`, `down`, `outage`, `database` | `INFRASTRUCTURE` |
| `login`, `account`, `password`, `access` | `ACCOUNT` |
| `hardware`, `mouse`, `keyboard`, `monitor`, `pc`, `laptop` | `HARDWARE` |

**Lớp 2 — ML Fallback (nếu Rule-based không khớp):**
- Gọi mô hình `distilbert-base-uncased-mnli` (Zero-shot Classification).
- Danh sách nhãn cố định: `["GENERAL", "NETWORK", "INFRASTRUCTURE", "ACCOUNT", "SOFTWARE", "HARDWARE"]`.
- Ngưỡng tin cậy (Confidence Threshold): **0.5**. Nếu score thấp hơn 0.5 → trả về `GENERAL` thay vì đoán sai.
- Nếu model lỗi → fallback về `GENERAL`.

---

## 5. OUTPUT TRẢ VỀ

```json
{
  "category": "HARDWARE",
  "priority": "HIGH",
  "sentiment": "NEGATIVE",
  "reason": "Category: Matched hardware keywords | Priority: High-severity keywords + NEGATIVE sentiment | Sentiment: Sentiment model score: 0.91"
}
```

Trường `reason` giải thích rõ **tại sao** AI ra quyết định đó — hữu ích cho Agent/Admin khi muốn kiểm tra lại kết quả phân loại.

---

## 6. HƯỚNG NÂNG CẤP

### 6.1 Hỗ trợ Tiếng Việt
Hiện tại các từ khóa Rule-based và cả 2 model đều tối ưu cho tiếng Anh. Cần:
- Bổ sung bộ từ khóa tiếng Việt vào Rule-based (`"wifi"`, `"mạng"`, `"chậm"`, `"không vào được"`, ...).
- Thay `typeform/distilbert-base-uncased-mnli` bằng `joeddav/xlm-roberta-large-xnli` (hỗ trợ Zero-shot đa ngôn ngữ gồm tiếng Việt).
- Thay Sentiment model mặc định bằng model được fine-tune trên tiếng Việt (ví dụ: `uitnlp/visobert`).

### 6.2 Cho phép Category động (Admin tự cấu hình)
Hiện tại `CANDIDATE_CATEGORIES` đang bị code cứng trong `ai_logic.py`. Nâng cấp: Backend Java truyền thêm mảng `candidate_labels` trong request body, AI Service dùng danh sách đó thay vì danh sách cứng. Admin thêm/xóa danh mục trên giao diện mà không cần sửa code AI.

### 6.3 Nâng cấp Sentiment thành Đa nhãn
Model hiện tại chỉ trả về POSITIVE/NEGATIVE. Có thể thay bằng các model phân tích cảm xúc chi tiết hơn (`cardiffnlp/twitter-roberta-base-sentiment-latest`) để phân biệt thêm: `ANGER`, `FEAR`, `JOY`, `SADNESS` — từ đó có logic nâng Priority chính xác hơn.

### 6.4 Tích hợp RAG Chatbot tự trả lời
Xây dựng thêm endpoint `/suggest` trong AI Service: khi nhận text ticket, tìm kiếm trong Vector Database (ChromaDB) chứa tài liệu HDSD và lịch sử ticket cũ đã giải quyết thành công, sau đó dùng LLM (GPT-4o-mini hoặc LLaMA3) tổng hợp và trả về một câu hướng dẫn khắc phục. Hiển thị gợi ý này cho khách hàng ngay khi họ gõ mô tả lỗi.
