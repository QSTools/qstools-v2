import {
  CATEGORY_DEFINITIONS,
  DEFAULT_CATEGORY_MAP,
} from "./generalOverheadDefinitions";

import { to_number } from "./generalOverheadFormatting";

export function get_category_definition(category_key) {
  return (
    CATEGORY_DEFINITIONS.find((category) => category.key === category_key) ||
    CATEGORY_DEFINITIONS.find(
      (category) => category.key === "other_unallocated"
    )
  );
}

export function get_default_category_key(row) {
  if (
    row.overhead_category_key &&
    CATEGORY_DEFINITIONS.some(
      (category) => category.key === row.overhead_category_key
    )
  ) {
    return row.overhead_category_key;
  }

  if (row.is_custom) {
    return "other_unallocated";
  }

  return DEFAULT_CATEGORY_MAP[row.key] || "other_unallocated";
}

export function get_effective_category_key(row, overhead_state) {
  const overrides = overhead_state?.overhead_category_overrides ?? {};
  const override_category_key = overrides[row.key];

  if (
    override_category_key &&
    CATEGORY_DEFINITIONS.some(
      (category) => category.key === override_category_key
    )
  ) {
    return override_category_key;
  }

  return get_default_category_key(row);
}

export function build_general_overhead_category_totals(
  rows = [],
  overhead_state = {}
) {
  const totals = new Map(
    CATEGORY_DEFINITIONS.map((category) => [
      category.key,
      {
        category_id: category.key,
        category_name: category.label,
        total: 0,
      },
    ])
  );

  for (const row of rows ?? []) {
    const category_key = get_effective_category_key(row, overhead_state);
    const category = get_category_definition(category_key);
    const existing = totals.get(category.key);

    totals.set(category.key, {
      ...existing,
      total: to_number(existing?.total) + to_number(row.active_amount),
    });
  }

  return Array.from(totals.values());
}