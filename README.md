# JL Bags Store - E-commerce MVP

Production-ready MVP e-commerce site for JL (Julia Lebedeva) women's bags brand.

## Features

- **Modern Premium Design**: Black/white/graphite palette with clean, minimal UI
- **Bilingual Support**: Ukrainian (default) + Russian with automatic fallback
- **Product Catalog**: Search, filter by stock/color, sort by various criteria
- **Product Pages**: Gallery, multiple prices (retail/drop), order forms, JSON-LD schema
- **Order System**: Three order types (retail, drop, wholesale) with webhook integration
- **Simple Admin Panel**: Products CRUD, orders management, settings
- **SEO Optimized**: Sitemap, robots.txt, metadata, structured data
- **Mobile-First**: Responsive design with excellent spacing and typography

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (Postgres + Auth + Storage)
- **Deployment**: Vercel

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
N8N_WEBHOOK_URL=https://n8n.vladkuzmenko.com/webhook/jl-website
```

### 3. Run Database Migrations

Go to your Supabase project → SQL Editor → New Query

Run the following migration files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_products.sql`

This will create all tables and seed 13 initial products.

### 4. Create Admin User

In Supabase Dashboard → Authentication → Users → Add User

Create a user with email/password. This will be your admin login.

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 6. Access Admin Panel

Visit http://localhost:3000/admin/login

Login with the admin user you created in Supabase.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
N8N_WEBHOOK_URL=https://n8n.vladkuzmenko.com/webhook/jl-website
```

4. Deploy

## Environment Variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

### Optional

- `N8N_WEBHOOK_URL`: Webhook URL for order notifications (defaults to https://n8n.vladkuzmenko.com/webhook/jl-website)

## Admin Features

### Products Management

- ✅ Create, edit, delete products
- ✅ Quick toggle active/inactive status
- ✅ Duplicate products
- ✅ Multiple colors with individual prices
- ✅ Stock status management
- ✅ Ukrainian/Russian content

### Orders Management

- ✅ View all orders with customer details
- ✅ Update order status (new → confirmed → packed → shipped → completed)
- ✅ Track webhook delivery status
- ✅ Three order types: retail, drop, wholesale

### Settings

- ✅ Update brand name
- ✅ Phone number
- ✅ Social media links (Instagram, Facebook, Telegram)
- ✅ Default locale

## Order Flow

1. Customer fills order form on product page
2. Order saved to database (always succeeds)
3. Webhook sent to n8n (failures logged, don't block order)
4. Admin receives notification
5. Admin manages order through admin panel

## Database Schema

### Tables

- `products`: Product catalog with Ukrainian/Russian content
- `product_media`: Product photos and videos
- `orders`: Customer orders with webhook tracking
- `order_items`: Order line items
- `settings`: Site configuration (single row)

## Pages Structure

### Public

- `/uk` or `/ru` - Homepage with hero, featured products, benefits
- `/uk/catalog` - Product catalog with filters and search
- `/uk/product/[slug]` - Product detail page
- `/uk/delivery-payment` - Delivery information
- `/uk/wholesale` - Wholesale information
- `/uk/contacts` - Contact information
- `/uk/privacy` - Privacy policy
- `/uk/terms` - Terms of service

### Admin

- `/admin/login` - Admin authentication
- `/admin/products` - Products management
- `/admin/orders` - Orders management
- `/admin/settings` - Site settings

## Business Logic

- **Single Category**: Women's bags only (no multi-category complexity)
- **Two Prices**: Retail (higher) and Drop (lower) for each product
- **Wholesale Logic**: Uses drop price by default
- **Order Types**: Retail, Drop, and Wholesale request flows
- **No Online Payment**: Orders are requests that require manual confirmation

## Localization

- Default locale: Ukrainian (uk)
- Second locale: Russian (ru)
- Fallback: If Russian translation missing, Ukrainian is used
- Language switcher in header

## SEO

- Localized metadata for all pages
- Dynamic sitemap.xml
- robots.txt
- Canonical tags
- hreflang tags (uk-UA / ru-UA)
- Product JSON-LD structured data

## Contact Information

- **Phone**: 0957427720
- **Instagram**: https://www.instagram.com/sumki_kharkov
- **Facebook**: https://www.facebook.com/sumki.kharkov.julia
- **Telegram**: t.me/joinchat/VGzA____Ogov8wZ_

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Support

For issues or questions, contact the development team.