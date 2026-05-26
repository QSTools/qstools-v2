import ExcelJS from "exceljs";

const CREDIT_NOTE_SOURCE = "payable credit note";

const DEFAULT_VISIBLE_TREATMENTS = new Set([
  "cog_included",
  "review_required",
]);

const XERO_ACCOUNT_TREATMENT_RULES = [
  {
    match: [
      "purchase",
      "purchases",
      "cost of sales",
      "cost of goods",
      "materials",
      "subcontract",
    ],
    pnl_default_group: "direct_cost",
    cog_import_treatment: "cog_included",
    include_in_cog: true,
    visible_by_default: true,
  },
  {
    match: ["wages", "salaries", "paye", "kiwisaver", "payroll"],
    pnl_default_group: "labour",
    cog_import_treatment: "excluded_labour",
    include_in_cog: false,
    visible_by_default: false,
  },
  {
    match: [
      "fuel",
      "vehicle",
      "repairs",
      "maintenance",
      "finance",
      "loan",
      "hire purchase",
    ],
    pnl_default_group: "asset_cost",
    cog_import_treatment: "excluded_asset",
    include_in_cog: false,
    visible_by_default: false,
  },
  {
    match: [
      "insurance",
      "acc",
      "compliance",
      "software",
      "telephone",
      "subscriptions",
      "office",
      "accounting",
      "legal",
    ],
    pnl_default_group: "overhead",
    cog_import_treatment: "excluded_overhead",
    include_in_cog: false,
    visible_by_default: false,
  },
  {
    match: ["gst", "ird", "tax", "income tax"],
    pnl_default_group: "tax",
    cog_import_treatment: "excluded_tax",
    include_in_cog: false,
    visible_by_default: false,
  },
];

function normalise_text(value) {
  return String(value ?? "").trim().toLowerCase();
}

function clean_text(value) {
  if (value && typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result) return String(value.result).trim();
    if (value.richText) {
      return value.richText.map((part) => part.text || "").join("").trim();
    }
  }

  return String(value ?? "").trim();
}

function parse_money(value) {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") return value;

  let text = clean_text(value);

  if (!text || text === "-") return 0;

  let is_negative = false;

  if (text.startsWith("(") && text.endsWith(")")) {
    is_negative = true;
    text = text.slice(1, -1);
  }

  text = text.replace(/,/g, "").replace(/\$/g, "").trim();

  const parsed = Number(text);

  if (!Number.isFinite(parsed)) return 0;

  return is_negative ? -parsed : parsed;
}

function is_report_title_row(row) {
  const joined = row.map(normalise_text).join(" ");

  return (
    joined.includes("payable invoice detail") ||
    joined.includes("for the period") ||
    joined.includes("tsc construction")
  );
}

function is_header_row(row) {
  const cells = row.map(normalise_text);

  return (
    cells.includes("source") &&
    cells.includes("invoice total") &&
    cells.includes("account")
  );
}

function find_header_indexes(row) {
  const cells = row.map(normalise_text);

  return {
    source_index: cells.findIndex((value) => value === "source"),
    invoice_total_index: cells.findIndex((value) => value === "invoice total"),
    account_index: cells.findIndex((value) => value === "account"),
  };
}

function is_total_row(row) {
  return normalise_text(row[0]).startsWith("total ");
}

function extract_supplier_from_total_row(row) {
  const value = clean_text(row[0]);

  if (!value.toLowerCase().startsWith("total ")) return "";

  return value.replace(/^total\s+/i, "").trim();
}

function is_supplier_heading_row(row) {
  const non_empty_cells = row.map(clean_text).filter((value) => value !== "");

  if (non_empty_cells.length !== 1) return false;

  const value = non_empty_cells[0];
  const lower = value.toLowerCase();

  if (!value) return false;
  if (lower.startsWith("total ")) return false;
  if (lower.includes("source")) return false;
  if (lower.includes("invoice total")) return false;
  if (lower.includes("account")) return false;
  if (lower.includes("payable invoice detail")) return false;
  if (lower.includes("for the period")) return false;

  return true;
}

