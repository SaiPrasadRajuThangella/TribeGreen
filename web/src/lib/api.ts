import { PRODUCTS } from "@/data/products";
import type {
  Enquiry,
  EnquiryInput,
  EnquiryLookup,
  EnquiryRef,
  EnquiryStatus,
  OrderChanges,
  OrderDraft,
  Product,
} from "@/types";

import { ApiError } from "./apiError";
import { API_URL, USE_MOCK } from "./config";
import { MOCK_ADMIN, MOCK_TOKEN, mockDb } from "./mockDb";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export { ApiError };

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.message ?? "Something went wrong. Try again.", res.status);
  return body as T;
}

/* ---------- Public ---------- */

export async function getProducts(): Promise<Product[]> {
  if (USE_MOCK) return PRODUCTS;
  return request<Product[]>("/api/products");
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  if (USE_MOCK) {
    await wait(700);
    return mockDb.create(input);
  }
  return request<Enquiry>("/api/enquiries", {
    method: "POST",
    body: JSON.stringify({ ...input, source: "website" }),
  });
}

// The customer's own enquiries and orders, matched by reference + phone number
export async function trackEnquiries(refs: EnquiryRef[]): Promise<Enquiry[]> {
  if (!refs.length) return [];
  if (USE_MOCK) {
    await wait(250);
    return mockDb.track(refs);
  }
  return request<Enquiry[]>("/api/enquiries/track", { method: "POST", body: JSON.stringify({ refs }) });
}

// Track form: a reference finds that enquiry, a mobile number finds every enquiry made with it
export async function findEnquiries(lookup: EnquiryLookup): Promise<Enquiry[]> {
  if (USE_MOCK) {
    await wait(350);
    return mockDb.find(lookup);
  }
  return request<Enquiry[]>("/api/enquiries/lookup", { method: "POST", body: JSON.stringify(lookup) });
}

// The customer changes the number the team should call. The current number proves it's theirs
export async function changeCallbackNumber(ref: EnquiryRef, phone: string): Promise<Enquiry> {
  if (USE_MOCK) {
    await wait(350);
    return mockDb.changePhone(ref, phone);
  }
  return request<Enquiry>(`/api/enquiries/${ref.id}/phone`, {
    method: "PATCH",
    body: JSON.stringify({ phone: ref.phone, newPhone: phone }),
  });
}

/* ---------- Admin (needs the token from login) ---------- */

export async function adminLogin(username: string, password: string): Promise<{ token: string }> {
  if (USE_MOCK) {
    await wait(500);
    if (username === MOCK_ADMIN.username && password === MOCK_ADMIN.password) return { token: MOCK_TOKEN };
    throw new ApiError("Incorrect username or password", 401);
  }
  return request("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function getEnquiries(token: string): Promise<Enquiry[]> {
  if (USE_MOCK) {
    await wait(300);
    if (token !== MOCK_TOKEN) throw new ApiError("Session expired", 401);
    return mockDb.list();
  }
  return request<Enquiry[]>("/api/admin/enquiries", { token });
}

export async function updateEnquiryStatus(
  token: string,
  id: string,
  status: EnquiryStatus,
  reason?: string, // why it was lost, e.g. "Quote not agreed"
): Promise<Enquiry> {
  if (USE_MOCK) return mockDb.setStatus(id, status, reason);
  return request<Enquiry>(`/api/admin/enquiries/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status, reason }),
  });
}

// Turns an agreed quote into an order: final prices + delivery date. Sets the status to Converted
// and creates the tracking number
export async function finaliseOrder(token: string, id: string, draft: OrderDraft): Promise<Enquiry> {
  if (USE_MOCK) {
    await wait(400);
    return mockDb.finalise(id, draft);
  }
  return request<Enquiry>(`/api/admin/enquiries/${id}/order`, {
    method: "POST",
    token,
    body: JSON.stringify(draft),
  });
}

// Moves the order one stage (Confirmed → In production → Dispatched → Delivered, or back one),
// or changes the date and note
export async function updateOrder(token: string, id: string, changes: OrderChanges): Promise<Enquiry> {
  if (USE_MOCK) {
    await wait(300);
    return mockDb.updateOrder(id, changes);
  }
  return request<Enquiry>(`/api/admin/enquiries/${id}/order`, {
    method: "PATCH",
    token,
    body: JSON.stringify(changes),
  });
}
