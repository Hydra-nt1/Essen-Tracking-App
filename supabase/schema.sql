-- Food-Tracking-App: Datenbankschema für Supabase (Postgres)
-- Im Supabase Dashboard unter "SQL Editor" einfügen und ausführen.

create extension if not exists "pgcrypto";

-- ── profiles ─────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  daily_calorie_goal numeric,
  protein_goal_g numeric,
  fat_goal_g numeric,
  carbs_goal_g numeric,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Automatically create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── foods ────────────────────────────────────────────────────────
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  barcode text,
  calories_per_100g numeric not null default 0,
  protein_per_100g numeric not null default 0,
  fat_per_100g numeric not null default 0,
  carbs_per_100g numeric not null default 0,
  source text not null default 'custom' check (source in ('custom', 'openfoodfacts')),
  created_at timestamptz not null default now()
);

alter table public.foods enable row level security;
create index if not exists foods_user_id_idx on public.foods (user_id);

create policy "foods_select_own" on public.foods for select using (auth.uid() = user_id);
create policy "foods_insert_own" on public.foods for insert with check (auth.uid() = user_id);
create policy "foods_update_own" on public.foods for update using (auth.uid() = user_id);
create policy "foods_delete_own" on public.foods for delete using (auth.uid() = user_id);

-- ── diary_entries ────────────────────────────────────────────────
create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete cascade,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  quantity_g numeric not null,
  logged_at timestamptz not null default now()
);

alter table public.diary_entries enable row level security;
create index if not exists diary_entries_user_date_idx on public.diary_entries (user_id, date);

create policy "diary_entries_select_own" on public.diary_entries for select using (auth.uid() = user_id);
create policy "diary_entries_insert_own" on public.diary_entries for insert with check (auth.uid() = user_id);
create policy "diary_entries_update_own" on public.diary_entries for update using (auth.uid() = user_id);
create policy "diary_entries_delete_own" on public.diary_entries for delete using (auth.uid() = user_id);

-- ── weight_entries ───────────────────────────────────────────────
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.weight_entries enable row level security;
create index if not exists weight_entries_user_date_idx on public.weight_entries (user_id, date);

create policy "weight_entries_select_own" on public.weight_entries for select using (auth.uid() = user_id);
create policy "weight_entries_insert_own" on public.weight_entries for insert with check (auth.uid() = user_id);
create policy "weight_entries_update_own" on public.weight_entries for update using (auth.uid() = user_id);
create policy "weight_entries_delete_own" on public.weight_entries for delete using (auth.uid() = user_id);

-- ── recipes ──────────────────────────────────────────────────────
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  servings numeric not null default 1,
  created_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

create policy "recipes_select_own" on public.recipes for select using (auth.uid() = user_id);
create policy "recipes_insert_own" on public.recipes for insert with check (auth.uid() = user_id);
create policy "recipes_update_own" on public.recipes for update using (auth.uid() = user_id);
create policy "recipes_delete_own" on public.recipes for delete using (auth.uid() = user_id);

-- ── recipe_ingredients ───────────────────────────────────────────
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete cascade,
  quantity_g numeric not null
);

alter table public.recipe_ingredients enable row level security;

create policy "recipe_ingredients_select_own" on public.recipe_ingredients for select using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
);
create policy "recipe_ingredients_insert_own" on public.recipe_ingredients for insert with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
);
create policy "recipe_ingredients_update_own" on public.recipe_ingredients for update using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
);
create policy "recipe_ingredients_delete_own" on public.recipe_ingredients for delete using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
);

-- ── meal_plan_items ──────────────────────────────────────────────
create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id uuid references public.foods (id) on delete cascade,
  recipe_id uuid references public.recipes (id) on delete cascade,
  quantity_g numeric,
  created_at timestamptz not null default now(),
  constraint meal_plan_items_food_xor_recipe check (
    (food_id is not null and recipe_id is null) or (food_id is null and recipe_id is not null)
  )
);

alter table public.meal_plan_items enable row level security;
create index if not exists meal_plan_items_user_date_idx on public.meal_plan_items (user_id, date);

create policy "meal_plan_items_select_own" on public.meal_plan_items for select using (auth.uid() = user_id);
create policy "meal_plan_items_insert_own" on public.meal_plan_items for insert with check (auth.uid() = user_id);
create policy "meal_plan_items_update_own" on public.meal_plan_items for update using (auth.uid() = user_id);
create policy "meal_plan_items_delete_own" on public.meal_plan_items for delete using (auth.uid() = user_id);

-- ── shopping_list_items ──────────────────────────────────────────
create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  is_checked boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'generated')),
  created_at timestamptz not null default now()
);

alter table public.shopping_list_items enable row level security;
create index if not exists shopping_list_items_user_id_idx on public.shopping_list_items (user_id);

create policy "shopping_list_items_select_own" on public.shopping_list_items for select using (auth.uid() = user_id);
create policy "shopping_list_items_insert_own" on public.shopping_list_items for insert with check (auth.uid() = user_id);
create policy "shopping_list_items_update_own" on public.shopping_list_items for update using (auth.uid() = user_id);
create policy "shopping_list_items_delete_own" on public.shopping_list_items for delete using (auth.uid() = user_id);
