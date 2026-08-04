import { to_number } from "./assetSelectorFormatters";

export function resolve_asset_annual_weeks({
  asset_annual_weeks_override,
  business_default_annual_weeks,
}) {
  const override_weeks = to_number(asset_annual_weeks_override);

  if (override_weeks > 0) {
    return override_weeks;
  }

  const default_weeks = to_number(business_default_annual_weeks);

  return default_weeks > 0 ? default_weeks : 48;
}

export function get_live_asset_utilisation_hours_annual(
  asset = {},
  business_default_annual_weeks
) {
  if (asset?.asset_type !== "productive") {
    return 0;
  }

  const weekly_hours = Math.max(to_number(asset.utilisation_hours_per_week), 0);
  const annual_weeks_used = resolve_asset_annual_weeks({
    asset_annual_weeks_override: asset.asset_annual_weeks_override,
    business_default_annual_weeks,
  });

  return weekly_hours * annual_weeks_used;
}

