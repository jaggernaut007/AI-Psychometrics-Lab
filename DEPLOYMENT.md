# Deployment Guide

This guide will walk you through deploying the **AI Psychometrics Lab** to the web so you can share it with the world.

## Prerequisites

*   A GitHub account.
*   A [Supabase](https://supabase.com) account (Free Tier is sufficient).
*   A [Vercel](https://vercel.com) account (Free Tier is sufficient).

---

## Part 1: Set up the Hosted Database (Supabase)

Since your local database runs on your machine, we need a cloud database for the live website.

1.  **Create a Project:**
    *   Log in to [Supabase](https://supabase.com).
    *   Click **"New Project"**.
    *   Choose an implementation organization, name your project (e.g., `llm-profiler`), and set a database password.
    *   Select a region close to your users (e.g., US East).
    *   Click **"Create new project"**.

2.  **Get API Credentials:**
    *   Once the project is ready, go to **Settings (icon at bottom left) -> API**.
    *   Copy the **Project URL**.
    *   Copy the **anon public** key.
    *   *Save these for Part 3.*

3.  **Setup the Database Schema:**
    *   In the Supabase dashboard, go to the **SQL Editor** (icon on the left).
    *   Click **"New query"**.
    *   Copy and paste the entire content of the `schema.sql` file from your project into the query window.
    *   Click **"Run"**.
    *   *Verification:* Go to the **Table Editor** (icon on the left) and ensure you see the `runs` table.

---

## Part 2: Push Code to GitHub

If you haven't already, push your code to a GitHub repository.

1.  Create a new repository on GitHub.
2.  Run the following commands in your project terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## Part 3: Deploy to Vercel

1.  **Import Project:**
    *   Log in to [Vercel](https://vercel.com).
    *   Click **"Add New..." -> "Project"**.
    *   Select your GitHub repository and click **"Import"**.

2.  **Configure Project:**
    *   **Framework Preset:** Next.js (should detect automatically).
    *   **Root Directory:**
        *   If your GitHub repo contains this app inside a `web-app/` folder, set Root Directory to `web-app`.
        *   If your GitHub repo root is already this Next.js app (you see `package.json` at the repo root), leave Root Directory as the default.

3.  **Environment Variables:**
    *   Expand the **"Environment Variables"** section. Add the following:
        *   `NEXT_PUBLIC_SUPABASE_URL`: (Paste the URL from Part 1)
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Paste the anon key from Part 1)
        *   Do not set `NEXT_PUBLIC_OPENROUTER_API_KEY` by default. Users should enter their own OpenRouter key in the UI at runtime.

4.  **Deploy:**
    *   Click **"Deploy"**.

Vercel will build your application and assign it a domain (e.g., `llm-profiler.vercel.app`).

---

## Verification

1.  Visit your new Vercel URL.
2.  Try running a short test (you can select just one inventory like "DISC" for speed).
3.  Go to the **Model Explorer** (Leaderboard).
4.  Verify that your run appears in the list.

**Congratulations!** Your AI Psychometrics Lab is now live.
