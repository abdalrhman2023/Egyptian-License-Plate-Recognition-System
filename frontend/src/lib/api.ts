/**
 * API client for Sentry Egypt Vision backend.
 */

const API_BASE = "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("sentry_token");
}

function setToken(token: string) {
  localStorage.setItem("sentry_token", token);
}

function clearToken() {
  localStorage.removeItem("sentry_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API Error");
  }

  if (res.headers.get("content-type")?.includes("text/csv")) {
    return (await res.blob()) as unknown as T;
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export const authApi = {
  register: (data: { username: string; email: string; password: string; full_name?: string }) =>
    request<TokenResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    request<TokenResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<UserResponse>("/api/auth/me"),

  setToken,
  getToken,
  clearToken,
};

// ── Dashboard ────────────────────────────────────────────────────────

export interface DashboardStats {
  vehicles_today: number;
  violations_today: number;
  watchlist_matches: number;
  system_accuracy: number;
  vehicles_change: number;
  violations_change: number;
}

export interface HourlyData {
  hour: string;
  vehicles: number;
  violations: number;
}

export interface WeeklyData {
  day: string;
  vehicles: number;
  violations: number;
}

export interface ViolationTypeData {
  name: string;
  value: number;
  color: string;
}

export const dashboardApi = {
  stats: () => request<DashboardStats>("/api/dashboard/stats"),
  activity: (limit = 20) => request<DetectionResponse[]>(`/api/dashboard/activity?limit=${limit}`),
  hourly: () => request<HourlyData[]>("/api/dashboard/hourly"),
  weekly: () => request<WeeklyData[]>("/api/dashboard/weekly"),
  violationTypes: () => request<ViolationTypeData[]>("/api/dashboard/violation-types"),
};

// ── Upload ───────────────────────────────────────────────────────────

export interface JobResponse {
  id: string;
  filename: string | null;
  file_type: string | null;
  status: string;
  progress: number;
  total_frames: number;
  processed_frames: number;
  detections_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<JobResponse>("/api/upload", { method: "POST", body: formData });
  },
  jobStatus: (jobId: string) => request<JobResponse>(`/api/jobs/${jobId}`),
};

// ── Vehicles ─────────────────────────────────────────────────────────

export interface DetectionResponse {
  id: number;
  plate_number: string;
  plate_number_arabic: string | null;
  governorate: string | null;
  confidence: number | null;
  speed: number | null;
  speed_limit: number | null;
  camera: string | null;
  location: string | null;
  status: string;
  frame_number: number;
  timestamp_in_video: string | null;
  source_file: string | null;
  plate_image_path: string | null;
  car_image_path: string | null;
  job_id: string | null;
  created_at: string;
}

export interface DetectionListResponse {
  items: DetectionResponse[];
  total: number;
  page: number;
  page_size: number;
}

export const vehiclesApi = {
  list: (params?: { page?: number; page_size?: number; status?: string; governorate?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.governorate) searchParams.set("governorate", params.governorate);
    if (params?.search) searchParams.set("search", params.search);
    return request<DetectionListResponse>(`/api/vehicles?${searchParams}`);
  },
  unique: () => request<DetectionResponse[]>("/api/vehicles/unique"),
  get: (id: number) => request<DetectionResponse>(`/api/vehicles/${id}`),
  delete: (id: number) => request<{ message: string }>(`/api/vehicles/${id}`, { method: "DELETE" }),
  search: (q: string, page = 1) => request<DetectionListResponse>(`/api/vehicles/search?q=${encodeURIComponent(q)}&page=${page}`),
  governorates: () => request<{ governorate: string; count: number }[]>("/api/vehicles/governorates/list"),
};

// ── Violations ───────────────────────────────────────────────────────

export interface ViolationResponse {
  id: number;
  detection_id: number | null;
  violation_type: string;
  description: string | null;
  plate_number: string;
  speed: number | null;
  speed_limit: number | null;
  location: string | null;
  camera: string | null;
  resolved: boolean;
  created_at: string;
}

