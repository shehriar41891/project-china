# Setup: Login, Quiz, Profile (SQLite + Mistral)

## 1. Install dependencies

```bash
cd playground
npm install
```

## 2. Environment

Copy `.env.example` to `.env` and set:

- `MISTRAL_API_KEY` — your Mistral API key (for adaptive quiz and recommendations)
- `SESSION_SECRET` — random string for session cookies (optional for local dev)
- `PORT` — default 3000

**.env is gitignored.** Do not commit it.

## 3. Build and run

```bash
npm run prep
npm run server
```

Then open **http://localhost:3000**

### TensorFlow Playground page (`/playground.html`) — dark theme

The server serves static files from **`playground/dist/`**. The classic playground CSS is built as **`dist/bundle.css`** = Material Design Lite + `styles.css` + **`playground-custom.css`** (see `npm run build-css` in `package.json`).

- Always run **`npm run prep`** (or at least **`npm run build-css`**) after pulling or editing `playground-custom.css`, so `dist/bundle.css` includes the dark theme.
- If the playground still looks **white and default**, your `dist/bundle.css` is stale: run `npm run prep` from the **`playground`** folder and hard-refresh the browser (Ctrl+F5).

- **Home** is the default page (Sign in / Sign up in navbar when not logged in).
- **Sign up** → create account (stored in SQLite).
- **Sign in** → session cookie set; navbar shows Profile, Quiz, Network Builder, Logout.
- **Quiz** → 5 adaptive questions per attempt (Mistral). Results stored in DB.
- **Profile** → progress by topic, recent attempts, LLM recommendations.
- **Retake** → on the quiz page, "Retake (adapted to your last results)" uses previous weak areas.

## 4. Database and persistence

- **SQLite:** `playground/data/playground.db` — users, quiz attempts/answers, chapter progress, chapters, `store` (graph/preferences).
- **Sessions:** `playground/data/sessions/` — login cookies are backed by **file storage** (not RAM), so **restarting the server keeps you logged in** as long as the cookie is valid and this folder is not deleted.
- Set a stable **`SESSION_SECRET`** in `.env` in production; changing it invalidates existing session cookies.
- Do **not** delete `data/` if you want to keep accounts and progress (both files are gitignored).

## 5. Without the server

If you run only `npx serve dist/` (no Node server), the app still works but:

- Login/signup and quiz/profile are unavailable (redirect to login will fail; use Network Builder and home as before).
- To use auth and quiz, run `npm run server` and open the app through it.

## 6. Deploying on Render (or similar)

**What you see in the logs is usually not an error:**

| Log | Meaning |
|-----|--------|
| `copyfiles … dist && concat …` | Normal output from `npm run prep` / `npm start` (static assets + `lib.js` bundle). |
| `SQLite DB: /opt/render/...` | Normal — the app uses SQLite under `data/playground.db`. |
| `Seeded 10 chapters` | First run only — empty DB was populated with default chapters. |
| `Server listening on port …` | Server started successfully. |

**`Warning: connect.session() MemoryStore is not designed for a production environment`**

That warning appears only when Express is using the **default in-memory** session store (no `store:` option). The current `server.js` uses **`session-file-store`** under `data/sessions/`, so you should **not** see this if you deploy the latest code. If you still do, your Render service is probably running an **old `server.js`** — redeploy after pulling the repo, or confirm the **Root Directory** is `playground` and **Start Command** runs this project’s `server.js`.

**Recommended Render settings**

- **Root Directory:** `playground` (if the repo root is above it).
- **Build Command:** `npm install && npm run prep` (or `npm ci && npm run prep`).
- **Start Command:** `node server.js` (or `npm start` if that only runs the server; avoid double `prep` on every restart if builds are slow — use a build step + `node server.js` for start).
- **Environment:** set `SESSION_SECRET` to a long random string, `MISTRAL_API_KEY` if you use AI features, and optionally `NODE_ENV=production` (Render often sets this automatically).

**Note:** Ephemeral disk on free tiers means `data/` is wiped if the instance is moved; for durable SQLite + sessions, use a [persistent disk](https://render.com/docs/disks) or an external database.

Cookies use `secure: true` in production so sessions work over HTTPS behind Render’s proxy (`trust proxy` is enabled).
