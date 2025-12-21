-- Adds no_ads and paid_at to profiles if absent
alter table if exists profiles add column if not exists no_ads boolean default false;
alter table if exists profiles add column if not exists paid_at timestamptz;
