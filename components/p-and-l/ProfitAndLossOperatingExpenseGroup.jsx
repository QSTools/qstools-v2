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

function get_line_amount_total(lines = []) {
  return (lines ?? []).reduce((total, line) => {
    return total + Number(line.amount || 0);
  }, 0);
}

function is_wip_line(line_name = "") {
  const normalized = String(line_name).trim().toLowerCase();
  return (
    normalized.includes("wip") ||
    normalized.includes("work in progress") ||
    normalized.includes("opening wip") ||
    normalized.includes("closing wip") ||
    normalized.includes("wip adjustment")
  );
}

const OPERATING_EXPENSE_CLASSIFICATION_OPTIONS = [
  {
    value: "salary_wages",
    category: "labour",
    review_subcategory: "salary_wages",
    label: "Salary & Wages → Labour",
  },
  {
    value: "employer_kiwisaver",
    category: "labour",
    review_subcategory: "employer_kiwisaver",
    label: "KiwiSaver → Labour",
  },
  {
    value: "employer_acc",
    category: "labour",
    review_subcategory: "employer_acc",
    label: "ACC Levy → Labour",
  },
  {
    value: "staff_overheads",
    category: "general_overheads",
    review_subcategory: "staff_overheads",
    label: "Staff Overheads → General Overheads",
  },
  {
    value: "entertainment",
    category: "general_overheads",
    review_subcategory: "staff_overheads",
    label: "Entertainment → Staff Overheads",
  },
  {
    value: "vehicle_running_costs",
    category: "general_overheads",
    review_subcategory: "vehicle_running_costs",
    label: "Vehicle Running Costs → General Overheads",
  },
  {
    value: "office_admin",
    category: "general_overheads",
    review_subcategory: "office_admin",
    label: "Office / Admin → General Overheads",
  },
  {
    value: "finance_admin",
    category: "general_overheads",
    review_subcategory: "finance_admin",
    label: "Accounting / Admin → General Overheads",
  },
  {
    value: "finance_interest",
    category: "general_overheads",
    review_subcategory: "finance_interest",
    label: "Finance / Interest → General Overheads",
  },
  {
    value: "asset_finance",
    category: "assets",
    review_subcategory: "asset_finance",
    label: "Asset Finance → Assets",
  },
  {
    value: "mixed_finance",
    category: "review_required",
    review_subcategory: "mixed_finance",
    label: "Mixed Finance → Review Required",
  },
  {
    value: "insurance_compliance",
    category: "general_overheads",
    review_subcategory: "insurance_compliance",
    label: "Insurance / Compliance → General Overheads",
  },
  {
    value: "sales_growth",
    category: "general_overheads",
    review_subcategory: "sales_growth",
    label: "Sales / Growth → General Overheads",
  },
  {
    value: "travel",
    category: "general_overheads",
    review_subcategory: "travel",
    label: "Travel → General Overheads",
  },
  {
    value: "penalties_non_deductible",
    category: "excluded",
    review_subcategory: "penalties_non_deductible",
    label: "Penalties / Non-Deductible → Excluded",
  },
  {
    value: "other_review_required",
    category: "review_required",
    review_subcategory: "other_review_required",
    label: "Other / Review Required",
  },
  {
    value: "excluded_non_qs",
    category: "excluded",
    review_subcategory: "excluded_non_qs",
    label: "Excluded / Non-QS Cost",
  },
  {
    value: "unassigned",
    category: "unassigned",
    review_subcategory: "",
    label: "Unassigned",
  },
];

function get_operating_expense_classification_option_value(line) {
  const category = line.category || "unassigned";
  const subcategory = line.review_subcategory || "";
  const detected_classification = detect_operating_expense_subcategory(
    line.line_name,
  );

  if (
    detected_classification &&
    detected_classification.category === category &&
    detected_classification.subcategory === subcategory
  ) {
    const detectedOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
      (option) =>
        option.category === category &&
        option.review_subcategory === subcategory &&
        option.label.startsWith(detected_classification.label),
    );

    if (detectedOption) {
      return detectedOption.value;
    }
  }

  const matchedOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
    (option) =>
      option.category === category && option.review_subcategory === subcategory,
  );

  if (matchedOption) {
    return matchedOption.value;
  }

  const genericOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
    (option) => option.value === category,
  );

  return genericOption?.value || "unassigned";
}

