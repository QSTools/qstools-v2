// Mirra v6.0 - Calculation Trace - Business Outcome Nodes
// Session 12. Business Outcome's per-source revenue attribution
// (useBusinessOutcomePerSourceRevenue + selectBusinessOutcomePerSourceRevenue)
// is mounted a SECOND, independent time here (same proven-tolerated
// double-mount pattern already used for Business Summary and Rate
// Builder in this trace tool) - called with NO overrides, matching
// exactly the naive per_source Business Modelling itself reads
// (useBusinessModelling.js's `per_source`, NOT `modelled_per_source`,
// per that file's own revert comment: the real-capacity/View B
// cascades are deliberately excluded from live-lever modelling because
// they are DESIGNED to always reconcile to today's real revenue and so
// can never move with a lever - this trace slice follows the same
// naive path modelling actually runs on, not the reconciled Outcome
// view).
//
// DELIBERATELY OUT OF SCOPE this slice (see
// CALCULATION_TRACE_VERIFICATION_LAYER_FUTURE_BUILD_BRIEF_2026-09-26.txt,
// session 12 entry): the real_capacity two-phase cascade
// (naive_net_profit -> final_net_profit) and View B's parallel cascade.
// Both are genuinely different "true" net-profit figures from the naive
// rows traced here and deserve their own explicit node design, not a
// silent collapse into one number.
//
// SHARED NODES: a labour source's revenue-side figures point back at
// the SAME cost_allocation.labour_type.<staff_type_id> node Cost
// Allocation's own nodes use (costAllocationTraceNodes.js) - this is
// the same source, just viewed from the revenue side, not a new root.
// Same for assets -> cost_allocation.asset.<asset_id>.

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildBusinessOutcomePerSourceBoundaryNode(live) {
  const per_source = live?.business_outcome;
  if (!per_source || per_source.data_status !== "ready") {
    return [];
  }

  const source_count =
    (Array.isArray(per_source.labour_groups)
      ? per_source.labour_groups.reduce((sum, g) => sum + (g.staff?.length ?? 0), 0)
      : 0) +
    (Array.isArray(per_source.asset_groups)
      ? per_source.asset_groups.reduce((sum, g) => sum + (g.assets?.length ?? 0), 0)
      : 0);

  return [
    {
      node_id: "business_outcome.per_source_revenue",
      display_label: "Per-Source Revenue Attribution (Business Outcome)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "number",
      formula_text:
        "Every labour source and priced asset's modelled revenue (real charge-out/blended rate x real expected hours) and true cost, attributed per source and rolled up per Cost Allocation group (useBusinessOutcomePerSourceRevenue + selectBusinessOutcomePerSourceRevenue). Modelled, not actual invoiced revenue - the variance against real P&L is a diagnostic, not an error. The blended-rate resolution, CM-1 labour-mix subtraction, and overhead split are not independently re-derived here - traced only via the hook's known output rows. Value shown is source row count, not a dollar figure.",
      brief_reference: "useBusinessOutcomePerSourceRevenue.js / businessOutcomePerSourceRevenueSelectors.js",
      last_verified_against: "Session 12, calculation trace Business Outcome extension",
      source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => (source_count > 0 ? source_count : null),
    },
  ];
}

