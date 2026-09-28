# Database

The OKSA schema uses PostgreSQL through Prisma.

Generate the client:

```bash
npx prisma generate
```

Create/apply a development migration after configuring DATABASE_URL:

```bash
npx prisma migrate dev --name init
```

For deployment:

```bash
npx prisma migrate deploy
```

The supplier feed URL is server-side configuration only. Never expose it through client components, public API responses, SEO, or customer-facing UI.
