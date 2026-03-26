# Neural Network Playground — React client

Single-page app (React + Vite + React Router). All main routes (home, login, signup, learn, chapter, quiz, profile, about) are handled here. Editor and Playground are still static HTML and are linked from the app.

## First-time setup

From the `playground` folder (parent of `client`):

```bash
cd client
npm install
cd ..
npm run start
```

Or from repo root: `cd playground/client && npm install`, then from `playground`: `npm run start`.

## Scripts

- `npm run dev` — Vite dev server (port 5173) with API proxy to backend. Run the backend separately on port 3000.
- `npm run build` — Builds to `../dist` (used by root `npm run prep`).
