"use client";

import { useEffect, useState } from "react";

function format_currency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function format_percent(value) {
  const number = Number(value) || 0;
  return `${number.toFixed(2)}%`;
}

export default function EmployerContributionsCard({
  state,
  outputs,
  update_field,
  disabled = false,
}) {
  const [acc_search, setAccSearch] = useState("");
  const [acc_results, setAccResults] = useState([]);
  const [acc_loading, setAccLoading] = useState(false);
  const [acc_error, setAccError] = useState("");

  const employee_kiwisaver_enabled = Boolean(
    state?.employee_kiwisaver_enabled
  );

  const acc_enabled = state?.acc_enabled !== false;
  const acc_cu_code = state?.acc_cu_code ?? "";
  const acc_cu_description = state?.acc_cu_description ?? "";
  const acc_bic_code = state?.acc_bic_code ?? "";
  const acc_bic_description = state?.acc_bic_description ?? "";
  const acc_rate = Number(state?.acc_rate) || 0;
  const acc_manual_override_enabled = Boolean(
    state?.acc_manual_override_enabled
  );
  const acc_manual_rate = state?.acc_manual_rate ?? "";

  const active_acc_rate = acc_manual_override_enabled
    ? Number(acc_manual_rate) || 0
    : acc_rate;

  async function search_acc(query) {
    const trimmed_query = String(query || "").trim();

    if (trimmed_query.length < 2) {
      setAccResults([]);
      setAccError("");
      return;
    }

    setAccLoading(true);
    setAccError("");

    try {
      const response = await fetch(
        `/api/acc/search?q=${encodeURIComponent(trimmed_query)}`
      );

      if (!response.ok) {
        throw new Error("ACC search failed");
      }

      const data = await response.json();
      setAccResults(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setAccResults([]);
      setAccError("ACC search is not available yet.");
    } finally {
      setAccLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      search_acc(acc_search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [acc_search]);

  function select_acc_result(row) {
    update_field("acc_enabled", true);
    update_field("acc_bic_code", row?.bic_code ?? "");
    update_field("acc_bic_description", row?.bic_description ?? "");
    update_field("acc_cu_code", row?.acc_cu_code ?? "");
    update_field("acc_cu_description", row?.acc_cu_description ?? "");
    update_field("acc_rate", Number(row?.total_acc_rate) || 0);

    setAccSearch("");
    setAccResults([]);
    setAccError("");
  }

  function clear_acc_selection() {
    update_field("acc_bic_code", "");
    update_field("acc_bic_description", "");
    update_field("acc_cu_code", "");
    update_field("acc_cu_description", "");
    update_field("acc_rate", 0);
    update_field("acc_manual_override_enabled", false);
    update_field("acc_manual_rate", 0);
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Employer Contributions</div>
          <div className="ui-card-title">KiwiSaver, ESCT & ACC</div>
          <p className="ui-help">
            Employer-funded contributions are calculated in Labour and flow
            downstream through the locked Labour output contract.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">KiwiSaver</div>

          <label className="ui-row">
            <input
              type="checkbox"
              checked={employee_kiwisaver_enabled}
              disabled={disabled}
              onChange={(event) =>
                update_field(
                  "employee_kiwisaver_enabled",
                  event.target.checked
                )
              }
            />
            <span>Employer KiwiSaver applies</span>
          </label>

          <div className="ui-grid-2">
            <div className="ui-readonly">
              <div className="ui-label">Employer KiwiSaver</div>
              <div className="ui-value">
                {format_currency(outputs?.employer_kiwisaver_gross)}
              </div>
            </div>

            <div className="ui-readonly">
              <div className="ui-label">ESCT</div>
              <div className="ui-value">
                {format_currency(outputs?.esct_amount)}
              </div>
              <div className="ui-help">
                Derived ESCT rate: {format_percent(outputs?.esct_rate * 100)}
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">ACC Work Levy</div>

          <p className="ui-help">
            Search the official ACC activity list, select the closest business
            activity, then Labour applies the linked ACC CU rate to liable
            earnings.
          </p>

          <label className="ui-row">
            <input
              type="checkbox"
              checked={acc_enabled}
              disabled={disabled}
              onChange={(event) =>
                update_field("acc_enabled", event.target.checked)
              }
            />
            <span>ACC levy applies</span>
          </label>

          {acc_enabled && (
            <>
              <div className="ui-stack-sm">
                <label className="ui-label" htmlFor="acc_search">
                  Search ACC activity
                </label>
                <input
                  id="acc_search"
                  className="ui-input"
                  value={acc_search}
                  disabled={disabled}
                  placeholder="Search activity, e.g. concrete, carpentry, plumbing"
                  onChange={(event) => setAccSearch(event.target.value)}
                />
                {acc_loading && <div className="ui-help">Searching ACC…</div>}
                {acc_error && <div className="ui-help">{acc_error}</div>}
              </div>

              {acc_results.length > 0 && (
                <div className="ui-panel ui-stack-sm">
                  <div className="ui-kicker">Search results</div>

                  {acc_results.map((row) => (
                    <button
                      key={`${row.bic_code}_${row.acc_cu_code}`}
                      type="button"
                      className="ui-button-secondary"
                      disabled={disabled}
                      onClick={() => select_acc_result(row)}
                    >
                      <span>{row.bic_description}</span>
                      <span className="ui-help">
                        {row.acc_cu_description} | CU {row.acc_cu_code} |{" "}
                        {format_percent(row.total_acc_rate)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {acc_cu_code && (
                <div className="ui-readonly">
                  <div className="ui-kicker">Selected ACC activity</div>
                  <div className="ui-card-title-sm">
                    {acc_bic_description || acc_cu_description}
                  </div>
                  <div className="ui-help">
                    BIC {acc_bic_code || "—"} | CU {acc_cu_code} |{" "}
                    {acc_cu_description}
                  </div>
                  <div className="ui-help">
                    Official ACC rate: {format_percent(acc_rate)}
                  </div>

                  <button
                    type="button"
                    className="ui-button-secondary"
                    disabled={disabled}
                    onClick={clear_acc_selection}
                  >
                    Clear ACC selection
                  </button>
                </div>
              )}

              <label className="ui-row">
                <input
                  type="checkbox"
                  checked={acc_manual_override_enabled}
                  disabled={disabled}
                  onChange={(event) =>
                    update_field(
                      "acc_manual_override_enabled",
                      event.target.checked
                    )
                  }
                />
                <span>Manual accountant-confirmed ACC override</span>
              </label>

              {acc_manual_override_enabled && (
                <div className="ui-stack-sm">
                  <label className="ui-label" htmlFor="acc_manual_rate">
                    Manual ACC rate %
                  </label>
                  <input
                    id="acc_manual_rate"
                    className="ui-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={acc_manual_rate}
                    disabled={disabled}
                    onChange={(event) =>
                      update_field("acc_manual_rate", event.target.value)
                    }
                  />
                </div>
              )}

              <div className="ui-grid-2">
                <div className="ui-readonly">
                  <div className="ui-label">Active ACC rate</div>
                  <div className="ui-value">
                    {format_percent(active_acc_rate)}
                  </div>
                </div>

                <div className="ui-readonly">
                  <div className="ui-label">Annual ACC levy</div>
                  <div className="ui-value">
                    {format_currency(outputs?.acc_work_levy_annual)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">Employer contribution total</div>
          <div className="ui-value">
            {format_currency(outputs?.total_employer_contribution_cost)}
          </div>
          <div className="ui-help">
            KiwiSaver + ESCT + ACC. This total is owned by Labour and consumed
            downstream unchanged.
          </div>
        </div>
      </div>
    </section>
  );
}