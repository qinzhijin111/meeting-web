
create table if not exists public.room_agents (
  id uuid primary key default gen_random_uuid(),

  room_id uuid not null
    references public.rooms(id)
    on delete cascade,

  agent_type text not null
    check (
      agent_type in (
        'minimal',
        'notes',
        'assistant',
        'translator'
      )
    ),

  dispatch_id text unique,

  participant_identity text,

  status text not null default 'starting'
    check (
      status in (
        'starting',
        'dispatched',
        'running',
        'stopping',
        'stopped',
        'failed'
      )
    ),

  settings_json jsonb not null
    default '{}'::jsonb,

  started_by uuid not null
    references auth.users(id)
    on delete cascade,

  error_message text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  stopped_at timestamptz
);

create index if not exists
  room_agents_room_id_idx
on public.room_agents(room_id);

create index if not exists
  room_agents_dispatch_id_idx
on public.room_agents(dispatch_id);

/*
 * This is the important idempotency protection.
 *
 * A room may not have two active sessions
 * of the same agent type.
 */
create unique index if not exists
  room_agents_one_active_type_per_room_idx
on public.room_agents(room_id, agent_type)
where status in (
  'starting',
  'dispatched',
  'running',
  'stopping'
);

alter table public.room_agents
enable row level security;
