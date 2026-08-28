// Business Outcome - Per-Source Revenue Attribution selector (S26/S27/S29).
//
// Shapes useBusinessOutcomePerSourceRevenue's output for rendering. Pure
// function, no calculation - every number here already comes correct from
// the hook. This file only groups, sorts, and labels.
//
// Three UI decisions confirmed with the user this session:
// 1. Asset sources are grouped under their parent Cost Allocation group
//    (source-level detail rolling up to group-level, matching the
//    drill-down hierarchy: is this group profitable, and within it, is
//    each individual source paying its way).
// 2. The "modelled, not actual" disclosure (S29 Section 3) appears BOTH as
//    a persistent top-level banner AND as a tag on every individual row -
//    never buried in a tooltip only.
// 3. unassigned_labour_cost, unassigned_asset_cost,
//    unassigned_non_productive_labour_cost, unassigned_non_productive_asset_cost,
//    and materials are their own separate block, not folded into the
//    source list - so an unassigned amount reads as a clear, actionable
//    "go assign this in Cost Allocation" item, not a mystery number
//    buried inside a total.

const DISCLOSURE_TEXT =
  "Modelled from real rates and expected hours - not a measurement of actual invoiced revenue. See reconciliation below for how this compares to your real P&L cost.";

function verdict_label(verdict) {
  if (verdict === "paying_its_way") return "Paying its way";
  if (verdict === "being_carried") return "Being carried";
  return "Not available";
}

function verdict_for(net_profit) {
  return net_profit >= 0 ? "paying_its_way" : "being_carried";
}

// Shared grouping for both labour and asset sources - each source row
// must already carry group_id/group_name (confirmed both do, after the
// labour fix keying build_labour_sources by (group_id, staff_type_id)).
// "member_key" is which field holds each row (assets vs staff), so the
// same function serves both without duplicating the grouping logic.
function group_sources_by_group(sources, member_key) {
  const groups = new Map();

  sources.forEach((row) => {
    const key = row.group_id || "ungrouped";
    if (!groups.has(key)) {
      groups.set(key, {
        group_id: row.group_id,
        group_name: row.group_name || "Unnamed group",
        [member_key]: [],
        group_modelled_revenue: 0,
        group_true_cost: 0,
        group_net_profit: 0,
        group_has_unavailable: false,
      });
    }

    const group = groups.get(key);
    group[member_key].push(row);
    group.group_modelled_revenue += row.modelled_revenue ?? 0;
    group.group_true_cost += row.true_cost ?? 0;
    group.group_net_profit += row.net_profit ?? 0;
    if (!row.available) {
      group.group_has_unavailable = true;
    }
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      group_verdict: group.group_has_unavailable
        ? null
        : verdict_for(group.group_net_profit),
      [member_key]: group[member_key].sort(
        (a, b) => (b.modelled_revenue ?? -Infinity) - (a.modelled_revenue ?? -Infinity)
      ),
    }))
    .sort(
      (a, b) => (b.group_modelled_revenue ?? -Infinity) - (a.group_modelled_revenue ?? -Infinity)
    );
}

export function selectBusinessOutcomePerSourceRevenue(per_source_result) {
  if (!per_source_result || per_source_result.data_status !== "ready") {
    return {
      available: false,
      data_status: per_source_result?.data_status ?? "no_sources",
    };
  }

  const {
    labour_sources,
    asset_sources,
    materials,
    unassigned_labour_cost,
    unassigned_asset_cost,
    unassigned_non_productive_labour_cost,
    unassigned_non_productive_asset_cost,
    residual_overhead,
    reconciliation,
    total_revenue_reference,
  } = per_source_result;

  const labour_groups = group_sources_by_group(labour_sources, "staff").map((group) => ({
    ...group,
    group_verdict_label: verdict_label(group.group_verdict),
    staff: group.staff.map((row) => ({
      ...row,
      verdict_label: verdict_label(row.verdict),
    })),
  }));

  const asset_groups = group_sources_by_group(asset_sources, "assets").map((group) => ({
    ...group,
    group_verdict_label: verdict_label(group.group_verdict),
    assets: group.assets.map((row) => ({
      ...row,
      verdict_label: verdict_label(row.verdict),
    })),
  }));

  // Decision 3: separate, explicit "not yet assigned / not source-specific"
  // block. Each line is only shown if non-zero, so an empty business (all
  // real cost fully assigned) shows a clean, short block rather than a
  // wall of zeroes.
  const unassigned_lines = [
    unassigned_labour_cost > 0 && {
      label: "Unassigned labour cost",
      amount: unassigned_labour_cost,
      hint: "Real labour cost not yet assigned to a Cost Allocation group.",
    },
    unassigned_asset_cost > 0 && {
      label: "Unassigned asset cost",
      amount: unassigned_asset_cost,
      hint: "Real productive asset cost not yet assigned to a Cost Allocation group.",
    },
    unassigned_non_productive_labour_cost > 0 && {
      label: "Unassigned non-productive labour cost",
      amount: unassigned_non_productive_labour_cost,
      hint: "Real support labour cost not yet assigned to a Cost Allocation group.",
    },
    unassigned_non_productive_asset_cost > 0 && {
      label: "Unassigned non-productive asset cost",
      amount: unassigned_non_productive_asset_cost,
      hint: "Real support asset cost not yet assigned to a Cost Allocation group - e.g. a vehicle with no group assignment.",
    },
  ].filter(Boolean);

  const total_unassigned =
    unassigned_labour_cost +
    unassigned_asset_cost +
    unassigned_non_productive_labour_cost +
    unassigned_non_productive_asset_cost;

  const total_labour_modelled_revenue = labour_groups.reduce(
    (sum, g) => sum + (g.group_modelled_revenue ?? 0),
    0
  );
  const total_asset_modelled_revenue = asset_groups.reduce(
    (sum, g) => sum + (g.group_modelled_revenue ?? 0),
    0
  );

  return {
    available: true,
    data_status: "ready",
    disclosure_text: DISCLOSURE_TEXT,

    labour_groups,
    asset_groups,

    materials: {
      ...materials,
      verdict_label: verdict_label(materials.verdict),
      build_up: {
        total_pnl_revenue: total_revenue_reference,
        labour_modelled_revenue: total_labour_modelled_revenue,
        asset_modelled_revenue: total_asset_modelled_revenue,
        cogs: materials.true_cost - residual_overhead,
        residual_overhead,
      },
    },

    unassigned: {
      lines: unassigned_lines,
      total: total_unassigned,
      has_gaps: unassigned_lines.length > 0,
    },

    residual_overhead,

    reconciliation: {
      ...reconciliation,
      cost_status_label: reconciliation.cost_reconciles
        ? "Reconciles to real cost"
        : "Variance found - see below",
    },
  };
}






