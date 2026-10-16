// Mirra v6.0 - Calculation Trace - Idle Cost and Capacity Gap Nodes
// R2 rider backfill (2026-10-17). The idle cost work shipped 2026-10-15
// (IDLE_COST_BUSINESS_OUTCOME_DESIGN_BRIEF Steps 1-4) without trace nodes;
// the 2026-10-16 definition of done says a calculated figure is not done
// until it has one. DISPLAY-ONLY figures: none of these feeds a net profit,
// revenue, cost or rate, so none of these nodes is wired INTO a total.
//
// Figures covered:
//   Cost Allocation  idle_labour_hours, idle_labour_cost (per working group,
//                    costAllocationGroupCostBuilder.js)
//   Business Outcome idle_labour_by_group hours and cost (tied groups only,
//                    businessOutcomeIdleLabourSelectors.js)
//   Business Outcome capacity gap hours, gap dollars and the completeness
//                    flag (calculate_capacity_coverage_gap in the hook, which
//                    calls calculate_per_asset_shortfall_dollars)
//
// Baseline only: like the other Business Outcome nodes these follow the
// no-override path (Business Modelling overrides on the shortfall figure are
// not traced here).
//
// SHAPE RULES: Cost Allocation idle nodes exist for every working group that
// has an id (value 0 when the tick box is off). Business Outcome idle nodes
// exist only for groups in idle_labour_by_group (tied and really idle). Gap
// hours nodes exist for every row of capacity_coverage_gap; gap dollar and
// completeness nodes only where gap_type is not "none".

// Unlike the safeNumber in the older trace files, null/undefined stay null here:
// an unpriceable gap figure must never show as $0 (owner rule: no silent low number).
function safeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cost_allocation_input_ids(row) {
  const labour_ids = Array.isArray(row?.labour_group_assignments)
    ? row.labour_group_assignments
        .map((a) => a?.staff_type_id)
        .filter(Boolean)
        .map((id) => `cost_allocation.labour_type.${id}`)
    : [];
  const asset_ids = Array.isArray(row?.asset_group_assignments)
    ? row.asset_group_assignments
        .map((a) => a?.asset_id)
        .filter(Boolean)
        .map((id) => `cost_allocation.asset.${id}`)
    : [];
  return [...labour_ids, ...asset_ids];
}

export function buildIdleCostCostAllocationNodes(live) {
  const rows = Array.isArray(live?.cost_allocation?.operational_group_cost_rows)
    ? live.cost_allocation.operational_group_cost_rows
    : [];

  return rows.flatMap((row) => {
    const group_id = row?.group_id;
    if (!group_id) {
      return [];
    }

    const label = row.group_name || group_id;
    const hours_node_id = `cost_allocation.group.${group_id}.idle_labour_hours`;

    return [
      {
        node_id: hours_node_id,
        display_label: `${label} - Idle Labour Hours (Cost Allocation)`,
        module_name: "cost-allocation",
        is_root_input: false,
        value_format: "number",
        formula_text:
          "idle_labour_hours = assigned_labour_hours - required_asset_hours, only when the group's 'labour is tied to the asset' box is ticked, the group recovers on asset hours, and assigned labour hours exceed required asset hours; otherwise 0. DISPLAY ONLY - the cost of these hours is already inside the group's cost per hour and net profit.",
        brief_reference: "IDLE_COST_BUSINESS_OUTCOME_DESIGN_BRIEF section 3.2 (D4 in costAllocationGroupCostBuilder.js)",
        last_verified_against: "R2 rider, idle cost trace backfill (2026-10-17)",
        source_file: "lib/calculations/cost-allocation/costAllocationGroupCostBuilder.js",
        implementation_status: "live_verified_field",
        inputs: cost_allocation_input_ids(row),
        resolve: () => safeNumber(row.idle_labour_hours),
      },
      {
        node_id: `cost_allocation.group.${group_id}.idle_labour_cost`,
        display_label: `${label} - Idle Labour Cost (Cost Allocation)`,
        module_name: "cost-allocation",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "idle_labour_cost = idle_labour_hours x (assigned_labour_cost / assigned_labour_hours). Valued at raw labour cost per assigned hour (D-IDLE-1), not the blended rate. DISPLAY ONLY - already inside the group's net profit, never added to or subtracted from a total.",
        brief_reference: "IDLE_COST_BUSINESS_OUTCOME_DESIGN_BRIEF D-IDLE-1 (D4 in costAllocationGroupCostBuilder.js)",
        last_verified_against: "R2 rider, idle cost trace backfill (2026-10-17)",
        source_file: "lib/calculations/cost-allocation/costAllocationGroupCostBuilder.js",
        implementation_status: "live_verified_field",
        inputs: [hours_node_id, ...cost_allocation_input_ids(row).filter((id) => id.startsWith("cost_allocation.labour_type."))],
        resolve: () => safeNumber(row.idle_labour_cost),
      },
    ];
  });
}

