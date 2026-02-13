# LUXE CANDLE - Luxury Candle E-Commerce Platform

## Overview

Luxe Candle is a premium, production-ready candle e-commerce website built with a modern full-stack architecture. The platform features a luxury, minimal UI design with a dark theme and gold accents, providing customers with product browsing, shopping cart, checkout with multiple payment options, and order tracking. An admin panel enables product and order management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state, React Context for cart state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for the luxury dark theme (pure black background with vibrant gold accents)
- **Animations**: Framer Motion for smooth page transitions and interactions
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: scrypt hashing with timing-safe comparison

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Migrations**: Drizzle Kit for schema push (`npm run db:push`)
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schema definitions and route contracts used by both frontend and backend, ensuring type safety across the stack
- **Storage Abstraction**: `server/storage.ts` implements an `IStorage` interface, abstracting database operations
- **Path Aliases**: TypeScript path aliases (`@/` for client, `@shared/` for shared code) simplify imports

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Custom build script using esbuild for server bundling and Vite for client build
- **Output**: Server bundles to `dist/index.cjs`, client builds to `dist/public/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and query building

### Payment Integration
- **UPI Direct**: Primary payment method with merchant UPI ID (abhinavyaduvanshi100-1@oksbi)
- **Razorpay**: Configured for cards/netbanking (requires API keys)
- **Currency**: All prices display in Indian Rupees (₹)

### Shipping Policy
- **Delhi**: Configurable delivery charge (default: Free) - 30 minute express delivery!
- **Other Cities**: Configurable delivery charge (default: ₹45)
- **Logic Location**: `client/src/contexts/cart-context.tsx` - `getShippingForCity()` function
- **Admin Control**: Delivery charges can be modified in Admin Panel → Settings → Delivery Charges
- **Settings Keys**: `delivery_charge_delhi`, `delivery_charge_other` in site_settings table

### Coupon/Discount System
- **Database Table**: `coupons` table with code, discount type (percentage/fixed), discount value, min order, max discount, usage limits, expiration
- **Checkout Integration**: Coupon input field in checkout with real-time validation and discount display
- **Admin Management**: Coupons tab in admin dashboard for creating, editing, and deleting coupons
- **API Endpoints**: 
  - `GET /api/coupons` - List all coupons (admin)
  - `GET /api/coupons/validate/:code` - Validate coupon code
  - `POST /api/coupons` - Create coupon (admin)
  - `PATCH /api/coupons/:id` - Update coupon (admin)
  - `DELETE /api/coupons/:id` - Delete coupon (admin)

### WhatsApp Notifications
- **Admin Notifications**: WhatsApp URL generated for new orders with order details
- **Contact Number**: +91 9279547350
- **Order Details**: Customer name, phone, items, total, payment method, address included in message

### Order Tracking
- **Tracking Number**: Field for delivery tracking number
- **Delivery Partner**: Field for delivery partner name (Delhivery, Bluedart, etc.)
- **API Endpoint**: `PATCH /api/orders/:id/tracking` - Update tracking info (admin)

### AI Chatbot
- **Replit AI Integrations**: Uses OpenAI gpt-5.1 via Replit's managed API (bills to Replit credits)
- **Floating Chat Widget**: Available on all pages via bottom-right corner button
- **Streaming Responses**: Uses Server-Sent Events (SSE) for real-time AI responses
- **Database Persistence**: Conversations and messages stored in PostgreSQL (conversations, messages tables)
- **Auto-Greeting**: Chatbot popup appears after 20 seconds on website load, auto-closes after 5 seconds

### Wishlist Feature
- **Context Provider**: WishlistProvider in `client/src/contexts/wishlist-context.tsx`
- **Storage**: localStorage persistence under key 'luxe-candle-wishlist'
- **Components**: 
  - WishlistButton: Heart icon toggle on product cards and detail pages
  - Wishlist Page: `/wishlist` route showing saved products
- **Navbar Badge**: Shows count of wishlist items with theme-colored badge

### Product Search
- **Search Button**: In navbar, opens overlay with search input
- **Shop Page Integration**: Filters products by name, description, and category
- **URL Sync**: Search query persisted in URL parameters
- **Components**:
  - Search overlay in Navbar (`client/src/components/layout.tsx`)
  - Shop page filtering (`client/src/pages/shop.tsx`)

### Price Filter
- **Location**: Shop page filter bar
- **Dropdown Options**:
  - All Prices (default)
  - Under ₹500
  - ₹500 - ₹1,000
  - ₹1,000 - ₹2,000
  - Above ₹2,000
- **Features**:
  - Click-outside to close dropdown
  - "Clear Filters" button to reset all filters
  - Combined with search filter for multi-criteria filtering
  - Product count updates in real-time

### Back to Top Button
- **Component**: `client/src/components/back-to-top.tsx`
- **Behavior**: Floating button appears after scrolling 300px
- **Animation**: Smooth scroll back to top with fade in/out transitions

### Social Share
- **Component**: `client/src/components/social-share.tsx`
- **Location**: Product detail page
- **Features**:
  - WhatsApp share with product name and price
  - Copy link to clipboard with toast notification

### Image Upload System
- **Object Storage**: Replit's built-in object storage for high-quality image uploads
- **Upload Methods**: 
  - Direct file upload from phone/laptop (supports all image formats, max 10MB)
  - URL paste for external images (Unsplash, Cloudinary, etc.)
- **Admin Integration**: Both Add Product and Edit Product forms support image upload
- **API Endpoints**:
  - `POST /api/uploads/request-url` - Get presigned URL for upload
  - `GET /objects/{*path}` - Serve uploaded images
- **Client Components**: 
  - `useUpload` hook in `client/src/hooks/use-upload.ts`
  - Upload UI integrated directly in product forms

### UI/Component Libraries
- **Radix UI**: Headless, accessible component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled components using Radix primitives
- **Lucide React**: Icon library
- **Framer Motion**: Animation library

### Session Management
- **express-session**: Server-side session handling
- **connect-pg-simple**: PostgreSQL session store

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (defaults to fallback in development)