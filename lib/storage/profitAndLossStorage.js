"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_DIRECT_COST_CATEGORIES,
  DEFAULT_PROFIT_AND_LOSS_STATE,
  PNL_CATEGORY_OPTIONS,
  PNL_SECTION_OPTIONS,
  createDirectCostCategory,
  create_pnl_line,
} from "@/lib/storage/profit-and-loss/profitAndLossDefaults";
import {
  normalize_direct_cost_categories,
  sanitize_profit_and_loss_state,
} from "@/lib/storage/profit-and-loss/profitAndLossSanitizers";

export {
  DEFAULT_DIRECT_COST_CATEGORIES,
  DEFAULT_PROFIT_AND_LOSS_STATE,
  PNL_CATEGORY_OPTIONS,
  PNL_SECTION_OPTIONS,
  createDirectCostCategory,
};

const PROFIT_AND_LOSS_STATE_STORAGE_KEY = "qs_tools_profit_and_loss_state";

function read_stored_profit_and_loss_state() {
  if (typeof window === "undefined") {
    return DEFAULT_PROFIT_AND_LOSS_STATE;
  }

  try {
    const raw = window.localStorage.getItem(PROFIT_AND_LOSS_STATE_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_PROFIT_AND_LOSS_STATE;
    }

    return sanitize_profit_and_loss_state(JSON.parse(raw));
  } catch {
    return DEFAULT_PROFIT_AND_LOSS_STATE;
  }
}

export function useProfitAndLossStorage() {
  const [profit_and_loss_state, set_profit_and_loss_state] = useState(
    DEFAULT_PROFIT_AND_LOSS_STATE,
  );
  const [is_editing, set_is_editing] = useState(true);
  const [has_hydrated, set_has_hydrated] = useState(false);

  useEffect(() => {
    const stored_state = read_stored_profit_and_loss_state();
    set_profit_and_loss_state(stored_state);
    set_has_hydrated(true);
  }, []);

  useEffect(() => {
    if (!has_hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      PROFIT_AND_LOSS_STATE_STORAGE_KEY,
      JSON.stringify(profit_and_loss_state),
    );
  }, [profit_and_loss_state, has_hydrated]);

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
          category: section === "trading_income" ? "revenue" : "unassigned",
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

  function add_direct_cost_category(category_name) {
    const clean_name = String(category_name || "").trim();
    if (!clean_name) return null;

    const category = createDirectCostCategory(clean_name);

    set_profit_and_loss_state((prev) => ({
      ...prev,
      direct_cost_categories: normalize_direct_cost_categories([
        ...(prev.direct_cost_categories ?? []),
        category,
      ]),
    }));

    return category;
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
    set_profit_and_loss_state(sanitize_profit_and_loss_state(next_state));
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
    add_direct_cost_category,
    remove_pnl_line,
    reset_profit_and_loss_state,
    is_editing,
    toggle_edit,
  };
}
