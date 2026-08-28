-- =============================================
-- AI Provider Usage Metrics
-- Track total tokens and invocation counts
-- =============================================

ALTER TABLE ai_providers ADD COLUMN total_tokens_used INTEGER DEFAULT 0;
ALTER TABLE ai_providers ADD COLUMN total_calls INTEGER DEFAULT 0;
