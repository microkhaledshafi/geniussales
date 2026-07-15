# Genius Scientific - Enterprise ERP System

A comprehensive inventory and order management system built with React, TypeScript, and TanStack Router.

## Features

- 📊 **Dashboard** - Real-time analytics and KPIs
- 👥 **Customers** - Complete customer management
- 📦 **Stock** - Inventory tracking with low-stock alerts
- 🛒 **Orders** - Order placement and fulfillment
- 💰 **Invoices** - Professional invoice generation with GST
- 📧 **Leads** - Sales pipeline and lead management

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx      # Root layout
│   └── index.tsx       # Main ERP dashboard
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:5000
```

## Deployment

Deployed on Netlify with automatic CI/CD from the main branch.

- Build command: `npm run build`
- Publish directory: `dist`

## API Endpoints

The app expects the following API endpoints:

- `GET /api/customers` - List all customers
- `GET /api/stock` - List all stock items
- `GET /api/orders` - List all orders
- `GET /api/leads` - List all leads
- `POST /api/customers` - Create customer
- `POST /api/stock` - Add stock item
- `POST /api/orders` - Create order
- `POST /api/leads` - Create lead
- `PUT /api/customers/:id` - Update customer
- `PUT /api/stock/:id` - Update stock
- `PUT /api/orders/:id` - Update order
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/customers/:id` - Delete customer
- `DELETE /api/stock/:id` - Delete stock
- `DELETE /api/orders/:id` - Delete order
- `DELETE /api/leads/:id` - Delete lead
