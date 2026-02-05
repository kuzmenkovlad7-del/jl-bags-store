-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_uk TEXT NOT NULL,
  name_ru TEXT,
  slug TEXT UNIQUE NOT NULL,
  description_uk TEXT NOT NULL DEFAULT '',
  description_ru TEXT,
  material_uk TEXT NOT NULL DEFAULT '',
  material_ru TEXT,
  size_text TEXT NOT NULL DEFAULT '',
  colors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_retail NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_drop NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'preorder', 'out_of_stock')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_sort_order ON products(sort_order);

-- Product media table
CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_media_product_id ON product_media(product_id);
CREATE INDEX idx_product_media_position ON product_media(product_id, position);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_type TEXT NOT NULL CHECK (order_type IN ('retail', 'drop', 'wholesale')),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  telegram TEXT,
  city TEXT,
  delivery_method TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'packed', 'shipped', 'completed', 'canceled')),
  webhook_status TEXT,
  webhook_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  color TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price_snapshot NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Settings table (single row)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name TEXT NOT NULL DEFAULT 'JL',
  phone TEXT NOT NULL DEFAULT '0957427720',
  instagram_url TEXT NOT NULL DEFAULT 'https://www.instagram.com/sumki_kharkov',
  facebook_url TEXT NOT NULL DEFAULT 'https://www.facebook.com/sumki.kharkov.julia/?ref=PROFILE_EDIT_xav_ig_profile_page_web#',
  telegram_url TEXT NOT NULL DEFAULT 't.me/joinchat/VGzA____Ogov8wZ_',
  default_locale TEXT NOT NULL DEFAULT 'uk'
);

-- Insert default settings
INSERT INTO settings (id) VALUES (1);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
