# Selahe

Turn feelings into action. An AI action-coach that breaks task-initiation paralysis.

Stack: Next.js 14 (App Router) · Supabase (Postgres + Google Auth) · Groq (Llama 3.3 70B).

---

## What's in here

```
app/
  page.tsx                  Landing page (logged out)
  login/                    Google sign-in
  auth/callback/            OAuth callback
  chat/[action_id]/         A single action's chat thread
  logbook/                  The Action Logbook grid
  api/
    chat/                   Runs Groq, parses the card JSON
    actions/                Create / list actions
    commit/                 Save a card version (first commit + renegotiation)
    punch/                  Record / undo a completion
    messages/               Load a thread
components/                 ActionCard, ChatThread, Sidebar, Logo
lib/                        supabase clients, groq + prompt, dates, types
middleware.ts              Session refresh + route protection
selahe_schema.sql          Run this in Supabase first
```

---

## Setup (one time)

### 1. Create the database tables
In Supabase → SQL Editor → New query → paste the contents of `selahe_schema.sql` → Run.

### 2. Google login redirect
Already configured if you followed setup. The redirect URI in Google Cloud should be:
`https://<your-project-ref>.supabase.co/auth/v1/callback`

### 3. Deploy on Vercel
1. Push this folder to your GitHub repo.
2. In Vercel → Add New → Project → import the repo.
3. Before deploying, add these **Environment Variables** in Vercel:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fkrfyqbozwijzstcnyaq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_PJW2BcphY2-E-CKDM62rcw_OcpCJXwb` |
| `GROQ_API_KEY` | your real Groq key (starts with `gsk_`) — paste it here, nowhere else |

4. Deploy. Vercel auto-detects Next.js.

### 4. Add the Vercel URL back to Google + Supabase
Once Vercel gives you a URL (e.g. `https://selahe.vercel.app`):
- Supabase → Authentication → URL Configuration → add it to **Site URL** and **Redirect URLs** (`https://selahe.vercel.app/auth/callback`).

---

## Run locally (optional)
```
npm install
cp .env.local.example .env.local   # then put your real Groq key in it
npm run dev
```
Open http://localhost:3000

---

## Notes
- **The chat is the source of truth.** Cards and the logbook are views into it.
- **All weekday/date math is in `lib/dates.ts`**, computed in code — never by the AI. This fixes the wrong-weekday bug.
- **`scheduled_date` for punches is set server-side** in `api/punch`, again so the model never decides what day it is.
- Open-weight models are less reliable at clean JSON, so `api/chat` validates the card JSON and retries once if malformed.
