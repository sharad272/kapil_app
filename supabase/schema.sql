-- ============================================================
-- RM Productivity Portal — schema + row level security
-- Run this in Supabase: SQL Editor > New query > Run
-- ============================================================

-- ---------- tables ----------

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'rm' check (role in ('rm','tl')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.months (
  id          text primary key,              -- e.g. "2026-04"
  label       text not null,                 -- e.g. "Apr'26"
  sort_order  integer not null,
  is_open     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- TL-owned: targets and audit-assigned quality scores
create table if not exists public.assignments (
  rm_id         uuid not null references public.profiles(id) on delete cascade,
  month_id      text not null references public.months(id) on delete cascade,
  target        numeric,
  quality_score numeric,
  updated_at    timestamptz not null default now(),
  primary key (rm_id, month_id)
);

-- RM-owned: self-reported production
create table if not exists public.submissions (
  rm_id        uuid not null references public.profiles(id) on delete cascade,
  month_id     text not null references public.months(id) on delete cascade,
  ape          numeric,
  frp          numeric,
  policies     integer,
  submitted_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (rm_id, month_id)
);

-- RM-owned: certification scores (carry across months)
create table if not exists public.certifications (
  rm_id      uuid primary key references public.profiles(id) on delete cascade,
  ulip       numeric,
  endowment  numeric,
  term       numeric,
  updated_at timestamptz not null default now()
);

-- TL-only: private coaching notes. RMs must never read these.
create table if not exists public.coaching_notes (
  rm_id      uuid primary key references public.profiles(id) on delete cascade,
  note       text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------- helper ----------
-- SECURITY DEFINER so the policy on profiles doesn't recurse into itself.
create or replace function public.is_tl()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'tl' and active
  );
$$;

-- ---------- auto-create a profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- enable RLS ----------
alter table public.profiles       enable row level security;
alter table public.months         enable row level security;
alter table public.assignments    enable row level security;
alter table public.submissions    enable row level security;
alter table public.certifications enable row level security;
alter table public.coaching_notes enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_tl());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));

drop policy if exists profiles_tl_write on public.profiles;
create policy profiles_tl_write on public.profiles
  for all to authenticated
  using (public.is_tl()) with check (public.is_tl());

-- ---------- months: everyone reads, TL writes ----------
drop policy if exists months_select on public.months;
create policy months_select on public.months
  for select to authenticated using (true);

drop policy if exists months_tl_write on public.months;
create policy months_tl_write on public.months
  for all to authenticated
  using (public.is_tl()) with check (public.is_tl());

-- ---------- assignments: RM reads own, TL reads/writes all ----------
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments
  for select to authenticated
  using (rm_id = auth.uid() or public.is_tl());

drop policy if exists assignments_tl_write on public.assignments;
create policy assignments_tl_write on public.assignments
  for all to authenticated
  using (public.is_tl()) with check (public.is_tl());

-- ---------- submissions: RM owns their row, TL sees/corrects all ----------
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
  for select to authenticated
  using (rm_id = auth.uid() or public.is_tl());

drop policy if exists submissions_rm_insert on public.submissions;
create policy submissions_rm_insert on public.submissions
  for insert to authenticated
  with check (rm_id = auth.uid() or public.is_tl());

drop policy if exists submissions_rm_update on public.submissions;
create policy submissions_rm_update on public.submissions
  for update to authenticated
  using (rm_id = auth.uid() or public.is_tl())
  with check (rm_id = auth.uid() or public.is_tl());

drop policy if exists submissions_tl_delete on public.submissions;
create policy submissions_tl_delete on public.submissions
  for delete to authenticated using (public.is_tl());

-- ---------- certifications ----------
drop policy if exists certs_select on public.certifications;
create policy certs_select on public.certifications
  for select to authenticated
  using (rm_id = auth.uid() or public.is_tl());

drop policy if exists certs_write on public.certifications;
create policy certs_write on public.certifications
  for all to authenticated
  using (rm_id = auth.uid() or public.is_tl())
  with check (rm_id = auth.uid() or public.is_tl());

-- ---------- coaching notes: TL only, both directions ----------
drop policy if exists notes_tl_only on public.coaching_notes;
create policy notes_tl_only on public.coaching_notes
  for all to authenticated
  using (public.is_tl()) with check (public.is_tl());

-- ---------- indexes ----------
create index if not exists idx_submissions_month on public.submissions(month_id);
create index if not exists idx_assignments_month on public.assignments(month_id);
create index if not exists idx_profiles_role on public.profiles(role) where active;
