import {
  format_currency,
  format_number,
  format_percent,
} from "@/lib/selectors/labour/labourFormatters";
import {
  get_acc_levy_value,
  get_acc_rate_value,
  get_available_hours_before_productivity,
  get_lost_hours_to_productivity,
} from "@/lib/selectors/labour/labourSharedSelectors";

function get_labour_decision_status(outputs = {}) {
  const productive_hours = Number(outputs.productive_hours ?? 0);
  const productive_labour_cost_rate = Number(
    outputs.productive_labour_cost_rate ?? 0
  );
  const total_labour_cost_annual = Number(outputs.total_labour_cost_annual ?? 0);

  if (productive_hours <= 0) {
    return {
      status_key: "incomplete",
      status_label: "Incomplete",
      message:
        "Productive hours are missing, so the labour cost position is not ready yet.",
    };
  }

  if (total_labour_cost_annual <= 0) {
    return {
      status_key: "incomplete",
      status_label: "Incomplete",
      message:
        "Annual labour cost is missing, so the labour cost position is not ready yet.",
    };
  }

  if (productive_labour_cost_rate <= 0) {
    return {
      status_key: "incomplete",
      status_label: "Incomplete",
      message:
        "Productive labour cost rate is missing, so the labour cost position is not ready yet.",
    };
  }

  return {
    status_key: "ready",
    status_label: "Labour cost ready",
    message:
      "This labour profile has enough cost and productive-hour data for downstream use.",
  };
}

function get_rate_build(outputs = {}) {
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const available_hours = get_available_hours_before_productivity(outputs);
  const productive_hours = Number(outputs.productive_hours ?? 0);

  const gross_wages_annual = Number(outputs.gross_wages_annual ?? 0);
  const employer_kiwisaver_gross = Number(
    outputs.employer_kiwisaver_gross ?? 0
  );
  const esct_amount = Number(outputs.esct_amount ?? 0);
  const acc_work_levy_annual = get_acc_levy_value(outputs);

  const paid_rate = paid_hours > 0 ? gross_wages_annual / paid_hours : 0;

  const available_rate =
    available_hours > 0 ? gross_wages_annual / available_hours : 0;

  const entitlement_uplift = Math.max(available_rate - paid_rate, 0);

  const productive_wage_rate =
    productive_hours > 0 ? gross_wages_annual / productive_hours : 0;

  const productivity_uplift = Math.max(
    productive_wage_rate - available_rate,
    0
  );

  const kiwisaver_per_productive_hr =
    productive_hours > 0 ? employer_kiwisaver_gross / productive_hours : 0;

  const esct_per_productive_hr =
    productive_hours > 0 ? esct_amount / productive_hours : 0;

  const acc_per_productive_hr =
    productive_hours > 0 ? acc_work_levy_annual / productive_hours : 0;

  const employer_uplift =
    kiwisaver_per_productive_hr +
    esct_per_productive_hr +
    acc_per_productive_hr;

  return {
    paid_rate,
    available_rate,
    entitlement_uplift,
    productive_wage_rate,
    productivity_uplift,
    kiwisaver_per_productive_hr,
    esct_per_productive_hr,
    acc_per_productive_hr,
    employer_uplift,
  };
}

