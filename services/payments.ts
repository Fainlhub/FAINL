import { supabase } from "./supabaseClient";

export type CheckoutProduct =
  | { type: "credits"; count: number }
  | { type: "subscription"; plan: "starter" | "pro" }
  | { type: "ad_free" };

export const startCheckout = async (product: CheckoutProduct) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Je moet ingelogd zijn om af te rekenen.");
  }

  const { data, error } = await supabase.functions.invoke("create-payment", {
    body: product,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message || "Checkout starten mislukt.");
  }

  if (!data?.checkoutUrl) {
    throw new Error(data?.error || "Stripe gaf geen checkout URL terug.");
  }

  window.location.href = data.checkoutUrl;
};