export function buildBusinessOutcomeLabourSourceNodes(live) {
  const labour_groups = Array.isArray(live?.business_outcome?.labour_groups)
    ? live.business_outcome.labour_groups
    : [];

  return labour_groups.flatMap((group) =>
    (Array.isArray(group.staff) ? group.staff : []).flatMap((row) => {
      const staff_type_id = row?.staff_type_id;
      const group_id = row?.group_id;
      if (!staff_type_id || !group_id) {
        return [];
      }

      const label = `${row.staff_type_name || staff_type_id} (${row.group_name || group_id})`;
      const modelled_revenue_node_id = `business_outcome.labour_source.${group_id}.${staff_type_id}.modelled_revenue`;

      return [
        {
          node_id: modelled_revenue_node_id,
          display_label: `${label} - Modelled Revenue (Business Outcome)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "modelled_revenue = charge_out_rate x revenue_hours (this labour source's charge-out rate x its assigned hours in this group). Modelled, not actual invoiced revenue.",
          brief_reference: "businessOutcomePerSourceRevenueSelectors.js (build_labour_sources)",
          last_verified_against: "Session 12, calculation trace Business Outcome extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [
            `cost_allocation.labour_type.${staff_type_id}`,
            "business_outcome.per_source_revenue",
          ],
          resolve: () => safeNumber(row.modelled_revenue),
        },
        {
          node_id: `business_outcome.labour_source.${group_id}.${staff_type_id}.net_profit`,
          display_label: `${label} - Net Profit (Business Outcome, as-priced)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "net_profit = modelled_revenue - true_cost. As-priced (naive) figure - NOT the real_capacity cascade or View B's smoothed figure, which are separate, not yet traced concepts.",
          brief_reference: "businessOutcomePerSourceRevenueSelectors.js (build_labour_sources)",
          last_verified_against: "Session 12, calculation trace Business Outcome extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [modelled_revenue_node_id],
          resolve: () => safeNumber(row.net_profit),
        },
      ];
    })
  );
}

