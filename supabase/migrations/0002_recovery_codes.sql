-- Recovery codes for username-only password reset (no email).
-- The hash is write-only for clients: users can set their own, but NO ONE can
-- read it back over the API. Only the service role (server, bypasses RLS) reads
-- it during a reset, so a leaked anon key can't be used to brute-force codes.

create table if not exists public.recovery_codes (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  hash       text not null,
  updated_at timestamptz not null default now()
);

alter table public.recovery_codes enable row level security;

-- Deliberately NO select policy → clients can never read the hash.
drop policy if exists "Set own recovery code" on public.recovery_codes;
create policy "Set own recovery code"
  on public.recovery_codes for insert with check (auth.uid() = user_id);

drop policy if exists "Update own recovery code" on public.recovery_codes;
create policy "Update own recovery code"
  on public.recovery_codes for update using (auth.uid() = user_id);

drop policy if exists "Delete own recovery code" on public.recovery_codes;
create policy "Delete own recovery code"
  on public.recovery_codes for delete using (auth.uid() = user_id);
