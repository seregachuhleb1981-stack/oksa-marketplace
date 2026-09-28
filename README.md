# OKSA Marketplace

OKSA — «Обирай. Замовляй. Отримуй.»

Production-oriented Ukrainian ecommerce marketplace foundation built with Next.js, TypeScript and the App Router.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production

```bash
npm install
npm run build
npm start
```

The production build runs Prisma migrations before the Next.js build, so a clean PostgreSQL database is recreated from the committed migration history automatically.

Render configuration is provided in `render.yaml`. Secrets and credentials belong only in environment variables.

## Product data

Supplier feed configuration is server-side only. Supplier URLs, costs, margins and import mechanics must never be exposed in public UI, SEO content or customer communications.

## Roadmap

- PostgreSQL + ORM and migrations
- Catalog/category data model
- Secure server-side XML import and synchronization
- Search, filters, pagination and product pages
- Cart and checkout
- Accounts, orders, favorites, comparison
- Reviews and questions
- Admin area
- Nova Poshta integration
- SEO, structured data and Merchant feeds
- GA4/GTM, Consent Mode v2 and Meta Pixel
- PWA, accessibility, performance and security hardening
- AI customer assistant with grounded product data
