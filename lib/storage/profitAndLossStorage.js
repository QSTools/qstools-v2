"use client";

import { useState } from "react";

function get_default_financial_year() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // NZ financial year: 1 Apr -> 31 Mar
  return month >= 4 ? year + 1 : year;
}

function make_pnl_line_id() {
  return `pnl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function create_pnl_line({
  line_name = "",
  amount = 0,
  section = "operating_expenses",
  category = "unassigned",
} = {}) {
  return {
    pnl_line_id: make_pnl_line_id(),
    line_name,
    amount,
    section,
    category,
  };
}

export const PNL_SECTION_OPTIONS = [
  "trading_income",
  "cost_of_sales",
  "other_income",
  "operating_expenses",
];

export const PNL_CATEGORY_OPTIONS = [
  "revenue",
  "cogs_materials",
  "cogs_subcontract",
  "cogs_hire",
  "labour",
  "employee_overheads",
  "assets",
  "general_overheads",
  "unassigned",
];

export const DEFAULT_PROFIT_AND_LOSS_STATE = {
  financial_year: get_default_financial_year(),
  period_month: "",
  pnl_lines: [
    // Trading Income
    create_pnl_line({
      line_name: "Sales",
      amount: 0,
      section: "trading_income",
      category: "revenue",
    }),

    // Cost of Sales
    create_pnl_line({
      line_name: "Materials",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs_materials",
    }),
    create_pnl_line({
      line_name: "Subcontract Labour",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs_subcontract",
    }),
    create_pnl_line({
      line_name: "Subcontract Services",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs_subcontract",
    }),
    create_pnl_line({
      line_name: "Equipment Hire",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs_hire",
    }),
    create_pnl_line({
      line_name: "Freight / Cartage",
      amount: 0,
      section: "cost_of_sales",
      category: "unassigned",
    }),
    create_pnl_line({
      line_name: "Waste Disposal",
      amount: 0,
      section: "cost_of_sales",
      category: "unassigned",
    }),
    create_pnl_line({
      line_name: "WIP Adjustment",
      amount: 0,
      section: "cost_of_sales",
      category: "unassigned",
    }),

    // Other Income
    create_pnl_line({
      line_name: "Other Income",
      amount: 0,
      section: "other_income",
      category: "unassigned",
    }),

    // Operating Expenses
    create_pnl_line({
      line_name: "ACC Levy",
      amount: 0,
      section: "operating_expenses",
      category: "employee_overheads",
    }),
    create_pnl_line({
      line_name: "Accounting Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Administration Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Advertising",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Bank Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Cleaning",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Computer Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Entertainment",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Entertainment - Non Deductible",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Insurance",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Interest Expense",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "KiwiSaver Employer Contributions",
      amount: 0,
      section: "operating_expenses",
      category: "employee_overheads",
    }),
    create_pnl_line({
      line_name: "Legal Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Licences & Registrations",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Motor Vehicle Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "Office Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Penalties & Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Printing & Stationery",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Repairs & Maintenance",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "Salary & Wages",
      amount: 0,
      section: "operating_expenses",
      category: "labour",
    }),
    create_pnl_line({
      line_name: "Staff Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "employee_overheads",
    }),
    create_pnl_line({
      line_name: "Storage Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Subscriptions",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Telephone & Internet",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Tools & Equipment",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "Travel - National",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
  ],
};

export function useProfitAndLossStorage() {
  const [profit_and_loss_state, set_profit_and_loss_state] = useState(
    DEFAULT_PROFIT_AND_LOSS_STATE,
  );

  const [is_editing, set_is_editing] = useState(true);

  function update_profit_and_loss_field(field, value) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function add_pnl_line(section = "operating_expenses") {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      pnl_lines: [
        ...(prev.pnl_lines ?? []),
        create_pnl_line({
          section,
          category:
            section === "trading_income"
              ? "revenue"
              : "unassigned",
        }),
      ],
    }));
  }

  function update_pnl_line(pnl_line_id, field, value) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      pnl_lines: (prev.pnl_lines ?? []).map((line) =>
        line.pnl_line_id === pnl_line_id
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    }));
  }

  function remove_pnl_line(pnl_line_id) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      pnl_lines: (prev.pnl_lines ?? []).filter(
        (line) => line.pnl_line_id !== pnl_line_id,
      ),
    }));
  }

  function replace_profit_and_loss_state(next_state) {
    set_profit_and_loss_state({
      ...DEFAULT_PROFIT_AND_LOSS_STATE,
      ...next_state,
      pnl_lines: Array.isArray(next_state?.pnl_lines)
        ? next_state.pnl_lines
        : DEFAULT_PROFIT_AND_LOSS_STATE.pnl_lines,
    });
  }

  function reset_profit_and_loss_state() {
    set_profit_and_loss_state(DEFAULT_PROFIT_AND_LOSS_STATE);
  }

  function toggle_edit() {
    set_is_editing((prev) => !prev);
  }

  return {
    profit_and_loss_state,
    set_profit_and_loss_state: replace_profit_and_loss_state,
    update_profit_and_loss_field,
    add_pnl_line,
    update_pnl_line,
    remove_pnl_line,
    reset_profit_and_loss_state,
    is_editing,
    toggle_edit,
  };
}