export function buildLabourSummary({ state = {}, outputs = {} }) {
  const rate_build = get_rate_build(outputs);
  const decision_status = get_labour_decision_status(outputs);

  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const non_productive_paid_hours = Number(
    outputs.non_productive_paid_hours ?? 0
  );
  const available_hours_before_productivity =
    get_available_hours_before_productivity(outputs);
  const lost_hours_to_productivity = get_lost_hours_to_productivity(outputs);
  const productive_hours = Number(outputs.productive_hours ?? 0);
  const total_labour_cost_annual = Number(outputs.total_labour_cost_annual ?? 0);
  const productive_labour_cost_rate = Number(
    outputs.productive_labour_cost_rate ?? 0
  );

  return {
    meta: {
      staff_name: state.staff_name || "Unnamed staff",
      staff_role: state.staff_role || "No role",
      labour_class: state.labour_class || "No class",
    },

    decision_status,

    decision_rows: [
      {
        label: "Productive hours",
        value: `${format_number(productive_hours, 0)} hrs`,
        helper:
          "Final productive hours after paid non-productive time and productivity.",
        is_total: true,
        breakdown_title: "Paid hours to productive hours",
        breakdown_rows: [
          {
            label: "Paid hours",
            value: `${format_number(paid_hours, 0)} hrs`,
            helper: "Total annual hours paid for this labour profile.",
          },
          {
            label: "Less non-productive paid hours",
            value: `${format_number(non_productive_paid_hours, 0)} hrs`,
            helper:
              "Leave, public holidays, sick leave and other paid non-productive time.",
          },
          {
            label: "Available hours before productivity",
            value: `${format_number(available_hours_before_productivity, 0)} hrs`,
            helper: "Paid hours left after removing entitlement time.",
          },
          {
            label: "Less productivity loss",
            value: `${format_number(lost_hours_to_productivity, 0)} hrs`,
            helper: "Hours lost through normal non-productive working time.",
          },
          {
            label: "Final productive hours",
            value: `${format_number(productive_hours, 0)} hrs`,
            helper: "Hours that can actually produce recoverable work.",
            is_total: true,
          },
        ],
      },
      {
        label: "Real cost per productive hour",
        value: `${format_currency(productive_labour_cost_rate, 2)}/hr`,
        helper: "True labour cost spread over productive hours only.",
        is_total: true,
        breakdown_title: "Annual cost to productive-hour rate",
        breakdown_rows: [
          {
            label: "Annual labour cost",
            value: format_currency(total_labour_cost_annual, 0),
            helper: "Wages plus employer contribution costs.",
          },
          {
            label: "Productive hours",
            value: `${format_number(productive_hours, 0)} hrs`,
            helper: "Final productive hours available for recoverable work.",
          },
          {
            label: "Real cost per productive hour",
            value: `${format_currency(productive_labour_cost_rate, 2)}/hr`,
            helper: "Annual labour cost divided by productive hours.",
            is_total: true,
          },
          {
            label: "Full labour rate evidence",
            value: "Show calculation trail",
            helper:
              "Shows how wage cost is lifted as paid hours reduce into productive hours.",
            child_rows: [
              {
                label: "1. Hourly Wage Rate",
                value: format_currency(rate_build.paid_rate, 2),
              },
              {
                label: "2. Entitlement Hours Removed",
                value: `${format_number(non_productive_paid_hours, 0)} hrs`,
              },
              {
                label: "3. Available Hours Before Productivity",
                value: `${format_number(
                  available_hours_before_productivity,
                  0
                )} hrs`,
              },
              {
                label: "4. Wage Rate After Entitlements",
                value: format_currency(rate_build.available_rate, 2),
                is_total: true,
              },
              {
                label: "Entitlement Uplift",
                value: `+${format_currency(
                  rate_build.entitlement_uplift,
                  2
                )}/hr`,
              },
              {
                label: "5. Productivity Hours Lost",
                value: `${format_number(lost_hours_to_productivity, 0)} hrs`,
              },
              {
                label: "6. Final Productive Hours",
                value: `${format_number(productive_hours, 0)} hrs`,
              },
              {
                label: "7. Wage Rate After Productivity",
                value: format_currency(rate_build.productive_wage_rate, 2),
                is_total: true,
              },
              {
                label: "Productivity Uplift",
                value: `+${format_currency(
                  rate_build.productivity_uplift,
                  2
                )}/hr`,
              },
              {
                label: "8. KiwiSaver / Productive Hr",
                value: format_currency(
                  rate_build.kiwisaver_per_productive_hr,
                  2
                ),
              },
              {
                label: "9. ESCT / Productive Hr",
                value: format_currency(rate_build.esct_per_productive_hr, 2),
              },
              {
                label: "10. ACC / Productive Hr",
                value: format_currency(rate_build.acc_per_productive_hr, 2),
              },
              {
                label: "Employer Cost Uplift",
                value: `+${format_currency(rate_build.employer_uplift, 2)}/hr`,
              },
              {
                label: "Real Productive Labour Cost Rate",
                value: format_currency(productive_labour_cost_rate, 2),
                is_total: true,
              },
            ],
          },
        ],
      },
    ],

    charge_out_result_rows: [],

    sections: [
      {
        key: "cost_build",
        title: "Annual labour cost evidence",
        summary:
          "Show the annual employer cost build before spreading it across productive hours.",
        rows: [
          {
            label: "Gross Wages",
            value: format_currency(outputs.gross_wages_annual),
          },
          {
            label: "Entitlements Included in Gross Wages",
            value: format_currency(outputs.entitlements_annual),
          },
          {
            label: "Employer KiwiSaver",
            value: format_currency(outputs.employer_kiwisaver_gross),
          },
          {
            label: "ESCT",
            value: format_currency(outputs.esct_amount),
          },
          {
            label: "ACC Work Levy",
            value: format_currency(get_acc_levy_value(outputs)),
          },
          {
            label: "Employer Contribution Total",
            value: format_currency(outputs.total_employer_contribution_cost),
          },
          {
            label: "Total Labour Cost",
            value: format_currency(outputs.total_labour_cost_annual),
            is_total: true,
          },
        ],
      },

      {
        key: "hourly_position",
        title: "Hourly labour position",
        summary:
          "Show the current hourly cost position after productivity and employer costs.",
        rows: [
          {
            label: "Productivity",
            value: format_percent(state.productivity_percent, 0),
          },
          {
            label: "ACC Rate",
            value: format_percent(get_acc_rate_value(outputs), 2),
          },
          {
            label: "Loaded Labour Cost Rate",
            value: format_currency(outputs.loaded_labour_cost_rate, 2),
          },
          {
            label: "Productive Labour Cost Rate",
            value: format_currency(outputs.productive_labour_cost_rate, 2),
            is_total: true,
          },
        ],
      },
    ],
  };
}