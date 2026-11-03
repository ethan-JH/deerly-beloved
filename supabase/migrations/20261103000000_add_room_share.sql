-- Two invites with separate logins can be put in one physical room (two single
-- guests sharing a double). Invites sharing a room_share_id carry the same
-- room_counts, describing one room between them rather than one each, so room
-- totals must count each group once instead of summing straight across.
--
-- Each invite keeps its own room_accepted, so one of them can drop out without
-- taking the other's answer with them.
alter table invites add column room_share_id uuid;

create index invites_room_share_id_idx on invites (room_share_id)
  where room_share_id is not null;
