-- Roles ------------------------------------------------------------------
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users read own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Profiles / subscriptions ------------------------------------------------
create type public.sub_tier as enum ('free', 'plus', 'pro', 'lifetime');
create type public.sub_status as enum ('active', 'trialing', 'past_due', 'canceled', 'suspended');

create table public.profiles (
  id uuid primary key,
  email text,
  display_name text,
  tier public.sub_tier not null default 'free',
  status public.sub_status not null default 'active',
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Users read own profile"
on public.profiles for select to authenticated
using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

create policy "Users update own display name"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins manage profiles"
on public.profiles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Prevent non-admins from escalating their own tier/status
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    new.tier := old.tier;
    new.status := old.status;
    new.expires_at := old.expires_at;
    new.notes := old.notes;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_update
before update on public.profiles
for each row execute function public.guard_profile_update();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- App settings (proxy endpoint configured by admins) ----------------------
create table public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

grant select on public.app_settings to authenticated;
grant select on public.app_settings to anon;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;

create policy "Anyone can read settings"
on public.app_settings for select to anon, authenticated
using (true);

create policy "Admins write settings"
on public.app_settings for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.app_settings (key, value) values
  ('proxy_base_url', ''),
  ('proxy_mode', 'encoded');
