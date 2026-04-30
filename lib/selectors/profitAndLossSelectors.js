import { format_number } from "@/lib/formatters/numberFormatters";

function build_warnings(output_contract) {
  const warnings = [];

  if (output_contract.total_trading_income <= 0) {
    warnings.push("No trading income has been entered yet.");
  }

  if (output_contract.total_cost_of_sales <= 0) {
    warnings.push("No cost of sales has been entered yet.");
  }

  if (output_contract.gross_profit < 0) {
    warnings.push("Gross profit is negative.");
  }

  if (output_contract.pnl_interest_marked_asset_finance_total > 0) {
    warnings.push(
      "Some P&L interest is marked as containing asset finance interest for later comparison with Assets finance cost.",
    );
  }

  if (output_contract.unreviewed_interest_count > 0) {
    warnings.push(
      "Review interest lines and confirm whether they contain asset finance interest before trusting P&L readiness.",
    );
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
    { value: "assets", label: "Assets" },
    { value: "general_overheads", label: "General Overheads" },
    { value: "excluded", label: "Excluded" },
    { value: "unassigned", label: "Unassigned" },
  ];
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

function build_unassigned_details(state) {
  const unassigned_lines = state.pnl_lines.filter(
    (line) =>
      line.category === "unassigned" || line.category === "review_required",
  );

  const accounting_adjustments = [];
  const unassigned_operating_expenses = [];
  const other_unassigned_lines = [];

  unassigned_lines.forEach(line => {
    const formatted_line = {
      section: line.section,
      line_name: line.line_name,
      amount: format_number(line.amount),
      current_category:
        line.category === "review_required" ? "Review Required" : "Unassigned",
      suggested_action: "",
    };

    if (is_wip_line(line.line_name) || line.line_name.toLowerCase().includes('adjustment')) {
      formatted_line.suggested_action = "Review source detail before assigning to the cost model.";
      accounting_adjustments.push(formatted_line);
    } else if (line.section === 'operating_expenses') {
      formatted_line.suggested_action = "Assign to a General Overheads review category.";
      unassigned_operating_expenses.push(formatted_line);
    } else {
      if (line.section === 'cost_of_sales') {
        formatted_line.suggested_action = "Assign to a COGS category or mark review required.";
      } else if (line.section === 'other_income' || line.section === 'trading_income') {
        formatted_line.suggested_action = "Review whether this should affect the QS cost model.";
      } else {
        formatted_line.suggested_action = "Review and assign to appropriate category.";
      }
      other_unassigned_lines.push(formatted_line);
    }
  });

  return {
    accounting_adjustments,
    unassigned_operating_expenses,
    other_unassigned_lines,
  };
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
  const unassigned_details = build_unassigned_details(state);

  return {
    state,
    category_options: build_category_options(),
    reconciliation,
    warnings,
    unassigned_details,
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
      pnl_interest_total: format_number(output_contract.pnl_interest_total),
      pnl_interest_marked_asset_finance_total: format_number(
        output_contract.pnl_interest_marked_asset_finance_total,
      ),
      excluded_asset_finance_interest_total: format_number(
        output_contract.excluded_asset_finance_interest_total,
      ),
      unreviewed_interest_count: output_contract.unreviewed_interest_count ?? 0,
      unreviewed_interest_total: format_number(
        output_contract.unreviewed_interest_total,
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
