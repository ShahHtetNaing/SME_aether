# agents

Workflow logic lives here, separate from the HTTP API.

```
agents/
  catalogs/   grant and compliance reference lists
  tools/      draft, approve, and send helpers
  runners/    one runner per workflow
```

`backend/` only exposes REST. `frontend/` only renders the operations UI.
