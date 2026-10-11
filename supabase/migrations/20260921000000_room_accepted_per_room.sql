-- room_accepted needs to track yes/no per individual room, not one flag for
-- the whole invite (a family with 3 garden doubles might only want 2).
-- Feature is brand new with no real guest data recorded yet, so a clean swap is safe.
alter table invites drop column room_accepted;
alter table invites add column room_accepted jsonb not null default '{}';
