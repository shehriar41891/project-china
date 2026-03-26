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
