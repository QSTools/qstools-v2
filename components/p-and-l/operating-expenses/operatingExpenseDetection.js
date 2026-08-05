export function detect_operating_expense_subcategory(line_name = "") {
  const normalized = String(line_name).trim().toLowerCase();

  if (
    normalized.includes("salary") ||
    normalized.includes("wages") ||
    normalized.includes("payroll")
  ) {
    return {
      category: "labour",
      subcategory: "salary_wages",
      label: "Salary & Wages",
    };
  }

  if (normalized.includes("kiwisaver") || normalized.includes("kiwi saver")) {
    return {
      category: "labour",
      subcategory: "employer_kiwisaver",
      label: "KiwiSaver",
    };
  }

  if (normalized.includes("acc levy") || normalized.includes("acc ")) {
    return {
      category: "labour",
      subcategory: "employer_acc",
      label: "ACC Levy",
    };
  }

  if (
    normalized.includes("staff expense") ||
    normalized.includes("staff expenses") ||
    normalized.includes("staff welfare") ||
    normalized.includes("staff amenities") ||
    normalized.includes("staff support")
  ) {
    return {
      category: "general_overheads",
      subcategory: "staff_overheads",
      label: "Staff Overheads",
    };
  }

  if (normalized.includes("entertainment")) {
    return {
      category: "general_overheads",
      subcategory: "staff_overheads",
      label: "Entertainment",
    };
  }

  if (normalized.includes("insurance")) {
    return {
      category: "general_overheads",
      subcategory: "insurance_compliance",
      label: "Insurance / Compliance",
    };
  }

  if (
    normalized.includes("fuel") ||
    normalized.includes("diesel") ||
    normalized.includes("petrol") ||
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("registration") ||
    normalized.includes("registrations") ||
    normalized.includes("rego") ||
    normalized.includes("licence") ||
    normalized.includes("licences") ||
    normalized.includes("license") ||
    normalized.includes("licenses") ||
    normalized.includes("repair") ||
    normalized.includes("repairs") ||
    normalized.includes("maintenance") ||
    normalized.includes("servicing")
  ) {
    return {
      category: "general_overheads",
      subcategory: "vehicle_running_costs",
      label: "Vehicle Running Costs",
    };
  }

  if (
    normalized.includes("computer") ||
    normalized.includes("printing") ||
    normalized.includes("stationery") ||
    normalized.includes("office") ||
    normalized.includes("supplies") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("internet") ||
    normalized.includes("software") ||
    normalized.includes("subscription")
  ) {
    return {
      category: "general_overheads",
      subcategory: "office_admin",
      label: "Office / Admin",
    };
  }

  if (normalized.includes("mixed") || normalized.includes("mixed finance")) {
    return {
      category: "general_overheads",
      subcategory: "finance_interest",
      label: "Mixed Finance / Assets + Business",
    };
  }

  if (
    normalized.includes("asset finance") ||
    normalized.includes("equipment finance") ||
    normalized.includes("finance lease")
  ) {
    return {
      category: "assets",
      subcategory: "asset_finance",
      label: "Asset Finance",
    };
  }

  if (normalized.includes("accounting") || normalized.includes("bookkeeper")) {
    return {
      category: "general_overheads",
      subcategory: "finance_admin",
      label: "Accounting / Admin",
    };
  }

  if (
    normalized.includes("bank fees") ||
    normalized.includes("loan interest") ||
    normalized.includes("finance") ||
    normalized.includes("interest")
  ) {
    return {
      category: "general_overheads",
      subcategory: "finance_interest",
      label: "Finance / Interest",
    };
  }

  if (
    normalized.includes("legal") ||
    normalized.includes("compliance") ||
    normalized.includes("audit")
  ) {
    return {
      category: "general_overheads",
      subcategory: "insurance_compliance",
      label: "Insurance / Compliance",
    };
  }

  if (normalized.includes("travel")) {
    return {
      category: "general_overheads",
      subcategory: "travel",
      label: "Travel",
    };
  }

  if (normalized.includes("advertising") || normalized.includes("marketing")) {
    return {
      category: "general_overheads",
      subcategory: "sales_growth",
      label: "Sales / Growth",
    };
  }

  if (
    normalized.includes("penalt") ||
    normalized.includes("fee") ||
    normalized.includes("fine") ||
    normalized.includes("non-deductible")
  ) {
    return {
      category: "excluded",
      subcategory: "penalties_non_deductible",
      label: "Penalties / Non-Deductible",
    };
  }

  if (
    normalized.includes("excluded") ||
    normalized.includes("non-qs") ||
    normalized.includes("non qs")
  ) {
    return {
      category: "excluded",
      subcategory: "excluded_non_qs",
      label: "Excluded / Non-QS Cost",
    };
  }

  if (normalized.includes("other") || normalized.includes("review required")) {
    return {
      category: "review_required",
      subcategory: "other_review_required",
      label: "Other / Review Required",
    };
  }

  return null;
}

