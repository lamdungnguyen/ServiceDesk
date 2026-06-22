-- ============================================================
-- AI_PREDICTIONS — Agent Correction Learning Table
-- ServiceDesk System — SQL Server
-- ============================================================
-- Mục đích:
--   Lưu mọi prediction của AI và correction của Agent.
--   Không overwrite history — mỗi lần sửa tạo record mới.
--   Chuẩn bị dataset cho fine-tuning PhoBERT/XLM-Roberta.
-- ============================================================

CREATE TABLE ai_predictions (
    id                  BIGINT          IDENTITY(1,1)   NOT NULL,

    -- Ticket reference
    ticket_id           BIGINT          NOT NULL,
    title               NVARCHAR(500)   NULL,
    description         NVARCHAR(MAX)   NULL,
    ticket_text         NVARCHAR(MAX)   NULL,   -- Combined: "Title: X. Description: Y"

    -- AI Predictions
    predicted_category  NVARCHAR(50)    NULL,
    predicted_priority  NVARCHAR(20)    NULL,
    predicted_sentiment NVARCHAR(20)    NULL,
    predicted_impact    NVARCHAR(40)    NULL,
    impact_reason       NVARCHAR(500)   NULL,
    urgency_signals     NVARCHAR(1000)  NULL,

    -- Agent Corrections (NULL nếu chưa được verify)
    corrected_category  NVARCHAR(50)    NULL,
    corrected_priority  NVARCHAR(20)    NULL,

    -- Metadata
    prediction_source   NVARCHAR(20)    NOT NULL DEFAULT 'ZERO_SHOT',
        -- RULE_BASED: rule-based fast path matched
        -- ZERO_SHOT:  ML zero-shot classification
        -- FALLBACK:   AI service unavailable or model error

    confidence_score    FLOAT           NULL DEFAULT 0.0,
    model_version       NVARCHAR(100)   NULL,
    decision_status     NVARCHAR(30)    NULL DEFAULT 'FALLBACK',
    ai_applied          BIT             NOT NULL DEFAULT 0,
        -- 1.0 nếu RULE_BASED
        -- Model score nếu ZERO_SHOT, 0.0 nếu FALLBACK

    agent_corrected     BIT             NOT NULL DEFAULT 0,
        -- 0: Chưa verify hoặc đã verify nhưng AI đúng
        -- 1: Agent đã sửa (predicted != corrected)

    -- Future: Vector DB / Embedding
    embedding_generated BIT             NOT NULL DEFAULT 0,
        -- 0: Chưa generate embedding
        -- 1: Đã generate, lưu trong Vector DB

    created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),

    -- Constraints
    CONSTRAINT pk_ai_predictions PRIMARY KEY (id),
    CONSTRAINT fk_ai_pred_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_prediction_source CHECK (
        prediction_source IN ('RULE_BASED', 'ZERO_SHOT', 'FALLBACK')
    )
);

-- Index để query nhanh theo ticket
CREATE INDEX idx_ai_pred_ticket_id
    ON ai_predictions (ticket_id);

-- Index để query analytics (accuracy stats)
CREATE INDEX idx_ai_pred_agent_corrected
    ON ai_predictions (agent_corrected, predicted_category, predicted_priority);

-- Index để export training data
CREATE INDEX idx_ai_pred_export
    ON ai_predictions (agent_corrected, created_at)
    INCLUDE (ticket_text, corrected_category, corrected_priority, prediction_source, confidence_score, model_version);

-- ============================================================
-- NOTE: Nếu dùng Hibernate ddl-auto=update thì không cần
--       chạy script này — Hibernate tự tạo table.
--       Script này dành cho manual setup / migration.
-- ============================================================
