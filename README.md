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

## Netlify deployment

Keep credentials in Netlify environment variables, not in repository files or
client-side configuration. Local `.env` files and their variants are ignored;
`.env.example` remains available as a template.

`netlify.toml` excludes only `DEMO_BUSINESS_ID` from environment-value secret
scanning. This is a non-secret tenant identifier that also appears in demo data
and tests, so matching it does not indicate exposed credentials. Secret scanning
remains enabled for other environment variables, including `DATABASE_URL` and
`RESEND_API_KEY`. Do not use the demo identifier to store credentials or as an
authentication mechanism.

If another scan fails, inspect the full deploy log for the flagged variable names
and file paths. Remove actual credentials from source or build output and rotate
any exposed credentials rather than disabling scanning or excluding generated
bundles wholesale.
