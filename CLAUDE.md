# Wedding website — Claude Code instructions

## Project overview
A bespoke wedding invitation website for ~130 guests. Next.js App Router,
Tailwind CSS, Supabase for RSVPs, Resend for confirmation emails, deployed
on Vercel. Password-protected for guests, separate admin password for RSVP dashboard.

## Commands
- `npm run dev` — start local dev server (localhost:3000)
- `npm run build` — production build (run this before pushing to catch errors)
- `npm run lint` — ESLint check

## Tech stack
- Framework: Next.js 16, App Router, TypeScript strict mode
- Styling: Tailwind CSS v4 — no CSS modules, no styled-components
- Database: Supabase (Postgres) — RSVP data only
- Email: Resend — guest confirmation emails on RSVP submission
- Hosting: Vercel — auto-deploys on git push to main

## Project structure
src/app/
  layout.tsx              # root layout, fonts, nav
  page.tsx                # home / hero
  rsvp/page.tsx           # RSVP form
  schedule/page.tsx       # day-of schedule
  travel/page.tsx         # venue, hotels, directions
  registry/page.tsx       # gift registry links
  faq/page.tsx            # FAQs
  admin/page.tsx          # RSVP dashboard (admin password protected)
  login/page.tsx          # passcode entry for guests
  api/rsvp/route.ts       # POST handler: Supabase write + Resend email
  api/auth/route.ts       # POST handler: sets site-auth cookie
src/components/           # shared components (Navbar, Footer, etc.)
src/proxy.ts              # guest passcode protection via cookie (Next.js 16 proxy)
src/lib/supabase.ts       # Supabase client singleton
src/lib/resend.ts         # Resend client singleton

## Environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
SITE_PASSCODE=
ADMIN_PASSWORD=

## Supabase — rsvps table
id uuid PK, created_at timestamptz, name text, email text,
attending boolean, plus_one boolean, plus_one_name text,
dietary text, song_request text, message text

## Coding conventions — follow these exactly
- Server components by default; 'use client' only when needed (forms, state)
- API routes use Next.js Route Handlers (app/api/), never pages/api/
- TypeScript strict mode on — no `any` types
- Tailwind only for styling
- No third-party component libraries (shadcn, MUI, etc.) — build from scratch
- Functional components only, no class components
- Named exports for components, default exports for pages (Next.js convention)
- Never commit secrets or API keys
- Run `npm run build` and fix all errors before considering a task done

## Hard rules — check before every action
- Never edit .env.local
- Never push to git without running npm run build first
- If a task touches more than 3 files or has architectural decisions → enter
  plan mode first, propose the approach, wait for approval before writing code
- If the task is ambiguous → ask a clarifying question, do not guess
- Read a file before editing it — never assume its contents
