function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(to_number(value));
}

function format_percent(value) {
  return `${new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 1,
  }).format(to_number(value))}%`;
}

function get_hero_message(calculations = {}) {
  const margin_after_labour = to_number(
    calculations.stress_tested_margin_after_labour
  );
  const shortfall = Math.abs(margin_after_labour);

  if (margin_after_labour > 0) {
    return `After paying labour, your margin still leaves ${format_currency(
      margin_after_labour
    )}.`;
  }

  if (margin_after_labour === 0) {
    return "Your P&L GP is fully consumed by labour.";
  }

  return `Your P&L GP is short by ${format_currency(
    shortfall
  )} after labour is paid.`;
}

function get_labour_consumption_message(calculations = {}) {
  const labour_consumption_percent = to_number(
    calculations.labour_consumption_percent
  );

  if (labour_consumption_percent >= 100) {
    return "Labour consumes all of your GP and more. The business is short before assets and overheads are paid.";
  }

  if (labour_consumption_percent >= 80) {
    return "Labour consumes most of your GP. This leaves limited room for assets, overheads, and profit.";
  }

  return "Labour consumes part of your GP, but margin remains after labour.";
}

function build_comparison_rows(calculations = {}) {
  return [
    {
      label: "Revenue",
      value: format_currency(calculations.total_revenue),
    },
    {
      label: "COGS / Direct Costs",
      value: `-${format_currency(calculations.total_direct_costs)}`,
    },
    {
      label: "P&L GP / Material Margin",
      value: format_currency(calculations.material_margin),
      total: true,
    },
    {
      label: "Labour Cost",
      value: `-${format_currency(calculations.total_labour_cost_annual)}`,
    },
    {
      label: "Stress-tested Margin after Labour",
      value: format_currency(calculations.stress_tested_margin_after_labour),
      total: true,
    },
  ];
}

export function buildRevenueRealityStatus(calculations = {}) {
  const revenue_reality_warnings = Array.isArray(
    calculations.revenue_reality_warnings
  )
    ? calculations.revenue_reality_warnings
    : [];

  return {
    revenue_reality_ready: calculations.revenue_reality_ready === true,
    revenue_reality_status:
      calculations.revenue_reality_status ?? "no_margin_data",
    status_title:
      revenue_reality_warnings.length > 0
        ? "Revenue Reality Has Warnings"
        : "Revenue Reality Ready",
    total_revenue: to_number(calculations.total_revenue),
    total_direct_costs: to_number(calculations.total_direct_costs),
    material_margin: to_number(calculations.material_margin),
    total_labour_cost_annual: to_number(
      calculations.total_labour_cost_annual
    ),
    stress_tested_margin_after_labour: to_number(
      calculations.stress_tested_margin_after_labour
    ),
    warning_count: revenue_reality_warnings.length,
    revenue_reality_warnings,
  };
}

export function buildRevenueRealityCard(calculations = {}) {
  return {
    ...calculations,
    formatted: {
      total_revenue: format_currency(calculations.total_revenue),
      total_direct_costs: format_currency(calculations.total_direct_costs),
      material_margin: format_currency(calculations.material_margin),
      material_margin_percent: format_percent(
        calculations.material_margin_percent
      ),
      total_labour_cost_annual: format_currency(
        calculations.total_labour_cost_annual
      ),
      stress_tested_margin_after_labour: format_currency(
        calculations.stress_tested_margin_after_labour
      ),
      stress_tested_margin_percent: format_percent(
        calculations.stress_tested_margin_percent
      ),
      labour_consumption_percent: format_percent(
        calculations.labour_consumption_percent
      ),
      remaining_margin_percent: format_percent(
        calculations.remaining_margin_percent
      ),
    },
    hero_message: get_hero_message(calculations),
    labour_consumption_message: get_labour_consumption_message(calculations),
    comparison_rows: build_comparison_rows(calculations),
  };
}
