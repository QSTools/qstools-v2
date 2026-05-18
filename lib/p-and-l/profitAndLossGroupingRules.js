import {
  infer_direct_cost_category_id,
  is_wip_line,
  normalize_line_name,
} from "@/lib/p-and-l/profitAndLossClassificationRules";

export function get_direct_cost_categories(state = {}) {
  return Array.isArray(state.direct_cost_categories)
    ? state.direct_cost_categories.filter(
        (category) => category?.is_active !== false,
      )
    : [];
}

export function get_direct_cost_category_name(state = {}, category_id = "") {
  const matched_category = get_direct_cost_categories(state).find(
    (category) => category.category_id === category_id,
  );

  return matched_category?.category_name || "Other direct costs";
}

export function get_operating_expense_group_key(line) {
  const name = normalize_line_name(line.line_name);
  const category = line.category ?? "unassigned";

  if (
    name.includes("kiwisaver") ||
    name.includes("kiwi saver") ||
    name.includes("acc levy") ||
    name.includes("acc ") ||
    name === "acc"
  ) {
    return "labour";
  }

  if (
    name.includes("travel") ||
    name.includes("entertainment") ||
    name.includes("penalt")
  ) {
    return "other_unallocated";
  }

  if (category === "labour") {
    return "labour";
  }

  if (category === "employee_overheads") {
    return "staff_overheads";
  }

  if (category === "assets") {
    return "assets_equipment";
  }

  if (category === "general_overheads") {
    if (
      name.includes("vehicle") ||
      name.includes("motor") ||
      name.includes("fuel") ||
      name.includes("diesel") ||
      name.includes("petrol") ||
      name.includes("registration") ||
      name.includes("registrations") ||
      name.includes("rego") ||
      name.includes("licence") ||
      name.includes("licences") ||
      name.includes("license") ||
      name.includes("licenses") ||
      name.includes("repair") ||
      name.includes("repairs") ||
      name.includes("maintenance") ||
      name.includes("servicing")
    ) {
      return "vehicles_running";
    }

    if (
      name.includes("tool") ||
      name.includes("tools") ||
      name.includes("ppe") ||
      name.includes("uniform") ||
      name.includes("uniforms") ||
      name.includes("training") ||
      name.includes("small equipment")
    ) {
      return "staff_overheads";
    }

    if (
      name.includes("accounting") ||
      name.includes("legal") ||
      name.includes("bank fees") ||
      name.includes("bookkeeper")
    ) {
      return "financial_admin";
    }

    if (name.includes("insurance")) {
      return "insurance_compliance";
    }

    if (
      name.includes("rent") ||
      name.includes("power") ||
      name.includes("cleaning") ||
      name.includes("storage")
    ) {
      return "facilities_premises";
    }

    if (name.includes("advertising") || name.includes("marketing")) {
      return "sales_growth";
    }

    return "office_admin";
  }

  if (category === "excluded") {
    return "excluded_items";
  }

  return "other_unallocated";
}

const OPERATING_EXPENSE_GROUPS = [
  {
    key: "labour",
    title: "Labour",
    help: "Wages and employer labour burden that should benchmark against the Labour module, including Salary & Wages, KiwiSaver, and ACC.",
    defaultOpen: false,
  },
  {
    key: "staff_overheads",
    title: "Staff Overheads",
    help: "Staff-linked and shared people support costs such as PPE, uniforms, training, tools, phones, small equipment, and similar overheads. These feed General Overheads.",
    defaultOpen: false,
  },
  {
    key: "vehicles_running",
    title: "Vehicles (Running)",
    help: "Shared vehicle fuel, licences, registrations, repairs, servicing, and maintenance. These feed General Overheads unless they are later assigned to a specific asset layer.",
    defaultOpen: false,
  },
  {
    key: "assets_equipment",
    title: "Assets / Equipment",
    help: "Plant, equipment, asset finance, ownership-related costs, and asset costs that are not shared vehicle running costs.",
    defaultOpen: false,
  },
  {
    key: "office_admin",
    title: "Office / Admin",
    help: "General office, admin, software, phone, internet, and business running costs.",
    defaultOpen: false,
  },
  {
    key: "financial_admin",
    title: "Financial Admin",
    help: "Accounting, bookkeeping, legal, bank fees, and finance administration.",
    defaultOpen: false,
  },
  {
    key: "insurance_compliance",
    title: "Insurance & Compliance",
    help: "Insurance, compliance, and related business cover.",
    defaultOpen: false,
  },
  {
    key: "facilities_premises",
    title: "Facilities / Premises",
    help: "Premises, rent, power, cleaning, storage, and site/office facility costs.",
    defaultOpen: false,
  },
  {
    key: "sales_growth",
    title: "Sales / Growth",
    help: "Advertising, marketing, and growth-related overheads.",
    defaultOpen: false,
  },
  {
    key: "excluded_items",
    title: "Excluded Items",
    help: "Penalties, non-deductible costs, and other items excluded from the Mirra cost model.",
    defaultOpen: false,
  },
  {
    key: "other_unallocated",
    title: "Other / Unallocated",
    help: "Travel, entertainment, unusual costs, and lines that still need review.",
    defaultOpen: false,
  },
];

