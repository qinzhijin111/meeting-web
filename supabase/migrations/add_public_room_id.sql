
alter table public.rooms
add column public_id text;

update public.rooms
set public_id = gen_random_uuid()::text
where public_id is null;

alter table public.rooms
alter column public_id set not null;

create unique index rooms_public_id_idx
on public.rooms (public_id);
