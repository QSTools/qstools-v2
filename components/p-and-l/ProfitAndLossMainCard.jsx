"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import Tooltip from "@/components/common/Tooltip";
import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

function MoneyInput({ value, onChange, disabled = false }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className="ui-input"
      value={format_number_with_commas(value)}
      onChange={(event) => onChange(parse_number_string(event.target.value))}
      disabled={disabled}
    />
  );
}

function normalize_line_name(value = "") {
  return String(value).trim().toLowerCase();
}

function infer_category_from_line_name(line_name = "") {
  const normalized = normalize_line_name(line_name);

  if (!normalized) return null;

  if (
    normalized.includes("salary") ||
    normalized.includes("salaries") ||
    normalized.includes("wages") ||
    normalized.includes("payroll")
  ) {
    return "labour";
  }

  if (
    normalized.includes("kiwisaver") ||
    normalized.includes("kiwi saver") ||
    normalized.includes("acc levy") ||
    normalized.includes("acc ") ||
    normalized === "acc" ||
    normalized.includes("uniform") ||
    normalized.includes("training") ||
    normalized.includes("ppe")
  ) {
    return "employee_overheads";
  }

  if (
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("plant") ||
    normalized.includes("equipment") ||
    normalized.includes("tool") ||
    normalized.includes("trailer") ||
    normalized.includes("fuel") ||
    normalized.includes("registration") ||
    normalized.includes("repairs") ||
    normalized.includes("maintenance")
  ) {
    return "assets";
  }

  if (
    normalized.includes("insurance") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("internet") ||
    normalized.includes("office") ||
    normalized.includes("accounting") ||
    normalized.includes("legal") ||
    normalized.includes("subscription") ||
    normalized.includes("bank fees") ||
    normalized.includes("admin") ||
    normalized.includes("advertising") ||
    normalized.includes("software")
  ) {
    return "general_overheads";
  }

  return null;
}

