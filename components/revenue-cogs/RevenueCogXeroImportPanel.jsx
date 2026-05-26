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

export default function RevenueCogXeroImportPanel({
    on_import_complete = () => { },
}) {
    const [is_processing, set_is_processing] = useState(false);
    const [error, set_error] = useState("");
    const [import_result, set_import_result] = useState(null);

    async function handle_file_change(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        set_error("");
        set_is_processing(true);
        set_import_result(null);

        try {
            const result = await read_xero_cog_workbook(file);

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

    const top_review_rows = useMemo(() => {
        return import_result?.review_rows?.slice(0, 10) || [];
    }, [import_result]);

    const category_summary = import_result?.category_summary || [];
    const supplier_summary = import_result?.supplier_account_summary || [];

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

                <label className="ui-field">
                    <span className="ui-label">Upload Xero Payable Invoice Detail</span>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handle_file_change}
                        disabled={is_processing}
                    />
                </label>

                {is_processing ? (
                    <div className="ui-muted">Processing Xero report...</div>
                ) : null}

                {error ? <div className="ui-alert ui-alert-warning">{error}</div> : null}

                {import_result ? (
                    <>
                        <div className="ui-grid ui-grid-4">
                            <div className="ui-metric-card">
                                <span className="ui-metric-label">Transaction rows</span>
                                <strong className="ui-metric-value">
                                    {import_result.import_meta.transaction_row_count}
                                </strong>
                            </div>

                            <div className="ui-metric-card">
                                <span className="ui-metric-label">Supplier/account rows</span>
                                <strong className="ui-metric-value">
                                    {import_result.import_meta.supplier_account_row_count}
                                </strong>
                            </div>

                            <div className="ui-metric-card">
                                <span className="ui-metric-label">Review rows</span>
                                <strong className="ui-metric-value">
                                    {import_result.import_meta.review_row_count}
                                </strong>
                            </div>

                            <div className="ui-metric-card">
                                <span className="ui-metric-label">COG total gross</span>
                                <strong className="ui-metric-value">
                                    {format_currency(import_result.import_meta.cog_total_gross)}
                                </strong>
                            </div>
                        </div>

                        <div className="ui-section">
                            <h3 className="ui-section-title">Category summary</h3>

                            <div className="ui-table-wrap">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Suggested category</th>
                                            <th>Suppliers</th>
                                            <th>Accounts</th>
                                            <th>Annual total gross</th>
                                            <th>COG</th>
                                            <th>Review</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {category_summary.map((row, index) => (
                                            <tr key={`${row.cog_import_treatment || "category"}-${index}`}>
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
                            <div className="ui-section">
                                <h3 className="ui-section-title">Review required</h3>

                                <div className="ui-table-wrap">
                                    <table className="ui-table">
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
                                            {top_review_rows.map((row) => (
                                                <tr key={`${row.supplier_name}-${row.account_name}`}>
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

                        <div className="ui-section">
                            <h3 className="ui-section-title">Supplier/account summary</h3>

                            <div className="ui-table-wrap">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Supplier</th>
                                            <th>Account</th>
                                            <th>Annual total gross</th>
                                            <th>Suggested category</th>
                                            <th>COG</th>
                                            <th>Review</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplier_summary.slice(0, 50).map((row) => (
                                            <tr key={`${row.supplier_name}-${row.account_name}`}>
                                                <td>{row.supplier_name}</td>
                                                <td>{row.account_name}</td>
                                                <td>{format_currency(row.annual_total_gross)}</td>
                                                <td>{row.suggested_qs_category}</td>
                                                <td>{row.include_in_cog ? "Yes" : "No"}</td>
                                                <td>{row.review_required ? "Required" : "No"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {supplier_summary.length > 50 ? (
                                <p className="ui-muted">
                                    Showing first 50 supplier/account rows. Full data is available
                                    in the imported result.
                                </p>
                            ) : null}
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}