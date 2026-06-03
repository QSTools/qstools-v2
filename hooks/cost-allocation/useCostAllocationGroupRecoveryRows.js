"use client";

import { useMemo } from "react";

import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

import {
  find_labour_type_for_staff,
  get_staff_label,
  get_staff_labour_type_key,
} from "@/lib/calculations/cost-allocation/costAllocationLabourAdapter";

function get_group_asset_ids(group = {}) {
  const possible_lists = [
    group.required_asset_ids,
    group.asset_ids,
    group.assigned_asset_ids,
    group.linked_asset_ids,
    group.assets,
  ];

  for (const list of possible_lists) {
    if (Array.isArray(list)) {
      return list
        .map((item) =>
          typeof item === "string" ? item : item?.asset_id || item?.id || ""
        )
        .filter(Boolean);
    }
  }

  if (group.asset_id) {
    return [group.asset_id];
  }

  return [];
}

function get_group_staff_ids(group = {}) {
  const possible_lists = [
    group.required_staff_ids,
    group.staff_ids,
    group.assigned_staff_ids,
    group.linked_staff_ids,
    group.staff,
  ];

  for (const list of possible_lists) {
    if (Array.isArray(list)) {
      return list
        .map((item) =>
          typeof item === "string" ? item : item?.staff_id || item?.id || ""
        )
        .filter(Boolean);
    }
  }

  if (group.staff_id) {
    return [group.staff_id];
  }

  return [];
}

function get_overhead_burden_rate_for_group({
  working_unit_recovery_rate = 0,
  running_cost_rate_per_hour = 0,
}) {
  const required_rate = safe_number(working_unit_recovery_rate);
  const running_rate = safe_number(running_cost_rate_per_hour);

  return Math.max(required_rate - running_rate, 0);
}