function should_parse_transaction_row(row, indexes) {
  const source = clean_text(row[indexes.source_index]);
  const invoice_total = clean_text(row[indexes.invoice_total_index]);
  const account = clean_text(row[indexes.account_index]);

  if (!source && !invoice_total && !account) return false;
  if (!source || !account) return false;

  return true;
}

function get_signed_invoice_total(source, invoice_total) {
  const parsed = parse_money(invoice_total);
  const source_key = normalise_text(source);

  if (source_key === CREDIT_NOTE_SOURCE && parsed > 0) {
    return parsed * -1;
  }

  return parsed;
}

function get_account_treatment(account_name) {
  const account = normalise_text(account_name);

  for (const rule of XERO_ACCOUNT_TREATMENT_RULES) {
    const matched = rule.match.some((keyword) => account.includes(keyword));

    if (matched) {
      return {
        pnl_default_group: rule.pnl_default_group,
        cog_import_treatment: rule.cog_import_treatment,
        include_in_cog: rule.include_in_cog,
        visible_by_default: rule.visible_by_default,
      };
    }
  }

  return {
    pnl_default_group: "unknown",
    cog_import_treatment: "review_required",
    include_in_cog: false,
    visible_by_default: true,
  };
}

function classify_supplier_account({ supplier_name, account_name }) {
  const supplier = normalise_text(supplier_name);
  const account = normalise_text(account_name);
  const combined = `${supplier} ${account}`;

  if (
    account.includes("acc") ||
    supplier.includes("accident compensation") ||
    supplier.includes("companies office") ||
    supplier.includes("hazardco")
  ) {
    return {
      suggested_qs_category: "general_overhead",
      include_in_cog: false,
      review_required: false,
      review_reason: "",
    };
  }

  if (
    account.includes("fuel") ||
    supplier.includes("z energy") ||
    supplier.includes("repco") ||
    supplier.includes("pirtek") ||
    supplier.includes("hosefast") ||
    supplier.includes("automotive") ||
    supplier.includes("neil park motors") ||
    supplier.includes("kirrane automotive") ||
    supplier.includes("nz transport") ||
    supplier.includes("nzta")
  ) {
    return {
      suggested_qs_category: "asset_running_cost",
      include_in_cog: false,
      review_required: false,
      review_reason: "",
    };
  }

  if (
    supplier.includes("udc finance") ||
    supplier.includes("oxford finance") ||
    supplier.includes("monument premium funding") ||
    supplier.includes("gallagher") ||
    combined.includes("insurance") ||
    combined.includes("loan") ||
    combined.includes("finance")
  ) {
    return {
      suggested_qs_category: "asset_finance_or_insurance",
      include_in_cog: false,
      review_required: true,
      review_reason:
        "Finance or insurance supplier. Confirm whether this belongs in Assets, General Overheads, or should be excluded from COG.",
    };
  }

  if (
    supplier.includes("smartly") ||
    supplier.includes("ird") ||
    combined.includes("wages") ||
    combined.includes("salaries") ||
    combined.includes("paye") ||
    combined.includes("kiwisaver")
  ) {
    return {
      suggested_qs_category: "payroll_or_tax",
      include_in_cog: false,
      review_required: false,
      review_reason: "",
    };
  }

  if (
    supplier.includes("allied concrete") ||
    supplier.includes("manukau quarry") ||
    supplier.includes("super steel") ||
    supplier.includes("the blockshop") ||
    supplier.includes("akarana timber") ||
    supplier.includes("akirana timber") ||
    supplier.includes("expol") ||
    supplier.includes("hynds") ||
    supplier.includes("steel and tube") ||
    supplier.includes("precast") ||
    supplier.includes("plyman") ||
    supplier.includes("canzac")
  ) {
    return {
      suggested_qs_category: "materials",
      include_in_cog: true,
      review_required: false,
      review_reason: "",
    };
  }

  if (
    supplier.includes("ktk") ||
    supplier.includes("concrete pumping") ||
    supplier.includes("k & c") ||
    supplier.includes("blocklaying") ||
    supplier.includes("bricklaying") ||
    supplier.includes("prime skills") ||
    supplier.includes("structuretech") ||
    supplier.includes("mpm waterproofing") ||
    supplier.includes("infinit8") ||
    supplier.includes("sol constructors") ||
    supplier.includes("r&j reinforcing") ||
    supplier.includes("fccn reinforcing") ||
    supplier.includes("eden bricklayers") ||
    supplier.includes("asap machine hire") ||
    supplier.includes("atom heavy hire") ||
    supplier.includes("nss") ||
    supplier.includes("scaffold") ||
    supplier.includes("diamond cutters") ||
    supplier.includes("concrete cutters")
  ) {
    return {
      suggested_qs_category: "subcontract",
      include_in_cog: true,
      review_required: false,
      review_reason: "",
    };
  }

  if (
    supplier.includes("bunnings") ||
    supplier.includes("mitre 10") ||
    supplier.includes("powertool") ||
    supplier.includes("tool shed") ||
    supplier.includes("machinery house") ||
    supplier.includes("tradelink")
  ) {
    return {
      suggested_qs_category: "mixed_review",
      include_in_cog: false,
      review_required: true,
      review_reason:
        "Mixed supplier. Confirm whether this is materials, tools, consumables, asset cost, or overhead.",
    };
  }

  if (
    supplier.includes("microsoft") ||
    supplier.includes("spark") ||
    supplier.includes("idigital") ||
    supplier.includes("professional cad") ||
    supplier.includes("pb tech") ||
    supplier.includes("pc traders") ||
    supplier.includes("business like")
  ) {
    return {
      suggested_qs_category: "general_overhead",
      include_in_cog: false,
      review_required: false,
      review_reason: "",
    };
  }

  if (account.includes("purchases")) {
    return {
      suggested_qs_category: "purchases_review",
      include_in_cog: true,
      review_required: true,
      review_reason:
        "Xero account is Purchases, but supplier was not recognised. Confirm whether this is Materials, Subcontract, Consumables, or exclude from COG.",
    };
  }

  return {
    suggested_qs_category: "unknown_review",
    include_in_cog: false,
    review_required: true,
    review_reason: "No supplier/account rule matched.",
  };
}

