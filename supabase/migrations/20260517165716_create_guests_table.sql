create table guests (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now(),

  -- Identity
  first_name         text not null,
  last_name          text not null,
  email              text,
  password           text not null unique,

  -- Invitation details
  friday_invited     boolean default false,
  has_deer_park_room boolean default false,
  plus_one_allowed   boolean default false,

  -- RSVP (filled in on submission)
  rsvp_submitted_at  timestamptz,
  attending_saturday boolean,
  attending_friday   boolean,
  plus_one_name      text,
  dietary            text,
  song_request       text,
  message            text
);
