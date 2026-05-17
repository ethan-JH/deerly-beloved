# Deployment Checklist

## Pre-deployment (build phase — no costs yet)

### App features to finish
- [ ] RSVP form wired up to Supabase (write guest row on submit)
- [ ] RSVP confirmation email via Resend
- [ ] Admin dashboard — view all RSVPs, attendance counts, dietary summary, CSV export
- [ ] All window content filled in — itinerary, travel directions, accommodation alternatives, FAQ, registry links
- [ ] Login page copy updated (remove "passcode from your invitation" placeholder)

### Data
- [ ] Populate the `guests` table — one row per guest/couple with their fun personal password
- [ ] Test locally with at least 3 guest accounts (Deer Park room holder, non-room guest, Friday-only invited guest)

---

## Deployment day (trigger costs only here)

- [ ] **Buy domain** — only buy when ready to share the URL. Cheapest: Cloudflare Registrar (at-cost, ~£8-12/yr) or Namecheap
- [ ] **Create Vercel account** — free Hobby plan, no card needed for this traffic level
- [ ] Connect GitHub repo to Vercel (auto-deploys on every push to `main`)
- [ ] Add all env vars to Vercel (Settings → Environment Variables):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_PASSWORD`
  - `RESEND_API_KEY`
- [ ] **Create Resend account** — free tier: 3,000 emails/month, more than enough for 130 guests
- [ ] Add your domain to Resend and verify it (adds DNS records, ~10 min)
- [ ] Add custom domain in Vercel and point DNS to Vercel nameservers
- [ ] Run `npm run db:push` if migrations haven't been applied yet
- [ ] **Set up UptimeRobot** — ping `yourdomain.com/api/ping` every 3 days to keep Supabase alive (free at uptimerobot.com)

---

## Before invitations go out

- [ ] Full end-to-end test on production: log in as a guest, RSVP, check confirmation email arrives
- [ ] Test on iOS Safari and Android Chrome (where most guests will be)
- [ ] Proof-read all content with Bechan
- [ ] Print guest passwords on physical invitations — keep a backup copy of the `guests` table

---

## Ongoing / closer to the wedding

- [ ] Check Supabase dashboard is not paused (if UptimeRobot was ever down)
- [ ] Monitor RSVPs via admin dashboard and chase non-responders
- [ ] Send a reminder to guests who haven't RSVP'd ~6 weeks before the wedding
- [ ] Export final guest list as CSV for caterers

---

## Cost summary

| Service    | Plan  | Cost         |
|------------|-------|--------------|
| Vercel     | Hobby | Free         |
| Supabase   | Free  | Free         |
| Resend     | Free  | Free         |
| UptimeRobot| Free  | Free         |
| Domain     | —     | ~£8-12/year  |

Only the domain name costs anything.
