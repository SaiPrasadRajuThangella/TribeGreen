import { useCustomer } from "@/store";
import type { Customer, CustomerProfile, Enquiry, EnquiryInput, Product } from "@/types";

import { API_URL } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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
    throw new ApiError(
      `Can't reach Tribe Green. Check your connection, or that the server is running (${API_URL}).`,
      0,
    );
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

/* ---------- Sign in with mobile number + 6-digit code (same accounts as the website) ---------- */

// demoCode comes back only while no SMS provider is connected
export const requestCode = (phone: string) =>
  request<{ sent: boolean; expiresInSeconds: number; demoCode?: string }>(
    "/api/auth/otp",
    json("POST", { phone }),
  );

export const verifyCode = (phone: string, code: string) =>
  request<{ token: string; user: Customer }>("/api/auth/verify", json("POST", { phone, code }));

export const updateProfile = (profile: CustomerProfile) =>
  asCustomer<Customer>("/api/me", json("PATCH", profile));

/* ---------- Enquiries and orders ---------- */

export const createEnquiry = (input: EnquiryInput) =>
  asCustomer<Enquiry>("/api/enquiries", json("POST", { ...input, source: "app" }));

// Everything on the account, from the app and the website
export const getMyEnquiries = () => asCustomer<Enquiry[]>("/api/my/enquiries");

export const changeCallbackNumber = (id: string, phone: string) =>
  asCustomer<Enquiry>(`/api/my/enquiries/${id}/phone`, json("PATCH", { phone }));
