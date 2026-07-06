import type { ScheduleTask } from "@/lib/calculations/schedulingCalculations";

const STORAGE_KEY = "qs_tools_scheduling_v4_tasks";

export function loadScheduleTasks(): ScheduleTask[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

export function saveScheduleTasks(tasks: ScheduleTask[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function clearScheduleTasks(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);
}