function get_category_help_text(category) {
  switch (category) {
    case "revenue":
      return "P&L benchmark only. This stays on the P&L page as income context.";
    case "cogs_materials":
      return "P&L benchmark only. Use for direct materials cost shown in Cost of Sales.";
    case "cogs_subcontract":
      return "P&L benchmark only. Use for direct subcontract cost shown in Cost of Sales.";
    case "cogs_hire":
      return "P&L benchmark only. Use for direct hire cost shown in Cost of Sales.";
    case "labour":
      return "Feeds the Labour module benchmark. Use for wages and direct staff cost.";
    case "employee_overheads":
      return "Feeds the Employee Overheads benchmark. Use for staff-linked burden such as KiwiSaver, ACC, PPE, uniforms, and training.";
    case "assets":
      return "Feeds the Assets benchmark. Use for vehicle, plant, equipment, tools, and ownership/running costs.";
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide costs such as insurance, phones, internet, office, accounting, and subscriptions.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

function get_suggested_category_text(line_name) {
  const suggested_category = infer_category_from_line_name(line_name);

  if (!suggested_category) return null;

  switch (suggested_category) {
    case "labour":
      return "Suggested: Labour";
    case "employee_overheads":
      return "Suggested: Employee Overheads";
    case "assets":
      return "Suggested: Assets";
    case "general_overheads":
      return "Suggested: General Overheads";
    default:
      return null;
  }
}

function get_section_lines(pnl_lines = [], section) {
  return (pnl_lines ?? []).filter((line) => line.section === section);
}

function get_section_title(section) {
  switch (section) {
    case "trading_income":
      return "Trading Income";
    case "cost_of_sales":
      return "Cost of Sales";
    case "other_income":
      return "Other Income";
    case "operating_expenses":
      return "Operating Expenses";
    default:
      return "Section";
  }
}

function get_section_help(section) {
  switch (section) {
    case "trading_income":
      return "Enter income lines as they appear on your P&L.";
    case "cost_of_sales":
      return "Enter direct delivery costs as they appear on your P&L.";
    case "other_income":
      return "Enter any non-trading income shown on the P&L.";
    case "operating_expenses":
      return "This is the critical classification section. These lines drive the downstream setup for Labour, Employee Overheads, Assets, and General Overheads.";
    default:
      return "";
  }
}

function get_section_default_open(section) {
  switch (section) {
    case "trading_income":
      return true;
    case "cost_of_sales":
      return true;
    case "other_income":
      return false;
    case "operating_expenses":
      return true;
    default:
      return true;
  }
}

function PeriodPanel({ state, actions }) {
  return (
    <div className="ui-panel ui-stack">
      <div className="ui-stack-sm">
        <span className="ui-kicker">Period</span>
        <div className="ui-section-title">Reporting Period</div>
      </div>

      <div className="ui-split-2">
        <div className="ui-stack-sm">
          <span className="ui-label">Financial Year</span>
          <p className="ui-help">
            NZ financial year. FY 2026 means 1 Apr 2025 to 31 Mar 2026.
          </p>
          <input
            type="number"
            className="ui-input"
            value={state.financial_year ?? ""}
            onChange={(event) =>
              actions.update_profit_and_loss_field(
                "financial_year",
                event.target.value,
              )
            }
          />
        </div>

        <div className="ui-stack-sm">
          <span className="ui-label">Month</span>
          <p className="ui-help">
            Optional. Leave blank for full-year input, or select a month for a
            monthly snapshot.
          </p>
          <select
            className="ui-select"
            value={state.period_month ?? ""}
            onChange={(event) =>
              actions.update_profit_and_loss_field(
                "period_month",
                event.target.value,
              )
            }
          >
            <option value="">Full Year</option>
            <option value="1">Jan</option>
            <option value="2">Feb</option>
            <option value="3">Mar</option>
            <option value="4">Apr</option>
            <option value="5">May</option>
            <option value="6">Jun</option>
            <option value="7">Jul</option>
            <option value="8">Aug</option>
            <option value="9">Sep</option>
            <option value="10">Oct</option>
            <option value="11">Nov</option>
            <option value="12">Dec</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AwarenessPanel() {
  return (
    <CollapsibleSection
      title="How to use this page"
      summary="This page is a guided benchmark layer. It helps you classify your P&L before the next setup steps."
      defaultOpen={true}
    >
      <div className="ui-panel ui-stack-sm">
        <div className="ui-help">
          Your P&amp;L may group a lot of costs together. That is normal.
        </div>
        <div className="ui-help">
          This page does not need to be perfect. Use your best estimate here,
          then structure things more accurately in the next modules.
        </div>
        <div className="ui-help">
          Each line should be assigned to one category only. Do not split a
          single P&amp;L line across multiple categories on this page.
        </div>
        <div className="ui-help">
          Revenue and Cost of Sales stay here as P&amp;L benchmark values.
          Labour, Employee Overheads, Assets, and General Overheads feed the
          downstream benchmark setup.
        </div>
      </div>
    </CollapsibleSection>
  );
}

function ReconciliationPanel({ reconciliation }) {
  const status_class = reconciliation.is_reconciled
    ? "text-[var(--success)]"
    : "text-[var(--danger)]";

  return (
    <CollapsibleSection
      title="Reconciliation"
      summary="Compare the P&L business-cost total against the model total when that wiring is added."
      defaultOpen={true}
    >
      <div className="ui-panel ui-stack-sm">
        <div className="ui-help">P&amp;L Total Costs</div>
        <div>{reconciliation.total_pnl_costs}</div>

        <div className="ui-help">Model Total Costs</div>
        <div>{reconciliation.total_model_costs}</div>

        <div className="ui-help">Variance</div>
        <div>{reconciliation.variance}</div>

        <div className="ui-help">Status</div>
        <div className={status_class}>{reconciliation.status_label}</div>
      </div>
    </CollapsibleSection>
  );
}

function SavedSnapshotsPanel({
  profiles,
  show_saved_snapshots,
  on_load,
  on_delete,
}) {
  if (!show_saved_snapshots) return null;

  return (
    <CollapsibleSection
      title="Saved Snapshots"
      summary="Load a saved full-year or monthly P&L snapshot."
      defaultOpen={true}
    >
      <div className="ui-stack-sm">
        {profiles.length === 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-help">No saved snapshots yet.</div>
          </div>
        ) : (
          profiles
            .slice()
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .map((profile) => (
              <div key={profile.id} className="ui-panel ui-stack-sm">
                <div className="ui-stack-sm">
                  <div className="ui-label">{profile.label}</div>
                  <div className="ui-help">
                    {profile.type === "monthly" ? "Monthly snapshot" : "Full-year snapshot"}
                  </div>
                </div>

                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={() => on_load(profile.id)}
                  >
                    Load
                  </button>

                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={() => on_delete(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </CollapsibleSection>
  );
}

function SectionBlock({
  section,
  state,
  category_options,
  actions,
  summary = {},
}) {
  const lines = get_section_lines(state.pnl_lines, section);
  const title = get_section_title(section);
  const help = get_section_help(section);

  let subtotal_label = "";
  let subtotal_value = "";

  if (section === "trading_income") {
    subtotal_label = "Total Trading Income";
    subtotal_value = summary.total_trading_income;
  } else if (section === "cost_of_sales") {
    subtotal_label = "Total Cost of Sales";
    subtotal_value = summary.total_cost_of_sales;
  } else if (section === "other_income") {
    subtotal_label = "Total Other Income";
    subtotal_value = summary.total_other_income;
  } else if (section === "operating_expenses") {
    subtotal_label = "Total Operating Expenses";
    subtotal_value = summary.total_operating_expenses;
  }

  function handle_line_name_change(line, next_line_name) {
    actions.update_pnl_line(line.pnl_line_id, "line_name", next_line_name);

    const suggested_category = infer_category_from_line_name(next_line_name);
    if (!suggested_category) return;

    const current_category = line.category ?? "unassigned";
    const is_current_manual =
      current_category !== "unassigned" && current_category !== "";

    if (!is_current_manual) {
      actions.update_pnl_line(
        line.pnl_line_id,
        "category",
        suggested_category,
      );
    }
  }

  return (
    <CollapsibleSection
      title={title}
      summary={help}
      defaultOpen={get_section_default_open(section)}
    >
      <div className="ui-stack">
        <div className="ui-actions">
          <div className="ui-stack-sm">
            <span className="ui-kicker">{title}</span>
          </div>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => actions.add_pnl_line(section)}
          >
            Add Custom Line
          </button>
        </div>

        {section === "operating_expenses" ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-label">Important</div>
            <div className="ui-help">
              This is the most important classification section on the page.
            </div>
            <div className="ui-help">
              Salary &amp; Wages usually belongs in <strong>Labour</strong>.
            </div>
            <div className="ui-help">
              KiwiSaver, ACC, PPE, uniforms, and staff-linked burden usually
              belong in <strong>Employee Overheads</strong>.
            </div>
            <div className="ui-help">
              Vehicles, plant, tools, and ownership/running costs usually belong
              in <strong>Assets</strong>.
            </div>
            <div className="ui-help">
              Insurance, phones, internet, office, accounting, and general
              business running costs usually belong in{" "}
              <strong>General Overheads</strong>.
            </div>
            <div className="ui-help">
              If classification is wrong here, the next modules will not line up
              properly.
            </div>
          </div>
        ) : null}

        <div className="ui-stack-sm">
          {lines.map((line) => {
            const suggested_category_text = get_suggested_category_text(
              line.line_name,
            );

            return (
              <div key={line.pnl_line_id} className="ui-panel ui-stack-sm">
                <div className="ui-stack-sm">
                  <span className="ui-label">Line Name</span>
                  <input
                    className="ui-input"
                    value={line.line_name}
                    placeholder="Enter line name"
                    onChange={(event) =>
                      handle_line_name_change(line, event.target.value)
                    }
                  />
                  {suggested_category_text ? (
                    <p className="ui-help">{suggested_category_text}</p>
                  ) : null}
                </div>

                <div className="ui-stack-sm">
                  <span className="ui-label">Amount</span>
                  <MoneyInput
                    value={line.amount}
                    onChange={(value) =>
                      actions.update_pnl_line(line.pnl_line_id, "amount", value)
                    }
                  />
                </div>

                <div className="ui-stack-sm">
                  <span className="ui-label inline-flex items-center gap-2">
                    QS Category
                    <Tooltip text="This decides where the cost flows next inside QS Tools. Choosing the wrong category will affect later setup and reconciliation." />
                  </span>

                  <select
                    className="ui-select"
                    value={line.category}
                    onChange={(event) =>
                      actions.update_pnl_line(
                        line.pnl_line_id,
                        "category",
                        event.target.value,
                      )
                    }
                  >
                    {category_options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <p className="ui-help">
                    {get_category_help_text(line.category)}
                  </p>
                </div>

                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={() => actions.remove_pnl_line(line.pnl_line_id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ui-actions justify-end">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => actions.add_pnl_line(section)}
          >
            Add Custom Line
          </button>
        </div>

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{subtotal_label}</span>
          <div>{subtotal_value}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function SummaryPanel({ summary }) {
  return (
    <CollapsibleSection
      title="Summary Panels"
      summary="Review the benchmark totals built from your classified P&L lines."
      defaultOpen={true}
    >
      <div className="ui-stack">
        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">Traditional P&amp;L View</span>

          <div className="ui-help">Trading Income</div>
          <div>{summary.total_trading_income}</div>

          <div className="ui-help">Cost of Sales</div>
          <div>{summary.total_cost_of_sales}</div>

          <div className="ui-help">Gross Profit</div>
          <div>{summary.gross_profit}</div>

          <div className="ui-help">Other Income</div>
          <div>{summary.total_other_income}</div>

          <div className="ui-help">Operating Expenses</div>
          <div>{summary.total_operating_expenses}</div>

          <div className="ui-help">Net Profit</div>
          <div>{summary.net_profit}</div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">QS Benchmark View</span>

          <div className="ui-help">Revenue</div>
          <div>{summary.total_revenue}</div>

          <div className="ui-help">COGS - Materials</div>
          <div>{summary.materials_cost}</div>

          <div className="ui-help">COGS - Subcontract</div>
          <div>{summary.subcontract_cost}</div>

          <div className="ui-help">COGS - Hire</div>
          <div>{summary.hired_equipment_cost}</div>

          <div className="ui-help">Total COGS</div>
          <div>{summary.total_cogs}</div>

          <div className="ui-help">Labour Benchmark</div>
          <div>{summary.labour_benchmark_total}</div>

          <div className="ui-help">Employee Overheads Benchmark</div>
          <div>{summary.employee_overheads_benchmark_total}</div>

          <div className="ui-help">Assets Benchmark</div>
          <div>{summary.assets_benchmark_total}</div>

          <div className="ui-help">General Overheads Benchmark</div>
          <div>{summary.general_overheads_benchmark_total}</div>

          <div className="ui-help">Total Business Costs</div>
          <div>{summary.total_business_costs}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function AssignmentCheckPanel({ summary }) {
  return (
    <CollapsibleSection
      title="Assignment Check"
      summary="Confirm all business costs are assigned before trusting downstream pages."
      defaultOpen={true}
    >
      <div className="ui-panel ui-stack-sm">
        <div className="ui-help">Total Business Costs</div>
        <div>{summary.total_business_costs}</div>

        <div className="ui-help">Total Assigned</div>
        <div>{summary.total_assigned_business_costs}</div>

        <div className="ui-help">Unassigned Balance</div>
        <div>{summary.unassigned_balance}</div>

        <div className="ui-help">P&amp;L Ready</div>
        <div>{summary.pnl_ready}</div>
      </div>
    </CollapsibleSection>
  );
}

export default function ProfitAndLossMainCard({
  state,
  category_options,
  reconciliation,
  summary,
  actions,
  profiles = [],
  show_saved_snapshots = false,
}) {
  return (
    <section className="ui-section">
      <div className="ui-page-stack">
        <div className="ui-panel ui-stack">
          <div className="ui-stack-sm">
            <span className="ui-kicker">P&amp;L</span>
            <div className="ui-section-title">P&amp;L Business Picture</div>
            <p className="ui-help">
              Enter the business P&amp;L in the same section order it appears in
              your accounts, while classifying each line into the correct QS
              Tools benchmark bucket.
            </p>
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={actions.reset_profit_and_loss_state}
            >
              Reset
            </button>

            <button
              type="button"
              className="ui-button-primary"
              onClick={actions.on_save}
            >
              Save Snapshot
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={actions.on_toggle_saved_snapshots}
            >
              Load Snapshot
            </button>
          </div>
        </div>

        <SavedSnapshotsPanel
          profiles={profiles}
          show_saved_snapshots={show_saved_snapshots}
          on_load={actions.on_load}
          on_delete={actions.on_delete}
        />

        <PeriodPanel state={state} actions={actions} />
        <AwarenessPanel />
        <ReconciliationPanel reconciliation={reconciliation} />

        <SectionBlock
          section="trading_income"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <SectionBlock
          section="cost_of_sales"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <SectionBlock
          section="other_income"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <SectionBlock
          section="operating_expenses"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <SummaryPanel summary={summary} />
        <AssignmentCheckPanel summary={summary} />
      </div>
    </section>
  );
}