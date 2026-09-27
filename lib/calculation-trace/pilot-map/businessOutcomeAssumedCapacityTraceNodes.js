// Mirra v6.0 - Calculation Trace - Business Outcome Assumed Capacity ("Best Case") Nodes
// Session 13 (continued). The revenue-ceiling scaling mechanism, distinct
// from the real_capacity shortfall cascade (businessOutcomeRealCapacityTraceNodes.js):
// this one only activates when combined MODELLED revenue EXCEEDS real
// revenue - it scales every row down proportionally to what real revenue
// can actually support, producing "implied" (Best Case, i.e. "if your
// rates are genuinely achievable at this volume") figures.
//
// ASYMMETRY BETWEEN THE TWO VIEWS, confirmed by reading both functions:
//   VIEW A (apply_revenue_ceiling, inline in the hook): only labour +
//   asset rows participate. Materials is NOT part of this ceiling at all
//   - it never gets implied_revenue/implied_net_profit in View A. When
//   breached, materials' own revenue is separately hard-zeroed elsewhere
//   (materials.is_floored = true) - that coupling is not re-modelled as
//   an edge here to avoid overstating what this file traces; see the
//   ceiling boundary node's formula_text instead.
//   VIEW B (apply_revenue_ceiling_v2, businessOutcomeViewBCalculations.js):
//   materials IS a full peer in the ceiling, alongside labour/asset - it
//   gets its own implied_revenue/implied_net_profit like any other row.
//
// NOT TRACED (logged, not a gap in what was read): materials_independent_revenue
// (the markup-based "Best Case" materials figure, calc map s9.3) is
// computed at hook line ~1229 but only ever folded into total_modelled_revenue
// - never exposed as its own field on the output_contract. No live value
// exists to point a node at individually; it is baked into
// business_outcome's existing total_modelled_revenue figure (session 12,
// not modified here) untraceably beyond that point.
//
// Group-level View A rollups need NO new live-values work: group_implied_revenue
// / group_implied_net_profit are already summed onto labour_groups[] /
// asset_groups[] during session 12's grouping (group_sources_by_group),
// just never traced until now. View B has no equivalent pre-built
// rollup, so its group nodes sum the flat view_b.labour_sources[] /
// view_b.asset_sources[] rows per group_id here, same pattern as the
// real_capacity file's .find() lookups.

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildBusinessOutcomeAssumedCapacityBoundaryNodes(live) {
  const ceiling = live?.business_outcome?.revenue_ceiling;
  const view_b_ceiling = live?.business_outcome?.view_b?.revenue_ceiling;

  const nodes = [];

  if (ceiling) {
    nodes.push({
      node_id: "business_outcome.assumed_capacity_a.ceiling",
      display_label: "Assumed Capacity / Best Case Ceiling - View A (Business Outcome)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "number",
      formula_text:
        "apply_revenue_ceiling: combined_total = sum of labour + asset modelled_revenue (materials NOT included). is_breached = combined_total > real total_revenue. When breached, scale_factor = total_revenue / combined_total, and every labour/asset row''s implied_revenue = modelled_revenue x scale_factor. When breached, materials'' own revenue is separately hard-zeroed elsewhere (materials.is_floored) - not modelled as an edge from this node to avoid overstating what is traced here. Value shown is scale_factor (1 = not breached).",
      brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_revenue_ceiling, ~L525)",
      last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
      source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => safeNumber(ceiling.scale_factor),
    });
  }

  if (view_b_ceiling) {
    nodes.push({
      node_id: "business_outcome.assumed_capacity_b.ceiling",
      display_label: "Assumed Capacity / Best Case Ceiling - View B (Business Outcome)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "number",
      formula_text:
        "apply_revenue_ceiling_v2: combined_total = sum of labour + asset + materials modelled_revenue (materials IS included here, unlike View A). is_breached = combined_total > real total_revenue. When breached, scale_factor = total_revenue / combined_total, applied to every labour/asset/materials row''s implied_revenue. Value shown is scale_factor (1 = not breached).",
      brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_revenue_ceiling_v2)",
      last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
      source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => safeNumber(view_b_ceiling.scale_factor),
    });
  }

  return nodes;
}

