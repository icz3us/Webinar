create extension if not exists pgcrypto;

create type public.app_role as enum ('participant', 'staff', 'admin');
create type public.attendance_status as enum ('present', 'absent');
create type public.certificate_status as enum ('generated', 'issued', 'revoked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  event_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz not null default now(),
  unique(event_id, slug)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  affiliation text not null,
  participant_category text not null,
  other_category text,
  privacy_consent boolean not null check (privacy_consent = true),
  privacy_consent_at timestamptz not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, user_id),
  unique(event_id, email)
);

create table public.registration_sessions (
  registration_id uuid references public.registrations(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  primary key(registration_id, session_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  status public.attendance_status not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  marked_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(registration_id, session_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  certificate_number text not null unique default ('DDT-' || upper(encode(gen_random_bytes(9), 'hex'))),
  certificate_url text,
  issued_at timestamptz,
  generated_by uuid not null references auth.users(id),
  status public.certificate_status not null default 'generated',
  created_at timestamptz not null default now(),
  unique(registration_id, session_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index registrations_event_created_idx on public.registrations(event_id, created_at desc);
create index registrations_email_idx on public.registrations(lower(email));
create index attendance_session_status_idx on public.attendance(session_id, status);
create index certificates_status_idx on public.certificates(status);

create function public.is_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'));
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.sessions enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_logs enable row level security;

create policy "public event read" on public.events for select using (true);
create policy "public session read" on public.sessions for select using (true);
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "own registration read" on public.registrations for select using (user_id = auth.uid() or public.is_staff());
create policy "own registration insert" on public.registrations for insert with check (user_id = auth.uid() and email = (auth.jwt() ->> 'email'));
create policy "own registration update" on public.registrations for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "registration sessions read" on public.registration_sessions for select using (exists(select 1 from public.registrations r where r.id = registration_id and (r.user_id = auth.uid() or public.is_staff())));
create policy "registration sessions insert" on public.registration_sessions for insert with check (exists(select 1 from public.registrations r where r.id = registration_id and r.user_id = auth.uid()));
create policy "staff attendance" on public.attendance for all using (public.is_staff()) with check (public.is_staff());
create policy "own attendance read" on public.attendance for select using (exists(select 1 from public.registrations r where r.id = registration_id and r.user_id = auth.uid()));
create policy "staff certificates" on public.certificates for all using (public.is_staff()) with check (public.is_staff());
create policy "own certificates read" on public.certificates for select using (exists(select 1 from public.registrations r where r.id = registration_id and r.user_id = auth.uid()));
create policy "staff audit read" on public.audit_logs for select using (public.is_staff());
create policy "staff audit insert" on public.audit_logs for insert with check (public.is_staff() and user_id = auth.uid());

