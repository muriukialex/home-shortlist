# Home Shortlist

A one-page site listing household appliances by category. For each category you can
rank items from highest to lowest priority and mark one preferred item. Choices are
shared: everyone who opens the site sees and edits the same list. No login.

## Stack

- `public/index.html` — the whole site (HTML, CSS, JS; no build step)
- `api/state.js` — a Vercel Function that reads and writes the shared state
- Upstash Redis (free tier, via the Vercel Marketplace) for storage

## Deploy

1. Push this folder to a GitHub repo.
2. In Vercel: Add New → Project → import the repo → Deploy (no settings to change).
3. In the project: Storage → Create Database → Upstash (Redis) → free plan → connect it to this project.
4. Deployments → latest → Redeploy, so the function picks up the Redis variables.

The function reads `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` /
`UPSTASH_REDIS_REST_TOKEN`), which the integration sets automatically.

## Note

There is no login, so anyone with the link can change the rankings and picks.
