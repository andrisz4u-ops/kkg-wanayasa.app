-- =============================================
-- AI Provider Capability Type
-- Separates text (LLM) from image generation providers
-- =============================================

ALTER TABLE ai_providers ADD COLUMN capability TEXT NOT NULL DEFAULT 'text'
  CHECK(capability IN ('text', 'image', 'both'));

-- Auto-tag existing providers that are clearly image generators
UPDATE ai_providers SET capability = 'image'
WHERE model LIKE '%z-image%'
   OR model LIKE '%flux%'
   OR model LIKE '%stable-diffusion%'
   OR model LIKE '%sd%xl%'
   OR model LIKE '%dall-e%'
   OR model LIKE '%dalle%'
   OR (slug LIKE '%image%' AND slug NOT LIKE '%text%');
