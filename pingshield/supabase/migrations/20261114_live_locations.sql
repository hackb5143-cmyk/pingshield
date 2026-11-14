-- Apply after 20260214_pingshield_init.sql. No public read/write access is granted.
alter table public.recovery_reports add column if not exists updated_at timestamptz not null default now();
alter table public.recovery_reports add column if not exists live_token_hash text;
alter table public.recovery_reports add column if not exists live_expires_at timestamptz;
alter table public.recovery_reports add column if not exists sharing_stopped_at timestamptz;

create or replace function public.submit_live_recovery_report(
  p_tag_code text, p_message text, p_finder_contact text, p_latitude double precision,
  p_longitude double precision, p_accuracy double precision, p_manual_location text,
  p_requester_hash text, p_token_hash text
) returns table(report_id uuid, reported_at timestamptz, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare saved record; expiry timestamptz := now() + interval '30 minutes';
begin
  if p_latitude is null or p_longitude is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_token_hash is null then
    raise exception 'invalid_location';
  end if;
  select * into saved from public.submit_recovery_report(p_tag_code,p_message,p_finder_contact,
    p_latitude,p_longitude,p_accuracy,p_manual_location,p_requester_hash);
  update public.recovery_reports set live_token_hash=p_token_hash, live_expires_at=expiry, updated_at=now() where id=saved.report_id;
  return query select saved.report_id, saved.reported_at, expiry;
end;
$$;

create or replace function public.update_recovery_location(
  p_report_id uuid, p_token_hash text, p_stop boolean,
  p_latitude double precision, p_longitude double precision, p_accuracy double precision
) returns void language plpgsql security definer set search_path = public as $$
declare entry public.recovery_reports%rowtype;
begin
  select * into entry from public.recovery_reports where id=p_report_id and live_token_hash=p_token_hash for update;
  if not found then raise exception 'invalid_session'; end if;
  if p_stop then
    update public.recovery_reports set sharing_stopped_at=coalesce(sharing_stopped_at,now()) where id=p_report_id;
    return;
  end if;
  if entry.sharing_stopped_at is not null or entry.live_expires_at is null or entry.live_expires_at <= now() then raise exception 'session_expired'; end if;
  if entry.updated_at > now() - interval '3 seconds' then raise exception 'update_rate'; end if;
  if p_latitude is null or p_longitude is null or not(p_latitude between -90 and 90) or not(p_longitude between -180 and 180) or (p_accuracy is not null and not(p_accuracy between 0 and 100000)) then raise exception 'invalid_location'; end if;
  update public.recovery_reports set latitude=p_latitude,longitude=p_longitude,accuracy=p_accuracy,updated_at=now() where id=p_report_id;
end;
$$;
revoke all on function public.submit_live_recovery_report(text,text,text,double precision,double precision,double precision,text,text,text) from public,anon,authenticated;
revoke all on function public.update_recovery_location(uuid,text,boolean,double precision,double precision,double precision) from public,anon,authenticated;
grant execute on function public.submit_live_recovery_report(text,text,text,double precision,double precision,double precision,text,text,text) to service_role;
grant execute on function public.update_recovery_location(uuid,text,boolean,double precision,double precision,double precision) to service_role;
