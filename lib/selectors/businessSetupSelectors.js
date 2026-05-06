function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function getBusinessTypeLabel(business_type = "") {
  if (business_type === "product_based") {
    return "Product / Unit-based business";
  }

  if (business_type === "labour_based") {
    return "Service / Labour-based business";
  }

  return "Not selected";
}

export function getBusinessDriverLabel(business_type = "") {
  if (business_type === "product_based") {
    return "Units";
  }

  if (business_type === "labour_based") {
    return "Hours";
  }

  return "Not set";
}

export function buildBusinessSetupStatus(state = {}) {
  const business_name = state.business_name || "";
  const business_type = state.business_type || "";
  const setup_completed =
    Boolean(state.setup_completed) &&
    hasValue(business_name) &&
    hasValue(business_type);

  const warnings = [];

  if (!hasValue(business_name)) {
    warnings.push("Business name is required.");
  }

  if (!hasValue(business_type)) {
    warnings.push("Business type is required.");
  }

  return {
    setup_status: setup_completed ? "complete" : "incomplete",
    setup_status_label: setup_completed ? "Setup complete" : "Setup incomplete",
    business_name_label: hasValue(business_name)
      ? business_name
      : "No business name",
    business_type_label: getBusinessTypeLabel(business_type),
    activity_driver_label: getBusinessDriverLabel(business_type),
    setup_completed,
    warning_count: warnings.length,
    warnings,
  };
}

export function buildBusinessSetupCard(state = {}) {
  const business_type = state.business_type || "labour_based";

  return {
    business_name: state.business_name || "",
    business_type,
    setup_completed: Boolean(state.setup_completed),
    business_type_options: [
      {
        value: "labour_based",
        label: "Service / Labour-based business",
        helper:
          "Choose this if your business mainly sells time, labour, services, or charge-out hours.",
        examples:
          "Builders, contractors, trades, consultants, and service businesses.",
        driver_label: "Activity driver: productive hours",
        is_selected: business_type === "labour_based",
      },
      {
        value: "product_based",
        label: "Product / Unit-based business",
        helper:
          "Choose this if your business mainly sells products, units, subscriptions, or productised outputs.",
        examples:
          "Retail, online stores, SaaS, manufacturing, subscriptions, and product businesses.",
        driver_label: "Activity driver: units sold",
        is_selected: business_type === "product_based",
      },
    ],
  };
}