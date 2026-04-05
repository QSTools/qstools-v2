const STORAGE_KEY = "qs_employee_overhead_library_v1";

function get_now_iso() {
  return new Date().toISOString();
}

function generate_id(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safe_parse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function loadEmployeeOverheadLibrary() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safe_parse(raw, []);

  return Array.isArray(parsed) ? parsed : [];
}

export function saveEmployeeOverheadLibrary(items = []) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createEmployeeOverheadTemplate({
  custom_overhead_name = "",
  default_amount_annual = 0,
}) {
  const now = get_now_iso();

  return {
    custom_overhead_template_id: generate_id("tmpl"),
    custom_overhead_name: String(custom_overhead_name || "").trim(),
    default_amount_annual: Number(default_amount_annual) || 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function upsertEmployeeOverheadTemplate(template) {
  const existing = loadEmployeeOverheadLibrary();

  const index = existing.findIndex(
    (item) =>
      item.custom_overhead_template_id === template.custom_overhead_template_id
  );

  const next = [...existing];

  if (index >= 0) {
    next[index] = {
      ...next[index],
      ...template,
      updated_at: get_now_iso(),
    };
  } else {
    next.push(template);
  }

  saveEmployeeOverheadLibrary(next);
  return next;
}

export function deactivateEmployeeOverheadTemplate(template_id) {
  const existing = loadEmployeeOverheadLibrary();

  const next = existing.map((item) => {
    if (item.custom_overhead_template_id !== template_id) return item;

    return {
      ...item,
      is_active: false,
      updated_at: get_now_iso(),
    };
  });

  saveEmployeeOverheadLibrary(next);
  return next;
}