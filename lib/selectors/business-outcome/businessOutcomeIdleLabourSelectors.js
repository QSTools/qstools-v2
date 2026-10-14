// Idle labour lookup for the Business Outcome working-group drill-down
// (idle cost Step 3, D-IDLE-2, 2026-10-15).
// DISPLAY ONLY. Reads the figures Cost Allocation already holds on each
// operational group cost row (idle_labour_hours, idle_labour_cost). Nothing is
// recomputed here and no total, rate or net profit is touched.
// A group appears in the map only when its "labour tied to the asset" box is
// ticked and it really has idle hours (Cost Allocation already returns zero
// otherwise; the tick is re-checked here so the two displays can never disagree).

function to_number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round_2(value) {
  return Math.round(to_number(value) * 100) / 100;
}

// operational_group_cost_rows -> { [group_id]: { hours, cost } }
export function build_idle_labour_by_group(operational_group_cost_rows) {
  const by_group = {};
  const rows = Array.isArray(operational_group_cost_rows) ? operational_group_cost_rows : [];
  rows.forEach((row) => {
    if (!row || !row.group_id) return;
    if (row.labour_tied_to_asset !== true) return;
    const hours = to_number(row.idle_labour_hours);
    if (hours <= 0) return;
    by_group[row.group_id] = {
      hours: round_2(hours),
      cost: round_2(row.idle_labour_cost),
    };
  });
  return by_group;
}

// Finds the idle figures for a drill-down entry.
//  - a working group entry: looked up by its key (the group id)
//  - an operating area that holds exactly ONE working group (skips_middle_tier):
//    the group row is hidden, so read the member group's id instead
//  - a multi-group area, materials, or anything else: null (no line)
export function get_idle_labour_for_entry(idle_labour_by_group, entry) {
  if (!idle_labour_by_group || !entry) return null;
  if (entry.is_materials === true || entry.type === "materials" || entry.key === "materials") return null;

  let ids = [];
  if (entry.is_area) {
    if (entry.skips_middle_tier && Array.isArray(entry.member_group_ids)) ids = entry.member_group_ids;
  } else if (entry.key) {
    ids = [entry.key];
  }

  let hours = 0;
  let cost = 0;
  let found = false;
  ids.forEach((id) => {
    const row = idle_labour_by_group[id];
    if (!row) return;
    found = true;
    hours += to_number(row.hours);
    cost += to_number(row.cost);
  });
  return found ? { hours: round_2(hours), cost: round_2(cost) } : null;
}
