function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function formatHours(value) {
  return `${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })} hrs`;
}

export function buildRecoveryAnalysisCard({ recovery_analysis }) {
  return {
    primary_constraint_title: recovery_analysis.primary_constraint_title,
    decision_message: recovery_analysis.decision_message,
    decision_detail: recovery_analysis.decision_detail,

    direct_production_staff_count:
      recovery_analysis.direct_production_staff_count,
    direct_production_staff_count_display: String(
      recovery_analysis.direct_production_staff_count || 0
    ),

    total_recoverable_hours: recovery_analysis.total_recoverable_hours,
    total_recoverable_hours_display: formatHours(
      recovery_analysis.total_recoverable_hours
    ),

    achievable_revenue: recovery_analysis.achievable_revenue,
    achievable_revenue_display: formatMoney(recovery_analysis.achievable_revenue),

    required_revenue: recovery_analysis.required_revenue,
    required_revenue_display: formatMoney(recovery_analysis.required_revenue),

    revenue_gap: recovery_analysis.revenue_gap,
    revenue_gap_display: formatMoney(recovery_analysis.revenue_gap),

    weighted_achievable_rate: recovery_analysis.weighted_achievable_rate,
    weighted_achievable_rate_display: formatMoney(
      recovery_analysis.weighted_achievable_rate
    ),

    required_recovery_rate: recovery_analysis.required_recovery_rate,
    required_recovery_rate_display: formatMoney(
      recovery_analysis.required_recovery_rate
    ),

    recovery_gap: recovery_analysis.recovery_gap,
    recovery_gap_display: formatMoney(recovery_analysis.recovery_gap),

    shortfall_amount: recovery_analysis.shortfall_amount,
    shortfall_amount_display: formatMoney(recovery_analysis.shortfall_amount),

    extra_hours_required_at_current_rates:
      recovery_analysis.extra_hours_required_at_current_rates,
    extra_hours_required_at_current_rates_display: formatHours(
      recovery_analysis.extra_hours_required_at_current_rates
    ),

    cost_reduction_required_at_current_rates:
      recovery_analysis.cost_reduction_required_at_current_rates,
    cost_reduction_required_at_current_rates_display: formatMoney(
      recovery_analysis.cost_reduction_required_at_current_rates
    ),

    required_average_rate_increase:
      recovery_analysis.required_average_rate_increase,
    required_average_rate_increase_display: formatMoney(
      recovery_analysis.required_average_rate_increase
    ),

    recoverable_rows: (recovery_analysis.recoverable_rows ?? []).map((row) => ({
      ...row,
      productive_hours_display: formatHours(row.productive_hours),
      charge_out_rate_display: formatMoney(row.charge_out_rate),
      achievable_revenue_display: formatMoney(row.achievable_revenue),
    })),
  };
}