# Going live (multi-device)

The app runs locally on **SQLite** (a single file, one machine). To use it from
your laptop **and** phone with one shared plan, you deploy it to a host with a
**hosted database**. This is the runbook. Steps marked 🧑 need your accounts;
I can do the code steps and run the migration once you paste me the DB URL.

Recommended stack: **Neon (Postgres) + Vercel**. Both have free tiers.

---

## 1. Hosted Postgres (Neon) — ✅ DONE

A Neon Postgres project is created and its `DATABASE_URL` is in the (gitignored)
`.env`. Keep that string safe — you'll paste the same one into Vercel.

## 2. Prisma on Postgres — ✅ DONE

`prisma/schema.prisma` uses `provider = "postgresql"` + `env("DATABASE_URL")`.
The Postgres migration (`prisma/migrations/0_init`) has been applied to Neon and
the base data (4 categories + 7 weekday templates) is seeded. The app has been
run locally against Neon and connects fine. Nothing more to do here.

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
