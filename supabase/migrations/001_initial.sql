-- ============================================================
-- Tax Pro Hub University — Supabase Schema
-- Migration: 001_initial
-- Run: supabase db push  OR  paste in Supabase SQL editor
-- ============================================================

-- ── Enable UUID extension ─────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles (extends Supabase auth.users) ───────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  role         text not null default 'user' check (role in ('admin','preparer','client','viewer')),
  phone        text,
  avatar_url   text,
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role','user'));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Contacts ─────────────────────────────────────────────
create table if not exists public.contacts (
  id             uuid primary key default uuid_generate_v4(),
  owner_id       uuid references auth.users(id) on delete set null,
  first_name     text,
  last_name      text,
  email          text,
  phone          text,
  company        text,
  address        text,
  city           text,
  state          text,
  zip            text,
  tags           text[] default '{}',
  status         text default 'active' check (status in ('active','inactive','deleted')),
  lead_score     int default 0,
  source         text,
  notes          text,
  custom_fields  jsonb default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.contacts enable row level security;
create policy "Owners manage contacts" on public.contacts for all using (auth.uid() = owner_id);
create index if not exists contacts_owner_idx on public.contacts(owner_id);
create index if not exists contacts_email_idx on public.contacts(email);

-- ── Deals / Pipeline ─────────────────────────────────────
create table if not exists public.deals (
  id           uuid primary key default uuid_generate_v4(),
  contact_id   uuid references public.contacts(id) on delete cascade,
  owner_id     uuid references auth.users(id) on delete set null,
  title        text not null,
  stage        text not null default 'new',
  pipeline_id  text,
  value        numeric(12,2) default 0,
  probability  int default 0 check (probability between 0 and 100),
  close_date   date,
  notes        text,
  status       text default 'open' check (status in ('open','won','lost')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.deals enable row level security;
create policy "Owners manage deals" on public.deals for all using (auth.uid() = owner_id);

-- ── Appointments ─────────────────────────────────────────
create table if not exists public.appointments (
  id           uuid primary key default uuid_generate_v4(),
  contact_id   uuid references public.contacts(id) on delete set null,
  owner_id     uuid references auth.users(id) on delete set null,
  title        text not null,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  location     text,
  notes        text,
  status       text default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  reminder_sent boolean default false,
  created_at   timestamptz not null default now()
);
alter table public.appointments enable row level security;
create policy "Owners manage appointments" on public.appointments for all using (auth.uid() = owner_id);

-- ── Campaigns ────────────────────────────────────────────
create table if not exists public.campaigns (
  id             uuid primary key default uuid_generate_v4(),
  owner_id       uuid references auth.users(id) on delete set null,
  name           text not null,
  type           text not null check (type in ('sms','email','sequence')),
  status         text default 'draft' check (status in ('draft','active','paused','completed')),
  message        text,
  subject        text,
  schedule_at    timestamptz,
  sent_count     int default 0,
  open_count     int default 0,
  click_count    int default 0,
  reply_count    int default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.campaigns enable row level security;
create policy "Owners manage campaigns" on public.campaigns for all using (auth.uid() = owner_id);

-- ── Campaign Sends (log) ──────────────────────────────────
create table if not exists public.campaign_sends (
  id           uuid primary key default uuid_generate_v4(),
  campaign_id  uuid references public.campaigns(id) on delete cascade,
  contact_id   uuid references public.contacts(id) on delete set null,
  status       text default 'sent' check (status in ('sent','failed','bounced','opened','clicked')),
  sid          text,
  sent_at      timestamptz not null default now()
);
create index if not exists campaign_sends_campaign_idx on public.campaign_sends(campaign_id);

-- ── Workflows ─────────────────────────────────────────────
create table if not exists public.workflows (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid references auth.users(id) on delete set null,
  name         text not null,
  trigger_type text not null,
  status       text default 'active' check (status in ('active','paused')),
  steps        jsonb not null default '[]',
  run_count    int default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.workflows enable row level security;
create policy "Owners manage workflows" on public.workflows for all using (auth.uid() = owner_id);

-- ── Conversations / SMS Threads ───────────────────────────
create table if not exists public.conversations (
  id           uuid primary key default uuid_generate_v4(),
  contact_id   uuid references public.contacts(id) on delete cascade,
  owner_id     uuid references auth.users(id) on delete set null,
  channel      text not null check (channel in ('sms','email','call','chat')),
  last_message text,
  unread_count int default 0,
  updated_at   timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "Owners manage conversations" on public.conversations for all using (auth.uid() = owner_id);

create table if not exists public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  direction       text not null check (direction in ('inbound','outbound')),
  body            text not null,
  sid             text,
  status          text default 'delivered',
  sent_at         timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id);

-- ── Subscriptions ─────────────────────────────────────────
create table if not exists public.subscriptions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade unique,
  stripe_customer   text,
  stripe_sub_id     text,
  plan              text default 'free' check (plan in ('free','starter','growth','enterprise')),
  status            text default 'trialing' check (status in ('trialing','active','past_due','cancelled')),
  trial_ends_at     timestamptz,
  current_period_end timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "Users read own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- ── Preparers / Payouts ───────────────────────────────────
create table if not exists public.preparers (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid references auth.users(id) on delete set null,
  owner_id             uuid references auth.users(id) on delete cascade,
  name                 text not null,
  email                text,
  phone                text,
  stripe_account_id    text,
  commission_rate      numeric(5,2) default 30.00,
  total_earned_cents   bigint default 0,
  total_paid_cents     bigint default 0,
  status               text default 'active',
  created_at           timestamptz not null default now()
);
alter table public.preparers enable row level security;
create policy "Owners manage preparers" on public.preparers for all using (auth.uid() = owner_id);

create table if not exists public.payouts (
  id                   uuid primary key default uuid_generate_v4(),
  preparer_id          uuid references public.preparers(id) on delete set null,
  deal_id              uuid,
  amount_cents         bigint not null,
  status               text default 'pending' check (status in ('pending','approved','paid','failed')),
  stripe_transfer_id   text,
  note                 text,
  created_at           timestamptz not null default now(),
  processed_at         timestamptz
);
create index if not exists payouts_preparer_idx on public.payouts(preparer_id);

-- ── Documents ─────────────────────────────────────────────
create table if not exists public.documents (
  id           uuid primary key default uuid_generate_v4(),
  contact_id   uuid references public.contacts(id) on delete set null,
  owner_id     uuid references auth.users(id) on delete set null,
  name         text not null,
  type         text,
  r2_key       text,
  size_bytes   bigint,
  tax_year     int,
  status       text default 'pending' check (status in ('pending','processing','ready','error')),
  ocr_text     text,
  ai_summary   text,
  created_at   timestamptz not null default now()
);
alter table public.documents enable row level security;
create policy "Owners manage documents" on public.documents for all using (auth.uid() = owner_id);

-- ── Notifications ─────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text,
  action_url   text,
  read         boolean default false,
  created_at   timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications for all using (auth.uid() = user_id);
create index if not exists notifs_user_idx on public.notifications(user_id, read);
