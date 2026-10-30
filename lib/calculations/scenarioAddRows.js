// R3 slice 4, batch C2b (Business Modelling brief, Addendum 29). PURE, no imports, so it runs in plain node for the tests.
// Turns the C1 rows (scenarioAdds.js build_added_staff_rows / build_added_asset_rows) into the row shapes the real chain reads.
// Only PRODUCTIVE adds become rows: non-productive adds enter as one overhead line (C2a, scenarioOverheadLine.js), so nothing is counted twice.
// Why the extra fields (read from the code, Addendum 29 item 2):
//   staff:  buildLabourOutputContract sums total_labour_cost_annual and recovery_hours; the type selectors read productive_hours_annual, staff_type_name,
//           paid_hours_per_year. Paid hours are set equal to productive hours, so the displayed productivity of a scratch hire is 100 percent (display only).
//   assets: get_asset_utilisation_fields recomputes hours as utilisation_hours_per_week x weeks and IGNORES utilisation_hours_annual (an absent weekly figure
//           defaults to 40). So the weekly figure carries the annual hours and the weeks override is 1: annual hours = exactly the hours typed.
// Inputs are never mutated; rows are new objects. Nothing to add returns the same frozen empty list.

const EMPTY_ROWS = Object.freeze([]);

function round_cents(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function to_labour_rows(staff_rows) {
  if (!Array.isArray(staff_rows)) return EMPTY_ROWS;
  const rows = staff_rows
    .filter((row) => row && row.is_productive === true)
    .map((row) => {
      const hours = Number(row.productive_hours_annual) || 0;
      const cost = round_cents(row.annual_labour_cost);
      return {
        ...row,
        profile_id: row.staff_id,
        staff_type_name: row.staff_name,
        staff_type: row.staff_name,
        staff_role: row.staff_name,
        is_active: true,
        annual_labour_cost: cost,
        total_labour_cost_annual: cost,
        recovery_hours: hours,
        productive_hours: hours,
        productive_hours_annual: hours,
        paid_hours_per_year: hours,
        total_hours_annual: hours,
        non_productive_paid_hours: 0,
        non_productive_hours_annual: 0,
      };
    });
  return rows.length === 0 ? EMPTY_ROWS : rows;
}

export function to_asset_rows(asset_rows) {
  if (!Array.isArray(asset_rows)) return EMPTY_ROWS;
  const rows = asset_rows
    .filter((row) => row && row.asset_type === "productive")
    .map((row) => {
      const hours = Number(row.utilisation_hours_annual) || 0;
      const cost = round_cents(row.asset_recovery_cost_annual);
      return {
        ...row,
        total_asset_cost_annual: cost,
        asset_recovery_cost_annual: cost,
        utilisation_hours_per_week: hours,
        asset_annual_weeks_override: 1,
        utilisation_hours_annual: hours,
        asset_overhead_pool_assignments: {},
        is_retired: false,
      };
    });
  return rows.length === 0 ? EMPTY_ROWS : rows;
}

// list = the modelled list so far. Nothing to append returns the SAME array (identity), otherwise a new array.
export function append_rows(list, extra_rows) {
  if (!Array.isArray(extra_rows) || extra_rows.length === 0) return list;
  return [...(Array.isArray(list) ? list : []), ...extra_rows];
}
