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
        group_implied_revenue: 0,
        group_implied_net_profit: 0,
        group_real_capacity_net_profit: 0,
        group_has_unavailable: false,
      });
    }

    const group = groups.get(key);
    group[member_key].push(row);
    group.group_modelled_revenue += row.modelled_revenue ?? 0;
    group.group_true_cost += row.true_cost ?? 0;
    group.group_net_profit += row.net_profit ?? 0;
    // STEP 4 (S30 brief): implied figures roll up the same way as
    // assumed figures - summed per group from each individual source.
    // Falls back to the assumed value when implied is not present (no
    // ceiling breach), so this sum is always safe to read regardless of
    // breach state.
    group.group_implied_revenue += row.implied_revenue ?? row.modelled_revenue ?? 0;
    group.group_implied_net_profit += row.implied_net_profit ?? row.net_profit ?? 0;
    // REAL CAPACITY (two-phase cascade, hand-verified in a spreadsheet
    // before this was coded): same roll-up pattern as implied above -
    // falls back to the assumed net_profit when real_capacity_net_profit
    // is not present, always safe to read.
    group.group_real_capacity_net_profit += row.real_capacity_net_profit ?? row.net_profit ?? 0;
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

// SHARED MERGE (fixes S30 drill/headline split): a real Cost Allocation
// group like "2inc Line" or "PC55" can carry BOTH labour and asset
// members. Building separate labour-group and asset-group entries and
// never merging them produces two sibling entries sharing one display
// name instead of one entry with two children. This is the single
// source of truth for that merge, used by both this selector's
// headline/being-carried list and the drill component, so both
// surfaces agree. Implied-aware: reads implied figures when
// use_implied is true, same convention as group_sources_by_group.
export function merge_groups_by_id(labour_groups, asset_groups, materials, use_implied) {
  const by_group_id = new Map();

  function get_or_create(group_id, group_name) {
    const key = group_id || `unkeyed_${group_name}`;
    if (!by_group_id.has(key)) {
      by_group_id.set(key, {
        key,
        label: group_name,
        net_profit: 0,
        modelled_revenue: 0,
        children: [],
        has_unavailable: false,
      });
    }
    return by_group_id.get(key);
  }

  labour_groups.forEach((g) => {
    const entry = get_or_create(g.group_id, g.group_name);
    entry.net_profit += (use_implied ? g.group_implied_net_profit : g.group_net_profit) ?? 0;
    entry.modelled_revenue += g.group_modelled_revenue ?? 0;
    if (g.group_has_unavailable) entry.has_unavailable = true;
    g.staff.forEach((s) => {
      const verdict = use_implied ? s.implied_verdict : s.verdict;
      entry.children.push({
        key: s.staff_type_id,
        label: s.staff_type_name,
        net_profit: (use_implied ? s.implied_net_profit : s.net_profit) ?? 0,
        modelled_revenue: s.modelled_revenue,
        available: s.available,
        unavailable_reason: s.unavailable_reason,
        verdict,
        verdict_label: verdict_label(verdict),
      });
    });
  });

  asset_groups.forEach((g) => {
    const entry = get_or_create(g.group_id, g.group_name);
    entry.net_profit += (use_implied ? g.group_implied_net_profit : g.group_net_profit) ?? 0;
    entry.modelled_revenue += g.group_modelled_revenue ?? 0;
    if (g.group_has_unavailable) entry.has_unavailable = true;
    g.assets.forEach((a) => {
      const verdict = use_implied ? a.implied_verdict : a.verdict;
      entry.children.push({
        key: a.asset_id,
        label: a.asset_name,
        net_profit: (use_implied ? a.implied_net_profit : a.net_profit) ?? 0,
        modelled_revenue: a.modelled_revenue,
        available: a.available,
        unavailable_reason: a.unavailable_reason,
        verdict,
        verdict_label: verdict_label(verdict),
      });
    });
  });

  const merged_entries = Array.from(by_group_id.values()).map((entry) => {
    const verdict = entry.has_unavailable ? null : verdict_for(entry.net_profit);
    return {
      ...entry,
      type: "group",
      verdict,
      verdict_label: verdict_label(verdict),
    };
  });

  merged_entries.push({
    key: "materials",
    label: "Materials / COG",
    net_profit: materials.net_profit,
    modelled_revenue: materials.revenue,
    verdict: materials.verdict,
    verdict_label: verdict_label(materials.verdict),
    children: [],
    type: "materials",
  });

  return merged_entries;
}

