-- Create a subscriptions table so users peuvent s'abonner à d'autres profils.

create table if not exists subscriptions (
  subscriber_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (subscriber_id, target_id)
);

create index if not exists subscriptions_target_id_idx on subscriptions (target_id);
