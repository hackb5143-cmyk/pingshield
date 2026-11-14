-- Run once in Supabase SQL editor. Browser roles receive no table access.
create extension if not exists pgcrypto;
create table if not exists public.demo_tags (
  code text primary key check (code ~ '^[A-Z0-9]{3,30}$'),
  item_name text not null,
  owner_alias text not null,
  active boolean not null default true
);
create table if not exists public.recovery_reports (
  id uuid primary key default gen_random_uuid(),
  tag_code text not null references public.demo_tags(code),
  message text not null check (char_length(message) between 3 and 1000),
  finder_contact text check (char_length(finder_contact) <= 120),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  accuracy double precision check (accuracy between 0 and 100000),
  manual_location text check (char_length(manual_location) <= 300),
  requester_hash text not null,
  created_at timestamptz not null default now(),
  constraint paired_coordinates check ((latitude is null) = (longitude is null)),
  constraint location_present check (latitude is not null or nullif(trim(manual_location), '') is not null)
);
create index if not exists recovery_reports_tag_time on public.recovery_reports(tag_code, created_at desc);
create index if not exists recovery_reports_rate on public.recovery_reports(requester_hash, created_at desc);
alter table public.demo_tags enable row level security;
alter table public.recovery_reports enable row level security;
revoke all on public.demo_tags, public.recovery_reports from anon, authenticated;

-- Atomic rate limit across serverless instances.
create or replace function public.submit_recovery_report(
  p_tag_code text, p_message text, p_finder_contact text,
  p_latitude double precision, p_longitude double precision,
  p_accuracy double precision, p_manual_location text, p_requester_hash text
) returns table(report_id uuid, reported_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare inserted public.recovery_reports%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_requester_hash, 0));
  if (select count(*) from public.recovery_reports
      where requester_hash = p_requester_hash and created_at > now() - interval '10 minutes') >= 6 then
    raise exception 'rate_limit' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.demo_tags where code = p_tag_code and active) then
    raise exception 'invalid_tag' using errcode = 'P0001';
  end if;
  insert into public.recovery_reports
    (tag_code, message, finder_contact, latitude, longitude, accuracy, manual_location, requester_hash)
  values
    (p_tag_code, p_message, p_finder_contact, p_latitude, p_longitude, p_accuracy, p_manual_location, p_requester_hash)
  returning * into inserted;
  return query select inserted.id, inserted.created_at;
end;
$$;
revoke all on function public.submit_recovery_report(text,text,text,double precision,double precision,double precision,text,text) from public, anon, authenticated;
grant execute on function public.submit_recovery_report(text,text,text,double precision,double precision,double precision,text,text) to service_role;

insert into public.demo_tags (code, item_name, owner_alias)
values ('DEMO001', 'MacBook Pro 16 (Space Black)', 'Alex R.')
on conflict (code) do update set item_name = excluded.item_name, owner_alias = excluded.owner_alias, active = true;
