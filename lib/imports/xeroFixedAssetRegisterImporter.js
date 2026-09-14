import ExcelJS from "exceljs";

// Fixed Asset Register importer - parses a Xero "Fixed Asset Register"
// export to Excel (Accounting > Fixed Assets > Export). See
// FIXED_ASSET_REGISTER_IMPORT_SCOPING_BRIEF_2026-09-12.txt for full
// background - real 29-asset export reviewed same session, structure
// confirmed below matches that real file exactly.
//
// Confirmed real column headers: *AssetName, *AssetNumber, AssetStatus,
// PurchaseDate, PurchasePrice, AssetType, Description, TrackingCategory1,
// TrackingOption1, TrackingCategory2, TrackingOption2, SerialNumber,
// WarrantyExpiry, Book_DepreciationStartDate, Book_CostLimit,
// Book_ResidualValue, Book_DepreciationMethod, Book_AveragingMethod,
// Book_Rate, Book_EffectiveLife, Book_OpeningBookAccumulatedDepreciation,
// Book_BookValue, AccumulatedDepreciation, InvestmentBoost,
// DepreciationToDate, DisposalDate.
//
// Disposed assets are DELIBERATELY EXCLUDED per user decision 2026-09-12 -
// not relevant to current operations. Confirmed real data has 2 of 29
// assets as "Disposed".

function clean_text(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (value && typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result !== undefined) return String(value.result ?? "").trim();
  }
  return String(value ?? "").trim();
}

function parse_money(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const text = clean_text(value).replace(/,/g, "").replace(/\$/g, "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parse_date_string(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = clean_text(value);
  return text || null;
}

/**
 * parseXeroFixedAssetRegisterWorkbook
 *
 * Returns { assets, warnings }. assets is an array of real, currently-
 * registered assets (Disposed rows filtered out). Each asset:
 *   asset_number, asset_name, purchase_date, purchase_price, asset_type,
 *   depreciation_method, depreciation_rate, book_value, accumulated_depreciation,
 *   depreciation_to_date, serial_number
 *
 * Trusts the header row's exact column order rather than hardcoding
 * column letters, since Xero's own column order could shift between
 * export versions - matches the same defensive approach as
 * xeroBalanceSheetImporter.js.
 */
export function parseXeroFixedAssetRegisterWorkbook(workbook) {
  const worksheet = workbook.worksheets[0];
  const assets = [];
  const warnings = [];

  let header_map = null;

  worksheet.eachRow({ includeEmpty: false }, (row, row_number) => {
    const cells = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(cell.value);
    });

    if (row_number === 1) {
      header_map = {};
      cells.forEach((header, index) => {
        const key = clean_text(header).replace(/^\*/, "");
        if (key) header_map[key] = index;
      });
      return;
    }

    if (!header_map) {
      warnings.push(`Row ${row_number} found before a header row - skipped.`);
      return;
    }

    const get = (col_name) => cells[header_map[col_name]];

    const asset_name = clean_text(get("AssetName"));
    if (!asset_name) return;

    const asset_status = clean_text(get("AssetStatus"));
    if (asset_status.toLowerCase() === "disposed") {
      return;
    }

    assets.push({
      asset_number: clean_text(get("AssetNumber")),
      asset_name,
      asset_status,
      purchase_date: parse_date_string(get("PurchaseDate")),
      purchase_price: parse_money(get("PurchasePrice")),
      asset_type: clean_text(get("AssetType")),
      depreciation_method: clean_text(get("Book_DepreciationMethod")),
      depreciation_rate: parse_money(get("Book_Rate")),
      book_value: parse_money(get("Book_BookValue")),
      accumulated_depreciation: parse_money(get("AccumulatedDepreciation")),
      depreciation_to_date: parse_date_string(get("DepreciationToDate")),
      serial_number: clean_text(get("SerialNumber")),
    });
  });

  if (assets.length === 0) {
    warnings.push("No registered (non-disposed) assets found in this file.");
  }

  return { assets, warnings };
}

export async function parseXeroFixedAssetRegisterFile(file_data) {
  const workbook = new ExcelJS.Workbook();
  const array_buffer =
    file_data instanceof ArrayBuffer ? file_data : await file_data.arrayBuffer();
  await workbook.xlsx.load(array_buffer);
  return parseXeroFixedAssetRegisterWorkbook(workbook);
}