// Mirra v6.0 - Calculation Trace - Rate Builder Nodes
// Session 11. Rate Builder's minimum_recoverable_charge_out_rate is built
// from two legs, neither of which is a single traced hop:
//   1. labour_cost_rate - Labour's per-staff-type weighted rate
//      (productive_staff_type_rates). Labour's only node in the graph so
//      far is the total_people_cost_annual aggregate, not the per-staff-
//      type rate, so this leg has no real upstream node to point at yet.
//   2. allocated_business_overhead_recovery_rate - built inside Cost
//      Allocation by build_rate_builder_labour_recovery_rows, which
//      aggregates across every operational group a staff type is
//      assigned to (many-to-one). This is NOT the same edge as
//      cost_allocation.group.<id>.total_group_cost, so pointing there
//      would overstate what's actually traced.
//
// Deliberately modelled as a boundary: one aggregation node for the
// recovery-rows stream (traced via its known hook output, arithmetic not
// re-derived here), and each Rate Builder node points only at that
// boundary. See CALCULATION_TRACE_VERIFICATION_LAYER_FUTURE_BUILD_BRIEF_
// 2026-09-26.txt (session 11 entry) for the decision record.

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildRateBuilderRecoveryRowsBoundaryNode(live) {
  const rows = Array.isArray(live?.cost_allocation?.rate_builder_labour_recovery_rows)
    ? live.cost_allocation.rate_builder_labour_recovery_rows
    : [];

  return [
    {
      node_id: "cost_allocation.rate_builder_labour_recovery_rows",
      display_label: "Rate Builder Labour Recovery Rows (Cost Allocation)",
      module_name: "cost-allocation",
      is_root_input: false,
      value_format: "number",
      formula_text:
        "Per-staff-type overhead recovery rows built from operational_group_cost_rows, aggregated across every group a staff type is assigned to (build_rate_builder_labour_recovery_rows). This spans groups per staff type, not a single group's total - the group-by-group arithmetic is not independently re-derived here, traced only via the hook's known output field. Value shown is row count, not a dollar figure.",
      brief_reference: "costAllocationRateBuilderSelectors.js (build_rate_builder_labour_recovery_rows)",
      last_verified_against: "Session 11, calculation trace Rate Builder extension",
      source_file: "lib/selectors/cost-allocation/costAllocationRateBuilderSelectors.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => (rows.length > 0 ? rows.length : null),
    },
  ];
}

export function buildRateBuilderLabourRateNodes(live) {
  const options = Array.isArray(live?.rate_builder?.labour_source_options)
    ? live.rate_builder.labour_source_options
    : [];

  return options.flatMap((option) => {
    const labour_source_type_id = option?.labour_source_type_id;
    if (!labour_source_type_id) {
      return [];
    }

    const label = option?.labour_source_type_name || labour_source_type_id;

    return [
      {
        node_id: `rate_builder.labour_rate.${labour_source_type_id}`,
        display_label: `${label} - Minimum Recoverable Charge-Out Rate (Rate Builder)`,
        module_name: "rate-builder",
        is_root_input: false,
        value_format: "currency_per_unit",
        formula_text:
          "minimum_recoverable_charge_out_rate = labour_cost_rate + allocated_business_overhead_recovery_rate. labour_cost_rate comes from Labour's per-staff-type weighted rate (not yet its own traced node). allocated_business_overhead_recovery_rate comes from the recovery-rows boundary node below. Neither leg is independently re-derived here.",
        brief_reference: "rateBuilderLabourSourceSelectors.js (build_labour_source_options / build_recovery_fields)",
        last_verified_against: "Session 11, calculation trace Rate Builder extension",
        source_file: "lib/selectors/rate-builder/rateBuilderLabourSourceSelectors.js",
        implementation_status: "live_traced_via_hook",
        inputs: ["cost_allocation.rate_builder_labour_recovery_rows"],
        resolve: () => safeNumber(option?.minimum_recoverable_charge_out_rate),
      },
    ];
  });
}