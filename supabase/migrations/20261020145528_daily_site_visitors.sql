begin;
create schema if not exists darasax_analytics_private;
revoke all on schema darasax_analytics_private from public,anon,authenticated;
create table darasax_analytics_private.config (
 singleton boolean primary key default true check(singleton),
 secret_hash text not null check(secret_hash ~ '^[0-9a-f]{64}$')
);
create table darasax_analytics_private.visitor_keys (
 day date not null, visitor_hash text not null check(visitor_hash ~ '^[0-9a-f]{64}$'),
 primary key(day,visitor_hash)
);
revoke all on all tables in schema darasax_analytics_private from public,anon,authenticated;
create table public.site_daily_visitors (
 day date primary key, visitors bigint not null default 0 check(visitors>=0)
);
alter table public.site_daily_visitors enable row level security;
revoke all on public.site_daily_visitors from public,anon,authenticated;
grant select on public.site_daily_visitors to authenticated;
create policy "Admins read daily site totals" on public.site_daily_visitors
 for select to authenticated using(public.is_admin());

-- Only the server holding the tracking secret can record a visitor. Raw IPs
-- never reach the database; the token is stored only as a SHA-256 digest.
create function public.record_site_visit(tracking_secret text,visit_hash text,visit_day date)
returns void language plpgsql security definer set search_path=pg_catalog,public
as $$ declare expected text; inserted integer; today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date; begin
 select secret_hash into expected from darasax_analytics_private.config where singleton;
 if tracking_secret is null or length(tracking_secret) not between 32 and 128 or expected is null
  or encode(sha256(convert_to(tracking_secret,'UTF8')),'hex') is distinct from expected
 then raise exception 'Not authorized' using errcode='42501'; end if;
 if visit_day is distinct from today or visit_hash is null or visit_hash !~ '^[0-9a-f]{64}$'
 then raise exception 'Invalid visit'; end if;
 insert into darasax_analytics_private.visitor_keys(day,visitor_hash) values(today,visit_hash) on conflict do nothing;
 get diagnostics inserted = row_count;
 if inserted=1 then
  insert into public.site_daily_visitors(day,visitors) values(today,1)
  on conflict(day) do update set visitors=site_daily_visitors.visitors+1;
  delete from darasax_analytics_private.visitor_keys where day<today-30;
 end if;
end; $$;
revoke all on function public.record_site_visit(text,text,date) from public,anon,authenticated;
grant execute on function public.record_site_visit(text,text,date) to anon,authenticated;

create function public.site_visitor_summary() returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public
as $$ declare today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date; result jsonb; begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('day',d::date,'visitors',coalesce(v.visitors,0)) order by d)
 into result from generate_series(today-13,today,interval '1 day') d
 left join public.site_daily_visitors v on v.day=d::date;
 return result;
end; $$;
revoke all on function public.site_visitor_summary() from public,anon,authenticated;
grant execute on function public.site_visitor_summary() to authenticated;
commit;