export function buildBusinessOutcomeLabourSourceAssumedCapacityNodes(live) {
  const labour_groups = Array.isArray(live?.business_outcome?.labour_groups)
    ? live.business_outcome.labour_groups
    : [];
  const view_b_labour_sources = Array.isArray(live?.business_outcome?.view_b?.labour_sources)
    ? live.business_outcome.view_b.labour_sources
    : [];

  return labour_groups.flatMap((group) =>
    (Array.isArray(group.staff) ? group.staff : []).flatMap((row) => {
      const staff_type_id = row?.staff_type_id;
      const group_id = row?.group_id;
      if (!staff_type_id || !group_id) {
        return [];
      }

      const label = `${row.staff_type_name || staff_type_id} (${row.group_name || group_id})`;
      const naive_modelled_revenue_node_id = `business_outcome.labour_source.${group_id}.${staff_type_id}.modelled_revenue`;

      const view_b_row = view_b_labour_sources.find(
        (r) => r.group_id === group_id && r.staff_type_id === staff_type_id
      );

      const nodes = [
        {
          node_id: `business_outcome.labour_source.${group_id}.${staff_type_id}.implied_net_profit`,
          display_label: `${label} - Implied Net Profit / Best Case (View A)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "implied_revenue = modelled_revenue x scale_factor; implied_net_profit = implied_revenue - true_cost. Only differs from modelled_revenue/net_profit when the View A ceiling is breached (scale_factor < 1) - otherwise falls back to the unscaled figures.",
          brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_revenue_ceiling)",
          last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [naive_modelled_revenue_node_id, "business_outcome.assumed_capacity_a.ceiling"],
          resolve: () => safeNumber(row.implied_net_profit ?? row.net_profit),
        },
      ];

      if (view_b_row) {
        nodes.push({
          node_id: `business_outcome.labour_source.${group_id}.${staff_type_id}.view_b_implied_net_profit`,
          display_label: `${label} - Implied Net Profit / Best Case (View B)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "Same mechanism as View A''s implied figure, but scaled by View B''s ceiling instead, whose combined_total includes materials as a peer - so this can differ from the View A figure even when both start from the same naive modelled_revenue.",
          brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_revenue_ceiling_v2)",
          last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
          source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
          implementation_status: "live_verified_field",
          inputs: [naive_modelled_revenue_node_id, "business_outcome.assumed_capacity_b.ceiling"],
          resolve: () => safeNumber(view_b_row.implied_net_profit ?? view_b_row.net_profit),
        });
      }

      return nodes;
    })
  );
}

export function buildBusinessOutcomeAssetSourceAssumedCapacityNodes(live) {
  const asset_groups = Array.isArray(live?.business_outcome?.asset_groups)
    ? live.business_outcome.asset_groups
    : [];
  const view_b_asset_sources = Array.isArray(live?.business_outcome?.view_b?.asset_sources)
    ? live.business_outcome.view_b.asset_sources
    : [];

  return asset_groups.flatMap((group) =>
    (Array.isArray(group.assets) ? group.assets : []).flatMap((row) => {
      const asset_id = row?.asset_id;
      const group_id = row?.group_id;
      if (!asset_id || !group_id) {
        return [];
      }

      const label = `${row.asset_name || asset_id} (${row.group_name || group_id})`;
      const naive_modelled_revenue_node_id = `business_outcome.asset_source.${group_id}.${asset_id}.modelled_revenue`;

      const view_b_row = view_b_asset_sources.find(
        (r) => r.group_id === group_id && r.asset_id === asset_id
      );

      const nodes = [
        {
          node_id: `business_outcome.asset_source.${group_id}.${asset_id}.implied_net_profit`,
          display_label: `${label} - Implied Net Profit / Best Case (View A)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "implied_revenue = modelled_revenue x scale_factor; implied_net_profit = implied_revenue - true_cost. Only differs from modelled_revenue/net_profit when the View A ceiling is breached (scale_factor < 1) - otherwise falls back to the unscaled figures.",
          brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_revenue_ceiling)",
          last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [naive_modelled_revenue_node_id, "business_outcome.assumed_capacity_a.ceiling"],
          resolve: () => safeNumber(row.implied_net_profit ?? row.net_profit),
        },
      ];

      if (view_b_row) {
        nodes.push({
          node_id: `business_outcome.asset_source.${group_id}.${asset_id}.view_b_implied_net_profit`,
          display_label: `${label} - Implied Net Profit / Best Case (View B)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "Same mechanism as View A''s implied figure, but scaled by View B''s ceiling instead, whose combined_total includes materials as a peer - so this can differ from the View A figure even when both start from the same naive modelled_revenue.",
          brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_revenue_ceiling_v2)",
          last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
          source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
          implementation_status: "live_verified_field",
          inputs: [naive_modelled_revenue_node_id, "business_outcome.assumed_capacity_b.ceiling"],
          resolve: () => safeNumber(view_b_row.implied_net_profit ?? view_b_row.net_profit),
        });
      }

      return nodes;
    })
  );
}