function build_line_category_options(line, category_options) {
  if (is_wip_line(line.line_name)) {
    return [
      {
        value: "review_required",
        label: "WIP / Accounting Adjustment",
        review_subcategory: "wip_accounting_adjustment",
        wip_treatment: "unresolved",
      },
      {
        value: "excluded",
        label: "Exclude from QS Cost Model",
        review_subcategory: "wip_accounting_adjustment_excluded",
        wip_treatment: "excluded_from_qs_cost_model",
      },
      {
        value: "cogs",
        label: "Include as COGS / Direct Job Cost",
        review_subcategory: "wip_direct_job_cost",
        wip_treatment: "include_as_direct_job_cost",
      },
      {
        value: "income",
        label: "Income / Revenue Timing Adjustment",
        review_subcategory: "wip_income_timing_adjustment",
        wip_treatment: "income_timing_adjustment",
      },
      ...category_options,
    ];
  }

  const operating_expense_classification = detect_operating_expense_subcategory(
    line.line_name,
  );

  if (operating_expense_classification) {
    const { category, subcategory } = operating_expense_classification;
    const inferredValue = `${category}|${subcategory}`;
    const inferredOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
      (option) => option.value === inferredValue,
    );

    return inferredOption
      ? [
          inferredOption,
          ...OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.filter(
            (option) => option.value !== inferredValue,
          ),
        ]
      : OPERATING_EXPENSE_CLASSIFICATION_OPTIONS;
  }

  return OPERATING_EXPENSE_CLASSIFICATION_OPTIONS;
}

function is_interest_line(line) {
  return String(line?.line_name || "")
    .toLowerCase()
    .includes("interest");
}

