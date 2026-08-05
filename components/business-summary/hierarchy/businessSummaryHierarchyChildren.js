import {
  formatCurrency,
  formatNumber,
} from "@/components/business-summary/BusinessSummaryCardUtils";
import {
  sumAssetCost,
  sumStaffCost,
} from "@/components/business-summary/hierarchy/businessSummaryHierarchyScaleUtils";

export function buildBusinessSummaryHierarchyChildren({
  active_assets,
  active_staff,
  direct_cost_category_totals,
  direct_cost_per_unit,
  margin_per_unit,
  overhead_category_totals,
  product_unit_suffix,
  revenue_per_unit,
  scaleDisplayPeriodValue,
  scale_suffix,
  scaled_asset_cost,
  scaled_direct_costs,
  scaled_general_overheads,
  scaled_margin_pool,
  scaled_non_people_cost_burden,
  scaled_people_cost,
  scaled_revenue,
  scaled_units_sold,
}) {
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

  const revenue_reference_total = Math.abs(scaled_revenue);
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

  return {
    direct_cost_children,
    people_cost_children,
    pending_contribution_children,
    product_margin_pool_children,
    remaining_cost_children,
  };
}