// View B ONLY - materials does not participate in View A''s ceiling at
// all (see this file''s header note).
export function buildBusinessOutcomeMaterialsAssumedCapacityNode(live) {
  const view_b_materials = live?.business_outcome?.view_b?.materials;
  if (!view_b_materials) {
    return [];
  }

  return [
    {
      node_id: "business_outcome.materials.view_b_implied_net_profit",
      display_label: "Materials - Implied Net Profit / Best Case (View B)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "Materials participates as a full peer in View B''s ceiling (unlike View A, where materials has no implied figure at all). implied_revenue = modelled_revenue x scale_factor; implied_net_profit = implied_revenue - true_cost.",
      brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_revenue_ceiling_v2)",
      last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
      source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
      implementation_status: "live_verified_field",
      inputs: ["business_outcome.materials.view_b_net_profit", "business_outcome.assumed_capacity_b.ceiling"],
      resolve: () => safeNumber(view_b_materials.implied_net_profit ?? view_b_materials.net_profit),
    },
  ];
}

export function buildBusinessOutcomeGroupAssumedCapacityNodes(live) {
  const labour_groups = Array.isArray(live?.business_outcome?.labour_groups)
    ? live.business_outcome.labour_groups
    : [];
  const asset_groups = Array.isArray(live?.business_outcome?.asset_groups)
    ? live.business_outcome.asset_groups
    : [];
  const view_b_labour_sources = Array.isArray(live?.business_outcome?.view_b?.labour_sources)
    ? live.business_outcome.view_b.labour_sources
    : [];
  const view_b_asset_sources = Array.isArray(live?.business_outcome?.view_b?.asset_sources)
    ? live.business_outcome.view_b.asset_sources
    : [];

  const group_ids = new Set([
    ...labour_groups.map((g) => g.group_id),
    ...asset_groups.map((g) => g.group_id),
  ]);

  return Array.from(group_ids).flatMap((group_id) => {
    if (!group_id) {
      return [];
    }

    const labour_group = labour_groups.find((g) => g.group_id === group_id);
    const asset_group = asset_groups.find((g) => g.group_id === group_id);
    const label = labour_group?.group_name || asset_group?.group_name || group_id;

    const view_a_implied_net_profit =
      (labour_group?.group_implied_net_profit ?? 0) + (asset_group?.group_implied_net_profit ?? 0);

    const view_b_group_rows = [
      ...view_b_labour_sources.filter((r) => r.group_id === group_id),
      ...view_b_asset_sources.filter((r) => r.group_id === group_id),
    ];
    const view_b_implied_net_profit = view_b_group_rows.reduce(
      (sum, r) => sum + (r.implied_net_profit ?? r.net_profit ?? 0),
      0
    );

    return [
      {
        node_id: `business_outcome.group.${group_id}.implied_net_profit`,
        display_label: `${label} - Group Implied Net Profit / Best Case (View A)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Sum of every labour and asset source''s implied_net_profit (falling back to net_profit where the ceiling was not breached) within this Cost Allocation group, View A. Already summed during session 12''s grouping (group_implied_net_profit) - this node just traces the existing field.",
        brief_reference: "businessOutcomePerSourceRevenueSelectors.js (group_sources_by_group)",
        last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
        source_file: "lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors.js",
        implementation_status: "live_verified_field",
        inputs: [`business_outcome.group.${group_id}.modelled_revenue`, "business_outcome.assumed_capacity_a.ceiling"],
        resolve: () => safeNumber(view_a_implied_net_profit),
      },
      {
        node_id: `business_outcome.group.${group_id}.view_b_implied_net_profit`,
        display_label: `${label} - Group Implied Net Profit / Best Case (View B)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Sum of every labour and asset source''s implied_net_profit (View B) within this Cost Allocation group - computed here from View B''s flat per-source rows, since no pre-built group-level rollup exists for View B''s ceiling output.",
        brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_revenue_ceiling_v2)",
        last_verified_against: "Session 13, calculation trace Business Outcome Assumed Capacity extension",
        source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
        implementation_status: "live_verified_field",
        inputs: [`business_outcome.group.${group_id}.modelled_revenue`, "business_outcome.assumed_capacity_b.ceiling"],
        resolve: () => safeNumber(view_b_implied_net_profit),
      },
    ];
  });
}