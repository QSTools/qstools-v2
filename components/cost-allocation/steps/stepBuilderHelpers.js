export function getRows(value) {
  if (Array.isArray(value?.rows)) {
    return value.rows.filter((row) => row?.is_active !== false);
  }

  if (Array.isArray(value)) {
    return value.filter((row) => row?.is_active !== false);
  }

  return [];
}

export function makeLocalId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
