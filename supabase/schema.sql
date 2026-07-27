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

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;

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

revoke all on public.conversations from anon;
revoke all on public.messages from anon;
revoke all on public.subscriptions from anon;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select on public.subscriptions to authenticated;
