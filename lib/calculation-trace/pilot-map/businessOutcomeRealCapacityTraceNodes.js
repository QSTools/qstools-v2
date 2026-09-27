// Mirra v6.0 - Calculation Trace - Business Outcome Real Capacity / View B Nodes
// Session 13. The two cascades deferred by session 12's naive-slice note.
//
// THESE ARE TWO GENUINELY DIFFERENT MECHANISMS, not two runs of the same
// one - confirmed by reading both functions in full:
//
//   VIEW A (apply_real_capacity, defined inline in
//   useBusinessOutcomePerSourceRevenue.js): materials is NOT a cascade
//   group. shortfall here is materials' OWN gap only
//   (max(0, materials_true_cost - materials_naive_revenue)) - the 5
//   labour/asset groups absorb THAT shortfall via the two-phase cascade.
//   materials.real_capacity_net_profit is then FLOORED:
//   materials_final_revenue = max(materials_naive_revenue,
//   materials_true_cost) - so it can never go negative.
//
//   VIEW B (apply_real_capacity_v2, businessOutcomeViewBCalculations.js):
//   materials IS a full peer group inside the same cascade as labour/
//   asset. shortfall is GLOBAL (total_modelled_revenue_all -
//   total_revenue_reference, all peers combined). materials absorbs
//   cascade pressure exactly like any other group - genuinely can go
//   negative, no floor.
//
// Both share the same two-phase STRUCTURE (Step 1: outer cascade across
// groups, proportional to each group's positive naive profit then its
// revenue share; Step 2: inner cascade pushing each group's own
// adjustment down to its individual rows, proportional to each row's own
// margin then its revenue share) - modelled here as ONE boundary node per
// cascade instance (matching the existing Rate Builder recovery-rows /
// Cost Allocation overhead-pool precedent) rather than atomizing every
// intermediate (v0, phase1_factor, inner_v0...) into its own node - that
// granularity would roughly triple this slice's node count for steps
// that are one interlocking mechanism, not independently checkable facts.
//
// NO NEW LIVE-VALUES MOUNT NEEDED: every field these nodes read
// (real_capacity.group_real_capacity[], view_b.real_capacity.
// group_real_capacity[], materials.real_capacity_net_profit, view_b.
// materials.real_capacity_net_profit, and row-level real_capacity_net_profit
// already spread onto labour_groups[].staff[] / flat in view_b.
// labour_sources[] / view_b.asset_sources[]) is already exposed by the
// existing business_outcome mount from session 12.

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildBusinessOutcomeRealCapacityBoundaryNodes(live) {
  const real_capacity = live?.business_outcome?.real_capacity;
  const view_b_real_capacity = live?.business_outcome?.view_b?.real_capacity;

  const nodes = [];

  if (real_capacity) {
    nodes.push({
      node_id: "business_outcome.real_capacity_a.cascade",
      display_label: "Real Capacity Cascade - View A (Business Outcome)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "Two-phase cascade (apply_real_capacity): shortfall = materials' OWN gap only (max(0, materials_true_cost - materials_naive_revenue)). Phase 1 spreads that shortfall across the 5 labour/asset groups proportional to each group's positive naive profit; Phase 2 spreads any leftover proportional to each group's revenue share. A second inner pass repeats the same two-phase logic within each group, down to its individual labour/asset sources. Materials itself is NOT a cascade group here - it is floored separately (see business_outcome.materials.real_capacity_net_profit) and can never go negative in this view.",
      brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_real_capacity, ~L778)",
      last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
      source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => safeNumber(real_capacity.shortfall),
    });
  }

  if (view_b_real_capacity) {
    nodes.push({
      node_id: "business_outcome.real_capacity_b.cascade",
      display_label: "Real Capacity Cascade - View B (Business Outcome)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "Two-phase cascade (apply_real_capacity_v2): shortfall is GLOBAL - total modelled revenue across ALL peers (labour + asset + materials combined) minus real total revenue. Materials is a genuine peer group inside this SAME cascade, not a special case - Phase 1/Phase 2 and the inner per-source pass treat it exactly like any labour/asset group. No flooring: materials' real_capacity_net_profit in this view can be negative, same as any operating group.",
      brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_real_capacity_v2)",
      last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
      source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => safeNumber(view_b_real_capacity.shortfall),
    });
  }

  return nodes;
}

