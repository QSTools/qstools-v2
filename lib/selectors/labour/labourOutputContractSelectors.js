import {
  calculateProductiveStaffTypeRates,
  calculatePnlDerivedLabourRecovery,
} from "@/lib/calculations/labourCalculations";
import {
  sum_staff_value,
  to_number,
} from "@/lib/selectors/labour/labourFormatters";
import {
  get_available_hours_before_productivity,
  sum_staff_acc_levy,
} from "@/lib/selectors/labour/labourSharedSelectors";
import {
  build_productive_labour_types,
} from "@/lib/selectors/labour/labourTypeSelectors";

export function buildLabourOutputContract({
  active_staff = [],
  outputs = {},
  state = {},
  pnl_recovery_inputs = {},
}) {
  const total_gross_wages_annual = sum_staff_value(
    active_staff,
    "gross_wages_annual"
  );
  const total_entitlements_annual = sum_staff_value(
    active_staff,
    "entitlements_annual"
  );
  const total_annual_leave_hours = sum_staff_value(
    active_staff,
    "annual_leave_hours"
  );
  const total_public_holiday_hours = sum_staff_value(
    active_staff,
    "public_holiday_hours"
  );
  const total_sick_leave_hours = sum_staff_value(
    active_staff,
    "sick_leave_hours"
  );
  const total_bereavement_leave_hours = sum_staff_value(
    active_staff,
    "bereavement_leave_hours"
  );
  const total_family_violence_leave_hours = sum_staff_value(
    active_staff,
    "family_violence_leave_hours"
  );
  const total_annual_leave_cost_annual = sum_staff_value(
    active_staff,
    "annual_leave_cost_annual"
  );
  const total_public_holiday_cost_annual = sum_staff_value(
    active_staff,
    "public_holiday_cost_annual"
  );
  const total_sick_leave_cost_annual = sum_staff_value(
    active_staff,
    "sick_leave_cost_annual"
  );
  const total_bereavement_leave_cost_annual = sum_staff_value(
    active_staff,
    "bereavement_leave_cost_annual"
  );
  const total_family_violence_leave_cost_annual = sum_staff_value(
    active_staff,
    "family_violence_leave_cost_annual"
  );
  const total_employer_kiwisaver_annual = sum_staff_value(
    active_staff,
    "employer_kiwisaver_gross"
  );
  const total_esct_annual = sum_staff_value(active_staff, "esct_amount");
  const total_acc_levy_annual = sum_staff_acc_levy(active_staff);
  const total_employer_contribution_annual = sum_staff_value(
    active_staff,
    "total_employer_contribution_cost"
  );
  const total_labour_cost_annual = sum_staff_value(
    active_staff,
    "total_labour_cost_annual"
  );
  const total_productive_output = sum_staff_value(
    active_staff,
    "productive_hours"
  );
  const total_recovery_hours = sum_staff_value(active_staff, "recovery_hours");

  const productive_staff_type_rate_outputs =
    calculateProductiveStaffTypeRates(active_staff);

  const total_productive_labour_hours =
    productive_staff_type_rate_outputs.total_productive_labour_hours;
  const total_productive_labour_cost =
    productive_staff_type_rate_outputs.total_productive_labour_cost;
  const total_productive_paid_hours =
    productive_staff_type_rate_outputs.total_productive_paid_hours;
  const weighted_all_productive_labour_rate =
    productive_staff_type_rate_outputs.weighted_all_productive_labour_rate;
  const weighted_all_productive_productivity_percent =
    productive_staff_type_rate_outputs
      .weighted_all_productive_productivity_percent;
  const base_productive_staff_type_rates =
    productive_staff_type_rate_outputs.productive_staff_type_rates;
  const productive_staff_type_rate_warnings =
    productive_staff_type_rate_outputs.productive_staff_type_rate_warnings;

  const pnl_labour_recovery_outputs = calculatePnlDerivedLabourRecovery({
    revenue: pnl_recovery_inputs.revenue,
    cog: pnl_recovery_inputs.cog,
    net_profit: pnl_recovery_inputs.net_profit,
    non_labour_overheads: pnl_recovery_inputs.non_labour_overheads,
    productive_staff_type_rates: base_productive_staff_type_rates,
    total_productive_labour_hours,
    total_productive_labour_cost,
  });

  const gross_profit = pnl_labour_recovery_outputs.gross_profit;
  const labour_recovery_pool =
    pnl_labour_recovery_outputs.labour_recovery_pool;
  const pnl_derived_recovered_labour_rate =
    pnl_labour_recovery_outputs.pnl_derived_recovered_labour_rate;
  const pnl_labour_recovery_multiplier =
    pnl_labour_recovery_outputs.pnl_labour_recovery_multiplier;
  const pnl_labour_recovery_status =
    pnl_labour_recovery_outputs.pnl_labour_recovery_status;
  const productive_staff_type_rates =
    pnl_labour_recovery_outputs
      .productive_staff_type_rates_with_pnl_recovery;

  const total_non_productive_labour_cost =
    total_labour_cost_annual - total_productive_labour_cost;

  const total_available_hours_before_productivity = active_staff.reduce(
    (total, staff) => {
      return total + get_available_hours_before_productivity(staff);
    },
    0
  );

  const weighted_productivity_percent =
    total_available_hours_before_productivity > 0
      ? (total_productive_output / total_available_hours_before_productivity) *
        100
      : 0;

  const labour_ready =
    active_staff.length > 0 &&
    total_labour_cost_annual > 0 &&
    total_productive_output > 0 &&
    total_employer_contribution_annual > 0 &&
    total_acc_levy_annual > 0;

  const productive_labour_cost_rate =
    total_productive_output > 0
      ? total_labour_cost_annual / total_productive_output
      : 0;

  const productive_labour_types = build_productive_labour_types(active_staff);
  const productive_labour_type_count = productive_labour_types.length;

  const total_productive_labour_type_hours = productive_labour_types.reduce(
    (total, labour_type) => {
      return total + to_number(labour_type?.total_productive_hours);
    },
    0
  );

  const total_productive_labour_type_cost = productive_labour_types.reduce(
    (total, labour_type) => {
      return total + to_number(labour_type?.total_labour_cost);
    },
    0
  );

  return {
    current_staff: {
      staff_id: state.staff_id || "",
      staff_name: state.staff_name || "",
      staff_role: state.staff_role || "",
      labour_class: state.labour_class || "",
      contributes_to_recovery_hours:
        state.contributes_to_recovery_hours !== false,
      ...outputs,
    },
    active_staff,

    total_gross_wages_annual,
    total_entitlements_annual,
    total_annual_leave_hours,
    total_public_holiday_hours,
    total_sick_leave_hours,
    total_bereavement_leave_hours,
    total_family_violence_leave_hours,
    total_annual_leave_cost_annual,
    total_public_holiday_cost_annual,
    total_sick_leave_cost_annual,
    total_bereavement_leave_cost_annual,
    total_family_violence_leave_cost_annual,
    total_employer_kiwisaver_annual,
    total_esct_annual,
    total_acc_levy_annual,
    total_employer_contribution_annual,

    total_labour_cost_annual,
    total_people_cost_annual: total_labour_cost_annual,
    total_productive_labour_cost,
    total_non_productive_labour_cost,
    total_productive_labour_hours,
    total_productive_paid_hours,
    total_productive_output,
    total_recovery_hours,
    total_available_hours_before_productivity,

    gross_profit,
    labour_recovery_pool,
    pnl_derived_recovered_labour_rate,
    pnl_labour_recovery_multiplier,
    pnl_labour_recovery_status,

    weighted_productivity_percent,
    weighted_all_productive_productivity_percent,
    productive_labour_cost_rate,
    weighted_all_productive_labour_rate,

    productive_staff_type_rates,
    productive_staff_type_rate_warnings,
    labour_warnings: productive_staff_type_rate_warnings,

    productive_labour_types,
    productive_labour_type_count,
    total_productive_labour_type_hours,
    total_productive_labour_type_cost,

    labour_ready,
  };
}