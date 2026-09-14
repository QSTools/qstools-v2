import ExcelJS from "exceljs";

// Balance Sheet importer - parses a Xero "Balance Sheet" report exported to
// Excel (Reports > Balance Sheet > Export > Excel). NOT an API pull - Xero
// API access requires an OAuth app/trial account, not yet set up (2026-09-12).
// This importer's OUTPUT SHAPE is designed to match what a future live API
// pull would return, so switching to a live feed later should mean swapping
// this file's internals, not reshaping every downstream consumer.
//
// Confirmed against a real exported file (2026-09-12): standard Xero layout
// is a 3-column sheet (blank / Account / <date>). Top-level sections (Assets,
// Liabilities, Equity) sit in column A with no value in column C. Subsections
// (Current Assets, Fixed Assets, Current Liabilities, Non-current Liabilities)
// sit in column B with no value in column C. Individual account lines and
// "Total ..." subtotal/total lines both sit in column B WITH a value in
// column C - distinguished by whether the label starts with "Total ".
// "Net Assets" and "Total Equity" are special top-level totals that also
// happen to render in column B (a genuine Xero export quirk, not a parsing
// inconsistency to "fix").

function clean_text(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (value && typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result !== undefined) return String(value.result ?? "").trim();
    if (value.richText) {
      return value.richText.map((part) => part.text || "").join("").trim();
    }
  }

  return String(value ?? "").trim();
}

function parse_money(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;

  let text = clean_text(value);
  if (!text || text === "-") return null;

  let is_negative = false;
  if (text.startsWith("(") && text.endsWith(")")) {
    is_negative = true;
    text = text.slice(1, -1);
  }

  text = text.replace(/,/g, "").replace(/\$/g, "").trim();
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;

  return is_negative ? -parsed : parsed;
}

const SECTION_LABELS = {
  assets: "assets",
  liabilities: "liabilities",
  equity: "equity",
};

const TOP_LEVEL_TOTAL_LABELS = new Set([
  "total assets",
  "total liabilities",
  "net assets",
  "total equity",
]);

function normalise_label(text) {
  return String(text ?? "").trim().toLowerCase();
}

function is_total_label(text) {
  return normalise_label(text).startsWith("total ");
}

/**
 * parseXeroBalanceSheetWorkbook
 *
 * Parses an ExcelJS Workbook already loaded from a Xero Balance Sheet
 * export. Returns { as_at_date, accounts, totals, warnings }.
 *
 * - accounts: flat array of { section, subsection, account_name, amount }
 *   for every real account line (never a subtotal/total row).
 * - totals: object keyed by known standard labels (total_current_assets,
 *   total_fixed_assets, total_assets, total_current_liabilities,
 *   total_non_current_liabilities, total_liabilities, net_assets,
 *   total_equity), read directly from Xero's own "Total ..." rows -
 *   trusted as-is, NOT re-derived by summing accounts (reconciliation
 *   between the two happens downstream in balanceSheetCalculations.js,
 *   matching the same trace-and-verify pattern used elsewhere in this
 *   codebase - never silently trust one source over the other without
 *   a visible reconciliation check).
 * - warnings: array of strings for anything unrecognised, so a genuine
 *   format change in a future Xero export gets flagged, not silently
 *   dropped.
 */
export function parseXeroBalanceSheetWorkbook(workbook) {
  const worksheet = workbook.worksheets[0];
  const accounts = [];
  const totals = {};
  const warnings = [];
  let as_at_date = null;
  let current_section = null;
  let current_subsection = null;

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const col_a = clean_text(row.getCell(1).value);
    const col_b = clean_text(row.getCell(2).value);
    const col_c_raw = row.getCell(3).value;
    const col_c = parse_money(col_c_raw);

    if (!col_a && !col_b && col_c === null) return;

    if (col_a.toLowerCase().startsWith("as at ")) {
      as_at_date = col_a.replace(/^as at\s+/i, "").trim();
      return;
    }

    if (col_a.toLowerCase() === "balance sheet") return;
    if (col_a.toLowerCase() === "business name") return;
    if (col_b.toLowerCase() === "account") return;

    // Top-level section header: column A has text, column C empty, column B empty.
    if (col_a && col_c === null && !col_b) {
      const section_key = SECTION_LABELS[normalise_label(col_a)];
      if (section_key) {
        current_section = section_key;
        current_subsection = null;
      } else {
        warnings.push(`Unrecognised top-level section header: "${col_a}"`);
      }
      return;
    }

    // Top-level total in column A (Total Assets / Total Liabilities).
    if (col_a && col_c !== null) {
      const key = normalise_label(col_a);
      if (TOP_LEVEL_TOTAL_LABELS.has(key)) {
        totals[key.replace(/\s+/g, "_")] = col_c;
      } else {
        warnings.push(`Unrecognised top-level total row: "${col_a}" = ${col_c}`);
      }
      return;
    }

    // Everything else lives in column B.
    if (!col_b) return;

    // Subsection header: column B has text, column C empty.
    if (col_c === null) {
      current_subsection = col_b;
      return;
    }

    // Column B has text AND a value - either a top-level total (Net Assets /
    // Total Equity, which do NOT start with "Total " so is_total_label alone
    // won't catch them), a "Total ..." subsection line, or a real account.
    const col_b_key = normalise_label(col_b);
    if (TOP_LEVEL_TOTAL_LABELS.has(col_b_key) || is_total_label(col_b)) {
      totals[col_b_key.replace(/[^a-z0-9]+/g, "_")] = col_c;
      return;
    }

    // A real account line.
    if (!current_section) {
      warnings.push(`Account line found before any section header: "${col_b}" = ${col_c}`);
      return;
    }

    accounts.push({
      section: current_section,
      subsection: current_subsection,
      account_name: col_b,
      amount: col_c,
    });
  });

  if (!as_at_date) {
    warnings.push("Could not find an \"As at <date>\" line - as_at_date is null.");
  }

  return { as_at_date, accounts, totals, warnings };
}

/**
 * parseXeroBalanceSheetFile
 *
 * Convenience wrapper - takes a File/Blob/ArrayBuffer (as provided by a
 * browser file input), loads it via ExcelJS, and returns the same shape
 * as parseXeroBalanceSheetWorkbook.
 */
export async function parseXeroBalanceSheetFile(file_data) {
  const workbook = new ExcelJS.Workbook();
  const array_buffer =
    file_data instanceof ArrayBuffer ? file_data : await file_data.arrayBuffer();
  await workbook.xlsx.load(array_buffer);
  return parseXeroBalanceSheetWorkbook(workbook);
}