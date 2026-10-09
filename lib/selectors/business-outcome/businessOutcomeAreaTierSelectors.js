// Operating-area tier for Business Outcome drill-downs (OPEN-C, 2026-10-09).
// Pure helpers: group working-group entries under their Cost Allocation
// operating area (division). No new calculation - area figures are plain sums
// of the working groups' own figures, so totals still reconcile to the headline.

export const AREA_KEY_PREFIX = "area:";
const DEFAULT_DIVISION_ID = "main_operations";

function to_number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safe_array(value) {
  return Array.isArray(value) ? value : [];
}

// group_id -> division_id, division_id -> name, from the Cost Allocation output contract.
export function build_area_lookup(operational_group_cost_rows, active_divisions) {
  const area_by_group_id = new Map();
  safe_array(operational_group_cost_rows).forEach((row) => {
    if (row && row.group_id) {
      area_by_group_id.set(row.group_id, row.division_id || DEFAULT_DIVISION_ID);
    }
  });
  const area_name_by_id = new Map();
  safe_array(active_divisions).forEach((division) => {
    if (division && division.division_id) {
      area_name_by_id.set(division.division_id, division.division_name || "Unnamed operating area");
    }
  });
  return { area_by_group_id, area_name_by_id };
}

function is_materials_entry(entry) {
  return entry?.key === "materials" || entry?.is_materials === true || entry?.type === "materials";
}

// entries: the drill's top-level list (working groups + materials).
// Returns area entries first, then anything that is not in an area (materials,
// or groups with no known area), unchanged.
export function wrap_entries_in_areas(entries, area_lookup) {
  const list = safe_array(entries);
  if (!area_lookup || !area_lookup.area_by_group_id || area_lookup.area_by_group_id.size === 0) {
    return list;
  }

  const members_by_area = new Map();
  const passthrough = [];

  list.forEach((entry) => {
    const area_id = area_lookup.area_by_group_id.get(entry?.key);
    if (!area_id || is_materials_entry(entry)) {
      passthrough.push(entry);
      return;
    }
    if (!members_by_area.has(area_id)) members_by_area.set(area_id, []);
    members_by_area.get(area_id).push(entry);
  });

  const area_entries = [];
  members_by_area.forEach((members, area_id) => {
    const sum = (field) => members.reduce((total, m) => total + to_number(m?.[field]), 0);
    const net_profit = sum("net_profit");
    const is_single = members.length === 1;
    const verdict = net_profit >= 0 ? "paying_its_way" : "being_carried";

    area_entries.push({
      key: AREA_KEY_PREFIX + area_id,
      label: area_lookup.area_name_by_id.get(area_id) || "Unnamed operating area",
      type: "group", // behaves like a group row in the drills; is_area marks it
      is_area: true,
      modelled_revenue: sum("modelled_revenue"),
      total_cost: sum("total_cost"),
      net_profit,
      overhead_share: sum("overhead_share"),
      achieved_revenue: sum("achieved_revenue"),
      current_rate: null,
      minimum_recoverable_rate: null,
      verdict,
      verdict_label: verdict === "being_carried" ? "Being carried" : "Paying its way",
      // One working group: skip the middle tier, go straight to its labour/assets.
      children: is_single ? safe_array(members[0].children) : members,
      member_group_ids: members.map((m) => m.key),
      skips_middle_tier: is_single,
    });
  });

  return [...area_entries, ...passthrough];
}

// Finds an entry by key at the area level, or inside a multi-group area.
// Returns { entry, parent } so the breadcrumb can show area then group.
export function find_entry_with_parent(wrapped_entries, key) {
  if (!key) return { entry: null, parent: null };
  for (const top of safe_array(wrapped_entries)) {
    if (top.key === key) return { entry: top, parent: null };
    if (top.is_area && !top.skips_middle_tier) {
      const child = safe_array(top.children).find((c) => c.key === key);
      if (child) return { entry: child, parent: top };
    }
  }
  return { entry: null, parent: null };
}

// Card 1 click-through passes a working group's id. A single-group area has no
// row for the group itself (the area goes straight to labour/assets), so map
// that key to its area. Anything else is returned unchanged.
export function resolve_selected_key(wrapped_entries, key) {
  if (!key) return key;
  for (const top of safe_array(wrapped_entries)) {
    if (top.key === key) return key;
    if (top.is_area && top.skips_middle_tier && safe_array(top.member_group_ids).includes(key)) {
      return top.key;
    }
  }
  return key;
}

// Self-check: wrapping must not change total net profit. Returns the difference.
// Headline source list ("Show breakdown" under Is your business working?).
// Rows there look like { key, name, net_profit, modelled_revenue, verdict }.
// Working-group rows are folded into one row per operating area; anything not
// in an area (Materials / COGS, unassigned, etc.) passes through unchanged.
// Area net profit is a plain sum of the (already rounded) group rows, so the
// list still adds up to the headline exactly.
export function wrap_headline_rows_in_areas(rows, area_lookup) {
  const list = safe_array(rows);
  if (!area_lookup || !area_lookup.area_by_group_id || area_lookup.area_by_group_id.size === 0) {
    return list;
  }
  const result = [];
  const area_rows = new Map();
  list.forEach((row) => {
    const area_id = area_lookup.area_by_group_id.get(row?.key);
    if (!area_id) {
      result.push(row);
      return;
    }
    let area_row = area_rows.get(area_id);
    if (!area_row) {
      area_row = {
        key: AREA_KEY_PREFIX + area_id,
        name: area_lookup.area_name_by_id.get(area_id) || "Unnamed operating area",
        is_area: true,
        net_profit: 0,
        modelled_revenue: 0,
        verdict: "paying_its_way",
        member_group_ids: [],
      };
      area_rows.set(area_id, area_row);
      result.push(area_row);
    }
    area_row.net_profit += to_number(row.net_profit);
    area_row.modelled_revenue += to_number(row.modelled_revenue);
    area_row.member_group_ids.push(row.key);
    const member_verdict = row.verdict || (to_number(row.net_profit) >= 0 ? "paying_its_way" : "being_carried");
    if (member_verdict === "being_carried") area_row.verdict = "being_carried";
  });
  return result;
}

export function area_net_profit_variance(original_entries, wrapped_entries) {
  const total = (list) => safe_array(list).reduce((sum, e) => sum + to_number(e?.net_profit), 0);
  return Math.round((total(wrapped_entries) - total(original_entries)) * 100) / 100;
}