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
  frequency: string;
  due_status: string;
  // added fields potentially needed
  description?: string;
  evidence_required_text?: string;
  is_active?: boolean;
};

export type ComplianceRecord = {
  id: string;
  indicator: string;
  compliant_on: string;
  valid_until?: string;
  note?: string;
  created_at: string;
};

export type EvidenceItem = {
  id: string;
  file?: string;
  link?: string;
  note?: string;
  created_at: string;
};

export type AuditSummary = {
  period: string;
  start: string;
  end: string;
  counts: { [key: string]: number };
}

// -- API Calls --

export async function fetchIndicators(q?: string): Promise<Indicator[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  return request(`/api/indicators/?${params.toString()}`);
}

export async function fetchIndicator(id: string): Promise<Indicator> {
  return request(`/api/indicators/${id}/`);
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
export async function createCompliance(data: any) {
  return request("/api/compliance/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Evidence
export async function uploadEvidence(formData: FormData) {
  // Content-Type header will be set automatically by browser with boundary for FormData
  return request("/api/evidence/", {
    method: "POST",
    body: formData,
  });
}

// Audit
export async function fetchAuditSummary(start?: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  return request(`/api/audit/summary/?${params.toString()}`);
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

export async function fetchComplianceRecords(indicatorId: string): Promise<ComplianceRecord[]> {
  return request(`/api/compliance/?indicator=${indicatorId}`);
}

export async function fetchEvidenceItems(indicatorId: string): Promise<EvidenceItem[]> {
  return request(`/api/evidence/?indicator=${indicatorId}`);
}
