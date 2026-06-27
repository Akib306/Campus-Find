-- Align the database schema and RLS policies with the claim and messaging flows.

alter table public.posts
  add column if not exists claimed_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists claimed_at timestamptz;

create index if not exists idx_posts_claimed_by_user_id
  on public.posts (claimed_by_user_id);

alter table public.conversations
  add column if not exists claim_code text,
  add column if not exists item_picked_up boolean not null default false,
  add column if not exists picked_up_at timestamptz;

alter table public.conversations
  alter column arranged_time type text using arranged_time::text;

alter table public.messages
  add column if not exists private boolean not null default false;

alter table public.messages
  drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint messages_message_type_check
  check (
    message_type in (
      'claim_initial',
      'suggestion',
      'confirmation',
      'status_update',
      'share_contact',
      'share_email',
      'system'
    )
  );

create table if not exists public.conversation_claim_codes (
  conversation_id uuid primary key references public.conversations(id) on delete cascade,
  claim_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_claim_codes_six_digits
    check (claim_code ~ '^[0-9]{6}$')
);

alter table public.conversation_claim_codes
  drop constraint if exists conversation_claim_codes_six_digits;

alter table public.conversation_claim_codes
  alter column claim_code type text using lpad(claim_code::text, 6, '0');

delete from public.conversation_claim_codes
where claim_code !~ '^[0-9]{6}$';

alter table public.conversation_claim_codes
  add constraint conversation_claim_codes_six_digits
  check (claim_code ~ '^[0-9]{6}$');

alter table public.conversation_claim_codes enable row level security;

insert into public.conversation_claim_codes (conversation_id, claim_code)
select id, lpad(claim_code::text, 6, '0')
from public.conversations
where claim_code is not null
  and claim_code::text ~ '^[0-9]{1,6}$'
on conflict (conversation_id) do update
set claim_code = excluded.claim_code,
    updated_at = now();

alter table public.conversations
  drop column if exists claim_code;

alter table public.posts
  drop column if exists claim_code;

drop policy if exists "Users can update conversations they are part of" on public.conversations;
create policy "Users can update conversations they are part of"
  on public.conversations for update
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "Users can delete conversations they are part of" on public.conversations;

drop policy if exists "Users can view messages in their conversations" on public.messages;
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.user1_id = auth.uid() or conversations.user2_id = auth.uid())
    )
    and (messages.private is not true or messages.sender_id = auth.uid())
  );

drop policy if exists "Users can update messages in their conversations" on public.messages;
create policy "Users can update messages in their conversations"
  on public.messages for update
  using (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.user1_id = auth.uid() or conversations.user2_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.user1_id = auth.uid() or conversations.user2_id = auth.uid())
    )
  );

drop policy if exists "Authenticated users can claim open posts" on public.posts;
drop policy if exists "Claimants can release their pending claims" on public.posts;

