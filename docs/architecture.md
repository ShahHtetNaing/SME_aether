# Architecture

```
frontend/   operations UI
backend/    REST API
agents/     catalogs, tools, runners
```

```
SME Dashboard
  → Express API
    → agents/runners
      → agents/tools
      → backend store
```