// REAL CAPACITY MERGE - same merge-by-group_id logic as merge_groups_by_id
// above, but always reads the real_capacity_* fields computed by
// apply_real_capacity in the hook (two-phase cascade: Materials floored
// at $0, shortfall absorbed by still-profitable sources weighted by
// current margin, any leftover spread by revenue share once every
// source's margin is exhausted - see hook comments for full mechanism).
// Unlike use_implied above, there is no boolean toggle here -
// real_capacity_net_profit already equals net_profit exactly whenever
// nothing is breached, so it is always safe to read directly.
export function merge_groups_by_id_real_capacity(labour_groups, asset_groups, materials) {
  const by_group_id = new Map();

  function get_or_create(group_id, group_name) {
    const key = group_id || `unkeyed_${group_name}`;
    if (!by_group_id.has(key)) {
      by_group_id.set(key, {
        key,
        label: group_name,
        net_profit: 0,
        modelled_revenue: 0,
        children: [],
        has_unavailable: false,
      });
    }
    return by_group_id.get(key);
  }

  labour_groups.forEach((g) => {
    const entry = get_or_create(g.group_id, g.group_name);
    entry.net_profit += g.group_real_capacity_net_profit ?? 0;
    entry.modelled_revenue += g.group_modelled_revenue ?? 0;
    if (g.group_has_unavailable) entry.has_unavailable = true;
    g.staff.forEach((s) => {
      const verdict = s.real_capacity_verdict;
      entry.children.push({
        key: s.staff_type_id,
        label: s.staff_type_name,
        net_profit: s.real_capacity_net_profit ?? 0,
        modelled_revenue: s.modelled_revenue,
        available: s.available,
        unavailable_reason: s.unavailable_reason,
        verdict,
        verdict_label: verdict_label(verdict),
      });
    });
  });

  asset_groups.forEach((g) => {
    const entry = get_or_create(g.group_id, g.group_name);
    entry.net_profit += g.group_real_capacity_net_profit ?? 0;
    entry.modelled_revenue += g.group_modelled_revenue ?? 0;
    if (g.group_has_unavailable) entry.has_unavailable = true;
    g.assets.forEach((a) => {
      const verdict = a.real_capacity_verdict;
      entry.children.push({
        key: a.asset_id,
        label: a.asset_name,
        net_profit: a.real_capacity_net_profit ?? 0,
        modelled_revenue: a.modelled_revenue,
        available: a.available,
        unavailable_reason: a.unavailable_reason,
        verdict,
        verdict_label: verdict_label(verdict),
      });
    });
  });

  const merged_entries = Array.from(by_group_id.values()).map((entry) => {
    const verdict = entry.has_unavailable ? null : verdict_for(entry.net_profit);
    return {
      ...entry,
      type: "group",
      verdict,
      verdict_label: verdict_label(verdict),
    };
  });

  merged_entries.push({
    key: "materials",
    label: "Materials / COG",
    net_profit: materials.real_capacity_net_profit,
    modelled_revenue: materials.revenue,
    verdict: materials.real_capacity_verdict,
    verdict_label: verdict_label(materials.real_capacity_verdict),
    children: [],
    type: "materials",
  });

  return merged_entries;
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
    net_annual_business_open_hours,
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

  // TIER 1/2 - headline summary. total_net_profit is derived, not a new
  // field: sum of every revenue-bearing source's own net profit, minus
  // total_unassigned (real cost with no revenue-bearing source attached,
  // which would otherwise silently inflate this figure). This is
  // mathematically guaranteed to equal the real net position exactly,
  // given cost_reconciles is true (confirmed this session) - not an
  // approximation.
  // STEP 4 (S30 brief, confirmed): once the ceiling is breached, the
  // headline and every group-level verdict must be based on IMPLIED net
  // profit (real, capped revenue), not assumed-hours net profit - the
  // implied figure is the honest answer to "is this actually paying its
  // way given what the business really billed." materials.net_profit is
  // already correct in both states (the hook computes it directly, not
  // via a separate implied field), so it is used as-is here either way.
  const use_implied = per_source_result.revenue_ceiling?.is_breached === true;

  const all_group_level_entries = merge_groups_by_id(
    labour_groups,
    asset_groups,
    materials,
    use_implied
  ).map((entry) => ({
    name: entry.label,
    net_profit: entry.net_profit,
    modelled_revenue: entry.modelled_revenue,
    verdict: entry.verdict,
    type: entry.type,
  }));

  const total_source_net_profit = all_group_level_entries.reduce(
    (sum, e) => sum + (e.net_profit ?? 0),
    0
  );

  const total_net_profit =
    total_source_net_profit -
    unassigned_labour_cost -
    unassigned_asset_cost -
    unassigned_non_productive_labour_cost -
    unassigned_non_productive_asset_cost;

  const being_carried = all_group_level_entries
    .filter((e) => e.verdict === "being_carried")
    .sort((a, b) => a.net_profit - b.net_profit);

  const total_modelled_revenue_headline = all_group_level_entries.reduce(
    (sum, e) => sum + (e.net_profit !== null ? (e.modelled_revenue ?? 0) : 0),
    0
  );

  const headline = {
    total_net_profit,
    total_modelled_revenue: total_revenue_reference,
    total_group_count: all_group_level_entries.length,
    being_carried_count: being_carried.length,
    being_carried,
    all_good: being_carried.length === 0,
    // Real, already-enforced Cost Allocation guardrail (confirmed live):
    // a staff type assigned more than 100% of their available hours
    // across ALL groups combined. If true, some of the revenue shown on
    // this page assumes hours that cannot actually be delivered by the
    // people currently assigned - the seat-hours model (this session)
    // credits a group's seat with its full recovery hours even when
    // covered by a real named person, but that person may be assigned
    // to MULTIPLE seats totalling more than they can actually work.
    labour_capacity_warning: per_source_result.labour_pool_over_allocated === true,
    asset_capacity_warning: per_source_result.asset_pool_over_allocated === true,
    labour_coverage_gaps: per_source_result.labour_coverage_gaps || [],
  };

  // REAL CAPACITY headline - same construction as the headline above,
  // parallel and additive, reading real_capacity figures instead of
  // assumed/implied. No use_implied-style conditional needed - the
  // two-phase cascade is always-on and always correct, including the
  // no-shortfall case where it exactly equals the assumed figures.
  const all_group_level_entries_real_capacity = merge_groups_by_id_real_capacity(
    labour_groups,
    asset_groups,
    materials
  ).map((entry) => ({
    name: entry.label,
    net_profit: entry.net_profit,
    modelled_revenue: entry.modelled_revenue,
    verdict: entry.verdict,
    type: entry.type,
  }));

  const total_source_net_profit_real_capacity = all_group_level_entries_real_capacity.reduce(
    (sum, e) => sum + (e.net_profit ?? 0),
    0
  );

  const total_net_profit_real_capacity =
    total_source_net_profit_real_capacity -
    unassigned_labour_cost -
    unassigned_asset_cost -
    unassigned_non_productive_labour_cost -
    unassigned_non_productive_asset_cost;

  const being_carried_real_capacity = all_group_level_entries_real_capacity
    .filter((e) => e.verdict === "being_carried")
    .sort((a, b) => a.net_profit - b.net_profit);

  const headline_real_capacity = {
    total_net_profit: total_net_profit_real_capacity,
    total_modelled_revenue: total_revenue_reference,
    total_group_count: all_group_level_entries_real_capacity.length,
    being_carried_count: being_carried_real_capacity.length,
    being_carried: being_carried_real_capacity,
    all_good: being_carried_real_capacity.length === 0,
    labour_capacity_warning: per_source_result.labour_pool_over_allocated === true,
    asset_capacity_warning: per_source_result.asset_pool_over_allocated === true,
    labour_coverage_gaps: per_source_result.labour_coverage_gaps || [],
  };

  return {
    available: true,
    data_status: "ready",
    disclosure_text: DISCLOSURE_TEXT,
    net_annual_business_open_hours,
    use_implied,
    revenue_ceiling: per_source_result.revenue_ceiling ?? null,
    real_capacity: per_source_result.real_capacity ?? null,

    headline,
    headline_real_capacity,
    labour_groups,
    asset_groups,

    materials: {
      ...materials,
      verdict_label: verdict_label(materials.verdict),
      real_capacity_verdict_label: verdict_label(materials.real_capacity_verdict),
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