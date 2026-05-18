"use client";

import {
  format_currency,
  format_number,
} from "@/components/recovery-summary/recoverySummaryFormatters";

function get_category_label(category = {}) {
  return (
    category.category_label ||
    category.category_name ||
    category.label ||
    category.name ||
    category.category_key ||
    "Overhead category"
  );
}

function get_category_amount(category = {}) {
  return (
    category.total ??
    category.amount ??
    category.category_total ??
    category.value ??
    0
  );
}

function get_staff_cost(staff = {}) {
  return (
    staff.total_labour_cost_annual ??
    staff.total_people_cost_annual ??
    staff.annual_cost ??
    0
  );
}

function get_staff_key(staff = {}, index) {
  return `${staff.profile_id || staff.staff_id || staff.staff_name || "staff-row"}-${index}`;
}

function get_asset_key(asset = {}, index, suffix = "") {
  return `${asset.asset_id || asset.asset_name || "asset-row"}${suffix}-${index}`;
}

function GroupHeader({ title, count, total }) {
  return (
    <div className="recovery-summary-interactive recovery-summary-row is-active">
      <div className="recovery-summary-row-label">{title}</div>

      <div className="recovery-summary-row-value">
        {format_currency(total)} · {count} item{count === 1 ? "" : "s"}
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

function StaffRows({ title, staff_rows = [], empty_message }) {
  const group_total = staff_rows.reduce(
    (sum, staff) => sum + Number(get_staff_cost(staff) ?? 0),
    0
  );

  return (
    <div className="ui-stack-sm">
      <GroupHeader
        title={title}
        count={staff_rows.length}
        total={group_total}
      />

      {staff_rows.length > 0 ? (
        staff_rows.map((staff, index) => (
          <div
            key={get_staff_key(staff, index)}
            className="labour-summary-table-row"
          >
            <div className="labour-summary-table-label">
              {staff.staff_name || "Unnamed staff"}
            </div>

            <div className="labour-summary-table-value">
              {format_currency(get_staff_cost(staff))}
            </div>
          </div>
        ))
      ) : (
        <EmptyGroupNotice message={empty_message} />
      )}
    </div>
  );
}

function AssetRows({ title, asset_rows = [], empty_message }) {
  const group_total = asset_rows.reduce(
    (sum, asset) => sum + Number(asset.asset_interest_annual ?? 0),
    0
  );

  return (
    <div className="ui-stack-sm">
      <GroupHeader
        title={title}
        count={asset_rows.length}
        total={group_total}
      />

      {asset_rows.length > 0 ? (
        asset_rows.map((asset, index) => (
          <div
            key={get_asset_key(asset, index, "interest")}
            className="labour-summary-table-row"
          >
            <div className="labour-summary-table-label">
              {asset.asset_name || "Unnamed asset"}
            </div>

            <div className="labour-summary-table-value">
              {format_currency(asset.asset_interest_annual)}
            </div>
          </div>
        ))
      ) : (
        <EmptyGroupNotice message={empty_message} />
      )}
    </div>
  );
}

export default function RecoverySummaryComponentBreakdown({
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

  const productive_staff = active_staff.filter(
    (staff) => staff.contributes_to_recovery_hours !== false
  );

  const non_productive_staff = active_staff.filter(
    (staff) => staff.contributes_to_recovery_hours === false
  );

  const active_assets = Array.isArray(assets.active_assets)
    ? assets.active_assets
    : [];

  const productive_assets = active_assets.filter(
    (asset) => asset.asset_type === "productive"
  );

  const support_assets = active_assets.filter(
    (asset) => asset.asset_type !== "productive"
  );

  const category_totals = Array.isArray(overheads.category_totals)
    ? overheads.category_totals
    : [];

  if (!active_component) {
    return null;
  }

  if (active_component === "people_cost") {
    const people_cost_total =
      people.total_people_cost_annual ??
      values.total_people_cost_annual ??
      0;

    const labour_cost_total =
      people.total_labour_cost_annual ?? people_cost_total;

    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">People Cost breakdown</p>

          <p className="ui-help">
            People Cost comes from Cost Summary. Productive and non-productive
            staff are displayed using the Labour source classification already
            exposed upstream.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Total Labour Cost
              </div>
              <div className="labour-summary-table-value">
                {format_currency(labour_cost_total)}
              </div>
            </div>

            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Available Hours Before Productivity
              </div>
              <div className="labour-summary-table-value">
                {format_number(
                  people.total_available_hours_before_productivity
                )}
              </div>
            </div>

            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Weighted Productivity
              </div>
              <div className="labour-summary-table-value">
                {format_number(people.weighted_productivity_percent, "%")}
              </div>
            </div>

            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Recovery Hours
              </div>
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
            <div className="ui-stack-sm">
              <StaffRows
                title="Productive staff"
                staff_rows={productive_staff}
                empty_message="No productive staff are exposed in this source set."
              />

              <StaffRows
                title="Non-productive staff"
                staff_rows={non_productive_staff}
                empty_message="No non-productive staff are exposed in this source set."
              />
            </div>
          ) : (
            <div className="ui-readonly">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Detailed active staff source rows are not exposed to this
                drilldown yet.
              </p>
            </div>
          )}

          <p className="ui-help">
            To trace individual staff inputs further, review the Labour page.
          </p>
        </div>
      </div>
    );
  }

  if (active_component === "asset_cost") {
    const asset_cost_total =
      assets.total_asset_cost_annual ??
      values.total_asset_cost_annual ??
      0;

    const asset_interest_total =
      assets.total_asset_interest_annual ??
      assets.finance_cost_annual ??
      0;

    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Asset Cost breakdown</p>

          <p className="ui-help">
            Asset Cost comes from the Assets module. Productive and support
            assets are displayed using the asset type already exposed upstream.
            The asset rows below show interest / finance cost only.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Asset Interest / Finance Cost
              </div>
              <div className="labour-summary-table-value">
                {format_currency(asset_interest_total)}
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

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Principal repayments are not included in this recovery cost. They
              belong to the balance sheet / cash-flow layer, not the operating
              cost burden.
            </p>
          </div>

          {active_assets.length > 0 ? (
            <div className="ui-stack-sm">
              <AssetRows
                title="Productive assets"
                asset_rows={productive_assets}
                empty_message="No productive assets are exposed in this source set."
              />

              <AssetRows
                title="Support assets"
                asset_rows={support_assets}
                empty_message="No support assets are exposed in this source set."
              />
            </div>
          ) : (
            <div className="ui-readonly">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Detailed active asset rows are not exposed to this drilldown
                yet.
              </p>
            </div>
          )}

          <p className="ui-help">
            To trace asset inputs further, review the Assets page.
          </p>
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
          <p className="ui-kicker">Business Overheads breakdown</p>

          <p className="ui-help">
            Business Overheads come from General Overheads. These category
            totals show where the overhead burden is coming from. Review General
            Overheads for the individual source rows.
          </p>

          <div className="ui-stack-sm">
            {category_totals.length > 0 ? (
              category_totals.map((category, index) => {
                const category_label = get_category_label(category);
                const category_amount = get_category_amount(category);

                const category_key =
                  category.category_key ||
                  category.category_name ||
                  category.category_label ||
                  category_label ||
                  "overhead-category";

                return (
                  <div
                    key={`${category_key}-${index}`}
                    className="recovery-summary-interactive recovery-summary-row"
                  >
                    <div className="recovery-summary-row-label">
                      {category_label}
                    </div>

                    <div className="recovery-summary-row-value">
                      {format_currency(category_amount)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Category totals not exposed
                </div>

                <div className="labour-summary-table-value">$0.00</div>
              </div>
            )}

            <div className="recovery-summary-row recovery-summary-row-total">
              <div className="recovery-summary-row-label">
                Business Overheads
              </div>

              <div className="recovery-summary-row-value">
                {format_currency(business_overheads_total)}
              </div>
            </div>
          </div>

          <p className="ui-help">
            To trace individual overhead inputs further, review General
            Overheads.
          </p>
        </div>
      </div>
    );
  }

  return null;
}