function detect_operating_expense_subcategory(line_name = "") {
  const normalized = String(line_name).trim().toLowerCase();

  // Labour-related operating expenses
  if (
    normalized.includes("salary") ||
    normalized.includes("wages") ||
    normalized.includes("payroll")
  ) {
    return { category: "labour", subcategory: "salary_wages", label: "Salary & Wages" };
  }

  if (
    normalized.includes("kiwisaver") ||
    normalized.includes("kiwi saver")
  ) {
    return { category: "labour", subcategory: "employer_kiwisaver", label: "KiwiSaver" };
  }

  if (
    normalized.includes("acc levy") ||
    normalized.includes("acc ")
  ) {
    return { category: "labour", subcategory: "employer_acc", label: "ACC Levy" };
  }

  // Staff overheads
  if (
    normalized.includes("staff expense") ||
    normalized.includes("staff expenses") ||
    normalized.includes("staff welfare") ||
    normalized.includes("staff amenities") ||
    normalized.includes("staff support")
  ) {
    return { category: "general_overheads", subcategory: "staff_overheads", label: "Staff Overheads" };
  }

  if (
    normalized.includes("entertainment")
  ) {
    return { category: "general_overheads", subcategory: "staff_overheads", label: "Entertainment" };
  }

  // Vehicle running costs
  if (
    normalized.includes("fuel") ||
    normalized.includes("diesel") ||
    normalized.includes("petrol") ||
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("registration") ||
    normalized.includes("registrations") ||
    normalized.includes("rego") ||
    normalized.includes("licence") ||
    normalized.includes("licences") ||
    normalized.includes("license") ||
    normalized.includes("licenses") ||
    normalized.includes("repair") ||
    normalized.includes("repairs") ||
    normalized.includes("maintenance") ||
    normalized.includes("servicing")
  ) {
    return { category: "general_overheads", subcategory: "vehicle_running_costs", label: "Vehicle Running Costs" };
  }

  // Office and admin costs
  if (
    normalized.includes("computer") ||
    normalized.includes("printing") ||
    normalized.includes("stationery") ||
    normalized.includes("office") ||
    normalized.includes("supplies") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("internet") ||
    normalized.includes("software") ||
    normalized.includes("subscription")
  ) {
    return { category: "general_overheads", subcategory: "office_admin", label: "Office / Admin" };
  }

  // Finance and interest
  if (
    normalized.includes("asset finance") ||
    normalized.includes("equipment finance") ||
    normalized.includes("finance lease")
  ) {
    return { category: "assets", subcategory: "asset_finance", label: "Asset Finance" };
  }

  if (
    normalized.includes("mixed") ||
    normalized.includes("mixed finance")
  ) {
    return { category: "review_required", subcategory: "mixed_finance", label: "Mixed Finance (Asset + General)" };
  }

  if (
    normalized.includes("accounting") ||
    normalized.includes("bookkeeper")
  ) {
    return { category: "general_overheads", subcategory: "finance_admin", label: "Accounting / Admin" };
  }

  if (
    normalized.includes("bank fees") ||
    normalized.includes("loan interest") ||
    normalized.includes("finance") ||
    normalized.includes("interest")
  ) {
    return { category: "general_overheads", subcategory: "finance_interest", label: "Finance / Interest" };
  }

  // Insurance and compliance
  if (
    normalized.includes("insurance")
  ) {
    return { category: "general_overheads", subcategory: "insurance_compliance", label: "Insurance / Compliance" };
  }

  if (
    normalized.includes("legal") ||
    normalized.includes("compliance") ||
    normalized.includes("audit")
  ) {
    return { category: "general_overheads", subcategory: "insurance_compliance", label: "Insurance / Compliance" };
  }

  // Travel
  if (
    normalized.includes("travel")
  ) {
    return { category: "general_overheads", subcategory: "travel", label: "Travel" };
  }

  // Sales and growth
  if (
    normalized.includes("advertising") ||
    normalized.includes("marketing")
  ) {
    return { category: "general_overheads", subcategory: "sales_growth", label: "Sales / Growth" };
  }

  // Excluded items
  if (
    normalized.includes("penalt") ||
    normalized.includes("fee") ||
    normalized.includes("fine") ||
    normalized.includes("non-deductible")
  ) {
    return { category: "excluded", subcategory: "penalties_non_deductible", label: "Penalties / Non-Deductible" };
  }

  if (
    normalized.includes("excluded") ||
    normalized.includes("non-qs") ||
    normalized.includes("non qs")
  ) {
    return { category: "excluded", subcategory: "excluded_non_qs", label: "Excluded / Non-QS Cost" };
  }

  // Other / Review Required
  if (
    normalized.includes("other") ||
    normalized.includes("review required")
  ) {
    return { category: "review_required", subcategory: "other_review_required", label: "Other / Review Required" };
  }

  return null;
}

