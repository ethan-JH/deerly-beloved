-- Create invites table (one per group / household)
create table invites (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now(),
  password           text not null unique,
  display_name       text not null,        -- e.g. "Dom & Jess", "The Smith Family"
  email              text,                 -- contact email for RSVP confirmation
  has_deer_park_room boolean not null default false,
  friday_invited     boolean not null default false
);

-- Clear test data (dev only — real data must be entered via new invite-first flow)
truncate table guests;

-- Refactor guests: add per-invite FK, drop columns that now live on invites
alter table guests
  add column invite_id uuid not null references invites(id),
  drop column password,
  drop column has_deer_park_room,
  drop column friday_invited,
  drop column plus_one_allowed,
  drop column plus_one_name,
  drop column email;