function add_to_summary(summary_map, row) {
  const key = `${row.supplier_name}||${row.account_name}`;

  if (!summary_map.has(key)) {
    const account_treatment = get_account_treatment(row.account_name);

    const classification = classify_supplier_account({
      supplier_name: row.supplier_name,
      account_name: row.account_name,
    });

    const final_review_required =
      classification.review_required ||
      account_treatment.cog_import_treatment === "review_required";

    const final_treatment = final_review_required
      ? "review_required"
      : account_treatment.cog_import_treatment;

    const final_include_in_cog =
      account_treatment.cog_import_treatment === "cog_included" &&
      classification.include_in_cog !== false &&
      !final_review_required;

    summary_map.set(key, {
      supplier_name: row.supplier_name,
      account_name: row.account_name,
      annual_total_gross: 0,
      transaction_count: 0,

      pnl_default_group: account_treatment.pnl_default_group,
      cog_import_treatment: final_treatment,
      visible_by_default:
        DEFAULT_VISIBLE_TREATMENTS.has(final_treatment) ||
        final_review_required,

      suggested_qs_category: classification.suggested_qs_category,
      include_in_cog: final_include_in_cog,
      review_required: final_review_required,
      review_reason:
        classification.review_reason ||
        (account_treatment.cog_import_treatment === "review_required"
          ? "Xero account did not match a default P&L treatment."
          : ""),
    });
  }

  const item = summary_map.get(key);

  item.annual_total_gross += row.invoice_total;
  item.transaction_count += 1;
}

