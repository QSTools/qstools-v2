"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_PROFIT_AND_LOSS_STATE,
  useProfitAndLossStorage,
} from "@/lib/storage/profitAndLossStorage";
import { useProfitAndLossProfileStorage } from "@/lib/storage/profitAndLossProfileStorage";
import { calculateProfitAndLoss } from "@/lib/calculations/profitAndLossCalculations";
import {
  buildProfitAndLossStatus,
  buildProfitAndLossCard,
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
    set_profit_and_loss_state,
    update_profit_and_loss_field,
    add_pnl_line,
    update_pnl_line,
    remove_pnl_line,
    reset_profit_and_loss_state,
  } = useProfitAndLossStorage();

  const {
    profiles,
    save_profile,
    load_profile,
    delete_profile,
  } = useProfitAndLossProfileStorage();

  const [show_saved_snapshots, set_show_saved_snapshots] = useState(false);
  const [save_message, set_save_message] = useState("");

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

    if (!financial_year) {
      set_save_message("Enter a financial year before saving.");
      return;
    }

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

    set_save_message(`Snapshot saved: ${label}`);
    set_show_saved_snapshots(true);
  }

  function handle_load(id) {
    const profile = load_profile(id);
    if (!profile) return;

    set_profit_and_loss_state(profile.state);
    set_save_message(`Loaded snapshot: ${profile.label}`);
    set_show_saved_snapshots(false);
  }

  function toggle_saved_snapshots() {
    set_show_saved_snapshots((prev) => !prev);
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
      profiles,
      show_saved_snapshots,
      save_message,
      update_profit_and_loss_field,
      add_pnl_line,
      update_pnl_line,
      remove_pnl_line,
      reset_profit_and_loss_state,
      on_save: handle_save,
      on_load: handle_load,
      on_delete: delete_profile,
      on_toggle_saved_snapshots: toggle_saved_snapshots,
    });
  }, [
    profit_and_loss_state,
    output_contract,
    profiles,
    show_saved_snapshots,
    save_message,
    update_profit_and_loss_field,
    add_pnl_line,
    update_pnl_line,
    remove_pnl_line,
    reset_profit_and_loss_state,
    delete_profile,
  ]);

  return {
    status,
    card,
    output_contract,
  };
}