export function buildBusinessOutcomeLabourSourceRealCapacityNodes(live) {
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
      const naive_net_profit_node_id = `business_outcome.labour_source.${group_id}.${staff_type_id}.net_profit`;

      const view_b_row = view_b_labour_sources.find(
        (r) => r.group_id === group_id && r.staff_type_id === staff_type_id
      );

      const nodes = [
        {
          node_id: `business_outcome.labour_source.${group_id}.${staff_type_id}.real_capacity_net_profit`,
          display_label: `${label} - Real Capacity Net Profit (View A)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "This source's as-priced net_profit, adjusted down by its group's and then its own share of the View A cascade's shortfall absorption (Step 1 group-level, Step 2 inner per-source pass, both proportional). See the real_capacity_a.cascade boundary node for the mechanism.",
          brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_real_capacity, Step 2 inner cascade)",
          last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [naive_net_profit_node_id, "business_outcome.real_capacity_a.cascade"],
          resolve: () => safeNumber(row.real_capacity_net_profit),
        },
      ];

      if (view_b_row) {
        nodes.push({
          node_id: `business_outcome.labour_source.${group_id}.${staff_type_id}.view_b_real_capacity_net_profit`,
          display_label: `${label} - Real Capacity Net Profit (View B)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "Same as-priced net_profit as View A's row, but adjusted down by View B's GLOBAL cascade instead - materials competes as a full peer for the same shortfall pool here, so this figure can differ from the View A row above even though both start from the identical naive net_profit. See the real_capacity_b.cascade boundary node.",
          brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_real_capacity_v2, Step 2 inner cascade)",
          last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
          source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
          implementation_status: "live_verified_field",
          inputs: [naive_net_profit_node_id, "business_outcome.real_capacity_b.cascade"],
          resolve: () => safeNumber(view_b_row.real_capacity_net_profit),
        });
      }

      return nodes;
    })
  );
}

export function buildBusinessOutcomeAssetSourceRealCapacityNodes(live) {
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
      const naive_net_profit_node_id = `business_outcome.asset_source.${group_id}.${asset_id}.net_profit`;

      const view_b_row = view_b_asset_sources.find(
        (r) => r.group_id === group_id && r.asset_id === asset_id
      );

      const nodes = [
        {
          node_id: `business_outcome.asset_source.${group_id}.${asset_id}.real_capacity_net_profit`,
          display_label: `${label} - Real Capacity Net Profit (View A)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "This source's as-priced net_profit, adjusted down by its group's and then its own share of the View A cascade's shortfall absorption (Step 1 group-level, Step 2 inner per-source pass, both proportional). See the real_capacity_a.cascade boundary node for the mechanism.",
          brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_real_capacity, Step 2 inner cascade)",
          last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [naive_net_profit_node_id, "business_outcome.real_capacity_a.cascade"],
          resolve: () => safeNumber(row.real_capacity_net_profit),
        },
      ];

      if (view_b_row) {
        nodes.push({
          node_id: `business_outcome.asset_source.${group_id}.${asset_id}.view_b_real_capacity_net_profit`,
          display_label: `${label} - Real Capacity Net Profit (View B)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "Same as-priced net_profit as View A's row, but adjusted down by View B's GLOBAL cascade instead - materials competes as a full peer for the same shortfall pool here, so this figure can differ from the View A row above even though both start from the identical naive net_profit. See the real_capacity_b.cascade boundary node.",
          brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_real_capacity_v2, Step 2 inner cascade)",
          last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
          source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
          implementation_status: "live_verified_field",
          inputs: [naive_net_profit_node_id, "business_outcome.real_capacity_b.cascade"],
          resolve: () => safeNumber(view_b_row.real_capacity_net_profit),
        });
      }

      return nodes;
    })
  );
}

