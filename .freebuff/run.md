# EduMind Preview Run Doc

## Reproduce uncommitted artifacts
No env files to copy — the `.env` in the main checkout already has `PORT` (or defaults to 3001).

Dependencies are already installed:
- `node_modules/` (root)
- `client/node_modules/`

Client build must exist at `client/dist/`:
```bash
cd client && npm run build
```

## How to run the server
```bash
PORT=3001 node server/index.js
```

Serves the React SPA from `client/dist` and the API on `/api`.

Preview URL: `http://localhost:3001`
