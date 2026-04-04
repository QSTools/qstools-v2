function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function sortDesc(rows = []) {
  return [...rows].sort((a, b) => toNumber(b.value) - toNumber(a.value));
}

export function selectCostSummaryStatus({
  labour_profiles = [],
  employee_overheads = [],
  assets = [],
  general_overheads = null,
  cost_allocation = null,
}) {
  const activeLabour = labour_profiles.filter((item) => item?.is_active);
  const activeEmployeeOverheads = employee_overheads.filter(
    (item) => item?.is_active
  );
  const activeAssets = assets.filter(
    (item) => item?.is_active && !item?.is_retired
  );

  const activeRevenueModel = cost_allocation?.active_revenue_model || null;
  const linkedStaffCount = toNumber(cost_allocation?.linked_staff_count);
  const linkedAssetCount = toNumber(cost_allocation?.linked_asset_count);
  const unlinkedActiveStaffCount = toNumber(
    cost_allocation?.unlinked_active_staff_count
  );

  const hasActiveStaff = activeLabour.length > 0;
  const hasEmployeeOverheads = activeEmployeeOverheads.length > 0;
  const totalGeneralOverheads = toNumber(
    general_overheads?.total_general_overheads
  );

  const missing_modules = [];
  const warnings = [];

  if (!hasActiveStaff) {
    missing_modules.push("No active staff profiles");
  }

  if (!activeRevenueModel) {
    missing_modules.push("No active recovery model");
  }

  if (!hasEmployeeOverheads) {
    warnings.push("No overheads applied");
  }

  if (totalGeneralOverheads <= 0) {
    warnings.push("No general overheads applied");
  }

  if (activeRevenueModel === "asset_driven" && linkedStaffCount === 0) {
    warnings.push("No active asset links");
  }

  if (activeRevenueModel === "labour_only" && linkedStaffCount === 0) {
    warnings.push("No asset links (labour_only assumed)");
  }

  if (unlinkedActiveStaffCount > 0) {
    warnings.push(`${unlinkedActiveStaffCount} staff not linked to asset`);
  }

  if (activeRevenueModel === "asset_driven" && activeAssets.length === 0) {
    warnings.push("No active assets available");
  }

  const is_structure_complete =
    missing_modules.length === 0 &&
    hasActiveStaff &&
    Boolean(activeRevenueModel);

  return {
    recovery_model_label:
      activeRevenueModel === "asset_driven"
        ? "Asset Driven"
        : activeRevenueModel === "labour_only"
          ? "Labour Only"
          : "Not set",
    linked_staff_count: linkedStaffCount,
    linked_asset_count: linkedAssetCount,
    unlinked_active_staff_count: unlinkedActiveStaffCount,
    missing_modules,
    warnings,
    is_structure_complete,
  };
}

