# 📋 ClassTrack

A mobile-friendly web app for tracking student class attendance and prepaid credits, built to replace a manual spreadsheet workflow at a tutoring program, with role-based access for teachers, admins, and parents.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Auth](https://img.shields.io/badge/Auth-Row%20Level%20Security-blue)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)

---

##  Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Next.js |
| Backend / Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Access control | Postgres Row Level Security (RLS) policies |
| Deployment | Vercel |

---
## 📝 Background

Originally built to solve a real attendance-and-billing workflow at a Python/AI tutoring program I worked at, then generalized here as a standalone project (no real student data or organization branding included).

##  The problem

Class programs that sell credits in bulk (e.g. "10 classes for $200") need to track, per student: how many credits are left, when they attended, and when to alert a parent before credits run out. Doing this in a shared spreadsheet doesn't scale — no access control, no audit trail, and no easy way for a teacher to check a student in from their phone mid-class.

##  What it does

- ** One-tap check-in** — teachers mark attendance from a phone; one credit is deducted and logged automatically
- ** Credit management** — add credits when a parent pays, with the payment date recorded
- ** Dashboard** — live overview of total students, who's running low on credits, and recent check-in activity
- ** History** — full attendance and payment log per student
- ** Role-based access** — Supabase Auth + Postgres Row Level Security enforce three roles:
  - **Admin** — full access, manages students and credits
  - **Teacher** — can check students in and view all records
  - **Parent** — can only view their own linked child's attendance and payment history
- ** Installable** as a home-screen web app for quick access on a teacher's phone

---

##  Architecture notes

- All data access goes through Supabase's client SDK — no student data is ever hardcoded in the app; everything is fetched live from Postgres
- Authorization is enforced at the **database level** via RLS policies (`supabase-schema.sql`), not just hidden in the UI — a parent's Supabase session literally cannot query another student's records, regardless of what the frontend shows
- Environment-based config (`.env.local`, git-ignored) keeps Supabase credentials out of source control

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────────┐
│   Browser   │ ───▶ │  Next.js Pages   │ ───▶ │ Supabase (Postgres)│
│ (teacher /  │      │  check-in /      │      │  + Auth + RLS      │
│  admin app) │ ◀─── │  students /      │ ◀─── │  policies enforce  │
└─────────────┘      │  dashboard       │      │  per-role access   │
                     └──────────────────┘      └────────────────────┘
```

##  Project structure

```
pages/
  index.js        # Check-in screen (default view)
  students.js      # Add/edit students, manage credits
  dashboard.js      # Overview + low-credit alerts
  history.js        # Attendance/payment history
  login.js           # Auth
lib/
  supabase.js       # Supabase client
  AuthContext.js     # Auth/role state
components/
  ui.js, Nav.js      # Shared UI components
supabase-schema.sql   # Database schema + RLS policies
```

##  Running locally

```bash
npm install
cp .env.local.example .env.local
# fill in your own Supabase project URL + anon key
npm run dev
```

Then run `supabase-schema.sql` in your Supabase project's SQL editor to set up the tables and RLS policies.

---


