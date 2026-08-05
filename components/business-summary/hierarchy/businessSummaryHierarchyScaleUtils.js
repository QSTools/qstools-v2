import {
  TIME_SCALES,
  scaleAnnualValue,
  scalePeriodValue,
} from "@/components/business-summary/BusinessSummaryCardUtils";

export const PRODUCT_TIME_SCALES = TIME_SCALES.filter(
  (option) => option.key !== "hour"
);

export function scaleProductAnnualValue(value, timeScale) {
  const number = Number(value) || 0;

  if (timeScale === "day") return number / 365;
  if (timeScale === "week") return number / 52;
  if (timeScale === "month") return number / 12;
  if (timeScale === "quarter") return number / 4;

  return number;
}

export function sumStaffCost(staffRows = []) {
  return staffRows.reduce(
    (total, staff) => total + (Number(staff.total_labour_cost_annual) || 0),
    0
  );
}

export function sumAssetCost(assetRows = []) {
  return assetRows.reduce(
    (total, asset) => total + (Number(asset.total_asset_cost_annual) || 0),
    0
  );
}

export function createDisplayScalers({
  active_time_scale,
  open_hours_used,
  product_mode_active,
}) {
  function scaleDisplayAnnualValue(annualValue, hourlyValue = 0) {
    return product_mode_active
      ? scaleProductAnnualValue(annualValue, active_time_scale)
      : scaleAnnualValue(
          annualValue,
          active_time_scale,
          hourlyValue,
          open_hours_used
        );
  }

  function scaleDisplayPeriodValue(annualValue) {
    return product_mode_active
      ? scaleProductAnnualValue(annualValue, active_time_scale)
      : scalePeriodValue(annualValue, active_time_scale, open_hours_used);
  }

  return {
    scaleDisplayAnnualValue,
    scaleDisplayPeriodValue,
  };
}
