"use client";

import { useState } from "react";

function make_custom_direct_cost_category_id(name = "") {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `custom_${slug || Date.now()}`;
}

export default function ProfitAndLossCustomDirectCostCategoryPanel({
  state,
  actions,
}) {
  const [custom_direct_cost_category_name, set_custom_direct_cost_category_name] =
    useState("");

  return (
    <div className="ui-panel ui-stack-sm">
      <span className="ui-label">Add a Cost of Sales category</span>
      <p className="ui-help">
        Add a business-specific Cost of Sales category, such as stock purchases,
        product packaging, merchant fees, fulfilment costs, or production
        supplies.
      </p>

      <div className="ui-actions">
        <input
          className="ui-input"
          value={custom_direct_cost_category_name}
          placeholder="Example: Traffic management"
          onChange={(event) =>
            set_custom_direct_cost_category_name(event.target.value)
          }
        />

        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => {
            const category_name = custom_direct_cost_category_name.trim();
            if (!category_name) return;

            const now = new Date().toISOString();
            const category = {
              category_id: make_custom_direct_cost_category_id(category_name),
              category_name,
              is_default: false,
              is_active: true,
              created_at: now,
              updated_at: now,
            };

            actions.update_profit_and_loss_field("direct_cost_categories", [
              ...(state.direct_cost_categories ?? []),
              category,
            ]);

            set_custom_direct_cost_category_name("");
          }}
        >
          Add Category
        </button>
      </div>
    </div>
  );
}
