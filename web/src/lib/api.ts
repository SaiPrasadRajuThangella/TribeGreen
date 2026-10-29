import { useCustomer } from "@/store";
import type {
  Customer,
  CustomerProfile,
  Enquiry,
  EnquiryInput,
  EnquiryStatus,
  OrderChanges,
  OrderDraft,
  Product,
} from "@/types";

import { ApiError } from "./apiError";
import { API_URL } from "./config";

export { ApiError };

async function request<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach Tribe Green right now. Check your connection and try again.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.message ?? "Something went wrong. Try again.", res.status);
  return body as T;
}

// Calls made as the signed-in customer. An expired session signs them out.
async function asCustomer<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await request<T>(path, { ...init, token: useCustomer.getState().token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) useCustomer.getState().signOut();
    throw err;
  }
}

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

/* ---------- Catalogue ---------- */

export const getProducts = () => request<Product[]>("/api/products");

/* ---------- Customer sign-in: mobile number + 6-digit code ---------- */

// demoCode comes back only while no SMS provider is connected
export const requestCode = (phone: string) =>
  request<{ sent: boolean; expiresInSeconds: number; demoCode?: string }>(
    "/api/auth/otp",
    json("POST", { phone }),
  );

export const verifyCode = (phone: string, code: string) =>
  request<{ token: string; user: Customer }>("/api/auth/verify", json("POST", { phone, code }));

export const getMe = () => asCustomer<Customer>("/api/me");

export const updateProfile = (profile: CustomerProfile) =>
  asCustomer<Customer>("/api/me", json("PATCH", profile));

/* ---------- Enquiries and orders ---------- */

export const createEnquiry = (input: EnquiryInput) =>
  asCustomer<Enquiry>("/api/enquiries", json("POST", { ...input, source: "website" }));

// Everything on the account: made while signed in or with the same mobile number
export const getMyEnquiries = () => asCustomer<Enquiry[]>("/api/my/enquiries");

// The number the team should call back on
export const changeCallbackNumber = (id: string, phone: string) =>
  asCustomer<Enquiry>(`/api/my/enquiries/${id}/phone`, json("PATCH", { phone }));

/* ---------- Admin (needs the token from login) ---------- */

export const adminLogin = (username: string, password: string) =>
  request<{ token: string }>("/api/admin/login", json("POST", { username, password }));

export const getEnquiries = (token: string) => request<Enquiry[]>("/api/admin/enquiries", { token });

export const updateEnquiryStatus = (
  token: string,
  id: string,
  status: EnquiryStatus,
  reason?: string, // why it was lost, e.g. "Quote not agreed"
) => request<Enquiry>(`/api/admin/enquiries/${id}`, { ...json("PATCH", { status, reason }), token });

// Turns an agreed quote into an order: final prices + delivery date. Sets the status to Converted
// and creates the tracking number
export const finaliseOrder = (token: string, id: string, draft: OrderDraft) =>
  request<Enquiry>(`/api/admin/enquiries/${id}/order`, { ...json("POST", draft), token });

// Moves the order one stage (Confirmed → In production → Dispatched → Delivered, or back one),
// or changes the date and note
export const updateOrder = (token: string, id: string, changes: OrderChanges) =>
  request<Enquiry>(`/api/admin/enquiries/${id}/order`, { ...json("PATCH", changes), token });
