import { PRODUCTS } from "@/data/products";
import type { Enquiry, EnquiryInput, Product } from "@/types";

import { API_URL, USE_MOCK } from "./config";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.message ?? "Something went wrong. Try again.");
  }
  return body as T;
}

export async function getProducts(): Promise<Product[]> {
  if (USE_MOCK) {
    await wait(300);
    return PRODUCTS;
  }
  return request<Product[]>("/api/products");
}

export async function getProduct(id: string): Promise<Product | undefined> {
  if (USE_MOCK) {
    return PRODUCTS.find((p) => p.id === id);
  }
  return request<Product>(`/api/products/${id}`);
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  if (USE_MOCK) {
    await wait(900);
    return {
      ...input,
      id: `TG-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      source: "app",
      status: "New",
      createdAt: new Date().toISOString(),
    };
  }
  return request<Enquiry>("/api/enquiries", {
    method: "POST",
    body: JSON.stringify({ ...input, source: "app" }),
  });
}