function get_category_help_text(category) {
  switch (category) {
    case "labour":
      return "Feeds the Labour module benchmark. Use for wages and direct staff cost.";
    case "employee_overheads":
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide costs such as insurance, phones, internet, office, accounting, and subscriptions.";
    case "assets":
      return "Feeds the Assets benchmark. Use for vehicle, plant, finance, running costs, repairs, maintenance, licences, registrations, and ownership costs.";
    case "review_required":
      return "Review required. This line has been identified as a WIP accounting adjustment and needs further review before model assignment.";
    case "excluded":
      return "Excluded from QS cost model. This WIP cost will not be included in the QS recovery benchmark.";
    case "cogs":
      return "Included as COGS / Direct Job Cost for QS benchmark and reconciliation.";
    case "income":
      return "Income / Revenue Timing Adjustment. This line is treated as timing-related revenue rather than an operating cost.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

function get_review_subcategory_help_text(subcategory) {
  switch (subcategory) {
    case "salary_wages":
      return "Gross wages and direct salary costs feed the Labour module benchmark.";
    case "employer_kiwisaver":
      return "KiwiSaver employer contributions feed the Labour module benchmark.";
    case "employer_acc":
      return "ACC employer levy feeds the Labour module benchmark.";
    case "staff_overheads":
      return "Staff welfare, training, uniforms, and support costs feed General Overheads.";
    case "vehicle_running_costs":
      return "Vehicle fuel, repairs, maintenance, registration, and running costs feed General Overheads.";
    case "office_admin":
      return "Office, admin, supplies, phones, internet, and software feed General Overheads.";
    case "finance_admin":
      return "Accounting, bookkeeping, and financial admin costs feed General Overheads.";
    case "finance_interest":
      return "General finance interest, bank fees, and non-asset borrowing costs feed General Overheads.";
    case "insurance_compliance":
      return "Insurance, legal, compliance, and audit costs feed General Overheads.";
    case "travel":
      return "Travel and accommodation costs feed General Overheads.";
    case "sales_growth":
      return "Advertising and marketing costs feed General Overheads.";
    case "asset_finance":
      return "Asset finance, equipment finance, and asset-related costs feed Assets.";
    case "mixed_finance":
      return "This contains both asset and general finance. Review and separate before finalizing.";
    case "penalties_non_deductible":
      return "Penalties, fines, and non-deductible costs are excluded from QS recovery.";
    case "excluded_non_qs":
      return "These costs are explicitly excluded from the QS cost model.";
    case "other_review_required":
      return "This line needs further review to determine correct classification.";
    default:
      return "";
  }
}

function get_interest_treatment_help_text(interest_treatment) {
  switch (interest_treatment) {
    case "contains_asset_finance_interest":
    case "asset_finance_exclude":
      return "This line contains asset finance interest. QS Tools handles asset finance through the Assets module to avoid double counting.";
    case "no_asset_finance_interest":
    case "general_overhead_keep":
      return "This line does not contain asset finance interest.";
    case "not_reviewed":
    case "unknown":
    default:
      return "Select whether this P&L interest line contains asset finance interest.";
  }
}

function normalise_interest_treatment(value) {
  switch (value) {
    case "asset_finance_exclude":
      return "contains_asset_finance_interest";
    case "general_overhead_keep":
      return "no_asset_finance_interest";
    case "unknown":
    case "not_reviewed":
    case undefined:
    case null:
    case "":
      return "not_reviewed";
    default:
      return value;
  }
}

export default function ProfitAndLossOperatingExpenseGroup({
  title,
  help,
  lines = [],
  category_options = [],
  actions,
  handle_line_name_change,
  get_suggested_category_text,
  defaultOpen = false,
}) {
  const subtotal = get_line_amount_total(lines);

  if (lines.length === 0) return null;

  return (
    <CollapsibleSection
      title={title}
      summary={format_number_with_commas(subtotal)}
      defaultOpen={defaultOpen}
    >
      <div className="ui-stack-sm">
        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">Group Guidance</span>
          <p className="ui-help">{help}</p>
        </div>

        {lines.map((line) => {
          const suggested_category_text = get_suggested_category_text(
            line.line_name,
          );
          const show_interest_treatment = is_interest_line(line);

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

                {(() => {
                  const local_category_options = build_line_category_options(
                    line,
                    category_options,
                  );
                  const current_option_value = get_operating_expense_classification_option_value(
                    line,
                  );
                  const effective_category =
                    is_wip_line(line.line_name) &&
                    (line.category === "unassigned" || !line.category)
                      ? "review_required"
                      : line.category || "unassigned";

                  return (
                    <>
                      <select
                        className="ui-select"
                        value={current_option_value}
                        onChange={(event) => {
                          const selectedValue = event.target.value;
                          const selectedOption = local_category_options.find(
                            (option) => option.value === selectedValue,
                          );

                          if (!selectedOption) {
                            return;
                          }

                          actions.update_pnl_line(
                            line.pnl_line_id,
                            "category",
                            selectedOption.category || selectedValue,
                          );

                          actions.update_pnl_line(
                            line.pnl_line_id,
                            "review_subcategory",
                            selectedOption.review_subcategory || "",
                          );

                          if (selectedOption?.wip_treatment) {
                            actions.update_pnl_line(
                              line.pnl_line_id,
                              "wip_treatment",
                              selectedOption.wip_treatment,
                            );
                          } else if (selectedValue === "review_required") {
                            actions.update_pnl_line(
                              line.pnl_line_id,
                              "wip_treatment",
                              "unresolved",
                            );
                          }
                        }}
                      >
                        {local_category_options.map((option) => (
                          <option
                            key={`${option.value}-${option.label}`}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <p className="ui-help">
                        {get_category_help_text(effective_category)}
                      </p>

                      {is_wip_line(line.line_name) ? (
                        <div className="ui-panel ui-stack-sm theme-warn-soft">
                          <span className="ui-label">WIP Decision Guide</span>
                          <p className="ui-help">
                            QS Tools cannot classify this WIP line from the P&L
                            alone. Check the WIP schedule, accountant journal,
                            or source detail, then choose the treatment below.
                            If this is only a year-end accounting, tax, or
                            timing adjustment, exclude it from the QS cost
                            model. If it represents real direct job costs for
                            the model period, include it as COGS / Direct Job
                            Cost. If it relates to revenue timing, treat it as
                            Income / Revenue Timing Adjustment. If unsure,
                            leave it as Review Required.
                          </p>
                          <ul className="ui-list">
                            <li>
                              <strong>Review Required:</strong> blocks
                              readiness until this WIP is resolved.
                            </li>
                            <li>
                              <strong>Exclude from QS Cost Model:</strong>
                              removes the line from QS benchmark and recovery.
                            </li>
                            <li>
                              <strong>Include as COGS / Direct Job Cost:</strong>
                              includes the line in benchmark/reconciliation.
                            </li>
                            <li>
                              <strong>Income / Revenue Timing Adjustment:</strong>
                              treats the line as timing-related revenue, not
                              an operating cost.
                            </li>
                          </ul>
                          {Math.abs(Number(line.amount || 0)) > 10000 ? (
                            <p className="ui-help theme-warn">
                              This WIP amount is material and should be
                              reviewed carefully.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>

              {show_interest_treatment ? (
                <div className="ui-stack-sm">
                  <div className="ui-panel ui-stack-sm">
                    <span className="ui-label">Why this matters</span>

                    <p className="ui-help">
                      Interest lines can include bank interest, overdraft
                      interest, or asset finance interest.
                    </p>

                    <p className="ui-help">
                      Asset finance is handled through the Assets module to
                      avoid double counting.
                    </p>

                    <p className="ui-help">
                      Select whether this P&amp;L interest line contains asset
                      finance interest.
                    </p>
                  </div>

                  <span className="ui-label inline-flex items-center gap-2">
                    Interest Classification
                    <Tooltip text="Select the factual condition for this interest line. QS Tools decides the treatment." />
                  </span>

                  <select
                    className="ui-select"
                    value={normalise_interest_treatment(
                      line.interest_treatment,
                    )}
                    onChange={(event) =>
                      actions.update_pnl_line(
                        line.pnl_line_id,
                        "interest_treatment",
                        event.target.value,
                      )
                    }
                  >
                    <option value="not_reviewed">Not reviewed</option>
                    <option value="contains_asset_finance_interest">
                      Contains asset finance interest
                    </option>
                    <option value="no_asset_finance_interest">
                      Does not contain asset finance interest
                    </option>
                  </select>

                  <p className="ui-help">
                    {get_interest_treatment_help_text(
                      line.interest_treatment || "not_reviewed",
                    )}
                  </p>
                </div>
              ) : null}

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

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{title} Subtotal</span>
          <div>{format_number_with_commas(subtotal)}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
