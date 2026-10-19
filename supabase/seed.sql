-- Wipe existing seed data
truncate table breakout_scores, guests, invites, app_config restart identity cascade;

-- Ethan & Bechan (Treehouse / Bridal Suite, Friday + Saturday, contact email)
-- Password below is a placeholder — set the real one directly in Supabase after seeding,
-- never commit the real password to this file.
insert into invites (id, password, display_name, email, room_counts, friday_invited)
values (
  'f3a7c291-84be-4d10-b6e2-91d05c3fa847',
  'changeme123',
  'Ethan & Bechan',
  'eharbinson966@gmail.com',
  '{"treehouse": 1}',
  true
);

insert into guests (id, invite_id, first_name, last_name)
values
  ('2e5d8b14-c3f0-4a92-b7d6-58e1a9024c3f', 'f3a7c291-84be-4d10-b6e2-91d05c3fa847', 'Ethan',  'Harbinson'),
  ('9a1f4e72-d08c-4b35-a561-3c7b2e950d81', 'f3a7c291-84be-4d10-b6e2-91d05c3fa847', 'Bechan', 'Thomas');

-- App config placeholders — real values (e.g. a third party's home address) are
-- inserted directly into the live DB, never committed here.
insert into app_config (key, value) values
  ('sunday_venue_short',   'TBD, Broadhembury'),
  ('sunday_venue_address', 'Address TBD\nBroadhembury\nTBD');
