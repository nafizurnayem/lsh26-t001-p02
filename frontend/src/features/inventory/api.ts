import type {
  Dashboard,
  ExpiryStatus,
  MedicineListResponse,
  ReturnResponse,
} from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new Error("Could not connect to the pharmacy server. Is the backend running?");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export function getDashboard(): Promise<Dashboard> {
  return request<Dashboard>("/api/dashboard");
}

export function getMedicines(filters: {
  status?: ExpiryStatus;
  search?: string;
} = {}): Promise<MedicineListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.size ? `?${params.toString()}` : "";
  return request<MedicineListResponse>(`/api/medicines${query}`);
}

export function getReturns(): Promise<MedicineListResponse> {
  return request<MedicineListResponse>("/api/returns");
}

export function markReturned(id: string): Promise<ReturnResponse> {
  return request<ReturnResponse>(`/api/medicines/${encodeURIComponent(id)}/return`, {
    method: "PATCH",
  });
}
