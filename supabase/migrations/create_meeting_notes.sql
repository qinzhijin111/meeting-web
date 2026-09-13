
create table
if not exists public.meeting_notes (
  id uuid primary key
    default gen_random_uuid(),

  room_id uuid not null
    references public.rooms(id)
    on delete cascade,

  agent_session_id uuid not null
    references public.room_agents(id)
    on delete cascade,

  summary text not null
    default '',

  decisions_json jsonb not null
    default '[]'::jsonb,

  action_items_json jsonb not null
    default '[]'::jsonb,

  open_questions_json jsonb not null
    default '[]'::jsonb,

  status text not null
    default 'waiting'
    check (
      status in (
        'waiting',
        'processing',
        'ready',
        'partial',
        'error'
      )
    ),

  error_message text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    agent_session_id
  )
);


create index
if not exists
meeting_notes_room_id_idx
on public.meeting_notes (
  room_id
);


alter table
public.meeting_notes
enable row level security;
