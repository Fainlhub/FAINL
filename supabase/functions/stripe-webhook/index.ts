// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: npm imports are supported in Supabase Edge Runtime
import Stripe from "npm:stripe@^22";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY) console.error("STRIPE_SECRET_KEY is not set");
if (!STRIPE_WEBHOOK_SECRET) console.error("STRIPE_WEBHOOK_SECRET is not set");

const stripe = new Stripe(STRIPE_SECRET_KEY || "");
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY || "",
  authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ""}`,
  "Content-Type": "application/json",
};

const supabaseFetch = async (path: string, init: RequestInit = {}) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service env vars are not configured");
  }

  return await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...supabaseHeaders,
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
};

const startEventProcessing = async (event: Stripe.Event): Promise<boolean> => {
  const response = await supabaseFetch("stripe_webhook_events", {
    method: "POST",
    body: JSON.stringify({ id: event.id, type: event.type, status: "processing" }),
  });

  if (response.status === 409) {
    const existingResponse = await supabaseFetch(
      `stripe_webhook_events?id=eq.${event.id}&select=status,attempts`
    );
    if (!existingResponse.ok) {
      throw new Error(`Could not load webhook event ${event.id}: ${await existingResponse.text()}`);
    }

    const rows = await existingResponse.json();
    const existing = rows?.[0] as { status?: string; attempts?: number } | undefined;
    if (existing?.status === "processed") {
      return false;
    }

    const updateResponse = await supabaseFetch(`stripe_webhook_events?id=eq.${event.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "processing",
        attempts: (existing?.attempts || 1) + 1,
        error: null,
      }),
    });
    if (!updateResponse.ok) {
      throw new Error(`Could not retry webhook event ${event.id}: ${await updateResponse.text()}`);
    }
    return true;
  }

  if (!response.ok) {
    throw new Error(`Could not record webhook event ${event.id}: ${await response.text()}`);
  }

  return true;
};

const finishEventProcessing = async (
  event: Stripe.Event,
  status: "processed" | "failed",
  error?: string
) => {
  const response = await supabaseFetch(`stripe_webhook_events?id=eq.${event.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      error: error || null,
      processed_at: status === "processed" ? new Date().toISOString() : null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not mark webhook event ${event.id} as ${status}: ${await response.text()}`);
  }
};

const updateProfile = async (userId: string, patch: Record<string, unknown>) => {
  const response = await supabaseFetch(`user_profiles?id=eq.${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });

  if (!response.ok) {
    throw new Error(`Could not update user profile: ${await response.text()}`);
  }
};

const findProfileBySubscription = async (subscriptionId: string) => {
  const response = await supabaseFetch(
    `user_profiles?stripe_subscription_id=eq.${subscriptionId}&select=id,subscription_plan`
  );

  if (!response.ok) {
    throw new Error(`Could not find subscription profile: ${await response.text()}`);
  }

  const rows = await response.json();
  return rows?.[0] as { id: string; subscription_plan?: string } | undefined;
};

const recordCredits = async (
  userId: string,
  credits: number,
  reason: string,
  eventId: string,
  sessionId?: string | null,
  invoiceId?: string | null,
  metadata: Record<string, unknown> = {}
) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_stripe_credit`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({
      p_user_id: userId,
      p_delta: credits,
      p_reason: reason,
      p_stripe_event_id: eventId,
      p_stripe_session_id: sessionId,
      p_stripe_invoice_id: invoiceId,
      p_metadata: metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not record credits: ${await response.text()}`);
  }
};

const unixToIso = (value?: number | null) =>
  value ? new Date(value * 1000).toISOString() : null;

const handleCheckoutCompleted = async (event: Stripe.Event) => {
  const session = event.data.object as any;
  const metadata = session.metadata || {};
  const userId = metadata.user_id || session.client_reference_id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!userId) {
    throw new Error(`checkout.session.completed ${session.id} has no user_id`);
  }

  if (metadata.type === "credits") {
    const credits = Number(metadata.credits || 0);
    if (credits > 0) {
      await recordCredits(userId, credits, "stripe_credit_purchase", event.id, session.id, null, {
        checkout_session_id: session.id,
        stripe_customer_id: customerId,
      });
    }
  }

  if (metadata.type === "ad_free") {
    await updateProfile(userId, {
      stripe_customer_id: customerId,
      ad_free_lifetime: true,
    });
  }

  if (metadata.type === "subscription") {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    await updateProfile(userId, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: "active",
      subscription_plan: metadata.plan,
    });
  }
};

const handleInvoicePaid = async (event: Stripe.Event) => {
  const invoice = event.data.object as any;
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  if (!subscriptionId) return;

  let subscriptionDetails = invoice.subscription_details?.metadata || {};
  if (!subscriptionDetails.user_id || !subscriptionDetails.monthly_credits) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    subscriptionDetails = {
      ...subscription.metadata,
      ...subscriptionDetails,
    };
  }

  const profile = await findProfileBySubscription(subscriptionId);
  const userId = subscriptionDetails.user_id || profile?.id;
  const monthlyCredits = Number(subscriptionDetails.monthly_credits || 0);

  if (!userId || monthlyCredits <= 0) {
    return;
  }

  await recordCredits(userId, monthlyCredits, "stripe_subscription_invoice", event.id, null, invoice.id, {
    stripe_subscription_id: subscriptionId,
    billing_reason: invoice.billing_reason,
    plan: subscriptionDetails.plan || profile?.subscription_plan,
  });
};

const handleSubscriptionChanged = async (event: Stripe.Event) => {
  const subscription = event.data.object as any;
  const metadata = subscription.metadata || {};
  const userId = metadata.user_id || (await findProfileBySubscription(subscription.id))?.id;

  if (!userId) return;

  await updateProfile(userId, {
    stripe_subscription_id: subscription.id,
    stripe_customer_id:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    subscription_status: event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
    subscription_plan: metadata.plan,
    subscription_current_period_end: unixToIso(subscription.current_period_end),
  });
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature || "",
      STRIPE_WEBHOOK_SECRET || "",
      undefined,
      cryptoProvider
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return new Response(message, { status: 400 });
  }

  try {
    const shouldProcess = await startEventProcessing(event);
    if (!shouldProcess) {
      return json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event);
    } else if (event.type === "invoice.payment_succeeded") {
      await handleInvoicePaid(event);
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionChanged(event);
    }

    await finishEventProcessing(event, "processed");
    return json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error(message);
    await finishEventProcessing(event, "failed", message).catch((finishError) => {
      console.error(finishError instanceof Error ? finishError.message : finishError);
    });
    return json({ error: message }, 500);
  }
});
