import apiClient from "./client";

export async function createCheckout(personaKey) {
  const res = await apiClient.post("/checkout/create", { persona_key: personaKey });
  return res.data;
}

export async function getCheckoutStatus(checkoutId) {
  const res = await apiClient.get(`/checkout/status/${checkoutId}`);
  return res.data;
}