export function selectCostSummaryCard({
  labour_profiles = [],
  employee_overheads = [],
  assets = [],
  general_overheads = null,
  cost_allocation = null,
}) {
  const activeLabour = labour_profiles.filter((item) => item?.is_active);
  const activeEmployeeOverheads = employee_overheads.filter(
    (item) => item?.is_active
  );
  const activeAssets = assets.filter(
    (item) => item?.is_active && !item?.is_retired
  );

  const status = selectCostSummaryStatus({
    labour_profiles,
    employee_overheads,
    assets,
    general_overheads,
    cost_allocation,
  });

  const labourRows = activeLabour.map((item, index) => {
    const productiveHours = toNumber(item?.productive_hours);
    const labourCostRate = toNumber(item?.labour_cost_rate);
    const annualCost = productiveHours * labourCostRate;

    return {
      key:
        item?.staff_id ||
        item?.id ||
        `staff-${item?.staff_name || "unknown"}-${index}`,
      staff_id: item?.staff_id || null,
      label: item?.staff_name || "Unnamed Staff",
      meta: [item?.staff_role, item?.labour_class].filter(Boolean).join(" • "),
      value: annualCost,
    };
  });

  const overheadByStaffId = new Map(
    activeEmployeeOverheads.map((item) => [
      item?.staff_id,
      {
        total_annual_overheads: toNumber(item?.total_annual_overheads),
      },
    ])
  );

  const peopleDrilldown = sortDesc(
    labourRows.map((row) => {
      const overhead = overheadByStaffId.get(row.staff_id);
      const overheadValue = toNumber(overhead?.total_annual_overheads);

      return {
        key: row.key,
        label: row.label,
        meta: row.meta,
        value: row.value + overheadValue,
      };
    })
  );

  const labourCostTotal = labourRows.reduce(
    (sum, row) => sum + toNumber(row.value),
    0
  );

  const employeeOverheadsTotal = activeEmployeeOverheads.reduce(
    (sum, item) => sum + toNumber(item?.total_annual_overheads),
    0
  );

  const peopleCostTotal = labourCostTotal + employeeOverheadsTotal;

  const assetDrilldown = sortDesc(
    activeAssets.map((item, index) => ({
      key:
        item?.asset_id ||
        item?.id ||
        `asset-${item?.asset_name || "unknown"}-${index}`,
      label: item?.asset_name || "Unnamed Asset",
      meta: item?.is_retired ? "Retired" : "Active Asset",
      value: toNumber(item?.total_asset_cost_annual),
    }))
  );

  const assetCostTotal = assetDrilldown.reduce(
    (sum, row) => sum + toNumber(row.value),
    0
  );

  const fixedOverheadFields = [
    ["Public Liability Insurance", general_overheads?.public_liability_insurance],
    [
      "Professional Indemnity Insurance",
      general_overheads?.professional_indemnity_insurance,
    ],
    ["Accounting Fees", general_overheads?.accounting_fees],
    ["Legal Fees", general_overheads?.legal_fees],
    ["Software Subscriptions", general_overheads?.software_subscriptions],
    ["Office Rent", general_overheads?.office_rent],
    ["Power", general_overheads?.power_cost],
    ["Internet", general_overheads?.internet_cost],
    ["Phone System", general_overheads?.phone_system_cost],
    ["Bank Fees", general_overheads?.bank_fees],
    ["Marketing", general_overheads?.marketing_cost],
    ["Office Supplies", general_overheads?.office_supplies_cost],
    ["General Admin", general_overheads?.general_admin_cost],
    ["Other General Overheads", general_overheads?.other_general_overhead_cost],
  ];

  const customOverheads = Array.isArray(general_overheads?.custom_overhead_items)
    ? general_overheads.custom_overhead_items.map((item, index) => ({
        key: item?.custom_overhead_id || `custom-overhead-${index}`,
        label: item?.custom_overhead_name || "Custom Overhead",
        meta: "Custom Item",
        value: toNumber(item?.custom_overhead_amount),
      }))
    : [];

  const overheadDrilldown = sortDesc([
    ...fixedOverheadFields
      .map(([label, value], index) => ({
        key: `fixed-overhead-${index}`,
        label,
        meta: "Fixed Overhead",
        value: toNumber(value),
      }))
      .filter((item) => item.value > 0),
    ...customOverheads.filter((item) => item.value > 0),
  ]);

  const generalOverheadsTotal =
    toNumber(general_overheads?.total_general_overheads) ||
    overheadDrilldown.reduce((sum, row) => sum + toNumber(row.value), 0);

  const businessCostTotal = assetCostTotal + generalOverheadsTotal;

  const totalProductiveOutput = activeLabour.reduce(
    (sum, item) => sum + toNumber(item?.productive_hours),
    0
  );

  const totalCostBurden = peopleCostTotal + businessCostTotal;
  const requiredRevenue = totalCostBurden;
  const requiredRecoveryRate =
    totalProductiveOutput > 0 ? totalCostBurden / totalProductiveOutput : 0;

  let insightText = "";
  if (totalCostBurden > 0) {
    const labourShare = (peopleCostTotal / totalCostBurden) * 100;
    if (labourShare >= 1) {
      insightText = `People cost represents ${Math.round(
        labourShare
      )}% of total cost`;
    }
  }

  return {
    recovery_model_label: status.recovery_model_label,
    linked_staff_count: status.linked_staff_count,
    linked_asset_count: status.linked_asset_count,
    warnings: status.warnings,

    people_cost_total: peopleCostTotal,
    labour_cost_total: labourCostTotal,
    employee_overheads_total: employeeOverheadsTotal,
    people_drilldown: peopleDrilldown,

    business_cost_total: businessCostTotal,
    asset_cost_total: assetCostTotal,
    general_overheads_total: generalOverheadsTotal,
    asset_drilldown: assetDrilldown,
    overhead_drilldown: overheadDrilldown,

    total_cost_burden: totalCostBurden,
    required_revenue: requiredRevenue,
    required_recovery_rate: requiredRecoveryRate,

    insight_text: insightText,
  };
}