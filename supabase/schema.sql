-- ==============================================================================
-- SUNNYBITE RESTAURANT — COMPLETE SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this entire script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).
-- It creates all tables, indexes, triggers, Row Level Security (RLS) policies,
-- and configures the `site-media` storage bucket.
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ADMINS TABLE (Role-Based Access Control)
-- ------------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz default now()
);

-- Index for speedy admin status lookups
create index if not exists idx_admins_user_id on public.admins(user_id);

-- Helper function to check if current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid()
  );
$$;

-- Helper function to check if current user is an owner admin
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid() and role = 'owner'
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. SITE SETTINGS TABLE (Brand, Contact, Stats, Ordering Flags, Accents)
-- ------------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz default now(),
  updated_by text
);

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_categories_sort on public.categories(sort_order asc);

-- ------------------------------------------------------------------------------
-- 4. MENU ITEMS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  slug text not null,
  category_id text not null references public.categories(id) on delete cascade,
  price numeric(10,2) not null,
  description text default '',
  short_description text default '',
  image_url text default '',
  tags text[] default '{}',
  dietary text[] default '{}',
  badge text default null,
  popular boolean not null default false,
  available boolean not null default true, -- "Sold Out" toggle
  aliases text[] default '{}',            -- Natural language synonyms for AI bot
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_menu_items_sort on public.menu_items(sort_order asc);
create index if not exists idx_menu_items_available on public.menu_items(available);

-- ------------------------------------------------------------------------------
-- 5. PAGE CONTENT TABLE (Every headline, paragraph, card, story, tip)
-- ------------------------------------------------------------------------------
create table if not exists public.page_content (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page in ('home', 'menu', 'about', 'contact', 'footer', 'privacy', 'terms')),
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz default now(),
  updated_by text,
  constraint uq_page_section unique (page, section_key)
);

create index if not exists idx_page_content_lookup on public.page_content(page, section_key);

-- ------------------------------------------------------------------------------
-- 6. CHATBOT FAQ TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.chatbot_faq (
  id uuid primary key default gen_random_uuid(),
  keywords text[] default '{}',
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 7. MEDIA LIBRARY TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  path text not null,
  alt_text text not null default '',
  width integer,
  height integer,
  size integer,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 8. INBOX: MESSAGES TABLE (Contact Form)
-- ------------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text default '',
  subject text default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'seen', 'confirmed', 'done')),
  honeypot text default '', -- Spam protection: must remain empty
  ip_address text default null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_created on public.messages(created_at desc);

-- ------------------------------------------------------------------------------
-- 9. INBOX: RESERVATIONS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  guests integer not null default 2,
  date date not null,
  time text not null,
  seating_area text default 'Indoor Dining',
  notes text default '',
  status text not null default 'new' check (status in ('new', 'seen', 'confirmed', 'done')),
  honeypot text default '',
  created_at timestamptz default now()
);

create index if not exists idx_reservations_created on public.reservations(created_at desc);

-- ------------------------------------------------------------------------------
-- 10. INBOX: SUBSCRIBERS TABLE (Foodie Club Newsletter)
-- ------------------------------------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  source text not null default 'footer_foodie_club',
  honeypot text default '',
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 11. INBOX: ORDERS TABLE (From Chatbot & Online Cart)
-- ------------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text default '',
  order_type text not null default 'Pickup' check (order_type in ('Pickup', 'Dine-in', 'Delivery')),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  payment_method text default 'Cash on Pickup',
  special_instructions text default '',
  source text default 'website_chat',
  status text not null default 'new' check (status in ('new', 'seen', 'confirmed', 'done', 'cancelled')),
  honeypot text default '',
  created_at timestamptz default now()
);

create index if not exists idx_orders_created on public.orders(created_at desc);

-- ------------------------------------------------------------------------------
-- 12. AUDIT LOG TABLE (Activity Tracking)
-- ------------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  entity_type text not null, -- 'menu_item', 'page_content', 'setting', etc.
  entity_id text,
  old_value jsonb default null,
  new_value jsonb default null,
  created_at timestamptz default now()
);

create index if not exists idx_audit_log_created on public.audit_log(created_at desc);

-- ------------------------------------------------------------------------------
-- 13. CONTENT VERSIONS TABLE (Restore History for Pages and Settings)
-- ------------------------------------------------------------------------------
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  page text,
  section_key text,
  setting_key text,
  content jsonb not null,
  changed_by text,
  created_at timestamptz default now()
);

