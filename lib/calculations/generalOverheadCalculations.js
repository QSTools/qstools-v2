function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function is_asset_finance_interest_row(row = {}) {
  return (
    row.contains_asset_finance_interest === true ||
    row.interest_treatment === "contains_asset_finance_interest"
  );
}

function is_interest_row(row = {}) {
  return (
    row.overhead_category_key === "finance_interest" ||
    String(row.label || "").toLowerCase().includes("interest") ||
    String(row.source_line_name || "").toLowerCase().includes("interest")
  );
}

export function calculate_general_overheads(overhead_state) {
  const fixed_rows = [
    {
      key: "public_liability_insurance",
      label: "Public Liability Insurance",
      amount: to_number(overhead_state.public_liability_insurance),
    },
    {
      key: "professional_indemnity_insurance",
      label: "Professional Indemnity Insurance",
      amount: to_number(overhead_state.professional_indemnity_insurance),
    },
    {
      key: "asset_insurance_cost",
      label: "Asset Insurance",
      amount: to_number(overhead_state.asset_insurance_cost),
    },
    {
      key: "accounting_fees",
      label: "Accounting Fees",
      amount: to_number(overhead_state.accounting_fees),
    },
    {
      key: "legal_fees",
      label: "Legal Fees",
      amount: to_number(overhead_state.legal_fees),
    },
    {
      key: "software_subscriptions",
      label: "Software Subscriptions",
      amount: to_number(overhead_state.software_subscriptions),
    },
    {
      key: "office_admin_cost",
      label: "Office / Admin",
      amount: to_number(overhead_state.office_admin_cost),
    },
    {
      key: "office_rent",
      label: "Office Rent",
      amount: to_number(overhead_state.office_rent),
    },
    {
      key: "power_cost",
      label: "Power",
      amount: to_number(overhead_state.power_cost),
    },
    {
      key: "internet_cost",
      label: "Internet",
      amount: to_number(overhead_state.internet_cost),
    },
    {
      key: "phone_system_cost",
      label: "Phone System",
      amount: to_number(overhead_state.phone_system_cost),
    },
    {
      key: "bank_fees",
      label: "Bank Fees",
      amount: to_number(overhead_state.bank_fees),
    },
    {
      key: "marketing_cost",
      label: "Marketing",
      amount: to_number(overhead_state.marketing_cost),
    },
    {
      key: "office_supplies_cost",
      label: "Office Supplies",
      amount: to_number(overhead_state.office_supplies_cost),
    },
    {
      key: "general_admin_cost",
      label: "General Admin",
      amount: to_number(overhead_state.general_admin_cost),
    },
    {
      key: "staff_overheads_cost",
      label: "Staff Overheads",
      amount: to_number(overhead_state.staff_overheads_cost),
    },
    {
      key: "finance_interest_cost",
      label: "Finance / Interest",
      amount: to_number(overhead_state.finance_interest_cost),
    },
    {
      key: "insurance_compliance_cost",
      label: "Insurance / Compliance",
      amount: to_number(overhead_state.insurance_compliance_cost),
    },
    {
      key: "sales_growth_cost",
      label: "Sales / Growth",
      amount: to_number(overhead_state.sales_growth_cost),
    },
    {
      key: "travel_cost",
      label: "Travel",
      amount: to_number(overhead_state.travel_cost),
    },
    {
      key: "fuel_cost_annual",
      label: "Fuel",
      amount: to_number(overhead_state.fuel_cost_annual),
    },
    {
      key: "vehicle_running_cost_annual",
      label: "Vehicle Running Costs",
      amount: to_number(overhead_state.vehicle_running_cost_annual),
    },
    {
      key: "vehicle_maintenance_cost_annual",
      label: "Vehicle Maintenance",
      amount: to_number(overhead_state.vehicle_maintenance_cost_annual),
    },
    {
      key: "vehicle_repairs_cost_annual",
      label: "Vehicle Repairs",
      amount: to_number(overhead_state.vehicle_repairs_cost_annual),
    },
    {
      key: "vehicle_registration_cost_annual",
      label: "Registration / Licensing",
      amount: to_number(overhead_state.vehicle_registration_cost_annual),
    },
    {
      key: "vehicle_tyres_cost_annual",
      label: "Tyres",
      amount: to_number(overhead_state.vehicle_tyres_cost_annual),
    },
    {
      key: "vehicle_consumables_cost_annual",
      label: "Vehicle Consumables",
      amount: to_number(overhead_state.vehicle_consumables_cost_annual),
    },
    {
      key: "other_general_overhead_cost",
      label: "Other General Overheads",
      amount: to_number(overhead_state.other_general_overhead_cost),
    },
  ];

  const synced_pnl_rows = (overhead_state.synced_pnl_overhead_items ?? []).map(
    (item) => ({
      key: item.synced_overhead_id,
      label: item.synced_overhead_name || "Synced P&L Overhead",
      amount: to_number(item.synced_overhead_amount),
      is_synced_from_pnl: true,
      overhead_category_key: item.overhead_category_key || "",
      source_module: item.source_module || "",
      source_pnl_line_id: item.source_pnl_line_id || "",
      source_line_name: item.source_line_name || "",
      source_review_subcategory: item.source_review_subcategory || "",
      source_category: item.source_category || "",
      source_section: item.source_section || "",
      interest_treatment: item.interest_treatment || "",
      contains_asset_finance_interest:
        item.contains_asset_finance_interest === true,
    })
  );

  const custom_rows = (overhead_state.custom_overhead_items ?? []).map(
    (item) => ({
      key: item.custom_overhead_id,
      label: item.custom_overhead_name || "Custom Overhead",
      amount: to_number(item.custom_overhead_amount),
      is_custom: true,
      overhead_category_key: item.overhead_category_key || "",
      source_module: item.source_module || "",
      source_pnl_line_id: item.source_pnl_line_id || "",
      source_line_name: item.source_line_name || "",
      source_review_subcategory: item.source_review_subcategory || "",
      source_category: item.source_category || "",
      interest_treatment: item.interest_treatment || "",
      contains_asset_finance_interest:
        item.contains_asset_finance_interest === true,
    })
  );

  const overhead_rows = [...fixed_rows, ...synced_pnl_rows, ...custom_rows].map(
    (row) => {
      const is_asset_finance_interest = is_asset_finance_interest_row(row);

      return {
        ...row,
        is_asset_finance_interest,
        active_amount: is_asset_finance_interest ? 0 : to_number(row.amount),
      };
    }
  );

  const total_general_overheads = overhead_rows.reduce(
    (sum, row) => sum + to_number(row.active_amount),
    0
  );

  const non_asset_interest_annual = overhead_rows.reduce((sum, row) => {
    if (!is_interest_row(row) || is_asset_finance_interest_row(row)) {
      return sum;
    }

    return sum + to_number(row.active_amount);
  }, 0);

  return {
    overhead_rows,
    total_general_overheads,
    non_asset_interest_annual,
  };
}
