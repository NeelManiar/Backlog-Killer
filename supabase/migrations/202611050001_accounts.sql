-- User-owned, versioned documents preserve the existing offline state model.
create table public.study_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.study_accounts enable row level security;
alter table public.study_accounts force row level security;
create policy own_read on public.study_accounts for select to authenticated
  using ((select auth.uid()) = user_id);
-- All writes go through compare-and-swap; direct DML is intentionally forbidden.
revoke all on public.study_accounts from anon, authenticated;
grant select on public.study_accounts to authenticated;
create function public.save_study(expected_revision bigint, new_document jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); result bigint;
begin
  if caller is null or not exists (select 1 from auth.users where id=caller) then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if jsonb_typeof(new_document) <> 'object' or octet_length(new_document::text) > 2000000 then
    raise exception 'Invalid document';
  end if;
  if expected_revision=0 then
    insert into public.study_accounts(user_id,document) values(caller,new_document)
      on conflict do nothing returning revision into result;
  else
    update public.study_accounts set document=new_document, revision=revision+1, updated_at=now()
      where user_id=caller and revision=expected_revision returning revision into result;
  end if;
  if result is null then raise exception 'Sync conflict' using errcode='40001'; end if;
  return result;
end $$;
revoke all on function public.save_study(bigint,jsonb) from public, anon;
grant execute on function public.save_study(bigint,jsonb) to authenticated;

-- Fresh email-OTP sign-in required before irreversible account deletion.
create function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null or not exists (
    select 1 from auth.users where id=caller and last_sign_in_at > now() - interval '10 minutes'
  ) or not exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) as proof
    where proof->>'method'='otp'
      and (proof->>'timestamp')::numeric between extract(epoch from now())-600 and extract(epoch from now())+30
  ) then raise exception 'Sign in again before deleting your account' using errcode='42501'; end if;
  delete from auth.users where id=caller;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
