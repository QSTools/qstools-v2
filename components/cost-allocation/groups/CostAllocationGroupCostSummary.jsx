"use client";

import { formatMoney } from "./costAllocationGroupHelpers";

export default function CostAllocationGroupCostSummary({ group_cost_row }) {
  return (
    <div className="ui-readonly cost-allocation-group-summary">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Group cost summary
          </p>
          <p className="ui-help">
            This is the cost currently assigned into this operating group.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Productive labour</div>
              <div className="ui-help">
                Assigned productive labour group cost.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.assigned_labour_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Assets</div>
              <div className="ui-help">Assigned productive asset burden.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.assigned_asset_burden)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Overhead</div>
              <div className="ui-help">Automatic overhead distribution.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.assigned_overhead_amount)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              <div>Total group cost</div>
              <div className="ui-help">
                Productive labour + assets + overhead.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.total_group_cost)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}