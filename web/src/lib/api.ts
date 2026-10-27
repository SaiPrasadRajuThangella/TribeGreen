import { PRODUCTS } from "@/data/products";
import type { Enquiry, EnquiryInput, EnquiryStatus, Product } from "@/types";

import { API_URL, USE_MOCK } from "./config";
import { MOCK_ADMIN, MOCK_TOKEN, mockDb } from "./mockDb";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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
): Promise<Enquiry> {
  if (USE_MOCK) {
    const updated = mockDb.setStatus(id, status);
    if (!updated) throw new ApiError("Enquiry not found", 404);
    return updated;
  }
  return request<Enquiry>(`/api/admin/enquiries/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}
