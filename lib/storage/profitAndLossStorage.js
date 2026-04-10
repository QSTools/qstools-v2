"use client";

import { useState } from "react";

function get_default_financial_year() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // NZ FY: 1 Apr -> 31 Mar
  return month >= 4 ? year + 1 : year;
}

export const DEFAULT_PROFIT_AND_LOSS_STATE = {
  financial_year: get_default_financial_year(),
  period_month: "",

  sales: 0,
  other_trading_income: 0,

  materials: 0,
  staff_labour: 0,
  subcontract_labour: 0,
  subcontract_services: 0,
  equipment_hire: 0,
  freight_cartage: 0,
  waste_disposal: 0,
  wip_adjustment: 0,
  other_job_costs: 0,

  other_income: 0,

  acc_levy: 0,
  accounting_fees: 0,
  administration_fees: 0,
  advertising: 0,
  bank_fees: 0,
  cleaning: 0,
  computer_expenses: 0,
  entertainment: 0,
  entertainment_non_deductible: 0,
  insurance: 0,
  interest_expense: 0,
  kiwisaver_employer_contributions: 0,
  legal_expenses: 0,
  licences_registrations: 0,
  motor_vehicle_expenses: 0,
  office_expenses: 0,
  penalties_fees: 0,
  printing_stationery: 0,
  repairs_maintenance: 0,
  salary_wages: 0,
  staff_expenses: 0,
  storage_fees: 0,
  subscriptions: 0,
  telephone_internet: 0,
  tools_equipment: 0,
  travel_national: 0,

  labour_revenue: 0,
  charge_out_rate: 0,

  custom_trading_income_lines: [],
  custom_cost_of_sales_lines: [],
  custom_other_income_lines: [],
  custom_operating_expense_lines: [],
};

function make_line_id(prefix = "pnl") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function create_line() {
  return {
    line_id: make_line_id(),
    name: "",
    value: 0,
    is_active: true,
  };
}

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

  function add_pnl_line(section_key) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      [section_key]: [...(prev[section_key] ?? []), create_line()],
    }));
  }

  function update_pnl_line(section_key, line_id, field, value) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      [section_key]: (prev[section_key] ?? []).map((line) =>
        line.line_id === line_id
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    }));
  }

  function remove_pnl_line(section_key, line_id) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      [section_key]: (prev[section_key] ?? []).filter(
        (line) => line.line_id !== line_id,
      ),
    }));
  }

  function reset_profit_and_loss_state() {
    set_profit_and_loss_state(DEFAULT_PROFIT_AND_LOSS_STATE);
  }

  function toggle_edit() {
    set_is_editing((prev) => !prev);
  }

  return {
    profit_and_loss_state,
    set_profit_and_loss_state,
    update_profit_and_loss_field,
    add_pnl_line,
    update_pnl_line,
    remove_pnl_line,
    reset_profit_and_loss_state,
    is_editing,
    toggle_edit,
  };
}