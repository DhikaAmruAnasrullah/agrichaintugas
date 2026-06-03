-- ROLES ENUM
create type public.app_role as enum ('admin','petani','distributor','konsumen');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  wallet_address text,
  region text,
  phone text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- HAS_ROLE FUNCTION
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- NEW USER TRIGGER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, region, phone, wallet_address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'region',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'wallet_address'
  );

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'konsumen')
  )
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- LANDS
create table public.lands (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  area_ha numeric not null default 0,
  location text,
  gps_coords text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.lands to authenticated;
grant all on public.lands to service_role;

alter table public.lands enable row level security;

create policy "Signed-in users can view lands"
  on public.lands for select to authenticated using (true);

create policy "Farmers manage own lands - insert"
  on public.lands for insert to authenticated
  with check (auth.uid() = farmer_id);

create policy "Farmers manage own lands - update"
  on public.lands for update to authenticated
  using (auth.uid() = farmer_id);

create policy "Farmers manage own lands - delete"
  on public.lands for delete to authenticated
  using (auth.uid() = farmer_id);

-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  farmer_id uuid not null references auth.users(id) on delete cascade,
  land_id uuid references public.lands(id) on delete set null,
  commodity text not null,
  variety text,
  weight_kg numeric not null default 0,
  harvest_date date not null,
  method text,
  status text not null default 'harvested',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;

create policy "Signed-in users can view products"
  on public.products for select to authenticated using (true);

create policy "Farmers create own products"
  on public.products for insert to authenticated
  with check (auth.uid() = farmer_id);

create policy "Farmers update own products"
  on public.products for update to authenticated
  using (auth.uid() = farmer_id);

create policy "Farmers delete own products"
  on public.products for delete to authenticated
  using (auth.uid() = farmer_id);

-- DISTRIBUTION EVENTS
create table public.distribution_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  actor_name text,
  location text,
  notes text,
  tx_hash text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.distribution_events to authenticated;
grant all on public.distribution_events to service_role;

alter table public.distribution_events enable row level security;

create policy "Signed-in users can view events"
  on public.distribution_events for select to authenticated using (true);

create policy "Signed-in users can add events"
  on public.distribution_events for insert to authenticated
  with check (auth.uid() = actor_id);

create index idx_products_farmer on public.products(farmer_id);
create index idx_products_code on public.products(product_code);
create index idx_events_product on public.distribution_events(product_id);
create index idx_lands_farmer on public.lands(farmer_id);