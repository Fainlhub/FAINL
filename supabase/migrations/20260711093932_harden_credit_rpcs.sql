-- Supabase default privileges grant EXECUTE on new functions to anon; the
-- earlier REVOKE FROM PUBLIC did not cover that direct grant. Both RPCs
-- already reject anon callers in the body, this closes the surface entirely.

REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, integer) FROM anon;

-- Covering index for chat_messages.user_id (RLS predicate + FK cascade).
CREATE INDEX chat_messages_user_idx ON public.chat_messages (user_id);
