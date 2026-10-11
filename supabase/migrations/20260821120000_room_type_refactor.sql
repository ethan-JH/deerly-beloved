-- Replace has_deer_park_room boolean with room_type text
-- Room types: 'main_house_double' (14 rooms), 'garden_double' (17 rooms), 'garden_single' (4 rooms)
alter table invites add column room_type text;
update invites set room_type = 'garden_double' where has_deer_park_room = true;
alter table invites drop column has_deer_park_room;
