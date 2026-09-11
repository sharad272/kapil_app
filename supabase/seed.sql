-- Optional: open a first reporting month.
insert into public.months (id, label, sort_order, is_open)
values ('2026-04', 'Apr''26', 202604, true)
on conflict (id) do nothing;

-- Promote yourself to team lead AFTER you have signed in once.
-- update public.profiles set role = 'tl' where email = 'you@company.com';
