create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  model_id text not null default 'vurenn',
  project_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null
    references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool', 'status')),
  content text not null default '',
  status text not null
    check (status in ('pending', 'streaming', 'completed', 'stopped', 'failed')),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
create index if not exists messages_user_idx on public.messages (user_id);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null default 'free'
    check (plan_id in ('free', 'pro', 'premier')),
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  occupation text not null default '',
  goals text[] not null default '{}'::text[],
  response_style text not null default 'balanced',
  onboarding_completed boolean not null default false,
  onboarding_skipped boolean not null default false,
  security_prompt_dismissed boolean not null default false,
  camera_unlock_enabled boolean not null default false,
  limited_test_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists limited_test_mode boolean not null default false;

create table if not exists public.credit_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 2000 check (balance >= 0),
  lifetime_granted integer not null default 2000 check (lifetime_granted >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  event_type text not null,
  feature_id text,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_created_idx
  on public.credit_ledger (user_id, created_at desc);

create table if not exists public.credit_purchases (
  stripe_session_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id text not null check (pack_id in ('credits_50', 'credits_100')),
  credits integer not null check (credits > 0),
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.uploaded_files (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mime_type text not null,
  size integer not null check (size > 0),
  created_at timestamptz not null default now()
);

create index if not exists uploaded_files_user_created_idx
  on public.uploaded_files (user_id, created_at desc);

alter table public.uploaded_files enable row level security;
revoke all on public.uploaded_files from public, anon, authenticated;
grant select, insert, delete on public.uploaded_files to service_role;

alter table public.credit_accounts alter column balance set default 2000;
alter table public.credit_accounts alter column lifetime_granted set default 2000;

do $$
begin
  if not exists (
    select 1 from public.app_settings where key = 'credit_scale_v2'
  ) then
    update public.credit_accounts
    set balance = balance * 100,
        lifetime_granted = lifetime_granted * 100,
        lifetime_spent = lifetime_spent * 100;
    update public.credit_ledger
    set delta = delta * 100,
        balance_after = balance_after * 100;
    update public.credit_purchases set credits = credits * 100;
    insert into public.app_settings (key, value)
    values ('credit_scale_v2', '{"factor":100,"welcome_credits":2000}'::jsonb);
  end if;
end;
$$;

insert into public.app_settings (key, value)
values ('construction_mode', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;

create or replace function public.initialize_vurenn_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  insert into public.credit_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.credit_ledger (
    user_id, delta, balance_after, event_type, feature_id, idempotency_key
  )
  values (new.id, 2000, 2000, 'welcome_grant', 'signup', 'welcome:' || new.id)
  on conflict (idempotency_key) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_vurenn on auth.users;
create trigger on_auth_user_created_vurenn
  after insert on auth.users
  for each row execute procedure public.initialize_vurenn_user();

insert into public.profiles (user_id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
on conflict (user_id) do nothing;

insert into public.credit_accounts (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.credit_ledger (
  user_id, delta, balance_after, event_type, feature_id, idempotency_key
)
select id, 2000, 2000, 'welcome_grant', 'signup', 'welcome:' || id
from auth.users
on conflict (idempotency_key) do nothing;

create or replace function public.spend_vurenn_credits(
  p_user_id uuid,
  p_amount integer,
  p_feature_id text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  next_balance integer;
  existing_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  select balance_after into existing_balance
  from public.credit_ledger
  where idempotency_key = p_idempotency_key
    and user_id = p_user_id;
  if found then
    return existing_balance;
  end if;

  update public.credit_accounts
  set balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = now()
  where user_id = p_user_id and balance >= p_amount
  returning balance into next_balance;

  if next_balance is null then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.credit_ledger (
    user_id, delta, balance_after, event_type, feature_id,
    idempotency_key, metadata
  ) values (
    p_user_id, -p_amount, next_balance, 'usage', p_feature_id,
    p_idempotency_key, coalesce(p_metadata, '{}'::jsonb)
  );
  return next_balance;
end;
$$;

create or replace function public.grant_vurenn_credits(
  p_user_id uuid,
  p_amount integer,
  p_feature_id text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  next_balance integer;
  existing_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  select balance_after into existing_balance
  from public.credit_ledger
  where idempotency_key = p_idempotency_key
    and user_id = p_user_id;
  if found then
    return existing_balance;
  end if;

  insert into public.credit_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  update public.credit_accounts
  set balance = balance + p_amount,
      lifetime_granted = lifetime_granted + p_amount,
      updated_at = now()
  where user_id = p_user_id
  returning balance into next_balance;

  insert into public.credit_ledger (
    user_id, delta, balance_after, event_type, feature_id,
    idempotency_key, metadata
  ) values (
    p_user_id, p_amount, next_balance, 'purchase', p_feature_id,
    p_idempotency_key, coalesce(p_metadata, '{}'::jsonb)
  );
  return next_balance;
end;
$$;

create or replace function public.refund_vurenn_credits(
  p_user_id uuid,
  p_amount integer,
  p_feature_id text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  next_balance integer;
  existing_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  select balance_after into existing_balance
  from public.credit_ledger
  where idempotency_key = p_idempotency_key
    and user_id = p_user_id;
  if found then
    return existing_balance;
  end if;

  update public.credit_accounts
  set balance = balance + p_amount,
      lifetime_spent = greatest(0, lifetime_spent - p_amount),
      updated_at = now()
  where user_id = p_user_id
  returning balance into next_balance;

  if next_balance is null then
    raise exception 'Credit account not found';
  end if;

  insert into public.credit_ledger (
    user_id, delta, balance_after, event_type, feature_id,
    idempotency_key, metadata
  ) values (
    p_user_id, p_amount, next_balance, 'refund', p_feature_id,
    p_idempotency_key, coalesce(p_metadata, '{}'::jsonb)
  );
  return next_balance;
end;
$$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.credit_purchases enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Users manage their conversations" on public.conversations;
create policy "Users manage their conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their messages" on public.messages;
create policy "Users manage their messages"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read their subscription" on public.subscriptions;
create policy "Users read their subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users manage their profile" on public.profiles;
create policy "Users manage their profile"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read their credit account" on public.credit_accounts;
create policy "Users read their credit account"
  on public.credit_accounts for select
  using (auth.uid() = user_id);

drop policy if exists "Users read their credit ledger" on public.credit_ledger;
create policy "Users read their credit ledger"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

drop policy if exists "Users read their credit purchases" on public.credit_purchases;
create policy "Users read their credit purchases"
  on public.credit_purchases for select
  using (auth.uid() = user_id);

revoke all on public.conversations from anon;
revoke all on public.messages from anon;
revoke all on public.subscriptions from anon;
revoke all on public.profiles from anon;
revoke all on public.credit_accounts from anon;
revoke all on public.credit_ledger from anon;
revoke all on public.credit_purchases from anon;
revoke all on public.app_settings from anon, authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.credit_accounts to authenticated;
grant select on public.credit_ledger to authenticated;
grant select on public.credit_purchases to authenticated;

revoke all on function public.spend_vurenn_credits(
  uuid, integer, text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.grant_vurenn_credits(
  uuid, integer, text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.refund_vurenn_credits(
  uuid, integer, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.spend_vurenn_credits(
  uuid, integer, text, text, jsonb
) to service_role;
grant execute on function public.grant_vurenn_credits(
  uuid, integer, text, text, jsonb
) to service_role;
grant execute on function public.refund_vurenn_credits(
  uuid, integer, text, text, jsonb
) to service_role;
