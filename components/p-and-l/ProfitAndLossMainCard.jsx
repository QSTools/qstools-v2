"use client";

import { useState } from "react";
import {
  format_number_with_commas,
  parse_number_string,
  format_currency,
} from "@/lib/formatters/numberFormatters";

function MoneyInput({ label, help, value, onChange, disabled = false }) {
  return (
    <div className="ui-stack-sm">
      {label ? (
        <div className="ui-stack-sm">
          <span className="ui-label">{label}</span>
          {help ? <p className="ui-help">{help}</p> : null}
        </div>
      ) : null}

      <input
        type="text"
        inputMode="decimal"
        className="ui-input"
        value={format_number_with_commas(value)}
        onChange={(event) => onChange(parse_number_string(event.target.value))}
        disabled={disabled}
      />
    </div>
  );
}

function PeriodInputs({ state, actions }) {
  return (
    <div className="ui-panel ui-stack">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Period
      </h3>

      <div className="ui-stack">
        <div className="ui-stack-sm">
          <span className="ui-label">Financial Year</span>
          <p className="ui-help">
            NZ financial year. FY 2025 means 1 Apr 2024 to 31 Mar 2025.
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
            disabled={!actions.is_editing}
          />
        </div>

        <div className="ui-stack-sm">
          <span className="ui-label">Month</span>
          <p className="ui-help">
            Optional. Leave blank for a full-year P&amp;L, or choose a month for
            monthly tracking.
          </p>
          <select
            className="ui-input"
            value={state.period_month ?? ""}
            onChange={(event) =>
              actions.update_profit_and_loss_field(
                "period_month",
                event.target.value,
              )
            }
            disabled={!actions.is_editing}
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

function PnlSection({
  title,
  items,
  subtotal_label,
  subtotal_value,
  custom_lines = [],
  custom_section_key,
  actions,
  allow_custom = true,
}) {
  const [show_custom, set_show_custom] = useState(false);

  return (
    <div className="ui-panel ui-stack">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      <div className="ui-stack">
        {items.map((item) => (
          <MoneyInput
            key={item.key}
            label={item.label}
            help={item.help}
            value={item.value}
            disabled={!actions.is_editing}
            onChange={(value) =>
              actions.update_profit_and_loss_field(item.key, value)
            }
          />
        ))}
      </div>

      {allow_custom ? (
        <div className="ui-stack">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => set_show_custom((prev) => !prev)}
          >
            {show_custom ? "Hide Custom Lines" : "Show Custom Lines"}
          </button>

          {show_custom ? (
            <div className="ui-panel ui-stack">
              <button
                type="button"
                className="ui-button-secondary"
                onClick={() => actions.add_pnl_line(custom_section_key)}
                disabled={!actions.is_editing}
              >
                Add Line Item
              </button>

              {custom_lines.map((line) => (
                <div key={line.line_id} className="ui-panel ui-stack-sm">
                  <label className="ui-stack-sm">
                    <span className="ui-label">Line Item Name</span>
                    <input
                      className="ui-input"
                      value={line.name}
                      placeholder="Line item name"
                      onChange={(event) =>
                        actions.update_pnl_line(
                          custom_section_key,
                          line.line_id,
                          "name",
                          event.target.value,
                        )
                      }
                      disabled={!actions.is_editing}
                    />
                    <p className="ui-help">
                      Enter a custom P&amp;L line name for this section.
                    </p>
                  </label>

                  <MoneyInput
                    label="Value"
                    help="Enter the annual value for this custom line item."
                    value={line.value}
                    disabled={!actions.is_editing}
                    onChange={(value) =>
                      actions.update_pnl_line(
                        custom_section_key,
                        line.line_id,
                        "value",
                        value,
                      )
                    }
                  />

                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={() =>
                      actions.remove_pnl_line(custom_section_key, line.line_id)
                    }
                    disabled={!actions.is_editing}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="ui-panel">
        <div className="ui-kicker">{subtotal_label}</div>
        <div className="text-lg font-semibold text-[var(--text-primary)]">
          {subtotal_value}
        </div>
      </div>
    </div>
  );
}

export default function ProfitAndLossMainCard({
  state,
  output_contract,
  actions,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div className="ui-stack-sm">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            P&amp;L Business Picture
          </h2>
          <p className="ui-help">
            Enter your annual business totals from the last financial year to
            build the starting picture of how your business actually performed.
          </p>
          <p className="ui-help">
            This page is the simple starting point of QS Tools. It shows what
            happened in your business before deeper modelling begins.
          </p>
        </div>

        <PeriodInputs state={state} actions={actions} />

        <PnlSection
          title="Trading Income"
          items={[
            {
              key: "sales",
              label: "Sales",
              help: "Your total annual sales from trading activity.",
              value: state.sales,
            },
            {
              key: "other_trading_income",
              label: "Other Trading Income",
              help: "Other direct trading income if applicable.",
              value: state.other_trading_income,
            },
          ]}
          subtotal_label="Total Trading Income"
          subtotal_value={format_currency(output_contract.total_trading_income)}
          custom_lines={state.custom_trading_income_lines}
          custom_section_key="custom_trading_income_lines"
          actions={actions}
        />

        <PnlSection
          title="Cost of Sales"
          items={[
            {
              key: "materials",
              label: "Materials",
              help: "Total cost of materials used to deliver your jobs.",
              value: state.materials,
            },
            {
              key: "staff_labour",
              label: "Staff Labour",
              help: "Wages and salaries for staff directly involved in delivering work.",
              value: state.staff_labour,
            },
            {
              key: "subcontract_labour",
              label: "Subcontract Labour",
              help: "Labour paid to subcontractors working directly on jobs.",
              value: state.subcontract_labour,
            },
            {
              key: "subcontract_services",
              label: "Subcontract Services",
              help: "Subcontracted services that are not labour.",
              value: state.subcontract_services,
            },
            {
              key: "equipment_hire",
              label: "Equipment Hire",
              help: "Cost of hired equipment used to deliver jobs.",
              value: state.equipment_hire,
            },
            {
              key: "freight_cartage",
              label: "Freight / Cartage",
              help: "Transport and delivery costs directly related to jobs.",
              value: state.freight_cartage,
            },
            {
              key: "waste_disposal",
              label: "Waste Disposal",
              help: "Costs associated with removing and disposing of waste from jobs.",
              value: state.waste_disposal,
            },
            {
              key: "wip_adjustment",
              label: "Work in Progress (WIP)",
              help: "Adjustment for work in progress between accounting periods.",
              value: state.wip_adjustment,
            },
            {
              key: "other_job_costs",
              label: "Other Job Costs",
              help: "Any other direct job-related costs not captured above.",
              value: state.other_job_costs,
            },
          ]}
          subtotal_label="Total Cost of Sales"
          subtotal_value={format_currency(output_contract.total_cost_of_sales)}
          custom_lines={state.custom_cost_of_sales_lines}
          custom_section_key="custom_cost_of_sales_lines"
          actions={actions}
        />

        <div className="ui-panel">
          <div className="ui-kicker">Gross Profit</div>
          <div className="text-xl font-semibold text-[var(--text-primary)]">
            {format_currency(output_contract.gross_profit)}
          </div>
        </div>

        <PnlSection
          title="Other Income"
          items={[
            {
              key: "other_income",
              label: "Other Income",
              help: "Non-trading income such as vehicle contributions or miscellaneous income.",
              value: state.other_income,
            },
          ]}
          subtotal_label="Total Other Income"
          subtotal_value={format_currency(output_contract.total_other_income)}
          custom_lines={state.custom_other_income_lines}
          custom_section_key="custom_other_income_lines"
          actions={actions}
        />

        <PnlSection
          title="Operating Expenses"
          items={[
            {
              key: "acc_levy",
              label: "ACC Levy",
              help: "Annual ACC expense.",
              value: state.acc_levy,
            },
            {
              key: "accounting_fees",
              label: "Accounting Fees",
              help: "Annual accounting fees.",
              value: state.accounting_fees,
            },
            {
              key: "administration_fees",
              label: "Administration Fees",
              help: "Annual administration fees.",
              value: state.administration_fees,
            },
            {
              key: "advertising",
              label: "Advertising",
              help: "Annual advertising cost.",
              value: state.advertising,
            },
            {
              key: "bank_fees",
              label: "Bank Fees",
              help: "Annual bank fees.",
              value: state.bank_fees,
            },
            {
              key: "cleaning",
              label: "Cleaning",
              help: "Annual cleaning cost.",
              value: state.cleaning,
            },
            {
              key: "computer_expenses",
              label: "Computer Expenses",
              help: "Annual computer and software-related expense.",
              value: state.computer_expenses,
            },
            {
              key: "entertainment",
              label: "Entertainment",
              help: "Annual entertainment expense.",
              value: state.entertainment,
            },
            {
              key: "entertainment_non_deductible",
              label: "Entertainment - Non Deductible",
              help: "Annual non-deductible entertainment expense.",
              value: state.entertainment_non_deductible,
            },
            {
              key: "insurance",
              label: "Insurance",
              help: "Annual insurance expense.",
              value: state.insurance,
            },
            {
              key: "interest_expense",
              label: "Interest Expense",
              help: "Annual finance or interest cost.",
              value: state.interest_expense,
            },
            {
              key: "kiwisaver_employer_contributions",
              label: "KiwiSaver Employer Contributions",
              help: "Annual employer KiwiSaver expense.",
              value: state.kiwisaver_employer_contributions,
            },
            {
              key: "legal_expenses",
              label: "Legal Expenses",
              help: "Annual legal fees.",
              value: state.legal_expenses,
            },
            {
              key: "licences_registrations",
              label: "Licences & Registrations",
              help: "Annual licences and registrations.",
              value: state.licences_registrations,
            },
            {
              key: "motor_vehicle_expenses",
              label: "Motor Vehicle Expenses",
              help: "Annual vehicle operating expense.",
              value: state.motor_vehicle_expenses,
            },
            {
              key: "office_expenses",
              label: "Office Expenses",
              help: "Annual office expense.",
              value: state.office_expenses,
            },
            {
              key: "penalties_fees",
              label: "Penalties and Fees",
              help: "Annual penalties and fees.",
              value: state.penalties_fees,
            },
            {
              key: "printing_stationery",
              label: "Printing & Stationery",
              help: "Annual printing and stationery cost.",
              value: state.printing_stationery,
            },
            {
              key: "repairs_maintenance",
              label: "Repairs and Maintenance",
              help: "Annual repairs and maintenance expense.",
              value: state.repairs_maintenance,
            },
            {
              key: "salary_wages",
              label: "Salary & Wages",
              help: "Annual wage and salary expense.",
              value: state.salary_wages,
            },
            {
              key: "staff_expenses",
              label: "Staff Expenses",
              help: "Annual staff-related expense.",
              value: state.staff_expenses,
            },
            {
              key: "storage_fees",
              label: "Storage Fees",
              help: "Annual storage cost.",
              value: state.storage_fees,
            },
            {
              key: "subscriptions",
              label: "Subscriptions",
              help: "Annual subscriptions expense.",
              value: state.subscriptions,
            },
            {
              key: "telephone_internet",
              label: "Telephone & Internet",
              help: "Annual phone and internet expense.",
              value: state.telephone_internet,
            },
            {
              key: "tools_equipment",
              label: "Tools & Equipment",
              help: "Annual tools and equipment expense.",
              value: state.tools_equipment,
            },
            {
              key: "travel_national",
              label: "Travel - National",
              help: "Annual national travel cost.",
              value: state.travel_national,
            },
          ]}
          subtotal_label="Total Operating Expenses"
          subtotal_value={format_currency(
            output_contract.total_operating_expenses,
          )}
          custom_lines={state.custom_operating_expense_lines}
          custom_section_key="custom_operating_expense_lines"
          actions={actions}
        />

        <div className="ui-panel">
          <div className="ui-kicker">Net Profit</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            {format_currency(output_contract.net_profit)}
          </div>
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
            onClick={actions.on_toggle_edit}
          >
            {actions.is_editing ? "Lock" : "Edit"}
          </button>
        </div>
      </div>
    </section>
  );
}