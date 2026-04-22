-- Additive migration: source attribution columns for orders
-- These allow tracking which channel (Instagram, Google, direct, etc.) drove each order.
-- All columns are nullable so existing orders are unaffected.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS utm_source    TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium    TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign  TEXT,
  ADD COLUMN IF NOT EXISTS referrer_url  TEXT;

-- Index on utm_source for simple channel reporting queries
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON orders(utm_source);
