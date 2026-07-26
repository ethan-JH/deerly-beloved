-- Wipe existing seed data
truncate table breakout_scores, guests, invites restart identity cascade;

-- Ethan & Bechan (Deer Park room, Friday + Saturday, contact email)
insert into invites (id, password, display_name, email, has_deer_park_room, friday_invited)
values (
  'f3a7c291-84be-4d10-b6e2-91d05c3fa847',
  'bethan4eva',
  'Ethan & Bechan',
  'eharbinson966@gmail.com',
  true,
  true
);

insert into guests (id, invite_id, first_name, last_name)
values
  ('2e5d8b14-c3f0-4a92-b7d6-58e1a9024c3f', 'f3a7c291-84be-4d10-b6e2-91d05c3fa847', 'Ethan',  'Harbinson'),
  ('9a1f4e72-d08c-4b35-a561-3c7b2e950d81', 'f3a7c291-84be-4d10-b6e2-91d05c3fa847', 'Bechan', 'Thomas');
