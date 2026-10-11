-- Replace room_type text with room_counts jsonb
-- Existing rows with a room_type get {room_type: 1}; rows without get {}
alter table invites add column room_counts jsonb not null default '{}';
update invites set room_counts = jsonb_build_object(room_type, 1) where room_type is not null;
alter table invites drop column room_type;
