-- =============================================
-- AI Provider Registry
-- Dynamic multi-provider AI management
-- =============================================

CREATE TABLE IF NOT EXISTS ai_providers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  api_type        TEXT NOT NULL DEFAULT 'openai_compat'
                    CHECK(api_type IN ('openai_compat','anthropic','gemini_sdk','bedrock','custom_proxy')),
  base_url        TEXT NOT NULL,
  model           TEXT NOT NULL,
  api_key         TEXT NOT NULL DEFAULT '',
  priority        INTEGER NOT NULL DEFAULT 100,
  is_active       INTEGER NOT NULL DEFAULT 1,
  max_tokens      INTEGER DEFAULT 8192,
  temperature     REAL DEFAULT 0.7,
  extra_headers   TEXT DEFAULT '{}',
  extra_body      TEXT DEFAULT '{}',
  last_check_at   DATETIME,
  last_check_ok   INTEGER DEFAULT 0,
  last_check_ms   INTEGER,
  last_error      TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_priority ON ai_providers(priority, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_slug ON ai_providers(slug);

-- Seed preset providers (API keys left empty — admin sets them)
INSERT OR IGNORE INTO ai_providers (name, slug, api_type, base_url, model, priority, is_active, max_tokens)
VALUES
  ('Vertex AI (GCP Proxy)',     'vertex-proxy',     'custom_proxy',  'http://34.101.33.242:8000/generate/proxy', 'gemini-2.5-flash',            1,  1, 8192),
  ('Gemini 2.0 Flash',          'gemini-flash',     'openai_compat', 'https://generativelanguage.googleapis.com/v1beta/openai', 'gemini-2.0-flash', 2, 1, 8192),
  ('Claude Sonnet 4.6',         'claude-anthropic', 'anthropic',     'https://api.anthropic.com',                'claude-sonnet-4-6-20250514',  3,  1, 8192),
  ('AWS Bedrock Claude',        'bedrock-claude',   'bedrock',       'https://bedrock-runtime.us-east-1.amazonaws.com', 'global.anthropic.claude-sonnet-4-6', 4, 1, 8192),
  ('Mistral Large',             'mistral-large',    'openai_compat', 'https://api.mistral.ai/v1',                'mistral-large-latest',        5,  1, 16384),
  ('GLM-4 Flash',               'glm4-flash',       'openai_compat', 'https://open.bigmodel.cn/api/paas/v4',     'glm-4-flash',                 6,  1, 8192);
