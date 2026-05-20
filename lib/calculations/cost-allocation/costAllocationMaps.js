import { safe_array } from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

export function build_active_maps(active_staff, active_assets) {
  const active_staff_map = new Map();
  const active_asset_map = new Map();

  safe_array(active_staff).forEach((staff) => {
    if (staff?.staff_id) {
      active_staff_map.set(staff.staff_id, staff);
    }
  });

  safe_array(active_assets).forEach((asset) => {
    if (asset?.asset_id) {
      active_asset_map.set(asset.asset_id, asset);
    }
  });

  return {
    active_staff_map,
    active_asset_map,
  };
}

export function get_active_links(
  asset_labour_links,
  active_staff_map,
  active_asset_map
) {
  return safe_array(asset_labour_links).filter((link) => {
    return (
      link?.is_active &&
      active_staff_map.has(link?.staff_id) &&
      active_asset_map.has(link?.asset_id)
    );
  });
}

export function get_active_groups(operational_groups) {
  return safe_array(operational_groups).filter((group) => group?.is_active);
}

export function get_linked_sets(active_links) {
  const linked_staff_ids = new Set();
  const linked_asset_ids = new Set();

  active_links.forEach((link) => {
    if (link?.staff_id) {
      linked_staff_ids.add(link.staff_id);
    }
    if (link?.asset_id) {
      linked_asset_ids.add(link.asset_id);
    }
  });

  return {
    linked_staff_ids,
    linked_asset_ids,
  };
}

export function calculate_coverage_percent(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return (numerator / denominator) * 100;
}
