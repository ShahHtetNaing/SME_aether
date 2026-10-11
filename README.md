# Aether

Operations desk for Singapore SMEs: collections, grants, follow-ups, compliance, and bookings.

## Folders

```
smeflow-ai/
  frontend/   Next.js UI (sidebar, pages, datasets)
  backend/    Express API, Prisma schema, store
  agents/     catalogs, tools, workflow runners
  tests/
  docs/
```

## Local run

```bash
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && npm install && npm run dev
```

- App: http://localhost:3000
- Datasets: http://localhost:3000/datasets
- API: http://localhost:4000/api/health
