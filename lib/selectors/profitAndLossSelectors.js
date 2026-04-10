function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function format_percent(value) {
  return `${((Number(value || 0) || 0) * 100).toFixed(1)}%`;
}

function build_warnings(output_contract) {
  const warnings = [];

  if (output_contract.total_trading_income <= 0) {
    warnings.push("No trading income entered.");
  }

  if (output_contract.total_cost_of_sales <= 0) {
    warnings.push("No cost of sales entered.");
  }

  if (output_contract.net_profit < 0) {
    warnings.push("Net profit is negative.");
  }

  return warnings;
}

export function buildProfitAndLossStatus({ output_contract }) {
  const warnings = build_warnings(output_contract);

  return {
    items: [
      {
        label: "Trading Income",
        value: format_currency(output_contract.total_trading_income),
        tone: output_contract.total_trading_income > 0 ? "good" : "bad",
      },
      {
        label: "Gross Profit",
        value: format_currency(output_contract.gross_profit),
        tone: output_contract.gross_profit >= 0 ? "good" : "bad",
      },
      {
        label: "Net Profit",
        value: format_currency(output_contract.net_profit),
        tone: output_contract.net_profit > 0 ? "good" : "bad",
      },
      {
        label: "Warnings",
        value: String(warnings.length),
        tone: warnings.length > 0 ? "bad" : "good",
      },
    ],
    warnings,
  };
}

export function buildProfitAndLossCard({
  state,
  output_contract,
  update_profit_and_loss_field,
  add_pnl_line,
  update_pnl_line,
  remove_pnl_line,
  reset_profit_and_loss_state,
  on_save,
  on_toggle_edit,
  is_editing,
}) {
  return {
    state,
    output_contract,
    actions: {
      update_profit_and_loss_field,
      add_pnl_line,
      update_pnl_line,
      remove_pnl_line,
      reset_profit_and_loss_state,

      on_save,
      on_toggle_edit,
      is_editing,
    },
  };
}

export function buildProfitAndLossSummary({ output_contract }) {
  const insights = [];

  if (output_contract.gross_profit_percent < 0.15) {
    insights.push("Gross profit looks thin relative to trading income.");
  }

  if (output_contract.net_profit < 0) {
    insights.push("The business made a net loss for the year.");
  }

  if (output_contract.net_profit > 0) {
    insights.push("This page shows what actually happened in the business.");
  }

  return {
    headline: [
      {
        label: "Total Trading Income",
        value: format_currency(output_contract.total_trading_income),
      },
      {
        label: "Gross Profit",
        value: format_currency(output_contract.gross_profit),
      },
      {
        label: "Net Profit",
        value: format_currency(output_contract.net_profit),
      },
    ],
    secondary: [
      {
        label: "Gross Profit %",
        value: format_percent(output_contract.gross_profit_percent),
      },
      {
        label: "Net Profit %",
        value: format_percent(output_contract.net_profit_percent),
      },
      {
        label: "Operating Expenses",
        value: format_currency(output_contract.total_operating_expenses),
      },
    ],
    insights,
  };
}