export function buildBusinessOutcomeMaterialsRealCapacityNodes(live) {
  const materials = live?.business_outcome?.materials;
  const view_b_materials = live?.business_outcome?.view_b?.materials;

  const nodes = [];

  if (materials) {
    nodes.push({
      node_id: "business_outcome.materials.real_capacity_net_profit",
      display_label: "Materials - Real Capacity Net Profit (View A, floored)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "materials_final_revenue = max(materials_naive_revenue, materials_true_cost); real_capacity_net_profit = materials_final_revenue - materials_true_cost. FLOORED - can never be negative in View A. Materials is not a cascade group here; this is a separate calculation from the 5 labour/asset groups' cascade.",
      brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_real_capacity)",
      last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
      source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
      implementation_status: "live_verified_field",
      inputs: ["business_outcome.materials.net_profit", "business_outcome.real_capacity_a.cascade"],
      resolve: () => safeNumber(materials.real_capacity_net_profit),
    });
  }

  if (view_b_materials) {
    nodes.push({
      node_id: "business_outcome.materials.view_b_net_profit",
      display_label: "Materials - Naive Net Profit (View B, markup-based)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "modelled_revenue = total_cogs x (1 + materials_markup_percent / 100); true_cost = total_cogs + max(residual_overhead, 0); net_profit = modelled_revenue - true_cost (build_materials_source). Genuinely DIFFERENT from business_outcome.materials.net_profit (View A) - that figure is a REVENUE RESIDUAL (total_revenue - labour - asset modelled revenue), this one is markup-based off real COGS. The two are not the same calculation and should not be expected to match.",
      brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (build_materials_source)",
      last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension (bug found live: this node was missing, View B real_capacity was incorrectly wired to View A's materials.net_profit node)",
      source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
      implementation_status: "live_verified_field",
      inputs: ["revenue_cogs.total_direct_costs"],
      resolve: () => safeNumber(view_b_materials.net_profit),
    });
    nodes.push({
      node_id: "business_outcome.materials.view_b_real_capacity_net_profit",
      display_label: "Materials - Real Capacity Net Profit (View B, unfloored)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "Materials treated as a full peer group inside View B's global cascade, same two-phase mechanism as any labour/asset group. NOT floored - can be negative, unlike the View A figure. Starts from View B's OWN naive net_profit (markup-based), not View A's residual-based figure - see business_outcome.materials.view_b_net_profit.",
      brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_real_capacity_v2)",
      last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
      source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
      implementation_status: "live_verified_field",
      inputs: ["business_outcome.materials.view_b_net_profit", "business_outcome.real_capacity_b.cascade"],
      resolve: () => safeNumber(view_b_materials.real_capacity_net_profit),
    });
  }

  return nodes;
}

export function buildBusinessOutcomeGroupRealCapacityNodes(live) {
  const group_real_capacity = Array.isArray(live?.business_outcome?.real_capacity?.group_real_capacity)
    ? live.business_outcome.real_capacity.group_real_capacity
    : [];
  const view_b_group_real_capacity = Array.isArray(
    live?.business_outcome?.view_b?.real_capacity?.group_real_capacity
  )
    ? live.business_outcome.view_b.real_capacity.group_real_capacity
    : [];

  const view_a_nodes = group_real_capacity.flatMap((g) => {
    const group_id = g?.group_id;
    if (!group_id) {
      return [];
    }
    return [
      {
        node_id: `business_outcome.group.${group_id}.real_capacity_net_profit`,
        display_label: `${g.group_name || group_id} - Group Real Capacity Net Profit (View A)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Group-level result of the View A cascade's Step 1 (outer, proportional to positive naive profit then revenue share) - the same figure the inner Step 2 pass then distributes down to this group's individual labour/asset sources.",
        brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (apply_real_capacity, Step 1)",
        last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
        source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
        implementation_status: "live_verified_field",
        inputs: [
          `business_outcome.group.${group_id}.net_profit`,
          `business_outcome.group.${group_id}.non_productive_cost`,
          "business_outcome.real_capacity_a.cascade",
        ],
        resolve: () => safeNumber(g.final_net_profit),
      },
    ];
  });

  const view_b_nodes = view_b_group_real_capacity.flatMap((g) => {
    const group_id = g?.group_id;
    // Materials appears as its own "group" in View B's cascade output -
    // already covered by buildBusinessOutcomeMaterialsRealCapacityNodes
    // above, so skip it here to avoid two node_ids for the same figure.
    if (!group_id || group_id === "materials") {
      return [];
    }
    return [
      {
        node_id: `business_outcome.group.${group_id}.view_b_real_capacity_net_profit`,
        display_label: `${g.group_name || group_id} - Group Real Capacity Net Profit (View B)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Group-level result of View B's GLOBAL cascade Step 1 - materials competes as a full peer group for the same shortfall pool here, so this can differ from the View A figure for the same group even when both start from the identical naive net_profit.",
        brief_reference: "lib/calculations/businessOutcomeViewBCalculations.js (apply_real_capacity_v2, Step 1)",
        last_verified_against: "Session 13, calculation trace Business Outcome Real Capacity extension",
        source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
        implementation_status: "live_verified_field",
        inputs: [
          `business_outcome.group.${group_id}.net_profit`,
          `business_outcome.group.${group_id}.non_productive_cost`,
          "business_outcome.real_capacity_b.cascade",
        ],
        resolve: () => safeNumber(g.final_net_profit),
      },
    ];
  });

  return [...view_a_nodes, ...view_b_nodes];
}