function build_category_summary(supplier_account_summary) {
  const category_map = new Map();

  for (const row of supplier_account_summary) {
    const key = row.cog_import_treatment;

    if (!category_map.has(key)) {
      category_map.set(key, {
        cog_import_treatment: key,
        annual_total_gross: 0,
        supplier_count: 0,
        account_count: 0,
        include_in_cog: row.include_in_cog,
        review_required: false,
      });
    }

    const item = category_map.get(key);

    item.annual_total_gross += row.annual_total_gross;
    item.account_count += 1;

    if (row.review_required) {
      item.review_required = true;
    }
  }

  for (const item of category_map.values()) {
    const suppliers = new Set(
      supplier_account_summary
        .filter((row) => row.cog_import_treatment === item.cog_import_treatment)
        .map((row) => row.supplier_name)
    );

    item.supplier_count = suppliers.size;
  }

  return Array.from(category_map.values()).sort(
    (a, b) => Math.abs(b.annual_total_gross) - Math.abs(a.annual_total_gross)
  );
}

export function parse_xero_cog_rows(sheet_rows) {
  let current_supplier = "";
  let indexes = null;

  const transaction_rows = [];
  const summary_map = new Map();
  const supplier_total_checks = [];

  for (const row of sheet_rows) {
    if (!row || row.length === 0) continue;
    if (is_report_title_row(row)) continue;

    if (is_header_row(row)) {
      indexes = find_header_indexes(row);
      continue;
    }

    if (!indexes) continue;

    if (is_supplier_heading_row(row)) {
      current_supplier = clean_text(row.find((cell) => clean_text(cell)));
      continue;
    }

    if (is_total_row(row)) {
      supplier_total_checks.push({
        supplier_name: extract_supplier_from_total_row(row),
      });
      continue;
    }

    if (!current_supplier) continue;
    if (!should_parse_transaction_row(row, indexes)) continue;

    const source = clean_text(row[indexes.source_index]);
    const account_name = clean_text(row[indexes.account_index]);
    const invoice_total_raw = row[indexes.invoice_total_index];

    const invoice_total = get_signed_invoice_total(source, invoice_total_raw);

    if (invoice_total === 0) continue;

    const transaction_row = {
      supplier_name: current_supplier,
      source,
      account_name,
      invoice_total,
    };

    transaction_rows.push(transaction_row);
    add_to_summary(summary_map, transaction_row);
  }

  const supplier_account_summary = Array.from(summary_map.values())
    .map((row) => ({
      ...row,
      annual_total_gross: Number(row.annual_total_gross.toFixed(2)),
    }))
    .sort(
      (a, b) => Math.abs(b.annual_total_gross) - Math.abs(a.annual_total_gross)
    );

  const review_rows = supplier_account_summary.filter(
    (row) => row.review_required
  );

  const cog_rows = supplier_account_summary.filter((row) => row.include_in_cog);

  const visible_default_rows = supplier_account_summary.filter(
    (row) => row.visible_by_default
  );

  const excluded_rows = supplier_account_summary.filter(
    (row) => !row.visible_by_default
  );

  const category_summary = build_category_summary(supplier_account_summary).map(
    (row) => ({
      ...row,
      annual_total_gross: Number(row.annual_total_gross.toFixed(2)),
    })
  );

  const cog_total_gross = cog_rows.reduce(
    (total, row) => total + row.annual_total_gross,
    0
  );

  return {
    supplier_account_summary,
    visible_default_rows,
    excluded_rows,
    category_summary,
    review_rows,
    transaction_rows,
    supplier_total_checks,
    import_meta: {
      importer_name: "Xero COG Importer",
      source_report: "Xero Payable Invoice Detail",
      required_columns: ["Source", "Invoice Total", "Account"],
      supplier_source: "Grouped supplier heading rows",
      modelling_amount: "annual_total_gross",
      cog_total_gross: Number(cog_total_gross.toFixed(2)),
      transaction_row_count: transaction_rows.length,
      supplier_account_row_count: supplier_account_summary.length,
      visible_default_row_count: visible_default_rows.length,
      excluded_row_count: excluded_rows.length,
      review_row_count: review_rows.length,
    },
  };
}

export async function read_xero_cog_workbook(file) {
  const array_buffer = await file.arrayBuffer();

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(array_buffer);

  const worksheet = workbook.worksheets[0];

  const sheet_rows = [];

  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values = [];

    row.eachCell({ includeEmpty: true }, (cell, col_number) => {
      values[col_number - 1] = cell.value ?? "";
    });

    sheet_rows.push(values);
  });

  return parse_xero_cog_rows(sheet_rows);
}