export const violationsApi = {
  list: (params?: { page?: number; page_size?: number; violation_type?: string; resolved?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.violation_type) searchParams.set("violation_type", params.violation_type);
    if (params?.resolved !== undefined) searchParams.set("resolved", String(params.resolved));
    return request<{ items: ViolationResponse[]; total: number }>(`/api/violations?${searchParams}`);
  },
  get: (id: number) => request<ViolationResponse>(`/api/violations/${id}`),
  resolve: (id: number) => request<{ message: string }>(`/api/violations/${id}/resolve`, { method: "PATCH" }),
  stats: () => request<{ total: number; resolved: number; pending: number; by_type: Record<string, number> }>("/api/violations/stats/summary"),
};

// ── Watchlist ────────────────────────────────────────────────────────

export interface WatchlistEntry {
  id: number;
  plate_number: string;
  plate_number_arabic: string | null;
  reason: string | null;
  priority: string;
  is_active: boolean;
  created_by: string | null;
  last_seen: string | null;
  last_seen_location: string | null;
  match_count: number;
  created_at: string;
}

export const watchlistApi = {
  list: (activeOnly = true) => request<WatchlistEntry[]>(`/api/watchlist?active_only=${activeOnly}`),
  add: (data: { plate_number: string; plate_number_arabic?: string; reason: string; priority?: string }) =>
    request<WatchlistEntry>("/api/watchlist", { method: "POST", body: JSON.stringify(data) }),
  get: (id: number) => request<WatchlistEntry>(`/api/watchlist/${id}`),
  update: (id: number, data: { reason?: string; priority?: string; is_active?: boolean }) =>
    request<WatchlistEntry>(`/api/watchlist/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => request<{ message: string }>(`/api/watchlist/${id}`, { method: "DELETE" }),
};

// ── Analytics ────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: () => request<{ total_detections: number; total_violations: number; unique_plates: number; average_confidence: number }>("/api/analytics/overview"),
  governorateDistribution: () => request<{ governorate: string; count: number }[]>("/api/analytics/governorate-distribution"),
  dailyTrend: (days = 30) => request<{ date: string; vehicles: number; violations: number }[]>(`/api/analytics/daily-trend?days=${days}`),
  confidenceDistribution: () => request<{ range: string; count: number }[]>("/api/analytics/confidence-distribution"),
  topPlates: (limit = 10) => request<{ plate_number: string; plate_number_arabic: string | null; governorate: string | null; detection_count: number; best_confidence: number }[]>(`/api/analytics/top-plates?limit=${limit}`),
};

// ── Reports ──────────────────────────────────────────────────────────

export const reportsApi = {
  summary: (days = 7) => request<Record<string, unknown>>(`/api/reports/summary?days=${days}`),
  exportCsv: (days = 7) =>
    fetch(`${API_BASE}/api/reports/export/csv?days=${days}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((r) => r.blob()),
};

// ── Settings ─────────────────────────────────────────────────────────

export interface SettingResponse {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

export const settingsApi = {
  list: () => request<SettingResponse[]>("/api/settings"),
  update: (key: string, value: string) =>
    request<SettingResponse>(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
  cameras: () => request<{ id: number; name: string; location: string; speed_limit: number; is_active: boolean }[]>("/api/settings/cameras"),
  addCamera: (data: { name: string; location: string; speed_limit?: number }) =>
    request<unknown>("/api/settings/cameras", { method: "POST", body: JSON.stringify(data) }),
  deleteCamera: (id: number) => request<unknown>(`/api/settings/cameras/${id}`, { method: "DELETE" }),
};

// ── Static file URL helper ───────────────────────────────────────────

export function staticUrl(path: string | null | undefined): string {
  if (!path) return "";
  return `${API_BASE}/static/${path}`;
}
