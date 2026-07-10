-- Atomic credit deduction to prevent race conditions in concurrent session starts.
-- Returns a JSON object: { success, credits_remaining, total_turns_used }
-- Returns success=false (without error) when credits are 0 and no active subscription.

CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits   integer;
  v_turns     integer;
  v_lifetime  boolean;
BEGIN
  -- This privileged RPC may only mutate the caller's own profile.
  IF (SELECT auth.uid()) IS NULL OR (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'not authorized'
      USING ERRCODE = '42501';
  END IF;

  -- Lock the row for this user exclusively to prevent concurrent updates
  SELECT credits_remaining, total_turns_used, is_lifetime
    INTO v_credits, v_turns, v_lifetime
    FROM user_profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Lifetime users always get access
  IF v_lifetime THEN
    UPDATE user_profiles
       SET total_turns_used = total_turns_used + 1
     WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'credits_remaining', v_credits,
      'total_turns_used', v_turns + 1
    );
  END IF;

  -- Paid credit available — deduct one
  IF v_credits > 0 THEN
    UPDATE user_profiles
       SET credits_remaining = credits_remaining - 1,
           total_turns_used  = total_turns_used + 1
     WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'credits_remaining', v_credits - 1,
      'total_turns_used', v_turns + 1
    );
  END IF;

  -- No credits left
  RETURN jsonb_build_object('success', false, 'reason', 'insufficient_credits');
END;
$$;

-- Only authenticated users can call this function; the body enforces ownership.
REVOKE ALL ON FUNCTION public.deduct_credit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_credit(uuid) TO authenticated;