export function buildBusinessOutcomeAssetSourceNodes(live) {
  const asset_groups = Array.isArray(live?.business_outcome?.asset_groups)
    ? live.business_outcome.asset_groups
    : [];

  return asset_groups.flatMap((group) =>
    (Array.isArray(group.assets) ? group.assets : []).flatMap((row) => {
      const asset_id = row?.asset_id;
      const group_id = row?.group_id;
      if (!asset_id || !group_id) {
        return [];
      }

      const label = `${row.asset_name || asset_id} (${row.group_name || group_id})`;
      const modelled_revenue_node_id = `business_outcome.asset_source.${group_id}.${asset_id}.modelled_revenue`;

      return [
        {
          node_id: modelled_revenue_node_id,
          display_label: `${label} - Modelled Revenue (Business Outcome)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "modelled_revenue = group_asset_revenue x this asset's share of the group's asset cost. group_asset_revenue = net_asset_rate x covered hours; net_asset_rate = blended calculator rate minus the group's labour-mix charge rate (CM-1, all-in rate split). Covered hours are operated hours only (F-7). A row ticked 'earns without operator' (dry hire) instead earns its Rate Builder per-asset price x its own hours, or nothing (blank) when it has no per-asset price; it takes no part in the cost-share split. Modelled, not actual invoiced revenue.",
          brief_reference: "businessOutcomePerSourceRevenueSelectors.js (build_asset_sources)",
          last_verified_against: "Session 12, calculation trace Business Outcome extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [
            `cost_allocation.asset.${asset_id}`,
            "business_outcome.per_source_revenue",
          ],
          resolve: () => safeNumber(row.modelled_revenue),
        },
        {
          node_id: `business_outcome.asset_source.${group_id}.${asset_id}.net_profit`,
          display_label: `${label} - Net Profit (Business Outcome, as-priced)`,
          module_name: "business-outcome",
          is_root_input: false,
          value_format: "currency",
          formula_text:
            "net_profit = modelled_revenue - true_cost. As-priced (naive) figure - NOT the real_capacity cascade or View B's smoothed figure, which are separate, not yet traced concepts.",
          brief_reference: "businessOutcomePerSourceRevenueSelectors.js (build_asset_sources)",
          last_verified_against: "Session 12, calculation trace Business Outcome extension",
          source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
          implementation_status: "live_verified_field",
          inputs: [modelled_revenue_node_id],
          resolve: () => safeNumber(row.net_profit),
        },
      ];
    })
  );
}

export function buildBusinessOutcomeMaterialsNode(live) {
  const materials = live?.business_outcome?.materials;
  if (!materials) {
    return [];
  }

  const modelled_revenue_node_id = "business_outcome.materials.modelled_revenue";

  return [
    {
      node_id: modelled_revenue_node_id,
      display_label: "Materials - Modelled Revenue (Business Outcome)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "Materials modelled revenue at Rate Builder's markup, as its own peer source alongside labour/asset groups (View A: residual against real revenue). Markup resolution not independently re-derived here - boundary node.",
      brief_reference: "useBusinessOutcomePerSourceRevenue.js (build_materials_source)",
      last_verified_against: "Session 12, calculation trace Business Outcome extension",
      source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
      implementation_status: "live_traced_via_hook",
      inputs: ["business_outcome.per_source_revenue"],
      resolve: () => safeNumber(materials.modelled_revenue ?? materials.revenue),
    },
    {
      node_id: "business_outcome.materials.net_profit",
      display_label: "Materials - Net Profit (Business Outcome, as-priced)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text: "net_profit = modelled_revenue - true_cost (materials true cost / COGS). As-priced figure.",
      brief_reference: "useBusinessOutcomePerSourceRevenue.js (build_materials_source)",
      last_verified_against: "Session 12, calculation trace Business Outcome extension",
      source_file: "lib/calculations/businessOutcomeViewBCalculations.js",
      implementation_status: "live_traced_via_hook",
      inputs: [modelled_revenue_node_id],
      resolve: () => safeNumber(materials.net_profit),
    },
  ];
}

export function buildBusinessOutcomeGroupNodes(live) {
  const labour_groups = Array.isArray(live?.business_outcome?.labour_groups)
    ? live.business_outcome.labour_groups
    : [];
  const asset_groups = Array.isArray(live?.business_outcome?.asset_groups)
    ? live.business_outcome.asset_groups
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

    const labour_modelled_revenue_ids = (labour_group?.staff ?? []).map(
      (s) => `business_outcome.labour_source.${group_id}.${s.staff_type_id}.modelled_revenue`
    );
    const labour_net_profit_ids = (labour_group?.staff ?? []).map(
      (s) => `business_outcome.labour_source.${group_id}.${s.staff_type_id}.net_profit`
    );
    const asset_modelled_revenue_ids = (asset_group?.assets ?? []).map(
      (a) => `business_outcome.asset_source.${group_id}.${a.asset_id}.modelled_revenue`
    );
    const asset_net_profit_ids = (asset_group?.assets ?? []).map(
      (a) => `business_outcome.asset_source.${group_id}.${a.asset_id}.net_profit`
    );

    const group_modelled_revenue =
      (labour_group?.group_modelled_revenue ?? 0) + (asset_group?.group_modelled_revenue ?? 0);
    const group_net_profit =
      (labour_group?.group_net_profit ?? 0) + (asset_group?.group_net_profit ?? 0);

    return [
      {
        node_id: `business_outcome.group.${group_id}.modelled_revenue`,
        display_label: `${label} - Group Modelled Revenue (Business Outcome)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Sum of every labour and asset source's modelled_revenue within this Cost Allocation group. As-priced (naive) roll-up - NOT the real_capacity cascade or View B, which are separate, not yet traced concepts.",
        brief_reference: "businessOutcomePerSourceRevenueSelectors.js (group_sources_by_group)",
        last_verified_against: "Session 12, calculation trace Business Outcome extension",
        source_file: "lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors.js",
        implementation_status: "live_verified_field",
        inputs: [...labour_modelled_revenue_ids, ...asset_modelled_revenue_ids],
        resolve: () => safeNumber(group_modelled_revenue),
      },
      {
        node_id: `business_outcome.group.${group_id}.net_profit`,
        display_label: `${label} - Group Net Profit (Business Outcome, as-priced)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "Sum of every labour and asset source's net_profit within this Cost Allocation group. As-priced (naive) roll-up - NOT the real_capacity cascade's smoothed group_real_capacity_net_profit or View B's final_net_profit, which are separate, not yet traced concepts.",
        brief_reference: "businessOutcomePerSourceRevenueSelectors.js (group_sources_by_group)",
        last_verified_against: "Session 12, calculation trace Business Outcome extension",
        source_file: "lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors.js",
        implementation_status: "live_verified_field",
        inputs: [...labour_net_profit_ids, ...asset_net_profit_ids],
        resolve: () => safeNumber(group_net_profit),
      },
    ];
  });
}