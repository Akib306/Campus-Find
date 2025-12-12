begin;

-- When an auth user is deleted, profiles.id is deleted via ON DELETE CASCADE.
-- Ensure messaging tables don't block that cascade.

-- conversations.user1_id -> profiles(id)
alter table if exists public.conversations
  drop constraint if exists conversations_user1_id_fkey;

alter table public.conversations
  add constraint conversations_user1_id_fkey
  foreign key (user1_id)
  references public.profiles(id)
  on delete cascade
  on update cascade;

-- conversations.user2_id -> profiles(id)
alter table if exists public.conversations
  drop constraint if exists conversations_user2_id_fkey;

alter table public.conversations
  add constraint conversations_user2_id_fkey
  foreign key (user2_id)
  references public.profiles(id)
  on delete cascade
  on update cascade;

-- messages.sender_id -> profiles(id)
-- If messages ever outlive a conversation (or other constraints are added later),
-- don't let sender deletion block profile deletion.
alter table if exists public.messages
  drop constraint if exists messages_sender_id_fkey;

alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id)
  references public.profiles(id)
  on delete set null
  on update cascade;

commit;
