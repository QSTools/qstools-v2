// New Zealand statutory rest and meal break entitlements.
// Source: Employment Relations Act 2000, ss 69ZD-69ZE (restored 6 May 2019
// by the Employment Relations Amendment Act 2018). Verified against
// legislation.govt.nz, 2026-09-22.
// Rest breaks: paid, 10 minutes each. Meal breaks: unpaid, 30 minutes each.
// Entitlement scales with work-period length and recurs for any period
// beyond 8 hours (a "subsequent period" gets the same table applied again).

function get_nz_break_entitlement_for_period(period_hours) {
  if (period_hours < 2) {
    return { paid_rest_minutes: 0, unpaid_meal_minutes: 0 };
  }
  if (period_hours <= 4) {
    return { paid_rest_minutes: 10, unpaid_meal_minutes: 0 };
  }
  if (period_hours <= 6) {
    return { paid_rest_minutes: 10, unpaid_meal_minutes: 30 };
  }
  return { paid_rest_minutes: 20, unpaid_meal_minutes: 30 };
}

export function get_nz_break_entitlement(work_period_hours = 0) {
  const hours = Number(work_period_hours) || 0;
  if (hours <= 0) {
    return { paid_rest_minutes: 0, unpaid_meal_minutes: 0 };
  }

  const first_period = Math.min(hours, 8);
  const entitlement = get_nz_break_entitlement_for_period(first_period);

  if (hours > 8) {
    const subsequent = get_nz_break_entitlement(hours - 8);
    return {
      paid_rest_minutes:
        entitlement.paid_rest_minutes + subsequent.paid_rest_minutes,
      unpaid_meal_minutes:
        entitlement.unpaid_meal_minutes + subsequent.unpaid_meal_minutes,
    };
  }

  return entitlement;
}