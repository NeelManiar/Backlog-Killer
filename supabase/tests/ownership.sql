-- Run after migrations. Synthetic identities; transaction always rolls back.
begin;
insert into auth.users(id,last_sign_in_at) values
 ('11111111-1111-1111-1111-111111111111',now()),
 ('22222222-2222-2222-2222-222222222222',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
select public.save_study(0,'{"chapters":[]}');
do $$ begin
 if (select count(*) from public.study_accounts)<>1 then raise exception 'Owner cannot read';end if;
 begin perform public.save_study(0,'{}');raise exception 'Duplicate write accepted';exception when serialization_failure then null;end;
 begin insert into public.study_accounts(user_id,document) values('22222222-2222-2222-2222-222222222222','{}');raise exception 'Direct DML allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
do $$ begin
 if (select count(*) from public.study_accounts)<>0 then raise exception 'Cross-account read leaked';end if;
 begin perform public.save_study(1,'{}');raise exception 'Cross-user revision accepted';exception when serialization_failure then null;end;
end $$;
select public.save_study(0,'{"owner":"B"}');
select public.save_study(1,'{"owner":"B","updated":true}');
do $$ begin
 begin perform public.save_study(1,'{}');raise exception 'Stale revision accepted';exception when serialization_failure then null;end;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 begin perform public.save_study(0,'{}');raise exception 'Anonymous write allowed';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.study_accounts;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
update auth.users set last_sign_in_at=now()-interval '1 hour' where id='22222222-2222-2222-2222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
do $$ begin
 begin perform public.delete_my_account();raise exception 'Stale login deleted account';exception when insufficient_privilege then null;end;
end $$;
reset role;
update auth.users set last_sign_in_at=now() where id='22222222-2222-2222-2222-222222222222';
set local role authenticated;
-- A fresh sign-in on another session must not authorize an old token to delete.
do $$ begin
 begin perform public.delete_my_account();raise exception 'Token without recent OTP deleted account';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now()))))::text,true);
select public.delete_my_account();
do $$ begin
 if exists(select 1 from public.study_accounts) then raise exception 'Deleted account data remains';end if;
 begin perform public.save_study(0,'{}');raise exception 'Deleted identity recreated data';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.study_accounts)<>1 then raise exception 'Deletion affected another user';end if;
end $$;
rollback;
