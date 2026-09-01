function to_number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safe_array(value) {
  return Array.isArray(value) ? value : [];
}

function totals_by_group(groups, members_key) {
  const by_group = new Map();
  safe_array(groups).forEach((g) => {
    const members = safe_array(g?.[members_key]);
    let direct_cost = 0;
    let overhead = 0;
    members.forEach((m) => {
      direct_cost += to_number(m?.direct_cost);
      overhead += to_number(m?.overhead_share);
    });
    by_group.set(g.group_id, {
      direct_cost,
      overhead,
      group_true_cost_known: g?.group_true_cost !== undefined ? to_number(g.group_true_cost) : null,
      members,
    });
  });
  return by_group;
}

function build_revenue_members(labour_entry, asset_entry, labour_name_key, asset_name_key) {
  const members = [];
  safe_array(labour_entry?.members).forEach((m) => {
    members.push({
      name: m[labour_name_key] || m.staff_type_name || "Unnamed labour source",
      modelled_revenue: to_number(m.modelled_revenue),
      type: "labour",
    });
  });
  safe_array(asset_entry?.members).forEach((m) => {
    members.push({
      name: m[asset_name_key] || m.asset_name || "Unnamed asset",
      modelled_revenue: to_number(m.modelled_revenue),
      type: "asset",
    });
  });
  return members;
}

export function buildNetProfitBuildUpRows(selected_output) {
  if (
    !selected_output ||
    selected_output.data_status !== "ready" ||
    !selected_output.headline_real_capacity
  ) {
    return null;
  }

  const { all_sources, total_net_profit } = selected_output.headline_real_capacity;
  const labour_totals = totals_by_group(selected_output.labour_groups, "staff");
  const asset_totals = totals_by_group(selected_output.asset_groups, "assets");

  const rows = safe_array(all_sources).map((source) => {
    if (source.type === "materials") {
      return {
        key: source.key,
        name: source.name,
        is_materials: true,
        modelled_revenue: to_number(source.modelled_revenue),
        net_profit: to_number(source.net_profit),
        revenue_members: [],
      };
    }

    const group_id = source.key;
    const labour = labour_totals.get(group_id) || { direct_cost: 0, overhead: 0, group_true_cost_known: null, members: [] };
    const asset = asset_totals.get(group_id) || { direct_cost: 0, overhead: 0, group_true_cost_known: null, members: [] };

    const regrouped_true_cost =
      labour.direct_cost + labour.overhead + asset.direct_cost + asset.overhead;

    const known_true_cost_parts = [labour.group_true_cost_known, asset.group_true_cost_known].filter(
      (v) => v !== null
    );
    const known_true_cost =
      known_true_cost_parts.length > 0 ? known_true_cost_parts.reduce((a, b) => a + b, 0) : null;
    const true_cost_variance =
      known_true_cost === null ? 0 : Math.round((regrouped_true_cost - known_true_cost) * 100) / 100;
    const true_cost_reconciles = known_true_cost === null ? true : Math.abs(true_cost_variance) < 1;

    const revenue_members = build_revenue_members(labour, asset, "staff_type_name", "asset_name");

    return {
      key: group_id,
      name: source.name,
      is_materials: false,
      modelled_revenue: to_number(source.modelled_revenue),
      labour_direct_cost: labour.direct_cost,
      labour_overhead: labour.overhead,
      asset_direct_cost: asset.direct_cost,
      asset_overhead: asset.overhead,
      total_overhead: labour.overhead + asset.overhead,
      true_cost_reconciles,
      true_cost_variance,
      net_profit: to_number(source.net_profit),
      revenue_members,
    };
  });

  const unassigned_lines = safe_array(selected_output.unassigned?.lines).map((l) => ({
    label: l.label,
    amount: to_number(l.amount),
    hint: l.hint || null,
  }));
  const total_unassigned = to_number(selected_output.unassigned?.total);

  const sum_of_rows = rows.reduce((sum, r) => sum + r.net_profit, 0);
  const total_net_profit_value = to_number(total_net_profit);
  const headline_variance =
    Math.round((sum_of_rows - total_unassigned - total_net_profit_value) * 100) / 100;

  return {
    rows,
    unassigned_lines,
    total_unassigned,
    total_net_profit: total_net_profit_value,
    reconciles_to_headline: Math.abs(headline_variance) < 1,
    headline_variance,
  };
}
