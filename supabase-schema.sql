-- ═══════════════════════════════════════════
-- AllScent Hub — Schema Database Supabase
-- Copia e incolla tutto questo nell'SQL Editor
-- ═══════════════════════════════════════════

-- UTENTI (estende auth.users di Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'editor' check (role in ('superadmin','admin','editor','viewer')),
  office text default 'trade',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PERMESSI MODULI PER UTENTE
create table public.user_modules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  module_id text not null,
  can_edit boolean default true,
  granted_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(user_id, module_id)
);

-- ATTIVAZIONI TRADE
create table public.trade_activities (
  id uuid default gen_random_uuid() primary key,
  brand text not null,
  pdvs text[] not null default '{}',
  tipo text not null,
  tipo_label text,
  start_date date not null,
  end_date date not null,
  price numeric default 0,
  incl_contributo boolean default false,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GIORNATE PDV
create table public.giornate (
  id uuid default gen_random_uuid() primary key,
  brand text not null,
  pdv text not null,
  tipo text not null,
  tipo_label text,
  nome_consulente text,
  days date[] not null default '{}',
  giorni_totali int default 0,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ATTIVITÀ INTERNE
create table public.internal_activities (
  id uuid default gen_random_uuid() primary key,
  tipo text not null,
  tipo_label text,
  brand text,
  owner text,
  start_date date not null,
  end_date date,
  pdv_area text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- SOCIAL / EDITORIALE
create table public.social_posts (
  id uuid default gen_random_uuid() primary key,
  channel text not null,
  channel_label text,
  brand text,
  title text not null,
  status text default 'IDA',
  status_label text,
  owner text,
  post_date date not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- TODO
create table public.todos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  assigned_to text,
  priority text default 'media' check (priority in ('alta','media','bassa')),
  due_date date,
  done boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Ogni utente autenticato può leggere e scrivere
-- ═══════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.user_modules enable row level security;
alter table public.trade_activities enable row level security;
alter table public.giornate enable row level security;
alter table public.internal_activities enable row level security;
alter table public.social_posts enable row level security;
alter table public.todos enable row level security;

-- Policies: utenti autenticati possono fare tutto
create policy "Authenticated read profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Authenticated update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Authenticated read modules" on public.user_modules for select using (auth.role() = 'authenticated');
create policy "Authenticated all trade" on public.trade_activities for all using (auth.role() = 'authenticated');
create policy "Authenticated all giornate" on public.giornate for all using (auth.role() = 'authenticated');
create policy "Authenticated all internal" on public.internal_activities for all using (auth.role() = 'authenticated');
create policy "Authenticated all social" on public.social_posts for all using (auth.role() = 'authenticated');
create policy "Authenticated all todos" on public.todos for all using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════
-- TRIGGER: crea profilo automaticamente al signup
-- ═══════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  -- Assegna moduli base
  insert into public.user_modules (user_id, module_id, can_edit)
  values
    (new.id, 'trade', true),
    (new.id, 'giornate', true),
    (new.id, 'internal', true),
    (new.id, 'social', true),
    (new.id, 'budget', true),
    (new.id, 'pdv', true),
    (new.id, 'todo', true);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════
-- AGGIORNAMENTO SCHEMA — Task Team
-- Esegui questo nell'SQL Editor di Supabase
-- ═══════════════════════════════════════════

-- Aggiungi start_date a todos se non esiste
alter table public.todos add column if not exists start_date date;

-- TASK DI TEAM (contenitore)
create table if not exists public.team_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  priority text default 'media' check (priority in ('alta','media','bassa')),
  start_date date,
  due_date date,
  done boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SOTTO-TASK assegnati a singole persone
create table if not exists public.team_subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.team_tasks(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  assigned_name text,
  assigned_email text,
  title text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.team_tasks enable row level security;
alter table public.team_subtasks enable row level security;

create policy "Auth read team_tasks" on public.team_tasks for select using (auth.role() = 'authenticated');
create policy "Auth insert team_tasks" on public.team_tasks for insert with check (auth.role() = 'authenticated');
create policy "Auth update team_tasks" on public.team_tasks for update using (auth.role() = 'authenticated');
create policy "Auth delete team_tasks" on public.team_tasks for delete using (auth.uid() = created_by);

create policy "Auth all team_subtasks" on public.team_subtasks for all using (auth.role() = 'authenticated');
