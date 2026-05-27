"use client";

import { useMemo, useState } from "react";
import { read_xero_cog_workbook } from "@/lib/imports/xeroCogImporter";
import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_currency(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

const FILTERS = [
  ["default", "Default"],
  ["review", "Review required"],
  ["included", "Included COG"],
  ["excluded", "Excluded"],
  ["all", "All"],
];

function XeroCogImportInstructions() {
  return (
    <CollapsibleSection
      title="How to export the Xero Account Transactions report"
      subtitle="Follow these steps before uploading the Excel file."
      defaultOpen={false}
    >
      <div className="ui-stack-sm">
        <div className="ui-info-block">
          <strong>Important:</strong> This importer is now based on the Xero{" "}
          <strong>Account Transactions</strong> report, not the Payable Invoice
          Detail report. QS Tools reads account-level transactions and compares
          the Xero ex-GST totals against the raw P&amp;L Cost of Sales accounts.
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">1. Open All Reports in Xero</div>
          <p className="ui-help">
            In Xero, go to <strong>Accounting</strong> →{" "}
            <strong>Reports</strong> → <strong>All Reports</strong>.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">2. Open Account Transactions</div>
          <p className="ui-help">
            Open the <strong>Account Transactions</strong> report.
          </p>
          <p className="ui-help">
            This report gives QS Tools account-level debit and credit movements
            that can be reconciled back to the P&amp;L Cost of Sales accounts.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">3. Set the date range</div>
          <p className="ui-help">
            Set the report from the start of the financial year to the end of
            the financial year.
          </p>
          <p className="ui-help">
            Example: <strong>1 April 2025</strong> to{" "}
            <strong>31 March 2026</strong>.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">4. Filter to COG accounts</div>
          <p className="ui-help">
            Filter the report to include the accounts that make up Cost of Sales
            / direct costs in the P&amp;L.
          </p>
          <p className="ui-help">
            The account names should match the raw P&amp;L Cost of Sales account
            names as closely as possible.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">5. Group by Account</div>
          <p className="ui-help">
            Group or organise the report by <strong>Account</strong> where
            possible.
          </p>
          <p className="ui-help">
            QS Tools reads the account heading rows and the matching account
            totals to build the reconciliation.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">6. Select the required columns</div>
          <p className="ui-help">The report must include these columns:</p>
          <ul className="ui-help list-disc pl-5">
            <li>Date</li>
            <li>Source</li>
            <li>Description</li>
            <li>Reference, if available</li>
            <li>Debit</li>
            <li>Credit</li>
            <li>Gross, if available</li>
            <li>GST, if available</li>
            <li>Running Balance, if available</li>
          </ul>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">7. Click Update</div>
          <p className="ui-help">
            Click <strong>Update</strong> after setting the date range, account
            filter, grouping, and columns.
          </p>
          <p className="ui-help">
            Click the blue star in Xero to add the report to favourites if you
            want quick access next time.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">
            8. Save the layout as a custom report
          </div>
          <p className="ui-help">
            Click <strong>Save As</strong> →{" "}
            <strong>Custom Report</strong>.
          </p>
          <p className="ui-help">
            Suggested name:{" "}
            <strong>QS Tools Account Transactions COG Export</strong>.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">9. Export to Excel</div>
          <p className="ui-help">
            Export the report as an <strong>Excel</strong> file.
          </p>
          <p className="ui-help">
            Save it in the same location as the exported P&amp;L files, then
            upload it into QS Tools below.
          </p>
        </div>

        <div className="ui-alert ui-alert-warning">
          <strong>Note:</strong> This report is ledger-account based. It is not a
          supplier invoice detail report. It does not include WIP, accruals, or
          accountant year-end adjustments unless those are posted in the ledger.
          QS Tools uses it as the operational COG account detail and shows the
          reconciliation difference against the P&amp;L separately.
        </div>
      </div>
    </CollapsibleSection>
  );
}

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

    set_is_processing(true);
    set_error("");

    try {
      const result = await read_xero_cog_workbook(file, {
        pnl_direct_cost_account_lines,
      });

      set_import_result(result);
      on_import_complete(result);
    } catch (err) {
      set_error(
        err?.message ||
          "The Xero COG Importer could not read this file. Check that the report is Account Transactions and includes Date, Source, Description, Debit, Credit, and Account heading rows."
      );
    } finally {
      set_is_processing(false);
      event.target.value = "";
    }
  }

  const visible_rows = useMemo(() => {
    if (!import_result) return [];

    if (active_filter === "review") {
      return import_result.review_rows || [];
    }

    if (active_filter === "included") {
      return (import_result.supplier_account_summary || []).filter(
        (row) => row.include_in_cog
      );
    }

    if (active_filter === "excluded") {
      return import_result.excluded_rows || [];
    }

    if (active_filter === "all") {
      return import_result.supplier_account_summary || [];
    }

    return import_result.visible_default_rows || [];
  }, [active_filter, import_result]);

  const top_review_rows = useMemo(() => {
    return (import_result?.review_rows || []).slice(0, 15);
  }, [import_result]);

  const category_summary = import_result?.category_summary || [];

  const account_reconciliation = import_result?.account_reconciliation || {
    rows: [],
    summary: {
      pnl_total: 0,
      xero_total_net: 0,
      difference: 0,
      status: "not_available",
    },
  };

  return (
    <section className="ui-card">
      <div className="ui-card-header">
        <div>
          <div className="ui-kicker">Xero COG importer</div>
          <h2 className="ui-card-title">
            Import Account Transactions COG detail
          </h2>
          <p className="ui-help">
            Upload the Xero Account Transactions Excel export to build a
            reconciled Cost of Goods / direct cost breakdown by ledger account.
          </p>
        </div>
      </div>

      <div className="ui-stack">
        <XeroCogImportInstructions />

        <div className="ui-readonly">
          <div className="ui-kicker">P&amp;L COG account filter</div>
          <div className="ui-card-title-sm">
            {pnl_direct_cost_account_lines.length} raw P&amp;L Cost of Sales
            accounts available
          </div>
          <p className="ui-help">
            The importer only treats matching raw P&amp;L Cost of Sales accounts
            as default COG rows. Other accounts are kept visible for review and
            reconciliation.
          </p>
        </div>

        <label className="ui-label">
          Upload Xero Account Transactions Excel file
          <input
            className="ui-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handle_file_change}
            disabled={is_processing}
          />
          <span className="ui-help">
            Upload the saved Xero Account Transactions Excel export. Debit and
            credit columns are treated as ex GST. Gross and GST are stored for
            audit where available.
          </span>
        </label>

        {is_processing ? (
          <div className="ui-info-block">Reading Xero export...</div>
        ) : null}

        {error ? <div className="ui-alert ui-alert-danger">{error}</div> : null}

        {import_result ? (
          <div className="ui-stack">
            <div className="ui-panel ui-stack-sm">
              <div className="ui-split">
                <div>
                  <h3 className="ui-card-title-sm">Import summary</h3>
                  <p className="ui-help">
                    Summary of the imported Account Transactions rows and the
                    resulting COG account totals.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="ui-readonly">
                  <div className="ui-kicker">Transactions</div>
                  <div className="ui-card-title-sm">
                    {import_result.import_meta.transaction_row_count}
                  </div>
                </div>

                <div className="ui-readonly">
                  <div className="ui-kicker">Accounts</div>
                  <div className="ui-card-title-sm">
                    {import_result.import_meta.account_row_count ||
                      import_result.import_meta.supplier_account_row_count}
                  </div>
                </div>

                <div className="ui-readonly">
                  <div className="ui-kicker">Review rows</div>
                  <div className="ui-card-title-sm">
                    {import_result.import_meta.review_row_count}
                  </div>
                </div>

                <div className="ui-readonly">
                  <div className="ui-kicker">COG total ex GST</div>
                  <div className="ui-card-title-sm">
                    {format_currency(import_result.import_meta.cog_total_net)}
                  </div>
                </div>
              </div>
            </div>

            {category_summary.length > 0 ? (
              <div className="ui-panel ui-stack-sm">
                <h3 className="ui-card-title-sm">Category summary</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th>Treatment</th>
                        <th>Accounts</th>
                        <th>Debit ex GST</th>
                        <th>Credit ex GST</th>
                        <th>Annual total ex GST</th>
                        <th>GST</th>
                        <th>COG</th>
                        <th>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category_summary.map((row) => (
                        <tr key={row.cog_import_treatment}>
                          <td>{row.cog_import_treatment}</td>
                          <td>{row.account_count}</td>
                          <td>{format_currency(row.annual_debit_total)}</td>
                          <td>{format_currency(row.annual_credit_total)}</td>
                          <td>{format_currency(row.annual_net_total)}</td>
                          <td>{format_currency(row.annual_gst_total)}</td>
                          <td>{row.include_in_cog ? "Yes" : "No"}</td>
                          <td>{row.review_required ? "Required" : "No"}</td>
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
                  <h3 className="ui-card-title-sm">Account reconciliation</h3>
                  <p className="ui-help">
                    Compares each raw P&amp;L Cost of Sales account against the
                    matching Xero Account Transactions account total, ex GST.
                  </p>
                </div>

                <div className="ui-readonly">
                  <div className="ui-kicker">Difference</div>
                  <div className="ui-card-title-sm">
                    {format_currency(account_reconciliation.summary.difference)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="ui-readonly">
                  <div className="ui-kicker">P&amp;L Cost of Sales</div>
                  <div className="ui-card-title-sm">
                    {format_currency(account_reconciliation.summary.pnl_total)}
                  </div>
                </div>

                <div className="ui-readonly">
                  <div className="ui-kicker">Xero COG ex GST</div>
                  <div className="ui-card-title-sm">
                    {format_currency(
                      account_reconciliation.summary.xero_total_net
                    )}
                  </div>
                </div>

                <div className="ui-readonly">
                  <div className="ui-kicker">Status</div>
                  <div className="ui-card-title-sm">
                    {account_reconciliation.summary.status === "balanced"
                      ? "Balanced"
                      : "Difference"}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Category</th>
                      <th>P&amp;L amount</th>
                      <th>Xero ex GST</th>
                      <th>Difference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account_reconciliation.rows.map((row, index) => (
                      <tr
                        key={`account-reconciliation-${row.account_name}-${index}`}
                      >
                        <td>{row.account_name}</td>
                        <td>{row.direct_cost_category_name}</td>
                        <td>{format_currency(row.pnl_amount)}</td>
                        <td>{format_currency(row.xero_total_net)}</td>
                        <td>{format_currency(row.difference)}</td>
                        <td>
                          {row.status === "balanced"
                            ? "Balanced"
                            : "Difference"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {account_reconciliation.rows.length === 0 ? (
                <p className="ui-help">
                  No account reconciliation rows are available. Check that the
                  P&amp;L raw Cost of Sales account lines are being passed into
                  the importer.
                </p>
              ) : null}
            </div>

            {top_review_rows.length > 0 ? (
              <div className="ui-panel ui-stack-sm">
                <h3 className="ui-card-title-sm">Review required</h3>
                <p className="ui-help">
                  These rows need manual review before they should be trusted as
                  COG inputs.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Annual total ex GST</th>
                        <th>Suggested category</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top_review_rows.map((row, index) => (
                        <tr key={`review-row-${row.account_name}-${index}`}>
                          <td>{row.account_name}</td>
                          <td>{format_currency(row.annual_total_net)}</td>
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
                  <h3 className="ui-card-title-sm">Imported account rows</h3>
                  <p className="ui-help">
                    Default view shows account rows where the Xero account
                    matched a raw Cost of Sales line from the imported P&amp;L.
                    Amounts shown are ex GST. Excluded rows are kept for
                    reconciliation.
                  </p>
                </div>

                <div className="ui-actions">
                  {FILTERS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={
                        active_filter === key
                          ? "ui-button-primary"
                          : "ui-button-secondary"
                      }
                      onClick={() => set_active_filter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>P&amp;L group</th>
                      <th>Treatment</th>
                      <th>Debit ex GST</th>
                      <th>Credit ex GST</th>
                      <th>Annual total ex GST</th>
                      <th>GST</th>
                      <th>Suggested category</th>
                      <th>COG</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible_rows.map((row, index) => (
                      <tr key={`${row.account_name}-${index}`}>
                        <td>{row.account_name}</td>
                        <td>{row.pnl_default_group}</td>
                        <td>{row.cog_import_treatment}</td>
                        <td>{format_currency(row.annual_debit_total)}</td>
                        <td>{format_currency(row.annual_credit_total)}</td>
                        <td>{format_currency(row.annual_total_net)}</td>
                        <td>{format_currency(row.annual_gst_total)}</td>
                        <td>{row.suggested_qs_category}</td>
                        <td>{row.include_in_cog ? "Yes" : "No"}</td>
                        <td>{row.review_required ? "Required" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visible_rows.length === 0 ? (
                <p className="ui-help">No rows match this filter.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}