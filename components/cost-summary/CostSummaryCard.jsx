"use client";

import { useMemo, useState } from "react";
import {
  Breadcrumb,
  CostBar,
  DrillRow,
} from "@/components/cost-summary/cost-summary-card/CostSummaryDrill";
import {
  TIME_SCALES,
  formatMoney,
  formatNumber,
  getInsightForLevel,
  getTimeScaleSuffix,
  scaleAnnualValue,
  toNumber,
} from "@/components/cost-summary/cost-summary-card/costSummaryFormatters";
import {
  buildCostSummaryHierarchy,
  getBreadcrumbNodes,
  getNodeByPath,
} from "@/components/cost-summary/cost-summary-card/costSummaryHierarchy";

export default function CostSummaryCard({
  people_cost_total,
  business_cost_total,
  asset_cost_total = 0,
  total_asset_interest_annual = 0,
  general_overheads_total = 0,
  total_cost_burden,
  total_recovery_hours = 0,
  macro_required_operating_hour_rate = 0,
  net_annual_business_open_hours = 0,
  labour_detail = {},
  asset_detail = {},
  overhead_detail = {},
  highlight_insight = "",
}) {
  const [timeScale, setTimeScale] = useState("hour");
  const [activePath, setActivePath] = useState(["total"]);
  const [hoveredItemKey, setHoveredItemKey] = useState("");

  const total_people_cost_annual = toNumber(people_cost_total);
  const total_business_cost_annual = toNumber(business_cost_total);
  const total_asset_cost_annual = toNumber(asset_cost_total);
  const total_asset_interest = toNumber(total_asset_interest_annual);
  const total_business_overheads = toNumber(general_overheads_total);
  const total_cost_burden_annual = toNumber(total_cost_burden);
  const recovery_hours_total = toNumber(total_recovery_hours);

  const hierarchy = useMemo(() => {
    return buildCostSummaryHierarchy({
      total_cost_burden_annual,
      total_people_cost_annual,
      total_asset_cost_annual,
      total_asset_interest,
      total_business_overheads,
      labour_detail,
      asset_detail,
      overhead_detail,
    });
  }, [
    total_cost_burden_annual,
    total_people_cost_annual,
    total_asset_cost_annual,
    total_asset_interest,
    total_business_overheads,
    labour_detail,
    asset_detail,
    overhead_detail,
  ]);

  const activeLevel = getNodeByPath(hierarchy, activePath);
  const activeItems = activeLevel.items ?? [];
  const breadcrumb = getBreadcrumbNodes(hierarchy, activePath);

  const headlineValue =
    timeScale === "hour"
      ? macro_required_operating_hour_rate
      : timeScale === "year"
        ? total_cost_burden_annual
        : scaleAnnualValue(
            total_cost_burden_annual,
            timeScale,
            recovery_hours_total,
            net_annual_business_open_hours
          );

  const insight =
    highlight_insight ||
    getInsightForLevel(
      activeLevel.key,
      activeItems,
      total_cost_burden_annual
    );

  function handleSelectLevel(item) {
    setHoveredItemKey("");
    setActivePath((currentPath) => [...currentPath, item.key]);
  }

  function handleSelectBreadcrumb(index) {
    setActivePath((currentPath) => currentPath.slice(0, index + 1));
    setHoveredItemKey("");
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Cost Baseline</div>
          <div className="ui-card-title">
            What your business must recover
          </div>

          <div className="cost-summary-hero">
            <div className="ui-stack-sm">
              <div className="ui-kicker">
                {timeScale === "hour" ? "Operating cost per open hour" : "Total cost burden"}
              </div>
              <div className="ui-display">
                {formatMoney(headlineValue)}
              </div>
              <div className="ui-help" style={{ fontSize: "0.9em", marginTop: "-4px" }}>
                {timeScale === "hour" ? "per open hr" : getTimeScaleSuffix(timeScale)}
              </div>
              <div className="ui-help" style={{ marginTop: "12px" }}>
                {timeScale === "hour"
                  ? "Total business cost burden divided by net annual business open hours."
                  : "This is the business cost baseline scaled to the selected period."}
              </div>
              {timeScale === "hour" && (
                <div className="ui-help" style={{ marginTop: "8px", fontSize: "0.85em" }}>
                  Based on {formatNumber(net_annual_business_open_hours)} net annual business open hours.
                </div>
              )}
            </div>

            <div className="cost-summary-toggle" aria-label="Time scale">
              {TIME_SCALES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={
                    option.key === timeScale
                      ? "cost-summary-toggle-button active"
                      : "cost-summary-toggle-button"
                  }
                  onClick={() => setTimeScale(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <Breadcrumb path={breadcrumb} onSelect={handleSelectBreadcrumb} />

          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Cost Composition</div>
              <div className="ui-card-title-sm">{activeLevel.title}</div>
              <div className="ui-help">
                {activeLevel.key === "people"
                  ? "All staff costs are divided across the net annual business open hours."
                  : "Click a section to explore. Values stay tied back to the total operating cost baseline."}
              </div>
            </div>

            <div className="cost-summary-level-total">
              <span className="cost-summary-level-total-label">Total</span>
              <span className="cost-summary-level-total-value">
                {formatMoney(
                  scaleAnnualValue(
                    activeLevel.total,
                    timeScale,
                    recovery_hours_total,
                    net_annual_business_open_hours
                  )
                )}
                <span className="cost-summary-level-total-suffix">
                  {getTimeScaleSuffix(timeScale)}
                </span>
              </span>
            </div>
          </div>

          <CostBar
            items={activeItems}
            total={activeLevel.total}
            timeScale={timeScale}
            totalRecoveryHours={recovery_hours_total}
            openHours={net_annual_business_open_hours}
            hoveredItemKey={hoveredItemKey}
            onHoverItem={setHoveredItemKey}
            onClearHover={() => setHoveredItemKey("")}
            onSelect={handleSelectLevel}
          />

          <div className="cost-summary-drill-list">
            {activeItems.map((item) => (
              <DrillRow
                key={item.key}
                item={item}
                parentTotal={activeLevel.total}
                total_cost_burden={total_cost_burden_annual}
                timeScale={timeScale}
                totalRecoveryHours={recovery_hours_total}
                openHours={net_annual_business_open_hours}
                hoveredItemKey={hoveredItemKey}
                onHoverItem={setHoveredItemKey}
                onClearHover={() => setHoveredItemKey("")}
                onSelect={handleSelectLevel}
              />
            ))}
          </div>

          <div className="cost-summary-insight">
            <div className="ui-kicker">Plain-language read</div>
            <div className="ui-help">{insight}</div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Baseline Inputs</div>
          <div className="ui-card-title-sm">What this is based on</div>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Total Operating Cost
              </div>
              <div className="labour-summary-table-value">
                {formatMoney(total_cost_burden_annual)}
              </div>
            </div>

            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Net annual business open hours
              </div>
              <div className="labour-summary-table-value">
                {formatNumber(net_annual_business_open_hours)} hrs
              </div>
            </div>

            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">
                Operating cost per open hour
              </div>
              <div className="labour-summary-table-value">
                {formatMoney(macro_required_operating_hour_rate)} / open hr
              </div>
            </div>
          </div>

          <div className="ui-help">
            The selected period changes the display scale only. The baseline is
            still built from total operating cost and net annual business open
            hours. This is your break-even cost baseline. Materials and profit sit on
            top.
          </div>
        </div>
      </div>
    </section>
  );
}
