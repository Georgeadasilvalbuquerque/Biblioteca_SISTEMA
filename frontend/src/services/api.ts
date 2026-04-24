import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api"
});

const TOKEN_KEY = "book_bench_token";

export type UserRole = "ADMIN" | "LIBRARIAN";
export type ItemType = "BOOK" | "MAGAZINE" | "SUPPORT_MATERIAL";
export type MovementType = "ENTRY" | "EXIT" | "LOAN" | "RETURN" | "ADJUSTMENT" | "LOSS";
export type LoanStatus = "OPEN" | "RETURNED" | "LATE" | "CANCELLED";

export interface ApiEnvelope<T> {
  data: T;
  meta?: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: { id: string; name: string; email: string; role: UserRole };
}

export interface DashboardSummary {
  cards: {
    totalItems: number;
    entriesInMonth: number;
    exitsInMonth: number;
    availableNow: number;
  };
  lowStock: Array<{
    id: string;
    code: string;
    title: string;
    currentQuantity: number;
    minimumQuantity: number;
  }>;
  recentMovements: Array<{
    id: string;
    createdAt: string;
    type: MovementType;
    quantity: number;
    item?: { code: string; title: string };
  }>;
}

export interface Item {
  id: string;
  code: string;
  title: string;
  type: ItemType;
  currentQuantity: number;
  minimumQuantity: number;
  author?: string | null;
  isActive: boolean;
}

export interface Movement {
  id: string;
  createdAt: string;
  type: MovementType;
  quantity: number;
  item?: { id: string; code: string; title: string };
  user?: { id: string; name: string };
}

export interface Member {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface Loan {
  id: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: LoanStatus;
  quantity: number;
  item?: { id: string; code: string; title: string };
  member?: { id: string; name: string };
}

export interface AppSettings {
  defaultLoanDays: number;
  lowStockAlertThreshold: number;
  allowNegativeAdjustments: boolean;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

async function loginWithDefaultAdmin() {
  const email = import.meta.env.VITE_ADMIN_EMAIL || "admin@biblioteca.com";
  const password = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
  const response = await api.post<ApiEnvelope<LoginResult>>("/auth/login", { email, password });
  return response.data.data;
}

export async function ensureToken() {
  const existing = getStoredToken();
  if (existing) return existing;
  const auth = await loginWithDefaultAdmin();
  setStoredToken(auth.token);
  return auth.token;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchDashboardSummary(token: string) {
  const response = await api.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary", {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function fetchItems(token: string, search = "") {
  const response = await api.get<ApiEnvelope<Item[]>>("/items", {
    params: { search: search || undefined, pageSize: 50 },
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function createItem(token: string, payload: Partial<Item> & { code: string; title: string; type: ItemType }) {
  const response = await api.post<ApiEnvelope<Item>>("/items", payload, {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function fetchMovements(token: string, params?: Record<string, string>) {
  const response = await api.get<ApiEnvelope<Movement[]>>("/movements", {
    params: { pageSize: 50, ...params },
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function createMovement(
  token: string,
  payload: { itemId: string; type: "ENTRY" | "EXIT" | "ADJUSTMENT" | "LOSS"; quantity: number; reason?: string }
) {
  const response = await api.post<ApiEnvelope<Movement>>("/movements", payload, {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function fetchLoans(token: string, params?: Record<string, string>) {
  const response = await api.get<ApiEnvelope<Loan[]>>("/loans", {
    params: { pageSize: 50, ...params },
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function createLoan(
  token: string,
  payload: { itemId: string; memberId: string; quantity?: number; dueDate: string; notes?: string }
) {
  const response = await api.post<ApiEnvelope<Loan>>("/loans", payload, {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function returnLoan(token: string, loanId: string) {
  const response = await api.post<ApiEnvelope<Loan>>(`/loans/${loanId}/return`, undefined, {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function fetchMembers(token: string, search = "") {
  const response = await api.get<ApiEnvelope<Member[]>>("/members", {
    params: { search: search || undefined, pageSize: 50 },
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function createMember(token: string, payload: { name: string; email?: string; phone?: string }) {
  const response = await api.post<ApiEnvelope<Member>>("/members", payload, {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function fetchSettings(token: string) {
  const response = await api.get<ApiEnvelope<AppSettings>>("/settings", {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function updateSettings(token: string, payload: AppSettings) {
  const response = await api.put<ApiEnvelope<AppSettings>>("/settings", payload, {
    headers: authHeaders(token)
  });
  return response.data.data;
}

export async function exportEntity(
  token: string,
  entity: "items" | "movements" | "loans" | "members",
  format: "pdf" | "xlsx",
  params?: Record<string, string>
) {
  const response = await api.get(`/${entity}/export`, {
    headers: authHeaders(token),
    params: { format, ...params },
    responseType: "blob"
  });
  const blob = new Blob([response.data], {
    type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const fileName = `${entity}-${new Date().toISOString().slice(0, 10)}.${format}`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}