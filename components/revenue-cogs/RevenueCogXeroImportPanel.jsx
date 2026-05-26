"use client";

import { useMemo, useState } from "react";
import { read_xero_cog_workbook } from "@/lib/imports/xeroCogImporter";

function format_currency(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  });
}

const FILTERS = [
  ["default", "Default view"],
  ["included_cog", "Included COG"],
  ["review_required", "Review"],
  ["excluded_not_in_pnl_cogs", "Excluded"],
  ["all", "All"],
];

export default function RevenueCogXeroImportPanel({
  pnl_direct_cost_account_lines = [],
  on_import_complete = () => {},
}) {
  const [is_processing, set_is_processing] = useState(false);
  const [error, set_error] = useState("");
  const [import_result, set_import_result] = useState(null);
  const [active_filter, set_active_filter] = useState("default");

  async function handle_file_change(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    set_error("");
    set_is_processing(true);
    set_import_result(null);
    set_active_filter("default");

    try {
      const result = await read_xero_cog_workbook(file, {
        pnl_direct_cost_account_lines,
      });

      set_import_result(result);
      on_import_complete(result);
    } catch (err) {
      set_error(
        err?.message ||
          "The Xero COG Importer could not read this file. Check that the report is Payable Invoice Detail and includes Source, Invoice Total, and Account."
      );
    } finally {
      set_is_processing(false);
    }
  }

  function get_filtered_supplier_rows() {
    const rows = import_result?.supplier_account_summary || [];

    if (active_filter === "default") {
      return rows.filter((row) => row.visible_by_default);
    }

    if (active_filter === "included_cog") {
      return rows.filter((row) => row.cog_import_treatment === "cog_included");
    }

    if (active_filter === "review_required") {
      return rows.filter((row) => row.review_required);
    }

    if (active_filter === "excluded_not_in_pnl_cogs") {
      return rows.filter(
        (row) => row.cog_import_treatment === "excluded_not_in_pnl_cogs"
      );
    }

    return rows;
  }

  const filtered_supplier_summary = get_filtered_supplier_rows();

  const top_review_rows = useMemo(() => {
    return import_result?.review_rows?.slice(0, 10) || [];
  }, [import_result]);

  const category_summary = import_result?.category_summary || [];

  return (
    <section className="ui-card">
      <div className="ui-card-header">
        <div>
          <h2 className="ui-card-title">Xero COG Importer</h2>
          <p className="ui-card-subtitle">
            Upload a Xero Payable Invoice Detail export to build supplier and
            account annual totals for Revenue / COG classification.
          </p>
        </div>
      </div>

      <div className="ui-stack">
        <div className="ui-info-block">
          <strong>Required Xero report setup:</strong> Payable Invoice Detail,
          same period as the P&amp;L, grouped by supplier/contact, with Source,
          Invoice Total, and Account columns visible.
        </div>

        <div className="ui-readonly">
          <div className="ui-kicker">P&amp;L COG account filter</div>
          <div className="ui-card-title-sm">
            {pnl_direct_cost_account_lines.length} active Cost of Sales account
            lines
          </div>
          <p className="ui-help">
            The importer only treats Xero account rows as COG when the account
            name matches a raw Cost of Sales account line from the imported
            P&amp;L.
          </p>
        </div>

        <label className="form-field ui-stack-sm">
          <span>Upload Xero Payable Invoice Detail</span>
          <input
            className="ui-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handle_file_change}
            disabled={is_processing}
          />
        </label>

        {is_processing ? (
          <div className="ui-help">Processing Xero report...</div>
        ) : null}

        {error ? <div className="ui-alert ui-alert-warning">{error}</div> : null}

        {import_result ? (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="ui-readonly">
                <div className="ui-kicker">P&amp;L COG accounts</div>
                <div className="ui-card-title-sm">
                  {import_result.import_meta.pnl_direct_cost_account_line_count}
                </div>
              </div>

              <div className="ui-readonly">
                <div className="ui-kicker">Supplier/account rows</div>
                <div className="ui-card-title-sm">
                  {import_result.import_meta.supplier_account_row_count}
                </div>
              </div>

              <div className="ui-readonly">
                <div className="ui-kicker">Review rows</div>
                <div className="ui-card-title-sm">
                  {import_result.import_meta.review_row_count}
                </div>
              </div>

              <div className="ui-readonly">
                <div className="ui-kicker">COG total gross</div>
                <div className="ui-card-title-sm">
                  {format_currency(import_result.import_meta.cog_total_gross)}
                </div>
              </div>
            </div>

            <div className="ui-panel ui-stack-sm">
              <h3 className="ui-card-title-sm">Import treatment summary</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>Treatment</th>
                      <th>Suppliers</th>
                      <th>Accounts</th>
                      <th>Annual total gross</th>
                      <th>COG</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category_summary.map((row, index) => (
                      <tr
                        key={`treatment-${
                          row.cog_import_treatment || "unknown"
                        }-${index}`}
                      >
                        <td>{row.cog_import_treatment}</td>
                        <td>{row.supplier_count}</td>
                        <td>{row.account_count}</td>
                        <td>{format_currency(row.annual_total_gross)}</td>
                        <td>{row.include_in_cog ? "Yes" : "No"}</td>
                        <td>{row.review_required ? "Required" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {top_review_rows.length > 0 ? (
              <div className="ui-panel ui-stack-sm">
                <h3 className="ui-card-title-sm">Review required</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Account</th>
                        <th>Annual total gross</th>
                        <th>Suggested category</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top_review_rows.map((row, index) => (
                        <tr
                          key={`review-${row.supplier_name}-${row.account_name}-${index}`}
                        >
                          <td>{row.supplier_name}</td>
                          <td>{row.account_name}</td>
                          <td>{format_currency(row.annual_total_gross)}</td>
                          <td>{row.suggested_qs_category}</td>
                          <td>{row.review_reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="ui-panel ui-stack-sm">
              <div className="ui-split">
                <div>
                  <h3 className="ui-card-title-sm">
                    Supplier/account summary
                  </h3>
                  <p className="ui-help">
                    Default view shows supplier/account rows where the Xero
                    account matched a raw Cost of Sales line from the imported
                    P&amp;L. Excluded rows are kept for reconciliation.
                  </p>
                </div>
              </div>

              <div className="ui-actions">
                {FILTERS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      active_filter === value
                        ? "ui-button-primary"
                        : "ui-button-secondary"
                    }
                    onClick={() => set_active_filter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Account</th>
                      <th>P&amp;L group</th>
                      <th>Treatment</th>
                      <th>Annual total gross</th>
                      <th>Suggested category</th>
                      <th>COG</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered_supplier_summary.slice(0, 50).map((row, index) => (
                      <tr
                        key={`supplier-${row.supplier_name}-${row.account_name}-${index}`}
                      >
                        <td>{row.supplier_name}</td>
                        <td>{row.account_name}</td>
                        <td>{row.pnl_default_group}</td>
                        <td>{row.cog_import_treatment}</td>
                        <td>{format_currency(row.annual_total_gross)}</td>
                        <td>{row.suggested_qs_category}</td>
                        <td>{row.include_in_cog ? "Yes" : "No"}</td>
                        <td>{row.review_required ? "Required" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered_supplier_summary.length > 50 ? (
                <p className="ui-help">
                  Showing first 50 supplier/account rows for this filter. Full
                  data is available in the imported result.
                </p>
              ) : null}

              {filtered_supplier_summary.length === 0 ? (
                <p className="ui-help">No rows match this filter.</p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}