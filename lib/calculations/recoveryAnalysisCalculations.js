function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function calculateRecoveryAnalysis({
  labour_data,
  cost_summary_calculations,
}) {
  const active_staff = Array.isArray(labour_data?.active_staff)
    ? labour_data.active_staff
    : [];

  const recoverable_rows = active_staff
    .filter((staff) => staff?.labour_class === "direct_production")
    .map((staff) => {
      const productive_hours = toNumber(staff?.productive_hours);
      const charge_out_rate = toNumber(staff?.charge_out_rate);
      const achievable_revenue = productive_hours * charge_out_rate;

      return {
        staff_id: staff?.staff_id ?? "",
        staff_name: staff?.staff_name ?? "Unnamed Staff",
        staff_role: staff?.staff_role ?? "",
        labour_class: staff?.labour_class ?? "",
        productive_hours,
        charge_out_rate,
        achievable_revenue,
      };
    });

  const total_recoverable_hours = recoverable_rows.reduce(
    (sum, row) => sum + row.productive_hours,
    0
  );

  const achievable_revenue = recoverable_rows.reduce(
    (sum, row) => sum + row.achievable_revenue,
    0
  );

  const weighted_achievable_rate =
    total_recoverable_hours > 0
      ? achievable_revenue / total_recoverable_hours
      : 0;

  const required_revenue = toNumber(cost_summary_calculations?.required_revenue);
  const required_recovery_rate = toNumber(
    cost_summary_calculations?.required_recovery_rate
  );

  const revenue_gap = achievable_revenue - required_revenue;
  const recovery_gap = weighted_achievable_rate - required_recovery_rate;

  const shortfall_amount = revenue_gap < 0 ? Math.abs(revenue_gap) : 0;

  const extra_hours_required_at_current_rates =
    shortfall_amount > 0 && weighted_achievable_rate > 0
      ? shortfall_amount / weighted_achievable_rate
      : 0;

  const cost_reduction_required_at_current_rates = shortfall_amount;

  const required_average_rate_increase =
    recovery_gap < 0 ? Math.abs(recovery_gap) : 0;

  let primary_constraint_key = "healthy";
  let primary_constraint_title = "Recovery is currently viable";
  let decision_message =
    "Current direct production pricing is sufficient to recover the full business cost burden.";
  let decision_detail =
    "Achievable revenue from direct production labour meets or exceeds required revenue.";

  if (total_recoverable_hours <= 0) {
    primary_constraint_key = "no_recoverable_base";
    primary_constraint_title = "No recoverable labour base";
    decision_message =
      "No direct production hours are available to recover business cost.";
    decision_detail =
      "Recovery analysis only uses direct production labour. If no staff are classified as direct production, the business has no recoverable labour base.";
  } else if (revenue_gap < 0 && required_average_rate_increase <= 5) {
    primary_constraint_key = "minor_gap";
    primary_constraint_title = "Minor recovery gap";
    decision_message =
      "Current production pricing is close, but not enough to recover the full business cost burden.";
    decision_detail =
      "A small lift in achievable rate, a modest increase in recoverable hours, or a small cost reduction should close the gap.";
  } else if (revenue_gap < 0 && required_average_rate_increase <= 15) {
    primary_constraint_key = "moderate_gap";
    primary_constraint_title = "Rates or utilisation are too low";
    decision_message =
      "Current direct production rates and hours are not sufficient to carry the present business burden.";
    decision_detail =
      "The business likely needs a combination of better recovery rates, more recoverable production hours, and tighter overhead control.";
  } else if (revenue_gap < 0) {
    primary_constraint_key = "heavy_cost_structure";
    primary_constraint_title = "Cost structure is too heavy";
    decision_message =
      "Current market-facing production rates are not enough to support the present cost structure.";
    decision_detail =
      "This usually indicates too much non-production burden, not enough recoverable labour base, or both.";
  }

  return {
    recoverable_rows,
    direct_production_staff_count: recoverable_rows.length,
    total_recoverable_hours,
    achievable_revenue,
    weighted_achievable_rate,
    required_revenue,
    required_recovery_rate,
    revenue_gap,
    recovery_gap,
    shortfall_amount,
    extra_hours_required_at_current_rates,
    cost_reduction_required_at_current_rates,
    required_average_rate_increase,
    primary_constraint_key,
    primary_constraint_title,
    decision_message,
    decision_detail,
  };
}