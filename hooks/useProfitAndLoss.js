"use client";

import { useMemo } from "react";
import {
  DEFAULT_PROFIT_AND_LOSS_STATE,
  useProfitAndLossStorage,
} from "@/lib/storage/profitAndLossStorage";
import { useProfitAndLossProfileStorage } from "@/lib/storage/profitAndLossProfileStorage";
import { calculateProfitAndLoss } from "@/lib/calculations/profitAndLossCalculations";
import {
  buildProfitAndLossStatus,
  buildProfitAndLossCard,
  buildProfitAndLossSummary,
} from "@/lib/selectors/profitAndLossSelectors";

function get_month_name(month) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[month - 1] ?? "";
}

export default function useProfitAndLoss() {
  const {
    profit_and_loss_state,
    update_profit_and_loss_field,
    add_pnl_line,
    update_pnl_line,
    remove_pnl_line,
    reset_profit_and_loss_state,
    is_editing,
    toggle_edit,
  } = useProfitAndLossStorage();

  const {
    profiles,
    save_profile,
    load_profile,
    delete_profile,
  } = useProfitAndLossProfileStorage();

  const output_contract = useMemo(() => {
    return calculateProfitAndLoss(
      profit_and_loss_state ?? DEFAULT_PROFIT_AND_LOSS_STATE,
    );
  }, [profit_and_loss_state]);

  function handle_save() {
    const financial_year = Number(profit_and_loss_state.financial_year) || null;
    const period_month = profit_and_loss_state.period_month
      ? Number(profit_and_loss_state.period_month)
      : null;

    if (!financial_year) return;

    const label = period_month
      ? `${get_month_name(period_month)} FY${financial_year}`
      : `FY ${financial_year}`;

    save_profile({
      label,
      financial_year,
      month: period_month,
      type: period_month ? "monthly" : "annual",
      state: profit_and_loss_state,
    });
  }

  function handle_load(id) {
    const profile = load_profile(id);
    if (!profile) return;

    Object.entries(profile.state).forEach(([key, value]) => {
      update_profit_and_loss_field(key, value);
    });
  }

  const status = useMemo(() => {
    return buildProfitAndLossStatus({
      state: profit_and_loss_state,
      output_contract,
    });
  }, [profit_and_loss_state, output_contract]);

  const card = useMemo(() => {
    return buildProfitAndLossCard({
      state: profit_and_loss_state,
      output_contract,
      update_profit_and_loss_field,
      add_pnl_line,
      update_pnl_line,
      remove_pnl_line,
      reset_profit_and_loss_state,
      on_save: handle_save,
      on_toggle_edit: toggle_edit,
      is_editing,
    });
  }, [
    profit_and_loss_state,
    output_contract,
    update_profit_and_loss_field,
    add_pnl_line,
    update_pnl_line,
    remove_pnl_line,
    reset_profit_and_loss_state,
    is_editing,
  ]);

  const summary = useMemo(() => {
    return buildProfitAndLossSummary({
      state: profit_and_loss_state,
      output_contract,
    });
  }, [profit_and_loss_state, output_contract]);

  return {
    status,
    card,
    summary,
    output_contract,
    profiles,
    on_load: handle_load,
    on_delete: delete_profile,
  };
}