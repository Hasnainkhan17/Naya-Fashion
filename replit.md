# Naya Fashion - E-Commerce Website

## Overview
Naya Fashion is a full-stack e-commerce platform for selling men's clothing, women's clothing, and bags. It includes a customer-facing storefront and an admin dashboard for store management. Currency is PKR, branded as 2026 Collection.

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, shadcn/ui components, Wouter routing, TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with custom theme tokens
- **File Upload**: Multer for product image uploads

## Project Structure
```
client/src/
  components/     - Reusable UI components (navbar, footer, product-card, theme-provider)
  pages/          - Page components (home, products, product-detail, cart, checkout, track-order, admin-login, admin-dashboard)
  lib/            - Utilities (cart context, query client)
  hooks/          - Custom hooks

server/
  index.ts        - Express server setup
  routes.ts       - API routes (including /api/upload, /api/payments/process)
  storage.ts      - Database storage layer (IStorage interface)
  db.ts           - Database connection
  seed.ts         - Seed data

shared/
  schema.ts       - Drizzle schema + Zod validation (users, products, categories, orders, order_items)
```

## Database Schema
- **users**: id, name, email, password, role
- **categories**: id, name, slug
- **products**: id, name, description, price, stock, image, categoryId
- **orders**: id, userId, customerName, customerEmail, customerPhone, shippingAddress, shippingCity, shippingZip, totalPrice, paymentMethod, paymentStatus, status, transactionId, trackingCode, orderDate
- **order_items**: id, orderId, productId, quantity, price

## Key Features
- Product browsing with category filtering and search
- Shopping cart with local storage persistence (key: "naya-cart")
- Checkout with 3 payment methods:
  - Cash on Delivery (COD) - pay on receive, stays unpaid until admin updates
  - Debit/Credit Card - full payment gateway with Luhn validation, card type detection, transaction IDs, auto-approval
  - JazzCash/EasyPaisa - manual transfer with reference number, admin verifies payment
- Payment gateway (POST /api/payments/process): server-side Luhn algorithm card validation, expiry check, card type detection (Visa/Mastercard/Amex/Discover/JCB), transaction ID generation
- Card payments auto-approved: paymentStatus="paid", status="confirmed" with transactionId stored
- Order tracking page (/track-order) - customers enter order ID + email to see status
- Admin login (admin@nayafashion.com / admin123) - accessible only at /admin, hidden from navbar
- Admin dashboard: product CRUD with image upload, order management with status/tracking/payment updates, shows transaction IDs for card orders
- Order statuses: pending, confirmed, processing, shipped, delivered, cancelled
- Payment statuses: unpaid, paid
- Dark/light theme toggle
- Responsive design
- Currency: PKR throughout (formatted with toLocaleString)
- Free shipping on orders over PKR 10,000 (PKR 500 shipping fee otherwise)

## Payment Gateway Notes
- Stripe integration not available (not supported in user's country)
- Built custom simulated payment gateway with real validation (Luhn algorithm)
- Gateway validates: card number (Luhn), expiry date (not expired), CVV length
- Detects card types: Visa, Mastercard, Amex, Discover, JCB, Diners
- Generates unique transaction IDs (format: NF-{timestamp}-{hex})
- Full-screen secure payment UI with processing animation (3-step: validate, contact network, authorize)
- Ready to swap in a real gateway (JazzCash API, EasyPaisa API, etc.) when available

## API Endpoints
- GET /api/categories
- GET /api/products, GET /api/products/:id
- POST /api/products, PATCH /api/products/:id, DELETE /api/products/:id (admin only)
- POST /api/upload (admin only - multer image upload, saves to client/public/images/)
- POST /api/admin/login, POST /api/admin/logout, GET /api/admin/me
- POST /api/payments/process (card payment validation and processing)
- GET /api/orders, GET /api/orders/:id (admin only)
- POST /api/orders
- POST /api/orders/track (public - order tracking by ID + email)
- PATCH /api/orders/:id/status (admin only)
- PATCH /api/orders/:id (admin only - tracking code, payment status)

## Design
- Rose/pink primary theme (hsl 340)
- Product images stored in client/public/images/
- Hero banner at client/public/images/hero-banner.png
