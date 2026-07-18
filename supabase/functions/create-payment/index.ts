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

const allowedOrigins = new Set(
  (
    Deno.env.get("ALLOWED_ORIGINS") ||
    "https://fainl.com,https://www.fainl.com,http://localhost:3000,http://localhost:3001,http://localhost:4173,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:4173,http://127.0.0.1:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const corsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://fainl.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
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

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
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
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const authorization = req.headers.get("authorization") || "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return json(req, { error: "Login required" }, 401);
    }

    const user = await getUser(authorization);
    if (!user?.id) {
      return json(req, { error: "Invalid session" }, 401);
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
        return json(req, { error: "Unknown credit package" }, 400);
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
      return json(req, { error: "Unknown product type" }, 400);
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
      return json(req, { error: "Failed to create checkout session" }, 400);
    }

    return json(req, { checkoutUrl: data.url, sessionId: data.id });
  } catch (error) {
    return json(req, { error: "Checkout is unavailable" }, 400);
  }
});
