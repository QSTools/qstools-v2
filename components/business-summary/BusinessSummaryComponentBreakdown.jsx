"use client";

import {
  format_currency,
  format_number,
} from "@/components/business-summary/businessSummaryFormatters";

function sum_rows(rows = [], field = "") {
  return rows.reduce((total, row) => total + Number(row?.[field] ?? 0), 0);
}

function GroupHeader({ title, count, total }) {
  return (
    <div className="recovery-summary-interactive recovery-summary-row is-active">
      <div className="recovery-summary-row-label">{title}</div>
      <div className="recovery-summary-row-value">
        {format_currency(total)} - {count} item{count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function EmptyGroupNotice({ message }) {
  return (
    <div className="ui-readonly">
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {message}
      </p>
    </div>
  );
}

function StaffRow({ staff, index }) {
  return (
    <div
      key={`${staff.profile_id || staff.staff_id || staff.staff_name || "staff"}-${index}`}
      className="labour-summary-table-row"
    >
      <div className="labour-summary-table-label">
        {staff.staff_name || "Unnamed staff"}
      </div>
      <div className="labour-summary-table-value">
        {format_currency(staff.total_labour_cost_annual)}
      </div>
    </div>
  );
}

function AssetRow({ asset, index }) {
  return (
    <div
      key={`${asset.asset_id || asset.asset_name || "asset"}-${index}`}
      className="labour-summary-table-row"
    >
      <div className="labour-summary-table-label">
        {asset.asset_name || "Unnamed asset"}
      </div>
      <div className="labour-summary-table-value">
        {format_currency(
          asset.asset_interest_annual ??
            asset.finance_cost_annual ??
            asset.total_asset_cost_annual
        )}
      </div>
    </div>
  );
}

export default function BusinessSummaryComponentBreakdown({
  active_component,
  values,
}) {
  const breakdown = values.cost_burden_breakdown ?? {};
  const people = breakdown.people ?? {};
  const assets = breakdown.assets ?? {};
  const overheads = breakdown.business_overheads ?? {};

  const active_staff = Array.isArray(people.active_staff)
    ? people.active_staff
    : [];
  const active_assets = Array.isArray(assets.active_assets)
    ? assets.active_assets
    : [];
  const category_totals = Array.isArray(overheads.category_totals)
    ? overheads.category_totals
    : [];

  if (!active_component) {
    return null;
  }

  if (active_component === "people_cost") {
    const productive_staff = active_staff.filter(
      (staff) => staff.contributes_to_recovery_hours !== false
    );
    const non_productive_staff = active_staff.filter(
      (staff) => staff.contributes_to_recovery_hours === false
    );
    const productive_staff_cost = sum_rows(
      productive_staff,
      "total_labour_cost_annual"
    );
    const non_productive_staff_cost = sum_rows(
      non_productive_staff,
      "total_labour_cost_annual"
    );
    const people_cost_total =
      people.total_people_cost_annual ??
      values.total_people_cost_annual ??
      0;

    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">People Cost source</p>
          <p className="ui-help">
            These values come from Labour and Cost Summary. The productive and
            non-productive groups use the existing staff recovery classification
            exposed upstream.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Productive staff cost
              </div>
              <div className="labour-summary-table-value">
                {format_currency(productive_staff_cost)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Non-productive staff cost
              </div>
              <div className="labour-summary-table-value">
                {format_currency(non_productive_staff_cost)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Recovery Hours</div>
              <div className="labour-summary-table-value">
                {format_number(people.total_recovery_hours)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Productive Output
              </div>
              <div className="labour-summary-table-value">
                {format_number(people.total_productive_output)}
              </div>
            </div>
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">People Cost</div>
              <div className="labour-summary-table-value">
                {format_currency(people_cost_total)}
              </div>
            </div>
          </div>

          {active_staff.length > 0 ? (
            <div className="ui-stack">
              <div className="ui-stack-sm">
                <GroupHeader
                  title="Productive staff"
                  count={productive_staff.length}
                  total={productive_staff_cost}
                />
                {productive_staff.length > 0 ? (
                  productive_staff.map((staff, index) => (
                    <StaffRow
                      key={`${staff.profile_id || staff.staff_id || staff.staff_name || "productive-staff"}-${index}`}
                      staff={staff}
                      index={index}
                    />
                  ))
                ) : (
                  <EmptyGroupNotice message="No productive staff are exposed in this source breakdown." />
                )}
              </div>

              <div className="ui-stack-sm">
                <GroupHeader
                  title="Non-productive staff"
                  count={non_productive_staff.length}
                  total={non_productive_staff_cost}
                />
                {non_productive_staff.length > 0 ? (
                  non_productive_staff.map((staff, index) => (
                    <StaffRow
                      key={`${staff.profile_id || staff.staff_id || staff.staff_name || "non-productive-staff"}-${index}`}
                      staff={staff}
                      index={index}
                    />
                  ))
                ) : (
                  <EmptyGroupNotice message="No non-productive staff are exposed in this source breakdown." />
                )}
              </div>
            </div>
          ) : (
            <p className="ui-help">
              Active staff source rows are not exposed to Business Summary yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (active_component === "asset_cost") {
    const productive_assets = active_assets.filter(
      (asset) => asset.asset_type === "productive"
    );
    const support_assets = active_assets.filter(
      (asset) => asset.asset_type !== "productive"
    );
    const productive_asset_cost = sum_rows(
      productive_assets,
      "total_asset_cost_annual"
    );
    const support_asset_cost = sum_rows(
      support_assets,
      "total_asset_cost_annual"
    );
    const asset_cost_total =
      assets.total_asset_cost_annual ?? values.total_asset_cost_annual ?? 0;

    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Asset Cost source</p>
          <p className="ui-help">
            Asset Cost comes from Assets. Principal repayments are not included
            in the operating cost burden because principal belongs to the
            balance sheet / cash-flow layer, not Cost Summary.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Asset Interest / Finance Cost
              </div>
              <div className="labour-summary-table-value">
                {format_currency(
                  assets.total_asset_interest_annual ??
                    assets.finance_cost_annual
                )}
              </div>
            </div>
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">
                Total Asset Cost
              </div>
              <div className="labour-summary-table-value">
                {format_currency(asset_cost_total)}
              </div>
            </div>
          </div>

          {active_assets.length > 0 ? (
            <div className="ui-stack">
              <div className="ui-stack-sm">
                <GroupHeader
                  title="Productive assets"
                  count={productive_assets.length}
                  total={productive_asset_cost}
                />
                {productive_assets.length > 0 ? (
                  productive_assets.map((asset, index) => (
                    <AssetRow
                      key={`${asset.asset_id || asset.asset_name || "productive-asset"}-${index}`}
                      asset={asset}
                      index={index}
                    />
                  ))
                ) : (
                  <EmptyGroupNotice message="No productive assets are exposed in this source breakdown." />
                )}
              </div>

              <div className="ui-stack-sm">
                <GroupHeader
                  title="Support assets"
                  count={support_assets.length}
                  total={support_asset_cost}
                />
                {support_assets.length > 0 ? (
                  support_assets.map((asset, index) => (
                    <AssetRow
                      key={`${asset.asset_id || asset.asset_name || "support-asset"}-${index}`}
                      asset={asset}
                      index={index}
                    />
                  ))
                ) : (
                  <EmptyGroupNotice message="No support assets are exposed in this source breakdown." />
                )}
              </div>
            </div>
          ) : (
            <p className="ui-help">
              Active asset source rows are not exposed to Business Summary yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (active_component === "business_overheads") {
    const business_overheads_total =
      overheads.total_business_overheads ??
      values.total_business_overheads ??
      0;

    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Business Overheads source</p>
          <p className="ui-help">
            These category totals come from General Overheads. Review General
            Overheads for individual source rows.
          </p>

          <div className="labour-summary-table">
            {category_totals.length > 0 ? (
              category_totals.map((category, index) => (
                <div
                  key={`${category.category_id || category.category_name || "overhead"}-${index}`}
                  className="labour-summary-table-row"
                >
                  <div className="labour-summary-table-label">
                    {category.category_label ||
                      category.category_name ||
                      category.category_id ||
                      "Overhead category"}
                  </div>
                  <div className="labour-summary-table-value">
                    {format_currency(category.total ?? category.amount ?? 0)}
                  </div>
                </div>
              ))
            ) : (
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Category totals not exposed
                </div>
                <div className="labour-summary-table-value">$0.00</div>
              </div>
            )}

            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">
                Business Overheads
              </div>
              <div className="labour-summary-table-value">
                {format_currency(business_overheads_total)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
