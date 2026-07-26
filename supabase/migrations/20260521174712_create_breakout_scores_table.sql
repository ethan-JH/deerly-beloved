create table breakout_scores (
  invite_id    uuid primary key references invites(id),
  display_name text    not null,
  score        integer not null,
  time_seconds numeric,          -- only set on perfect score (800 pts, no lives lost)
  achieved_at  timestamptz default now()
);