function build_operational_group_recovery_rows({
  operational_groups = [],
  active_assets = [],
  active_staff = [],
  productive_labour_type_rows = [],
  working_unit_recovery_cost = 0,
  overhead_absorbed_cost = 0,
  recovery_hours_used = 0,
}) {
  const asset_map = new Map(
    safe_array(active_assets).map((asset) => [asset.asset_id, asset])
  );

  const staff_map = new Map(
    safe_array(active_staff).map((staff) => [staff.staff_id, staff])
  );

  const labour_driver_map = new Map(
    safe_array(productive_labour_type_rows).map((row) => [
      row.labour_type_id || row.labour_type_key || row.staff_type_id,
      row,
    ])
  );

  return safe_array(operational_groups).map((group, index) => {
    const group_asset_ids = get_group_asset_ids(group);
    const group_staff_ids = get_group_staff_ids(group);

    const group_assets = group_asset_ids
      .map((asset_id) => asset_map.get(asset_id))
      .filter(Boolean);

    const group_staff = group_staff_ids
      .map((staff_id) => {
        const labour_driver = labour_driver_map.get(staff_id);

        if (labour_driver) {
          return {
            staff_id:
              labour_driver.labour_type_id ||
              labour_driver.labour_type_key ||
              labour_driver.staff_type_id,
            staff_name:
              labour_driver.labour_type_label ||
              labour_driver.staff_type_name,
            labour_type_key: labour_driver.labour_type_key,
            labour_type_label: labour_driver.labour_type_label,
            staff_type: labour_driver.staff_type,
            staff_role: labour_driver.staff_role,
            labour_class: labour_driver.labour_class,
            productive_hours: labour_driver.total_productive_hours,
            total_labour_cost_annual: labour_driver.total_labour_cost,
            weighted_recovery_rate:
              labour_driver.weighted_recovery_rate ||
              labour_driver.weighted_productive_hourly_rate,
            source_staff_ids: labour_driver.source_staff_ids,
            is_labour_driver: true,
          };
        }

        return staff_map.get(staff_id);
      })
      .filter(Boolean);

    const staff_recovery_rows = group_staff.map((staff) => {
      const labour_type = staff.is_labour_driver
        ? staff
        : find_labour_type_for_staff(staff, productive_labour_type_rows);

      const labour_recovery_rate_per_hour = safe_number(
        labour_type?.weighted_recovery_rate ??
          labour_type?.weighted_productive_hourly_rate ??
          staff.weighted_recovery_rate ??
          staff.productive_labour_cost_rate ??
          staff.labour_cost_rate ??
          0
      );

      return {
        staff_id: staff.staff_id,
        staff_name: get_staff_label(staff),
        labour_type_key:
          labour_type?.labour_type_key || get_staff_labour_type_key(staff),
        labour_type_label:
          labour_type?.labour_type_label ||
          staff.staff_type ||
          staff.staff_role ||
          staff.labour_class ||
          "Unclassified productive labour",
        labour_recovery_rate_per_hour,
      };
    });

    const asset_recovery_rows = group_assets.map((asset) => ({
      asset_id: asset.asset_id,
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      asset_recovery_rate_per_hour: safe_number(
        asset.asset_recovery_rate_per_hour
      ),
      asset_recovery_cost_annual: safe_number(asset.asset_recovery_cost_annual),
    }));

    const labour_recovery_rate_per_hour = staff_recovery_rows.reduce(
      (sum, staff) => sum + safe_number(staff.labour_recovery_rate_per_hour),
      0
    );

    const asset_recovery_rate_per_hour = asset_recovery_rows.reduce(
      (sum, asset) => sum + safe_number(asset.asset_recovery_rate_per_hour),
      0
    );

    const running_cost_rate_per_hour =
      labour_recovery_rate_per_hour + asset_recovery_rate_per_hour;

    const working_unit_recovery_rate =
      safe_number(recovery_hours_used) > 0
        ? (safe_number(working_unit_recovery_cost) +
            safe_number(overhead_absorbed_cost)) /
          safe_number(recovery_hours_used)
        : 0;

    const overhead_burden_rate_per_hour = get_overhead_burden_rate_for_group({
      working_unit_recovery_rate,
      running_cost_rate_per_hour,
    });

    const minimum_recoverable_rate_per_hour =
      running_cost_rate_per_hour + overhead_burden_rate_per_hour;

    return {
      group_id:
        group.group_id || group.operational_group_id || `group-${index}`,
      group_name:
        group.group_name || group.name || `Operating Group ${index + 1}`,

      required_staff_count: safe_number(group.required_staff_count),
      selected_staff_count: group_staff.length,
      selected_asset_count: group_assets.length,

      staff_recovery_rows,
      asset_recovery_rows,

      staff_names: group_staff.map(get_staff_label),
      asset_names: group_assets.map((asset) => asset.asset_name),

      labour_recovery_rate_per_hour,
      asset_recovery_rate_per_hour,

      running_cost_rate_per_hour,
      working_unit_recovery_rate_per_hour: working_unit_recovery_rate,
      overhead_burden_rate_per_hour,
      minimum_recoverable_rate_per_hour,

      operational_group_recovery_rate_per_hour:
        minimum_recoverable_rate_per_hour,

      has_labour_rate: labour_recovery_rate_per_hour > 0,
      has_asset_rate: asset_recovery_rate_per_hour > 0,
      has_running_cost: running_cost_rate_per_hour > 0,
      has_overhead_burden: overhead_burden_rate_per_hour > 0,
      is_rate_ready: minimum_recoverable_rate_per_hour > 0,
    };
  });
}

export function useCostAllocationGroupRecoveryRows({
  operational_groups = [],
  active_assets = [],
  active_staff = [],
  productive_labour_type_rows = [],
  working_unit_recovery_cost = 0,
  overhead_absorbed_cost = 0,
  recovery_hours_used = 0,
}) {
  return useMemo(() => {
    return build_operational_group_recovery_rows({
      operational_groups,
      active_assets,
      active_staff,
      productive_labour_type_rows,
      working_unit_recovery_cost,
      overhead_absorbed_cost,
      recovery_hours_used,
    });
  }, [
    operational_groups,
    active_assets,
    active_staff,
    productive_labour_type_rows,
    working_unit_recovery_cost,
    overhead_absorbed_cost,
    recovery_hours_used,
  ]);
}