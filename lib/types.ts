export type StockStatus = 'in_stock' | 'low_stock' | 'preorder' | 'out_of_stock'
export type OrderType = 'retail' | 'drop' | 'wholesale'
export type OrderStatus = 'new' | 'confirmed' | 'packed' | 'shipped' | 'completed' | 'canceled'
export type MediaType = 'photo' | 'video'

export interface Product {
  id: string
  code: string
  name_uk: string
  name_ru: string | null
  slug: string
  description_uk: string
  description_ru: string | null
  material_uk: string
  material_ru: string | null
  size_text: string
  colors_json: { color: string; price_drop: number; price_retail: number }[]
  price_retail: number
  price_drop: number
  stock_status: StockStatus
  is_active: boolean
  is_new?: boolean
  is_hit?: boolean
  is_sale?: boolean
  sort_order: number
  created_at: string
  updated_at: string
  media?: ProductMedia[]
  categories?: Category[]
}

export interface ProductMedia {
  id: string
  product_id: string
  media_type: MediaType
  url: string
  storage_path?: string
  position: number
  is_primary: boolean
  created_at: string
}

export interface Category {
  id: string
  slug: string
  name_uk: string
  name_ru: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  order_type: OrderType
  customer_name: string
  phone: string
  telegram: string | null
  city: string | null
  delivery_method: string
  comment: string | null
  status: OrderStatus
  webhook_status: string | null
  webhook_error: string | null
  created_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_code: string
  color: string
  qty: number
  price_snapshot: number
}

export interface Settings {
  brand_name: string
  phone: string
  instagram_url: string
  facebook_url: string
  telegram_url: string
  default_locale: string
}
