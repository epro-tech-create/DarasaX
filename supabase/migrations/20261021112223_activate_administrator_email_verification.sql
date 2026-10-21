-- Apply only after the administrator verification UI is deployed and checked.
begin;
update private.admin_security_policy set enabled=true where id;
commit;