export function group_operating_expense_lines(lines = []) {
  return OPERATING_EXPENSE_GROUPS.map((group) => ({
    ...group,
    lines: lines.filter(
      (line) => get_operating_expense_group_key(line) === group.key,
    ),
  }));
}

export function get_cost_of_sales_group_key(line) {
  const category = line.category || "unassigned";
  const direct_cost_category_id = line.direct_cost_category_id || "";
  const has_valid_direct_cost_category =
    Boolean(direct_cost_category_id) &&
    direct_cost_category_id !== "__review_required" &&
    direct_cost_category_id !== "review_required" &&
    direct_cost_category_id !== "__unassigned" &&
    direct_cost_category_id !== "unassigned";

  if (
    is_wip_line(line.line_name) &&
    !(category === "cogs" && has_valid_direct_cost_category)
  ) {
    return "__review_required";
  }

  if (category === "review_required") {
    return "__review_required";
  }

  if (category === "excluded") {
    return "__excluded";
  }

  if (category === "unassigned" || !category) {
    return "__unassigned";
  }

  if (category === "cogs") {
    return (
      direct_cost_category_id || infer_direct_cost_category_id(line.line_name)
    );
  }

  return "__review_required";
}

export function group_cost_of_sales_lines(state = {}, lines = []) {
  const reserved_category_ids = [
    "review_required",
    "__review_required",
    "excluded",
    "__excluded",
    "unassigned",
    "__unassigned",
  ];

  const direct_cost_categories = get_direct_cost_categories(state).filter(
    (category) => !reserved_category_ids.includes(category.category_id),
  );

  const base_groups = direct_cost_categories
    .map((category) => {
      const group_lines = lines.filter(
        (line) => get_cost_of_sales_group_key(line) === category.category_id,
      );

      return {
        key: `direct_${category.category_id}`,
        group_key: category.category_id,
        title: category.category_name,
        help: "Direct costs attached to producing, buying, or delivering what you sell.",
        defaultOpen: false,
        is_custom: category.is_default === false,
        lines: group_lines,
      };
    })
    .filter((group) => group.lines.length > 0 || group.is_custom);

  const review_group = {
    key: "__review_required",
    group_key: "__review_required",
    title: "Review Required",
    help: "Lines that need review before Mirra can trust the Cost of Sales baseline.",
    defaultOpen: true,
    lines: lines.filter(
      (line) => get_cost_of_sales_group_key(line) === "__review_required",
    ),
  };

  const excluded_group = {
    key: "__excluded",
    group_key: "__excluded",
    title: "Excluded",
    help: "Lines excluded from the Mirra cost model.",
    defaultOpen: false,
    lines: lines.filter(
      (line) => get_cost_of_sales_group_key(line) === "__excluded",
    ),
  };

  const unassigned_group = {
    key: "__unassigned",
    group_key: "__unassigned",
    title: "Unassigned",
    help: "Lines that still need a direct cost category.",
    defaultOpen: true,
    lines: lines.filter(
      (line) => get_cost_of_sales_group_key(line) === "__unassigned",
    ),
  };

  const system_groups = [review_group, excluded_group, unassigned_group].filter(
    (group) => group.lines.length > 0,
  );

  return [...base_groups, ...system_groups];
}
