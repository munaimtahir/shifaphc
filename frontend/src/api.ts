const API_BASE = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";

function getCookie(name: string) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export async function request(path: string, options: RequestInit = {}) {
  const url = new URL(path, API_BASE);

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    headers.set("X-CSRFToken", csrfToken);
  }

  const config = {
    ...options,
    headers,
    credentials: "include" as RequestCredentials,
  };

  const res = await fetch(url.toString(), config);

  if (res.status === 401) {
    // If not on login page, logic to redirect or warn?
    // We'll throw specific error for UI to catch or auth context to catch
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    let errMessage = res.statusText;
    try {
      const data = await res.json();
      if (data.detail) errMessage = data.detail;
      else if (typeof data === 'string') errMessage = data;
      else errMessage = JSON.stringify(data);
    } catch (e) { /* ignore */ }
    throw new Error(errMessage);
  }

  if (res.status === 204) return null;
  return res.json();
}

export type Indicator = {
  id: string;
  section: string;
  standard: string;
  indicator_text: string;
  evidence_required_text?: string;
  responsible_person?: string;
  frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_compliant_on: string | null;
  next_due_on: string | null;
  due_status: "COMPLIANT" | "DUE_SOON" | "OVERDUE" | "NOT_STARTED";
};

export type ComplianceRecord = {
  id: string;
  indicator: string;
  compliant_on: string;
  valid_until: string | null;
  notes: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type EvidenceItem = {
  id: string;
  indicator: string;
  compliance_record: string | null;
  type: "NOTE" | "FILE" | "PHOTO" | "SCREENSHOT" | "LINK";
  note_text: string | null;
  url: string | null;
  file: string | null;
  created_by?: string;
  created_at: string;
};

export type AuditSummary = {
  period: string;
  start: string;
  end: string;
  counts: { [key: string]: number };
}

export type AuditLog = {
  id: string;
  timestamp: string;
  actor: string | null;
  actor_username: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  before_snapshot: any;
  after_snapshot: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
};

export type PaginatedResponse<T> = {
  results: T[];
  count: number;
  num_pages: number;
  current_page: number;
};

// -- API Calls --

export async function fetchIndicators(q?: string, status?: string): Promise<Indicator[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("due_status", status);
  return request(`/api/indicators/?${params.toString()}`);
}

export async function fetchIndicator(id: string): Promise<Indicator> {
  return request(`/api/indicators/${id}/`);
}

export async function createIndicator(data: any): Promise<Indicator> {
  return request("/api/indicators/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIndicator(id: string, data: any): Promise<Indicator> {
  return request(`/api/indicators/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function login(username: string, password: string) {
  return request("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return request("/api/auth/logout/", { method: "POST" });
}

export async function checkAuth() {
  return request("/api/auth/user/");
}

// Compliance
export async function createCompliance(data: any): Promise<ComplianceRecord> {
  return request("/api/compliance/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCompliance(id: string, data: Partial<ComplianceRecord>): Promise<ComplianceRecord> {
  return request(`/api/compliance/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function revokeCompliance(id: string, reason: string): Promise<ComplianceRecord> {
  return updateCompliance(id, { is_revoked: true, revoked_reason: reason });
}

// Evidence
export async function uploadEvidence(formData: FormData): Promise<EvidenceItem> {
  return request("/api/evidence/", {
    method: "POST",
    body: formData,
  });
}

export async function updateEvidence(id: string, data: Partial<EvidenceItem>): Promise<EvidenceItem> {
  return request(`/api/evidence/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEvidence(id: string) {
  return request(`/api/evidence/${id}/`, {
    method: "DELETE",
  });
}

// Audit
export async function fetchAuditSummary(start?: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  return request(`/api/audit/summary/?${params.toString()}`);
}

export function getAuditLogsExportUrl(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return new URL(`/api/audit/logs/export/?${params.toString()}`, API_BASE).toString();
}

// Import
export async function importIndicators(formData: FormData) {
  return request("/api/indicators/import/", {
    method: "POST",
    body: formData,
  });
}

export function getFileUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return new URL(path, API_BASE).toString();
}

export function getSecureDownloadUrl(id: string) {
  return `${API_BASE}/api/evidence/${id}/download/`;
}

export async function fetchComplianceRecords(indicatorId: string): Promise<ComplianceRecord[]> {
  return request(`/api/compliance/?indicator=${indicatorId}`);
}

export async function fetchComplianceRecord(id: string): Promise<ComplianceRecord> {
  return request(`/api/compliance/${id}/`);
}

export async function fetchEvidenceItems(indicatorId: string): Promise<EvidenceItem[]> {
  return request(`/api/evidence/?indicator=${indicatorId}`);
}

export async function fetchAuditLogs(params: Record<string, any>): Promise<PaginatedResponse<AuditLog>> {
  const searchParams = new URLSearchParams(params as any);
  return request(`/api/audit/logs/?${searchParams.toString()}`);
}

export function getExportLogsUrl(params: Record<string, any>) {
  const searchParams = new URLSearchParams(params as any);
  return `${API_BASE}/api/audit/logs/export/?${searchParams.toString()}`;
}

export async function fetchAuditSnapshot(params: Record<string, any>): Promise<any> {
  const searchParams = new URLSearchParams(params as any);
  return request(`/api/audit/snapshot/?${searchParams.toString()}`);
}
