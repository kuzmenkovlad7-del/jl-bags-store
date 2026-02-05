-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_uk TEXT NOT NULL,
  name_ru TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Product-Category relationship (many-to-many)
CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Add product flags
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hit BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sale BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_is_hit ON products(is_hit);
CREATE INDEX IF NOT EXISTS idx_products_is_sale ON products(is_sale);

-- Update product_media table for storage
ALTER TABLE product_media
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_product_media_primary ON product_media(product_id, is_primary);

-- Set first photo of each product as primary
WITH first_media AS (
  SELECT DISTINCT ON (product_id) id, product_id
  FROM product_media
  WHERE media_type = 'photo'
  ORDER BY product_id, position, created_at
)
UPDATE product_media
SET is_primary = true
WHERE id IN (SELECT id FROM first_media);
