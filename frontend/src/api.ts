const API_BASE = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";

export type Indicator = {
  id: string;
  section: string;
  standard: string;
  indicator_text: string;
  frequency: string;
  due_status: string;
};

export async function fetchIndicators(q?: string): Promise<Indicator[]> {
  const url = new URL(API_BASE + "/api/indicators/");
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch indicators");
  return res.json();
}
