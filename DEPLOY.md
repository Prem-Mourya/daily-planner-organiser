# Going live (multi-device)

The app runs locally on **SQLite** (a single file, one machine). To use it from
your laptop **and** phone with one shared plan, you deploy it to a host with a
**hosted database**. This is the runbook. Steps marked 🧑 need your accounts;
I can do the code steps and run the migration once you paste me the DB URL.

Recommended stack: **Neon (Postgres) + Vercel**. Both have free tiers.

---

## 1. 🧑 Create a hosted Postgres (Neon)

1. Sign up at https://neon.tech (free).
2. Create a project → it gives you a connection string like:
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
3. Copy that string — that's your `DATABASE_URL`.

## 2. Switch Prisma to Postgres (code — I can do this)

In `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
Then reset migrations for Postgres and create a fresh initial migration
**against the Neon URL**:
```bash
rm -rf prisma/migrations                 # SQLite migrations don't apply to Postgres
DATABASE_URL="<your-neon-url>" npx prisma migrate dev --name init
```
This creates the tables in Neon. (Your current local SQLite data — a couple of
tasks/notes — won't carry over automatically; re-enter it in the deployed app,
or ask me to write a one-off export/import.)

## 3. 🧑 Deploy to Vercel

1. Push this repo to GitHub (private is fine).
2. At https://vercel.com → New Project → import the repo. Framework auto-detects
   Next.js.
3. Add **Environment Variables** (Production + Preview):
   - `DATABASE_URL` = your Neon string
   - `APP_PASSWORD` = the password you'll type to enter the app
   - `SESSION_SECRET` = a long random string (e.g. `openssl rand -hex 32`)
4. Ensure the build runs migrations. Set the Vercel **Build Command** to:
   ```
   npx prisma migrate deploy && npm run build
   ```
   (or add `"postinstall": "prisma generate"` — Prisma Client must be generated
   at build; `prisma generate` runs automatically on `npm install` in most setups).
5. Deploy. Open the URL on any device → you'll hit the password screen → enter
   `APP_PASSWORD` → you're in, sharing one database across devices.

## 4. Auth behavior (already built)

- **No `APP_PASSWORD` set** → app is open (this is how local dev stays
  frictionless).
- **`APP_PASSWORD` set** (production) → every route redirects to `/login` until
  you enter the password. The session is a signed, httpOnly cookie (30 days);
  "Log out" clears it.
- This is single-password (just you). It is **not** multi-user accounts — anyone
  with the password sees the same single plan.

## Local development

Nothing changes: keep using SQLite. Leave `APP_PASSWORD` unset in `.env.local`
to skip the login while developing. Copy `.env.example` → `.env.local` if you
want to test the login locally.
