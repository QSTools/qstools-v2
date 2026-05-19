import {
  TIME_SCALES,
  formatCurrency,
  formatNumber,
  getTimeScaleName,
  getTimeScaleSuffix,
  scaleAnnualValue,
  scalePeriodValue,
} from "@/components/business-summary/BusinessSummaryCardUtils";

export const PRODUCT_TIME_SCALES = TIME_SCALES.filter(
  (option) => option.key !== "hour"
);

function scaleProductAnnualValue(value, timeScale) {
  const number = Number(value) || 0;

  if (timeScale === "day") return number / 365;
  if (timeScale === "week") return number / 52;
  if (timeScale === "month") return number / 12;
  if (timeScale === "quarter") return number / 4;

  return number;
}

function sumStaffCost(staffRows = []) {
  return staffRows.reduce(
    (total, staff) => total + (Number(staff.total_labour_cost_annual) || 0),
    0
  );
}

function sumAssetCost(assetRows = []) {
  return assetRows.reduce(
    (total, asset) => total + (Number(asset.total_asset_cost_annual) || 0),
    0
  );
}

export function buildBusinessSummaryHierarchyState({
  total_revenue = 0,
  total_direct_costs = 0,
  direct_cost_category_totals = [],
  margin_pool = 0,
  total_cost_burden = 0,
  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
  margin_after_labour = 0,
  non_people_cost_burden = 0,
  people_cost_per_recovery_hour = 0,
  asset_cost_per_recovery_hour = 0,
  business_overheads_per_recovery_hour = 0,
  margin_after_labour_per_recovery_hour = 0,
  non_people_cost_burden_per_recovery_hour = 0,
  recovery_hours_used = 0,
  units_sold_annual = 0,
  business_type = "labour_based",
  is_product_based = false,
  is_labour_based = true,
  activity_driver_type = "hours",
  revenue_per_unit = 0,
  direct_cost_per_unit = 0,
  margin_per_unit = 0,
  required_units_to_break_even = 0,
  unit_surplus_or_shortfall = 0,
  required_recovery_rate = 0,
  actual_recovery_rate = 0,
  profit_or_deficit_per_recovery_hour = 0,
  net_position = 0,
  cost_burden_breakdown = {
    people: {},
    assets: {},
    business_overheads: {},
  },
  timeScale = "hour",
} = {}) {
  const business_type_label =
    business_type === "product_based"
      ? "Product / Unit-based business"
      : "Service / Labour-based business";
  const product_mode_active =
    is_product_based === true ||
    is_labour_based === false ||
    business_type === "product_based" ||
    activity_driver_type === "units";
  const active_time_scale =
    product_mode_active && timeScale === "hour" ? "day" : timeScale;

  function scaleDisplayAnnualValue(annualValue, hourlyValue = 0) {
    return product_mode_active
      ? scaleProductAnnualValue(annualValue, active_time_scale)
      : scaleAnnualValue(annualValue, active_time_scale, hourlyValue);
  }

  function scaleDisplayPeriodValue(annualValue) {
    return product_mode_active
      ? scaleProductAnnualValue(annualValue, active_time_scale)
      : scalePeriodValue(annualValue, active_time_scale, recovery_hours_used);
  }

  const scaled_required_recovery = scaleDisplayAnnualValue(
    total_cost_burden,
    required_recovery_rate
  );
  const scaled_actual_recovery = scaleDisplayAnnualValue(
    margin_pool,
    actual_recovery_rate
  );
  const scaled_recovery_result = scaleDisplayAnnualValue(
    net_position,
    profit_or_deficit_per_recovery_hour
  );
  const recovery_result_abs = Math.abs(scaled_recovery_result);
  const scale_label = getTimeScaleName(active_time_scale);
  const result_scale_label =
    active_time_scale === "hour" ? "Recovery Hour" : scale_label;
  const scale_suffix = product_mode_active
    ? `/${active_time_scale}`
    : getTimeScaleSuffix(active_time_scale);
  const product_unit_suffix = `units/${active_time_scale}`;
  const product_period_phrase = `per ${active_time_scale}`;
  const scaled_units_sold = scaleProductAnnualValue(
    units_sold_annual,
    active_time_scale
  );
  const scaled_required_units_to_break_even = scaleProductAnnualValue(
    required_units_to_break_even,
    active_time_scale
  );
  const scaled_unit_surplus_or_shortfall = scaleProductAnnualValue(
    unit_surplus_or_shortfall,
    active_time_scale
  );

  const recovery_result_label =
    scaled_recovery_result >= 0
      ? `Surplus per ${result_scale_label}`
      : `Deficit per ${result_scale_label}`;
  const recovery_headline =
    scaled_recovery_result >= 0
      ? `You are earning ${formatCurrency(
          recovery_result_abs
        )}${scale_suffix} after covering your real business costs.`
      : `You are short ${formatCurrency(
          recovery_result_abs
        )}${scale_suffix} against your required recovery rate.`;
  const product_position_title =
    margin_per_unit <= 0
      ? "Product Margin Not Recoverable"
      : unit_surplus_or_shortfall < 0
        ? "Unit Volume Shortfall"
        : "Unit Volume Surplus";
  const product_hero_value =
    margin_per_unit <= 0
      ? formatCurrency(margin_per_unit)
      : formatNumber(Math.abs(scaled_unit_surplus_or_shortfall));
  const product_hero_suffix =
    margin_per_unit <= 0 ? "/unit" : ` ${product_unit_suffix}`;
  const product_helper_text =
    margin_per_unit <= 0
      ? "Product margin is not positive, so unit volume cannot recover the business cost burden."
      : unit_surplus_or_shortfall < 0
        ? `You need ${formatNumber(
            scaled_required_units_to_break_even
          )} units sold ${product_period_phrase} to recover the business cost burden. Current volume is ${formatNumber(
            scaled_units_sold
          )} units ${product_period_phrase}.`
        : `Current unit volume is above the break-even unit requirement ${product_period_phrase}.`;

  const scaled_revenue = scaleDisplayPeriodValue(total_revenue);
  const scaled_direct_costs = scaleDisplayPeriodValue(total_direct_costs);
  const scaled_margin_pool = scaleDisplayPeriodValue(margin_pool);
  const scaled_people_cost =
    active_time_scale === "hour"
      ? people_cost_per_recovery_hour
      : scaleDisplayPeriodValue(total_people_cost_annual);
  const scaled_margin_after_labour =
    active_time_scale === "hour"
      ? margin_after_labour_per_recovery_hour
      : scaleDisplayPeriodValue(margin_after_labour);
  const scaled_asset_cost =
    active_time_scale === "hour"
      ? asset_cost_per_recovery_hour
      : scaleDisplayPeriodValue(total_asset_cost_annual);
  const scaled_general_overheads =
    active_time_scale === "hour"
      ? business_overheads_per_recovery_hour
      : scaleDisplayPeriodValue(total_business_overheads);
  const scaled_non_people_cost_burden =
    active_time_scale === "hour"
      ? non_people_cost_burden_per_recovery_hour
      : scaleDisplayPeriodValue(non_people_cost_burden);
  const scaled_net_position = scaleDisplayPeriodValue(net_position);
  const product_secondary_result =
    margin_per_unit <= 0
      ? `Final surplus / deficit: ${formatCurrency(
          scaled_net_position
        )}${scale_suffix}`
      : scaled_net_position < 0
        ? `Final deficit: ${formatCurrency(scaled_net_position)}${scale_suffix}`
        : `Final surplus: ${formatCurrency(scaled_net_position)}${scale_suffix}`;

  const surplus_or_deficit_label =
    scaled_net_position >= 0 ? "Surplus" : "Deficit";
  const surplus_or_deficit_amount = Math.abs(scaled_net_position);
  const revenue_reference_total = Math.abs(scaled_revenue);
  const people_breakdown = cost_burden_breakdown.people ?? {};
  const assets_breakdown = cost_burden_breakdown.assets ?? {};
  const overheads_breakdown = cost_burden_breakdown.business_overheads ?? {};
  const active_staff = Array.isArray(people_breakdown.active_staff)
    ? people_breakdown.active_staff
    : [];
  const active_assets = Array.isArray(assets_breakdown.active_assets)
    ? assets_breakdown.active_assets
    : [];
  const overhead_category_totals = Array.isArray(
    overheads_breakdown.category_totals
  )
    ? overheads_breakdown.category_totals
    : [];
  const productive_staff = active_staff.filter(
    (staff) => staff.contributes_to_recovery_hours !== false
  );
  const non_productive_staff = active_staff.filter(
    (staff) => staff.contributes_to_recovery_hours === false
  );
  const productive_assets = active_assets.filter(
    (asset) => asset.asset_type === "productive"
  );
  const support_assets = active_assets.filter(
    (asset) => asset.asset_type !== "productive"
  );

  function buildStaffRows(staffRows = []) {
    return staffRows.map((staff, index) => {
      const staff_cost = scaleDisplayPeriodValue(
        staff.total_labour_cost_annual
      );

      return {
        key: `${staff.profile_id || staff.staff_id || staff.staff_name || "staff"}-${index}`,
        label: staff.staff_name || "Unnamed staff",
        value: staff_cost,
        amount: Math.abs(staff_cost),
        referenceTotal: Math.abs(scaled_people_cost),
        suffix: scale_suffix,
      };
    });
  }

  function buildAssetRows(assetRows = []) {
    return assetRows.map((asset, index) => {
      const asset_cost = scaleDisplayPeriodValue(asset.total_asset_cost_annual);

      return {
        key: `${asset.asset_id || asset.asset_name || "asset"}-${index}`,
        label: asset.asset_name || "Unnamed asset",
        value: asset_cost,
        amount: Math.abs(asset_cost),
        referenceTotal: Math.abs(scaled_asset_cost),
        suffix: scale_suffix,
      };
    });
  }

  function buildOverheadCategoryRows(categoryRows = []) {
    return categoryRows.map((category, index) => {
      const category_amount = category.total ?? category.amount;
      const category_value = scaleDisplayPeriodValue(category_amount);

      return {
        key: `${category.category_id || category.category_name || category.category_label || "overhead-category"}-${index}`,
        label:
          category.category_label ||
          category.category_name ||
          category.category_id ||
          "Overhead category",
        value: category_value,
        amount: Math.abs(category_value),
        referenceTotal: Math.abs(scaled_general_overheads),
        suffix: scale_suffix,
      };
    });
  }

  const productive_staff_cost = scaleDisplayPeriodValue(
    sumStaffCost(productive_staff)
  );
  const non_productive_staff_cost = scaleDisplayPeriodValue(
    sumStaffCost(non_productive_staff)
  );
  const productive_staff_children = buildStaffRows(productive_staff);
  const non_productive_staff_children = buildStaffRows(non_productive_staff);
  const productive_asset_cost = scaleDisplayPeriodValue(
    sumAssetCost(productive_assets)
  );
  const support_asset_cost = scaleDisplayPeriodValue(
    sumAssetCost(support_assets)
  );
  const productive_asset_children = buildAssetRows(productive_assets);
  const support_asset_children = buildAssetRows(support_assets);
  const overhead_category_children =
    buildOverheadCategoryRows(overhead_category_totals);

  const direct_cost_children = (
    Array.isArray(direct_cost_category_totals) ? direct_cost_category_totals : []
  )
    .map((category) => {
      const categoryValue = scaleDisplayPeriodValue(category.amount);

      return {
        key: `direct-cost-${category.category_id || category.label}`,
        label: category.label || "Direct cost category",
        value: categoryValue,
        amount: Math.abs(categoryValue),
        referenceTotal: Math.abs(scaled_direct_costs),
        suffix: scale_suffix,
      };
    })
    .filter((category) => category.amount > 0);

  const remaining_cost_children = [
    {
      key: "assets",
      label: "Asset Cost",
      value: scaled_asset_cost,
      amount: Math.abs(scaled_asset_cost),
      referenceTotal: Math.abs(scaled_non_people_cost_burden),
      suffix: scale_suffix,
      note: "Annual asset cost from Cost Summary.",
      children: [
        {
          key: "productive-assets",
          label: "Productive assets",
          value: productive_asset_cost,
          amount: Math.abs(productive_asset_cost),
          referenceTotal: Math.abs(scaled_asset_cost),
          suffix: scale_suffix,
          note: "Assets marked as productive.",
          children: productive_asset_children,
        },
        {
          key: "support-assets",
          label: "Support assets",
          value: support_asset_cost,
          amount: Math.abs(support_asset_cost),
          referenceTotal: Math.abs(scaled_asset_cost),
          suffix: scale_suffix,
          note: "Support assets remain in the cost burden.",
          children: support_asset_children,
        },
      ],
    },
    {
      key: "general-overheads",
      label: "Business Overheads",
      value: scaled_general_overheads,
      amount: Math.abs(scaled_general_overheads),
      referenceTotal: Math.abs(scaled_non_people_cost_burden),
      suffix: scale_suffix,
      note: "Annual business overheads from Cost Summary.",
      children: overhead_category_children,
    },
  ].filter((item) => item.amount > 0);

  const people_cost_children = [
    {
      key: "productive-labour",
      label: "Productive labour",
      value: productive_staff_cost,
      amount: Math.abs(productive_staff_cost),
      referenceTotal: Math.abs(scaled_people_cost),
      suffix: scale_suffix,
      note: "Staff selected to contribute recovery hours.",
      children: productive_staff_children,
    },
    {
      key: "non-productive-labour",
      label: "Non-productive labour",
      value: non_productive_staff_cost,
      amount: Math.abs(non_productive_staff_cost),
      referenceTotal: Math.abs(scaled_people_cost),
      suffix: scale_suffix,
      note: "Staff that add cost but do not contribute recovery hours.",
      children: non_productive_staff_children,
    },
  ];

  const pending_contribution_children = [
    {
      key: "labour-contribution-split",
      label: "Labour Contribution Split",
      value: 0,
      amount: 0,
      referenceTotal: Math.abs(scaled_margin_pool),
      suffix: scale_suffix,
      isPending: true,
      includeInBar: false,
      note: "Not yet calculated.",
      pendingLabel: "Requires claimed labour hours / quote-job data",
    },
    {
      key: "material-contribution-split",
      label: "Material Contribution Split",
      value: 0,
      amount: 0,
      referenceTotal: Math.abs(scaled_margin_pool),
      suffix: scale_suffix,
      isPending: true,
      includeInBar: false,
      note: "Not yet calculated.",
      pendingLabel: "Requires claimed labour hours / quote-job data",
    },
    {
      key: "other-contribution-split",
      label: "Other Contribution Split",
      value: 0,
      amount: 0,
      referenceTotal: Math.abs(scaled_margin_pool),
      suffix: scale_suffix,
      isPending: true,
      includeInBar: false,
      note: "Not yet calculated.",
      pendingLabel: "Requires claimed labour hours / quote-job data",
    },
  ];

  const product_margin_pool_children = [
    {
      key: "revenue-generated",
      label: "Revenue",
      value: scaled_revenue,
      amount: revenue_reference_total,
      referenceTotal: revenue_reference_total,
      suffix: scale_suffix,
      isReference: true,
      includeInBar: false,
      note: "Annual product revenue.",
    },
    {
      key: "direct-costs",
      label: "COGS / Direct Costs",
      value: scaled_direct_costs,
      amount: Math.abs(scaled_direct_costs),
      referenceTotal: revenue_reference_total,
      suffix: scale_suffix,
      note: "Annual COGS / Direct Costs.",
      children: direct_cost_children,
    },
    {
      key: "units-sold",
      label: "Units Sold",
      value: 0,
      amount: 0,
      referenceTotal: revenue_reference_total,
      isPending: true,
      includeInBar: false,
      valueLabel: `${formatNumber(scaled_units_sold)} ${product_unit_suffix}`,
      pendingLabel: "Unit economics evidence",
    },
    {
      key: "revenue-per-unit",
      label: "Revenue per Unit",
      value: 0,
      amount: 0,
      referenceTotal: revenue_reference_total,
      isPending: true,
      includeInBar: false,
      valueLabel: `${formatCurrency(revenue_per_unit)} /unit`,
      pendingLabel: "Unit economics evidence",
    },
    {
      key: "direct-cost-per-unit",
      label: "Direct Cost per Unit",
      value: 0,
      amount: 0,
      referenceTotal: revenue_reference_total,
      isPending: true,
      includeInBar: false,
      valueLabel: `${formatCurrency(direct_cost_per_unit)} /unit`,
      pendingLabel: "Unit economics evidence",
    },
    {
      key: "margin-per-unit",
      label: "Margin per Unit",
      value: 0,
      amount: 0,
      referenceTotal: revenue_reference_total,
      isPending: true,
      includeInBar: false,
      valueLabel: `${formatCurrency(margin_per_unit)} /unit`,
      pendingLabel: "Unit economics evidence",
    },
  ];

  const labour_business_hierarchy = {
    key: "business-result",
    label: "Business Result",
    value: scaled_revenue,
    amount: revenue_reference_total,
    referenceTotal: revenue_reference_total,
    suffix: scale_suffix,
    shareLabel: "revenue",
    note: "This shows how your revenue is consumed before profit is created.",
    children: [
      {
        key: "revenue-generated",
        label: "Revenue Generated",
        value: scaled_revenue,
        amount: revenue_reference_total,
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        isReference: true,
        includeInBar: false,
        note: "This is the income available before direct costs and operating cost baseline are covered.",
      },
      {
        key: "direct-costs",
        label: "COG / Direct Costs",
        value: scaled_direct_costs,
        amount: Math.abs(scaled_direct_costs),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "Direct costs are removed before Gross Profit / Margin Pool is calculated.",
        shareLabel: "direct costs",
        children: direct_cost_children,
      },
      {
        key: "margin-pool",
        label: "Gross Profit / Margin Pool",
        value: scaled_margin_pool,
        amount: Math.abs(scaled_margin_pool),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: false,
        note: "Revenue after COG / Direct Costs.",
        shareLabel: "margin pool",
        children: pending_contribution_children,
      },
      {
        key: "people-cost",
        label: "Less People Cost",
        value: -Math.abs(scaled_people_cost),
        amount: Math.abs(scaled_people_cost),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "People Cost deducted from Gross Profit / Margin Pool.",
        shareLabel: "people cost",
        children: people_cost_children,
      },
      {
        key: "margin-after-labour",
        label: "Margin after Labour",
        value: scaled_margin_after_labour,
        amount: Math.abs(scaled_margin_after_labour),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: false,
        note: "Gross Profit / Margin Pool after People Cost. This shows whether the business is already positive or negative before assets and business overheads.",
      },
      {
        key: "remaining-cost-burden",
        label: "Remaining Cost Burden",
        value: scaled_non_people_cost_burden,
        amount: Math.abs(scaled_non_people_cost_burden),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "Asset Cost and Business Overheads still need to be covered after People Cost.",
        shareLabel: "remaining cost burden",
        children: remaining_cost_children,
      },
      {
        key: "surplus-deficit",
        label: surplus_or_deficit_label,
        value: scaled_net_position,
        amount: surplus_or_deficit_amount,
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: scaled_net_position >= 0,
        note:
          scaled_net_position >= 0
            ? "Revenue left after direct costs, People Cost, Asset Cost, and Business Overheads."
            : "Costs exceed revenue by this amount.",
      },
    ],
  };

  const product_business_hierarchy = {
    key: "business-result",
    label: "Business Result",
    value: scaled_revenue,
    amount: revenue_reference_total,
    referenceTotal: revenue_reference_total,
    suffix: scale_suffix,
    shareLabel: "revenue",
    note: "This shows how product revenue becomes trading margin, then whether that margin covers the business cost burden.",
    children: [
      {
        key: "revenue-generated",
        label: "Revenue",
        value: scaled_revenue,
        amount: revenue_reference_total,
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        isReference: true,
        includeInBar: false,
        note: "Product revenue generated before COGS / Direct Costs.",
      },
      {
        key: "direct-costs",
        label: "COGS / Direct Costs",
        value: scaled_direct_costs,
        amount: Math.abs(scaled_direct_costs),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "Direct costs are removed before Trading Margin Pool is calculated.",
        shareLabel: "direct costs",
        children: direct_cost_children,
      },
      {
        key: "margin-pool",
        label: "Trading Margin Pool",
        value: scaled_margin_pool,
        amount: Math.abs(scaled_margin_pool),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: false,
        note: "Revenue after COGS / Direct Costs.",
        shareLabel: "trading margin pool",
        children: product_margin_pool_children,
      },
      {
        key: "people-cost",
        label: "Less People Cost",
        value: -Math.abs(scaled_people_cost),
        amount: Math.abs(scaled_people_cost),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "People Cost deducted from Trading Margin Pool.",
        shareLabel: "people cost",
        children: people_cost_children,
      },
      {
        key: "margin-after-labour",
        label: "Margin after Labour",
        value: scaled_margin_after_labour,
        amount: Math.abs(scaled_margin_after_labour),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: false,
        note: "Trading Margin Pool after People Cost. This shows whether the business is positive or negative before assets and overheads.",
      },
      {
        key: "remaining-cost-burden",
        label: "Remaining Cost Burden",
        value: scaled_non_people_cost_burden,
        amount: Math.abs(scaled_non_people_cost_burden),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "Asset Cost and Business Overheads still need to be covered after People Cost.",
        shareLabel: "remaining cost burden",
        children: remaining_cost_children,
      },
      {
        key: "surplus-deficit",
        label: "Final Surplus / Deficit",
        value: scaled_net_position,
        amount: surplus_or_deficit_amount,
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: scaled_net_position >= 0,
        note: "Final position after Trading Margin Pool is reduced by People Cost, Asset Cost, and Business Overheads.",
      },
    ],
  };

  return {
    active_time_scale,
    business_hierarchy: product_mode_active
      ? product_business_hierarchy
      : labour_business_hierarchy,
    business_type_label,
    product_mode_active,
    hero: {
      product_position_title,
      product_hero_value,
      product_hero_suffix,
      product_helper_text,
      product_secondary_result,
      recovery_result_abs,
      recovery_result_label,
      recovery_headline,
    },
    result_table: {
      margin_per_unit,
      product_unit_suffix,
      recovery_hours_used,
      scale_label,
      scale_suffix,
      scaled_actual_recovery,
      scaled_net_position,
      scaled_recovery_result,
      scaled_required_recovery,
      scaled_required_units_to_break_even,
      scaled_unit_surplus_or_shortfall,
      scaled_units_sold,
    },
  };
}
