// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type ProductRequest =
  | { type: "credits"; count: number }
  | { type: "subscription"; plan: "starter" | "pro" }
  | { type: "ad_free" };

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.fainl.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const creditProducts = new Map<number, { label: string; amount: number }>([
  [1, { label: "1 Credit", amount: 299 }],
  [5, { label: "5 Credits", amount: 999 }],
  [10, { label: "10 Credits", amount: 1799 }],
  [30, { label: "30 Credits", amount: 4499 }],
  [100, { label: "100 Credits", amount: 11999 }],
]);

const subscriptionProducts = {
  starter: { label: "Starter abonnement", amount: 4999, credits: 50 },
  pro: { label: "Pro abonnement", amount: 21999, credits: 300 },
} as const;

const adFreeProduct = {
  label: "FAINL reclamevrij",
  amount: 999,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getUser = async (authorization: string) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase env vars are not configured");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization,
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
};

const appendLineItem = (
  params: URLSearchParams,
  label: string,
  amount: number,
  recurring = false
) => {
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "eur");
  params.append("line_items[0][price_data][unit_amount]", String(amount));
  params.append("line_items[0][price_data][product_data][name]", label);
  if (recurring) {
    params.append("line_items[0][price_data][recurring][interval]", "month");
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const authorization = req.headers.get("authorization") || "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Login required" }, 401);
    }

    const user = await getUser(authorization);
    if (!user?.id) {
      return json({ error: "Invalid session" }, 401);
    }

    const product = (await req.json()) as ProductRequest;
    const params = new URLSearchParams();
    const metadata: Record<string, string> = { user_id: user.id };
    const successUrl = `${SITE_URL}/payment-success?checkout_session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${SITE_URL}/tokens?payment_cancelled=true`;

    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("client_reference_id", user.id);
    params.append("allow_promotion_codes", "true");
    if (user.email) {
      params.append("customer_email", user.email);
    }

    if (product.type === "credits") {
      const creditProduct = creditProducts.get(product.count);
      if (!creditProduct) {
        return json({ error: "Unknown credit package" }, 400);
      }
      params.append("mode", "payment");
      appendLineItem(params, creditProduct.label, creditProduct.amount);
      metadata.type = "credits";
      metadata.credits = String(product.count);
    } else if (product.type === "subscription") {
      const subscriptionProduct = subscriptionProducts[product.plan];
      params.append("mode", "subscription");
      appendLineItem(params, subscriptionProduct.label, subscriptionProduct.amount, true);
      metadata.type = "subscription";
      metadata.plan = product.plan;
      metadata.monthly_credits = String(subscriptionProduct.credits);
      params.append("subscription_data[metadata][user_id]", user.id);
      params.append("subscription_data[metadata][type]", "subscription");
      params.append("subscription_data[metadata][plan]", product.plan);
      params.append("subscription_data[metadata][monthly_credits]", String(subscriptionProduct.credits));
    } else if (product.type === "ad_free") {
      params.append("mode", "payment");
      appendLineItem(params, adFreeProduct.label, adFreeProduct.amount);
      metadata.type = "ad_free";
    } else {
      return json({ error: "Unknown product type" }, 400);
    }

    for (const [key, value] of Object.entries(metadata)) {
      params.append(`metadata[${key}]`, value);
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return json({ error: data.error?.message || "Failed to create checkout session" }, 400);
    }

    return json({ checkoutUrl: data.url, sessionId: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return json({ error: message }, 400);
  }
});