create or replace function public.claim_post(
  p_post_id uuid,
  p_item_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimant_id uuid := auth.uid();
begin
  if v_claimant_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_claimant_id = p_item_owner_id then
    raise exception 'You cannot claim your own item';
  end if;

  update public.posts
  set
    claimed_by_user_id = v_claimant_id,
    claimed_at = now(),
    post_status = 'pending_claim'
  where id = p_post_id
    and user_id = p_item_owner_id
    and post_status = 'open'
    and claimed_by_user_id is null;

  if not found then
    raise exception 'This item has already been claimed';
  end if;
end;
$$;

create or replace function public.release_pending_claim(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimant_id uuid := auth.uid();
begin
  if v_claimant_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.posts
  set
    claimed_by_user_id = null,
    claimed_at = null,
    post_status = 'open'
  where id = p_post_id
    and claimed_by_user_id = v_claimant_id
    and post_status = 'pending_claim';
end;
$$;

create or replace function public.delete_empty_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.conversations c
  where c.id = p_conversation_id
    and (c.user1_id = v_user_id or c.user2_id = v_user_id)
    and not exists (
      select 1
      from public.messages m
      where m.conversation_id = c.id
    );
end;
$$;

create or replace function public.confirm_meeting(
  p_conversation_id uuid,
  p_meeting_details text,
  p_location text,
  p_time_slot text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_claim_code text := lpad(floor(random() * 1000000)::integer::text, 6, '0');
  v_confirmation_text text;
  v_code_message text;
  v_instruction_message text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(btrim(p_location), '') is null
    or nullif(btrim(p_time_slot), '') is null then
    raise exception 'Meeting details must include a location and time slot';
  end if;

  select *
  into v_conversation
  from public.conversations
  where id = p_conversation_id
    and (user1_id = v_user_id or user2_id = v_user_id);

  if not found then
    raise exception 'Could not find conversation';
  end if;

  if coalesce(v_conversation.item_picked_up, false) then
    raise exception 'This item has already been returned';
  end if;

  update public.conversations
  set
    arranged_location = p_location,
    arranged_time = p_time_slot,
    updated_at = now()
  where id = p_conversation_id;

  insert into public.conversation_claim_codes (conversation_id, claim_code)
  values (p_conversation_id, v_claim_code)
  on conflict (conversation_id) do update
  set claim_code = excluded.claim_code,
      updated_at = now();

  v_confirmation_text := 'Meeting confirmed' || chr(10) ||
    'Location: ' || p_location || chr(10) ||
    'Time: ' || p_time_slot;

  insert into public.messages (
    conversation_id,
    message_type,
    content,
    display_text,
    sender_id,
    is_read
  )
  values (
    p_conversation_id,
    'confirmation',
    p_meeting_details,
    v_confirmation_text,
    v_user_id,
    false
  );

  v_code_message := 'Your pickup code: ' || v_claim_code ||
    chr(10) || chr(10) ||
    'Give this 6-digit code to the finder when you meet to verify the return.';

  insert into public.messages (
    conversation_id,
    message_type,
    content,
    display_text,
    sender_id,
    is_read,
    private
  )
  values (
    p_conversation_id,
    'system',
    v_code_message,
    v_code_message,
    v_conversation.user2_id,
    false,
    true
  );

  v_instruction_message := 'Please ask the claimant for the pickup code when you meet and enter it in the app to confirm the return.';

  insert into public.messages (
    conversation_id,
    message_type,
    content,
    display_text,
    sender_id,
    is_read,
    private
  )
  values (
    p_conversation_id,
    'system',
    v_instruction_message,
    v_instruction_message,
    v_conversation.user1_id,
    false,
    true
  );
end;
$$;

drop function if exists public.get_claimant_pickup_code(uuid);

create or replace function public.get_claimant_pickup_code(p_conversation_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_claim_code text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select ccc.claim_code
  into v_claim_code
  from public.conversations c
  join public.conversation_claim_codes ccc
    on ccc.conversation_id = c.id
  where c.id = p_conversation_id
    and c.user2_id = v_user_id;

  return v_claim_code;
end;
$$;

create or replace function public.confirm_pickup(
  p_conversation_id uuid,
  p_entered_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_claim_code text;
  v_clean_entered_code text;
  v_completion_text text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_conversation
  from public.conversations
  where id = p_conversation_id;

  if not found then
    raise exception 'Conversation not found';
  end if;

  if v_conversation.user1_id <> v_user_id then
    raise exception 'Only the item owner can confirm pickup';
  end if;

  select claim_code
  into v_claim_code
  from public.conversation_claim_codes
  where conversation_id = p_conversation_id;

  if not found then
    raise exception 'Pickup code has not been created';
  end if;

  v_clean_entered_code := regexp_replace(coalesce(p_entered_code, ''), '\D', '', 'g');

  if v_clean_entered_code <> v_claim_code then
    raise exception 'Invalid pickup code';
  end if;

  update public.conversations
  set
    item_picked_up = true,
    picked_up_at = now(),
    status = 'completed',
    updated_at = now()
  where id = p_conversation_id;

  update public.posts
  set post_status = 'claimed'
  where id = v_conversation.post_id
    and user_id = v_user_id;

  if not found then
    raise exception 'Could not update post status';
  end if;

  v_completion_text := 'Verification completed. Item successfully returned.' ||
    chr(10) ||
    'Return confirmed at ' || to_char(now(), 'HH12:MI AM');

  insert into public.messages (
    conversation_id,
    message_type,
    content,
    display_text,
    sender_id,
    is_read
  )
  values (
    p_conversation_id,
    'system',
    v_completion_text,
    v_completion_text,
    v_user_id,
    false
  );
end;
$$;

revoke all on function public.claim_post(uuid, uuid) from public;
revoke all on function public.release_pending_claim(uuid) from public;
revoke all on function public.delete_empty_conversation(uuid) from public;
revoke all on function public.confirm_meeting(uuid, text, text, text) from public;
revoke all on function public.get_claimant_pickup_code(uuid) from public;
revoke all on function public.confirm_pickup(uuid, text) from public;
grant execute on function public.claim_post(uuid, uuid) to authenticated;
grant execute on function public.release_pending_claim(uuid) to authenticated;
grant execute on function public.delete_empty_conversation(uuid) to authenticated;
grant execute on function public.confirm_meeting(uuid, text, text, text) to authenticated;
grant execute on function public.get_claimant_pickup_code(uuid) to authenticated;
grant execute on function public.confirm_pickup(uuid, text) to authenticated;
