-- Add SEO metadata fields to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seo_title       TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_h1          TEXT,
  ADD COLUMN IF NOT EXISTS og_title        TEXT,
  ADD COLUMN IF NOT EXISTS og_description  TEXT;
