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
    });
  });
  return by_group;
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

  // As-priced (naive, no cascade) figures - independent of the smoothed
  // final_net_profit shown elsewhere. Groups: real_capacity.group_real_capacity's
  // own naive_net_profit. Materials: selected_output.materials.net_profit,
  // which IS the naive figure (real_capacity_net_profit is the floored/
  // smoothed one, kept separate).
  const naive_by_group_id = new Map(
    safe_array(selected_output.real_capacity?.group_real_capacity).map((g) => [g.group_id, to_number(g.naive_net_profit)])
  );
  const materials_naive_net_profit = to_number(selected_output.materials?.net_profit);

  const rows = safe_array(all_sources).map((source) => {
    if (source.type === "materials") {
      return {
        key: source.key,
        name: source.name,
        is_materials: true,
        modelled_revenue: to_number(source.modelled_revenue),
        net_profit: to_number(source.net_profit),
        naive_net_profit: materials_naive_net_profit,
        revenue_members: [],
      };
    }

    const group_id = source.key;
    const labour = labour_totals.get(group_id) || { direct_cost: 0, overhead: 0, group_true_cost_known: null };
    const asset = asset_totals.get(group_id) || { direct_cost: 0, overhead: 0, group_true_cost_known: null };

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

    const revenue_members = [];
    safe_array(selected_output.labour_groups).forEach((g) => {
      if (g.group_id !== group_id) return;
      safe_array(g.staff).forEach((m) => {
        revenue_members.push({ name: m.staff_type_name || "Unnamed labour source", modelled_revenue: to_number(m.modelled_revenue), type: "labour" });
      });
    });
    safe_array(selected_output.asset_groups).forEach((g) => {
      if (g.group_id !== group_id) return;
      safe_array(g.assets).forEach((m) => {
        revenue_members.push({ name: m.asset_name || "Unnamed asset", modelled_revenue: to_number(m.modelled_revenue), type: "asset" });
      });
    });

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
      naive_net_profit: naive_by_group_id.has(group_id) ? naive_by_group_id.get(group_id) : null,
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

  // As-priced total uses the SAME headline total_net_profit - the cascade
  // is zero-sum across sources (proven: naive sum - unassigned = the same
  // total_net_profit shown elsewhere), so the as-priced view's own total
  // row reconciles against that identical figure, not a separate one.
  const sum_of_naive_rows = rows.reduce((sum, r) => sum + (r.naive_net_profit ?? 0), 0);
  const naive_headline_variance =
    Math.round((sum_of_naive_rows - total_unassigned - total_net_profit_value) * 100) / 100;

  return {
    rows,
    unassigned_lines,
    total_unassigned,
    total_net_profit: total_net_profit_value,
    reconciles_to_headline: Math.abs(headline_variance) < 1,
    headline_variance,
    naive_reconciles_to_headline: Math.abs(naive_headline_variance) < 1,
    naive_headline_variance,
  };
}
