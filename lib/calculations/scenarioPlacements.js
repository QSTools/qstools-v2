// R3 slice 4, batch C2b (Business Modelling brief, Addendum 29). PURE, no imports.
// Puts the group placement of each PRODUCTIVE scratch add into a COPY of Cost Allocation's assignment arrays. The real Cost Allocation key is never
// written in Model mode. Shapes are exactly what add_labour_assignment / add_asset_assignment in useCostAllocation.js create:
//   labour: one assignment of the add's own scratch staff type, 100 percent, one staff member. The type holds only that hire, so 100 percent is its full
//           cost and hours.
//   asset:  one assignment of the add's asset id, 100 percent.
// placements = productive_placements(adds) from scenarioAdds.js. stamp = an ISO time string (the hook passes one per memo, so this stays pure).
// Nothing to place returns the SAME arrays (identity). A placement whose group does not exist is still appended on purpose: the cost then shows in the
// existing unassigned counters instead of disappearing silently.

export function inject_placements({ labour_assignments, asset_assignments, placements, names_by_id, stamp }) {
  const labour = Array.isArray(labour_assignments) ? labour_assignments : [];
  const assets = Array.isArray(asset_assignments) ? asset_assignments : [];
  if (!Array.isArray(placements) || placements.length === 0) {
    return { labour_assignments: labour_assignments, asset_assignments: asset_assignments, applied: false };
  }
  const names = names_by_id && typeof names_by_id === "object" ? names_by_id : {};
  const time = typeof stamp === "string" ? stamp : "";
  const next_labour = [];
  const next_assets = [];
  for (const p of placements) {
    if (!p || typeof p.group_id !== "string" || p.group_id === "") continue;
    if (p.kind === "staff" && p.staff_type_id) {
      const assignment_id = "scenario_labour_" + p.id;
      next_labour.push({
        assignment_id,
        labour_group_assignment_id: assignment_id,
        group_id: p.group_id,
        staff_type_id: p.staff_type_id,
        labour_type_id: p.staff_type_id,
        labour_type_key: p.staff_type_id,
        labour_type_label: names[p.id] || p.staff_type_id,
        labour_class: "productive",
        is_productive: true,
        contributes_to_recovery_hours: true,
        assigned_staff_count: 1,
        assignment_percent: 100,
        is_active: true,
        is_scenario: true,
        created_at: time,
        updated_at: time,
      });
    } else if (p.kind === "asset") {
      next_assets.push({
        assignment_id: "scenario_asset_" + p.id,
        group_id: p.group_id,
        asset_id: p.id,
        assignment_percent: 100,
        is_active: true,
        is_scenario: true,
        created_at: time,
        updated_at: time,
      });
    }
  }
  if (next_labour.length === 0 && next_assets.length === 0) {
    return { labour_assignments: labour_assignments, asset_assignments: asset_assignments, applied: false };
  }
  return {
    labour_assignments: next_labour.length ? [...labour, ...next_labour] : labour_assignments,
    asset_assignments: next_assets.length ? [...assets, ...next_assets] : asset_assignments,
    applied: true,
  };
}
