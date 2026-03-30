# ClassTrack — Setup & Deployment Guide

## What you're building
A mobile-friendly web app for teachers to track student class credits.
Teachers can check in students with one tap, add credits when parents pay,
and get alerted when students are running low.

---

## Step 1 — Create your Supabase project

1. Go to **https://supabase.com** and sign in (or create a free account)
2. Click **"New project"**
   - Give it a name like `classtrack`
   - Set a strong database password (save it!)
   - Choose a region close to you
3. Wait ~2 minutes for the project to provision

### Run the database schema

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `supabase-schema.sql` and paste it in
4. Click **"Run"** (or press Cmd+Enter)
5. You should see "Success. No rows returned" — that's correct ✓

### Get your API credentials

1. Go to **Settings → API** in your Supabase project
2. Copy these two values:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

## Step 2 — Set up the project locally

### Requirements
- Node.js 18+ (https://nodejs.org)
- Git (https://git-scm.com)

### Install and run

```bash
# 1. Go into the project folder
cd classtrack

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.local.example .env.local
```

Open `.env.local` in any text editor and fill in your Supabase values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
```

```bash
# 4. Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser. The app should load! 🎉

---

## Step 3 — Deploy to Vercel

### Option A: Deploy via Vercel website (recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/classtrack.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** and sign in with GitHub

3. Click **"Add New… → Project"**

4. Import your `classtrack` repository

5. Before clicking Deploy, click **"Environment Variables"** and add:
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |

6. Click **"Deploy"** — wait ~2 minutes

7. Your app is live at `https://classtrack-xxxx.vercel.app` ✓

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
# Follow prompts; add env vars when asked
```

---

## Step 4 — Share with teachers

1. Open your Vercel URL on a phone
2. On iPhone: tap the Share button → "Add to Home Screen"
3. On Android: tap the 3-dot menu → "Add to Home screen"

The app will work like a native app icon on the home screen!

---

## App Pages

| Page | URL | Purpose |
|------|-----|---------|
| Check In | `/` | Main teacher screen — mark attendance fast |
| Students | `/students` | Add/edit students, add credits when paid |
| Dashboard | `/dashboard` | Overview, low credit alerts, email parents |
| History | `/history` | Attendance + payment history per student |

---

## How to use day-to-day

### Adding a new student
1. Go to **Students** tab
2. Tap **+ Add**
3. Fill in name, parent name, email, starting credits
4. Tap **Add Student**

### When a parent pays for more classes
1. Go to **Students** tab
2. Find the student, tap **+ Credits**
3. Enter number of credits purchased and payment date
4. Tap **Add Credits**

### Marking attendance (during class)
1. Open the app — you're on the Check In screen
2. Optionally type the class name at the top
3. Find the student and tap the big **✓ Check In** button
4. 1 credit is automatically deducted and recorded

### Checking who's running low
1. Go to **Dashboard**
2. The "Needs Attention" section shows students with fewer than 3 credits
3. Tap **📧 Email** to send a quick reminder to the parent

---

## Customization

### Change the low-credit warning threshold
In `pages/index.js`, `pages/students.js`, and `pages/dashboard.js`,
search for `< 3` and change to your preferred number (e.g., `< 5`).

### Change the app name
Search for "ClassTrack" across all files and replace with your program name.

### Add a password / login
Install Supabase Auth for a simple email/password login. See:
https://supabase.com/docs/guides/auth/auth-email

---

## Troubleshooting

**"Missing Supabase environment variables"**
→ Make sure `.env.local` exists and has both values filled in, then restart `npm run dev`

**Check-in does nothing / errors**
→ Check your browser console (F12). The most common cause is a wrong Supabase URL.

**Data not saving**
→ Go to Supabase → Table Editor → check that the tables exist. If not, re-run the SQL schema.

**RLS errors in console**
→ Go to Supabase → Authentication → Policies and make sure the "Allow all for anon" policies exist on all 3 tables.
