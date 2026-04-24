import { format_number } from "@/lib/formatters/numberFormatters";

function build_warnings(output_contract) {
  const warnings = [];

  if (output_contract.total_trading_income <= 0) {
    warnings.push("No trading income has been entered yet.");
  }

  if (output_contract.total_cost_of_sales <= 0) {
    warnings.push("No cost of sales has been entered yet.");
  }

  if (output_contract.unassigned_balance > 0) {
    warnings.push("Some business costs are still unassigned.");
  }

  if (output_contract.gross_profit < 0) {
    warnings.push("Gross profit is negative.");
  }

  return warnings;
}

function build_category_options() {
  return [
    { value: "revenue", label: "Revenue" },
    { value: "cogs_materials", label: "COGS - Materials" },
    { value: "cogs_subcontract", label: "COGS - Subcontract" },
    { value: "cogs_hire", label: "COGS - Hire" },
    { value: "labour", label: "Labour" },
    { value: "employee_overheads", label: "Employee Overheads" },
    { value: "assets", label: "Assets" },
    { value: "general_overheads", label: "General Overheads" },
    { value: "unassigned", label: "Unassigned" },
  ];
}

function build_reconciliation(output_contract) {
  const total_pnl_costs = Number(output_contract.total_business_costs || 0);
  const total_model_costs = Number(output_contract.model_total_costs || 0);
  const variance = total_pnl_costs - total_model_costs;
  const is_reconciled = Math.abs(variance) < 1;

  return {
    total_pnl_costs: format_number(total_pnl_costs),
    total_model_costs: format_number(total_model_costs),
    variance: format_number(variance),
    is_reconciled,
    status_label: is_reconciled ? "Reconciled" : "Not Reconciled",
  };
}

export function buildProfitAndLossStatus({ output_contract }) {
  const warnings = build_warnings(output_contract);
  const reconciliation = build_reconciliation(output_contract);

  return {
    items: [
      {
        label: "Trading Income",
        value: format_number(output_contract.total_trading_income),
        tone: output_contract.total_trading_income > 0 ? "good" : "bad",
      },
      {
        label: "Cost of Sales",
        value: format_number(output_contract.total_cost_of_sales),
        tone: output_contract.total_cost_of_sales > 0 ? "warn" : "bad",
      },
      {
        label: "Gross Profit",
        value: format_number(output_contract.gross_profit),
        tone: output_contract.gross_profit >= 0 ? "good" : "bad",
      },
      {
        label: "Operating Expenses",
        value: format_number(output_contract.total_operating_expenses),
        tone: output_contract.total_operating_expenses > 0 ? "warn" : "good",
      },
      {
        label: "Net Profit",
        value: format_number(output_contract.net_profit),
        tone: output_contract.net_profit >= 0 ? "good" : "bad",
      },
    ],
    warnings,
    reconciliation,
  };
}

export function buildProfitAndLossCard({
  state,
  output_contract,
  profiles = [],
  show_saved_snapshots = false,
  save_message = "",
  update_profit_and_loss_field,
  add_pnl_line,
  update_pnl_line,
  remove_pnl_line,
  reset_profit_and_loss_state,
  on_save,
  on_load,
  on_delete,
  on_toggle_saved_snapshots,
}) {
  const reconciliation = build_reconciliation(output_contract);
  const warnings = build_warnings(output_contract);

  return {
    state,
    category_options: build_category_options(),
    reconciliation,
    warnings,
    profiles,
    show_saved_snapshots,
    save_message,

    summary: {
      total_trading_income: format_number(output_contract.total_trading_income),
      total_cost_of_sales: format_number(output_contract.total_cost_of_sales),
      total_other_income: format_number(output_contract.total_other_income),
      total_operating_expenses: format_number(
        output_contract.total_operating_expenses,
      ),

      gross_profit: format_number(output_contract.gross_profit),
      net_profit: format_number(output_contract.net_profit),

      total_revenue: format_number(output_contract.total_revenue),
      materials_cost: format_number(output_contract.materials_cost),
      subcontract_cost: format_number(output_contract.subcontract_cost),
      hired_equipment_cost: format_number(output_contract.hired_equipment_cost),
      total_cogs: format_number(output_contract.total_cogs),

      labour_benchmark_total: format_number(
        output_contract.labour_benchmark_total,
      ),
      employee_overheads_benchmark_total: format_number(
        output_contract.employee_overheads_benchmark_total,
      ),
      assets_benchmark_total: format_number(
        output_contract.assets_benchmark_total,
      ),
      general_overheads_benchmark_total: format_number(
        output_contract.general_overheads_benchmark_total,
      ),

      total_business_costs: format_number(output_contract.total_business_costs),
      total_assigned_business_costs: format_number(
        output_contract.total_assigned_business_costs,
      ),
      unassigned_balance: format_number(output_contract.unassigned_balance),
      pnl_ready: output_contract.pnl_ready ? "Ready" : "Not Ready",
    },

    actions: {
      update_profit_and_loss_field,
      add_pnl_line,
      update_pnl_line,
      remove_pnl_line,
      reset_profit_and_loss_state,
      on_save,
      on_load,
      on_delete,
      on_toggle_saved_snapshots,
    },
  };
}