export function buildIdleCostBusinessOutcomeNodes(live) {
  const business_outcome = live?.business_outcome;
  if (!business_outcome) {
    return [];
  }

  const cost_rows = Array.isArray(live?.cost_allocation?.operational_group_cost_rows)
    ? live.cost_allocation.operational_group_cost_rows
    : [];
  const known_group_ids = new Set(cost_rows.map((r) => r?.group_id).filter(Boolean));

  const labour_groups = Array.isArray(business_outcome.labour_groups) ? business_outcome.labour_groups : [];
  const asset_groups = Array.isArray(business_outcome.asset_groups) ? business_outcome.asset_groups : [];

  const idle_by_group =
    business_outcome.idle_labour_by_group && typeof business_outcome.idle_labour_by_group === "object"
      ? business_outcome.idle_labour_by_group
      : {};

  const idle_nodes = Object.keys(idle_by_group).flatMap((group_id) => {
    if (!known_group_ids.has(group_id)) {
      return [];
    }
    const entry = idle_by_group[group_id];
    const label =
      cost_rows.find((r) => r?.group_id === group_id)?.group_name || group_id;
    const hours_node_id = `business_outcome.group.${group_id}.idle_labour_hours`;

    return [
      {
        node_id: hours_node_id,
        display_label: `${label} - Idle Labour Hours (Business Outcome)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "number",
        formula_text:
          "Cost Allocation's idle_labour_hours for this group, rounded to 2 decimals, shown only when the group's 'labour is tied to the asset' box is ticked and it really has idle hours (build_idle_labour_by_group). Nothing is recomputed in Business Outcome. DISPLAY ONLY.",
        brief_reference: "businessOutcomeIdleLabourSelectors.js (build_idle_labour_by_group), idle cost Step 3",
        last_verified_against: "R2 rider, idle cost trace backfill (2026-10-17)",
        source_file: "lib/selectors/business-outcome/businessOutcomeIdleLabourSelectors.js",
        implementation_status: "live_verified_field",
        inputs: [`cost_allocation.group.${group_id}.idle_labour_hours`],
        resolve: () => safeNumber(entry?.hours),
      },
      {
        node_id: `business_outcome.group.${group_id}.idle_labour_cost`,
        display_label: `${label} - Idle Labour Cost (Business Outcome)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Cost Allocation's idle_labour_cost for this group, rounded to 2 decimals, same gating as the idle hours. The cost is already inside the group's net profit; this figure explains it and is never added to or subtracted from any total. DISPLAY ONLY.",
        brief_reference: "businessOutcomeIdleLabourSelectors.js (build_idle_labour_by_group), idle cost Step 3",
        last_verified_against: "R2 rider, idle cost trace backfill (2026-10-17)",
        source_file: "lib/selectors/business-outcome/businessOutcomeIdleLabourSelectors.js",
        implementation_status: "live_verified_field",
        inputs: [hours_node_id, `cost_allocation.group.${group_id}.idle_labour_cost`],
        resolve: () => safeNumber(entry?.cost),
      },
    ];
  });

  const gap_rows = Array.isArray(business_outcome.capacity_coverage_gap)
    ? business_outcome.capacity_coverage_gap
    : [];

  const gap_nodes = gap_rows.flatMap((gap) => {
    const group_id = gap?.group_id;
    if (!group_id || !known_group_ids.has(group_id)) {
      return [];
    }
    const cost_row = cost_rows.find((r) => r?.group_id === group_id);
    const label = gap.group_name || group_id;
    const gap_type = gap.gap_type || "none";

    const hours_node = {
      node_id: `business_outcome.group.${group_id}.capacity_gap_hours`,
      display_label: `${label} - Capacity Coverage Gap Hours (Business Outcome)`,
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "number",
      formula_text:
        "gap_hours = hours the assets need - assigned labour hours (asset-driven groups use required_asset_hours; others use group recovery hours). Positive = labour shortfall, negative = surplus labour. DISPLAY ONLY - no total reads it.",
      brief_reference: "useBusinessOutcomePerSourceRevenue.js (calculate_capacity_coverage_gap)",
      last_verified_against: "R2 rider, idle cost trace backfill (2026-10-17)",
      source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
      implementation_status: "live_traced_via_hook",
      inputs: cost_allocation_input_ids(cost_row),
      resolve: () => safeNumber(gap.gap_hours),
    };

    if (gap_type === "none") {
      return [hours_node];
    }

    // Inputs for the dollar figure: only ids this graph really builds.
    const labour_group = labour_groups.find((g) => g.group_id === group_id);
    const asset_group = asset_groups.find((g) => g.group_id === group_id);
    const revenue_input_ids = [
      ...(labour_group?.staff ?? []).map(
        (s) => `business_outcome.labour_source.${group_id}.${s.staff_type_id}.modelled_revenue`
      ),
      ...(asset_group?.assets ?? []).map(
        (a) => `business_outcome.asset_source.${group_id}.${a.asset_id}.modelled_revenue`
      ),
    ];
    const dollars_inputs = [hours_node.node_id];
    if (gap_type === "wasted_cost" && idle_by_group[group_id]) {
      dollars_inputs.push(`business_outcome.group.${group_id}.idle_labour_cost`);
    } else if (gap_type === "revenue_at_risk") {
      dollars_inputs.push(...revenue_input_ids);
    }

    const dollars_node_id = `business_outcome.group.${group_id}.capacity_gap_dollars`;

    return [
      hours_node,
      {
        node_id: dollars_node_id,
        display_label: `${label} - Capacity Coverage Gap Dollars (Business Outcome)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Dollar value of the capacity gap. revenue_at_risk (asset-driven shortfall): for a group priced PER ASSET = sum over assets of asset rate x asset hours x (1 - covered/required) + labour mix charge-out rate x (required - covered) (calculate_per_asset_shortfall_dollars); for a legacy group-calculator group = gap hours x group blended rate. wasted_cost (asset-driven surplus, tick box ticked) = Cost Allocation's idle_labour_cost. opportunity / data_check (labour-driven) = gap hours x blended rate / labour cost rate. Null when the figure cannot be priced at all. When the completeness flag is 0 the value is 'at least' this amount. DISPLAY ONLY - this is revenue BO-6 already removes, so it reconciles to net profit by construction and is never added to a total.",
        brief_reference: "IDLE_COST_BUSINESS_OUTCOME_DESIGN_BRIEF section 4 (O-2); businessOutcomeShortfallDollars.js",
        last_verified_against: "R2 rider, idle cost trace backfill (2026-10-17)",
        source_file: "lib/calculations/businessOutcomeShortfallDollars.js",
        implementation_status: "live_traced_via_hook",
        inputs: dollars_inputs,
        resolve: () => safeNumber(gap.gap_dollar_value),
      },
      {
        node_id: `${dollars_node_id}_is_complete`,
        display_label: `${label} - Capacity Gap Dollars Fully Priced (1 = yes, 0 = at least)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "number",
        formula_text:
          "1 when every asset and labour type behind the gap dollar figure has a price; 0 when something is missing (an asset with no Rate Builder price, a labour type with no charge-out rate, or no labour assigned) and the dollar figure is therefore 'at least' that amount (E-1, E-2, E-3). Reasons are listed in gap_dollar_incomplete_reasons.",
        brief_reference: "IDLE_COST_BUSINESS_OUTCOME_DESIGN_BRIEF section 4 edge cases E-1 to E-3",
        last_verified_against: "R2 rider, idle cost trace backfill (2026-10-17)",
        source_file: "lib/calculations/businessOutcomeShortfallDollars.js",
        implementation_status: "live_traced_via_hook",
        inputs: [dollars_node_id],
        resolve: () => (gap.gap_dollar_is_complete === false ? 0 : 1),
      },
    ];
  });

  return [...idle_nodes, ...gap_nodes];
}