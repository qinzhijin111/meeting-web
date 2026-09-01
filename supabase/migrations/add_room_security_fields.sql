
alter table public.rooms
add column password_hash text;

alter table public.rooms
add column livekit_room_name text;

create unique index rooms_livekit_room_name_idx
on public.rooms (livekit_room_name);