create index if not exists idx_content_versions_page on public.content_versions(page, section_key, created_at desc);

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on every table
alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.page_content enable row level security;
alter table public.chatbot_faq enable row level security;
alter table public.media enable row level security;
alter table public.messages enable row level security;
alter table public.reservations enable row level security;
alter table public.subscribers enable row level security;
alter table public.orders enable row level security;
alter table public.audit_log enable row level security;
alter table public.content_versions enable row level security;

-- ------------------------------------------------------------------------------
-- POLICIES: ADMINS
-- ------------------------------------------------------------------------------
-- Authenticated users can read their own admin record to verify login
create policy "Admins can view their own record or all if admin"
  on public.admins for select
  using (auth.uid() = user_id or public.is_admin());

-- Only 'owner' can insert, update, or remove admins
create policy "Owners can manage admins"
  on public.admins for all
  using (public.is_owner())
  with check (public.is_owner());

-- ------------------------------------------------------------------------------
-- POLICIES: SITE SETTINGS
-- ------------------------------------------------------------------------------
create policy "Public can read public settings"
  on public.site_settings for select
  using (is_public = true or public.is_admin());

create policy "Admins can manage settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: CATEGORIES
-- ------------------------------------------------------------------------------
create policy "Public can view visible categories"
  on public.categories for select
  using (visible = true or public.is_admin());

create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: MENU ITEMS
-- ------------------------------------------------------------------------------
create policy "Public can view visible menu items"
  on public.menu_items for select
  using (visible = true or public.is_admin());

create policy "Admins can manage menu items"
  on public.menu_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: PAGE CONTENT
-- ------------------------------------------------------------------------------
create policy "Public can view visible page content"
  on public.page_content for select
  using (visible = true or public.is_admin());

create policy "Admins can manage page content"
  on public.page_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: CHATBOT FAQ
-- ------------------------------------------------------------------------------
create policy "Public can view visible chatbot FAQs"
  on public.chatbot_faq for select
  using (visible = true or public.is_admin());

create policy "Admins can manage chatbot FAQs"
  on public.chatbot_faq for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: MEDIA LIBRARY
-- ------------------------------------------------------------------------------
create policy "Public can view media library"
  on public.media for select
  using (true);

create policy "Admins can manage media"
  on public.media for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: MESSAGES (Contact Form)
-- Public can INSERT only (with spam honeypot check). Admin can SELECT/UPDATE/DELETE.
-- ------------------------------------------------------------------------------
create policy "Public can submit contact messages"
  on public.messages for insert
  with check (honeypot is null or honeypot = '');

create policy "Admins can view and manage messages"
  on public.messages for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: RESERVATIONS
-- Public can INSERT only (with honeypot check). Admin can SELECT/UPDATE/DELETE.
-- ------------------------------------------------------------------------------
create policy "Public can submit reservations"
  on public.reservations for insert
  with check (honeypot is null or honeypot = '');

create policy "Admins can view and manage reservations"
  on public.reservations for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: SUBSCRIBERS
-- Public can INSERT only (with honeypot check). Admin can SELECT/UPDATE/DELETE.
-- ------------------------------------------------------------------------------
create policy "Public can subscribe to newsletter"
  on public.subscribers for insert
  with check (honeypot is null or honeypot = '');

create policy "Admins can view and manage subscribers"
  on public.subscribers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: ORDERS
-- Public can INSERT only (with honeypot check). Admin can SELECT/UPDATE/DELETE.
-- ------------------------------------------------------------------------------
create policy "Public can submit orders"
  on public.orders for insert
  with check (honeypot is null or honeypot = '');

create policy "Admins can view and manage orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLICIES: AUDIT LOG & CONTENT VERSIONS
-- Strictly Admin Only
-- ------------------------------------------------------------------------------
create policy "Admins can view and insert audit logs"
  on public.audit_log for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view and manage content versions"
  on public.content_versions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- 15. STORAGE BUCKET CONFIGURATION (`site-media`)
-- ==============================================================================
-- Insert the bucket into storage.buckets if not existing
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'];

-- Storage RLS: Public can view images
create policy "Public can view site-media files"
  on storage.objects for select
  using (bucket_id = 'site-media');

-- Storage RLS: Only Admins can upload/modify/delete files
create policy "Admins can upload files to site-media"
  on storage.objects for insert
  with check (bucket_id = 'site-media' and public.is_admin());

create policy "Admins can update files in site-media"
  on storage.objects for update
  using (bucket_id = 'site-media' and public.is_admin());

create policy "Admins can delete files in site-media"
  on storage.objects for delete
  using (bucket_id = 'site-media' and public.is_admin());
