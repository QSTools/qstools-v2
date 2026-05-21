"use client";

import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useRecoverySummary from "@/hooks/useRecoverySummary";

import {
  build_cost_allocation_inputs,
  calculate_cost_allocation,
} from "@/lib/calculations/costAllocationRules";
import {
  build_cost_allocation_status,
  build_cost_allocation_card,
} from "@/lib/selectors/costAllocationSelectors";
import { useCostAllocationStorage } from "@/lib/storage/costAllocationStorage";
import { useCostAllocationProfileStorage } from "@/lib/storage/costAllocationProfileStorage";

function safe_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safe_array(value) {
  return Array.isArray(value) ? value : [];
}

function normalise_asset_type(value) {
  return value === "support" ? "support" : "productive";
}

function normalise_key(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function get_asset_name(asset = {}) {
  return asset.asset_name || asset.name || "Unnamed Asset";
}

function get_labour_type_key(item = {}) {
  return normalise_key(
    item.labour_type_key ||
      item.labour_type_id ||
      item.staff_type ||
      item.staff_role ||
      item.labour_class ||
      item.label ||
      item.name ||
      ""
  );
}

function get_labour_type_label(item = {}) {
  return (
    item.labour_type_label ||
    item.label ||
    item.staff_type ||
    item.staff_role ||
    item.labour_class ||
    "Unclassified productive labour"
  );
}

function get_staff_labour_type_key(staff = {}) {
  return normalise_key(
    staff.labour_type_key ||
      staff.labour_type_id ||
      staff.staff_type ||
      staff.staff_role ||
      staff.labour_class ||
      staff.role ||
      ""
  );
}

function get_staff_label(staff = {}) {
  return (
    staff.staff_name ||
    staff.name ||
    staff.staff_role ||
    staff.staff_type ||
    staff.labour_class ||
    "Selected staff"
  );
}

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

function build_productive_labour_type_rows(labour_output_contract = {}) {
  const productive_labour_types = safe_array(
    labour_output_contract?.productive_labour_types
  );

  return productive_labour_types.map((item) => {
    const labour_type_key = get_labour_type_key(item);

    const weighted_recovery_rate = safe_number(
      item.weighted_recovery_rate ??
        item.weighted_recovery_rate_per_hour ??
        item.real_cost_per_productive_hour ??
        item.minimum_recovery_rate ??
        0
    );

    const highest_recovery_rate = safe_number(
      item.highest_recovery_rate ??
        item.highest_recovery_rate_per_hour ??
        weighted_recovery_rate
    );

    return {
      labour_type_key,
      labour_type_label: get_labour_type_label(item),
      labour_class: item.labour_class ?? "",
      staff_role: item.staff_role ?? "",
      staff_type: item.staff_type ?? "",
      staff_count: safe_number(item.staff_count ?? item.count ?? 0),
      total_productive_hours: safe_number(
        item.total_productive_hours ?? item.productive_hours ?? 0
      ),
      total_labour_cost: safe_number(
        item.total_labour_cost ?? item.labour_cost ?? 0
      ),
      weighted_recovery_rate,
      highest_recovery_rate,
    };
  });
}

function build_asset_recovery_overlay({
  asset_output_contract = {},
  recovery_hours_used = 0,
}) {
  const active_assets = safe_array(asset_output_contract.active_assets);
  const default_recovery_hours = safe_number(recovery_hours_used);

  const recovery_assets = active_assets.map((asset) => {
    const base_asset_cost_annual = safe_number(asset.total_asset_cost_annual);
    const allocated_asset_overhead_cost_annual = safe_number(
      asset.allocated_asset_overhead_cost_annual
    );

    const asset_recovery_cost_annual =
      asset.asset_recovery_cost_annual !== undefined
        ? safe_number(asset.asset_recovery_cost_annual)
        : base_asset_cost_annual + allocated_asset_overhead_cost_annual;

    const asset_recovery_rate_per_hour =
      default_recovery_hours > 0
        ? asset_recovery_cost_annual / default_recovery_hours
        : 0;

    return {
      ...asset,
      asset_type: normalise_asset_type(asset.asset_type),
      asset_name: get_asset_name(asset),
      base_asset_cost_annual,
      allocated_asset_overhead_cost_annual,
      asset_recovery_cost_annual,
      asset_recovery_hours_used: default_recovery_hours,
      asset_recovery_rate_per_hour,
      cost_allocation_asset_cost_annual: asset_recovery_cost_annual,
    };
  });

  const asset_recovery_rows = recovery_assets.map((asset) => ({
    asset_id: asset.asset_id ?? "",
    asset_name: asset.asset_name ?? "Unnamed Asset",
    asset_type: asset.asset_type,
    base_asset_cost_annual: safe_number(asset.base_asset_cost_annual),
    allocated_asset_overhead_cost_annual: safe_number(
      asset.allocated_asset_overhead_cost_annual
    ),
    asset_recovery_cost_annual: safe_number(asset.asset_recovery_cost_annual),
    asset_recovery_hours_used: safe_number(asset.asset_recovery_hours_used),
    asset_recovery_rate_per_hour: safe_number(
      asset.asset_recovery_rate_per_hour
    ),
  }));

  const productive_assets = recovery_assets.filter(
    (asset) => asset.asset_type === "productive"
  );

  const support_assets = recovery_assets.filter(
    (asset) => asset.asset_type === "support"
  );

  const productive_asset_base_cost = productive_assets.reduce(
    (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
    0
  );

  const support_asset_base_cost = support_assets.reduce(
    (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
    0
  );

  const productive_asset_allocated_overhead_cost = productive_assets.reduce(
    (sum, asset) =>
      sum + safe_number(asset.allocated_asset_overhead_cost_annual),
    0
  );

  const support_asset_allocated_overhead_cost = support_assets.reduce(
    (sum, asset) =>
      sum + safe_number(asset.allocated_asset_overhead_cost_annual),
    0
  );

  const productive_asset_recovery_cost = productive_assets.reduce(
    (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
    0
  );

  const support_asset_recovery_cost = support_assets.reduce(
    (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
    0
  );

  return {
    active_assets: recovery_assets,
    asset_recovery_rows,

    productive_asset_base_cost,
    support_asset_base_cost,

    productive_asset_allocated_overhead_cost,
    support_asset_allocated_overhead_cost,

    productive_asset_recovery_cost,
    support_asset_recovery_cost,

    productive_asset_cost: productive_asset_recovery_cost,
    support_asset_cost: support_asset_recovery_cost,

    total_allocated_asset_overhead_cost:
      productive_asset_allocated_overhead_cost +
      support_asset_allocated_overhead_cost,

    total_asset_recovery_cost:
      productive_asset_recovery_cost + support_asset_recovery_cost,
  };
}

function find_labour_type_for_staff(staff = {}, productive_labour_type_rows = []) {
  const rows = safe_array(productive_labour_type_rows);

  if (rows.length === 0) {
    return null;
  }

  const staff_key = get_staff_labour_type_key(staff);

  const direct_match = rows.find((row) => {
    return (
      row.labour_type_key === staff_key ||
      normalise_key(row.labour_type_label) === staff_key ||
      normalise_key(row.staff_type) === staff_key ||
      normalise_key(row.staff_role) === staff_key ||
      normalise_key(row.labour_class) === staff_key
    );
  });

  if (direct_match) {
    return direct_match;
  }

  const staff_role_key = normalise_key(staff.staff_role);
  const staff_type_key = normalise_key(staff.staff_type);
  const labour_class_key = normalise_key(staff.labour_class);

  const loose_match = rows.find((row) => {
    const row_values = [
      row.labour_type_key,
      row.labour_type_label,
      row.staff_type,
      row.staff_role,
      row.labour_class,
    ].map(normalise_key);

    return (
      row_values.includes(staff_role_key) ||
      row_values.includes(staff_type_key) ||
      row_values.includes(labour_class_key)
    );
  });

  if (loose_match) {
    return loose_match;
  }

  if (rows.length === 1) {
    return rows[0];
  }

  return null;
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

  return safe_array(operational_groups).map((group, index) => {
    const group_asset_ids = get_group_asset_ids(group);
    const group_staff_ids = get_group_staff_ids(group);

    const group_assets = group_asset_ids
      .map((asset_id) => asset_map.get(asset_id))
      .filter(Boolean);

    const group_staff = group_staff_ids
      .map((staff_id) => staff_map.get(staff_id))
      .filter(Boolean);

    const staff_recovery_rows = group_staff.map((staff) => {
      const labour_type = find_labour_type_for_staff(
        staff,
        productive_labour_type_rows
      );

      const labour_recovery_rate_per_hour = safe_number(
        labour_type?.weighted_recovery_rate ??
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
        group.group_name || group.name || `Working Unit ${index + 1}`,

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

export default function useCostAllocation(inputs = {}) {
  const labour = useLabour();
  const assets = useAssets();

  const fallback_recovery_summary = useRecoverySummary();
  const recovery_summary =
    inputs.recovery_summary ??
    fallback_recovery_summary?.output_contract ??
    {};

  const {
    state,
    set_field,
    add_asset_labour_link,
    remove_asset_labour_link,
    add_operational_group,
    update_operational_group,
    remove_operational_group,
    reset_state,
  } = useCostAllocationStorage();

  const {
    profiles,
    active_profile,
    save_profile,
    load_profile,
    delete_profile,
  } = useCostAllocationProfileStorage();

  const base_calculation_inputs = useMemo(() => {
    return build_cost_allocation_inputs({
      recovery_summary,
      labour,
      assets,
      allocation_state: state,
    });
  }, [recovery_summary, labour, assets, state]);

  const productive_labour_type_rows = useMemo(() => {
    return build_productive_labour_type_rows(labour?.output_contract ?? {});
  }, [labour?.output_contract]);

  const asset_recovery_overlay = useMemo(() => {
    return build_asset_recovery_overlay({
      asset_output_contract: assets?.output_contract ?? {},
      recovery_hours_used: base_calculation_inputs?.recovery_hours_used,
    });
  }, [assets?.output_contract, base_calculation_inputs?.recovery_hours_used]);

  const operational_group_recovery_rows = useMemo(() => {
    return build_operational_group_recovery_rows({
      operational_groups: state?.operational_groups ?? [],
      active_assets: asset_recovery_overlay.active_assets,
      active_staff: base_calculation_inputs?.active_staff ?? [],
      productive_labour_type_rows,
      working_unit_recovery_cost:
        safe_number(base_calculation_inputs?.labour_recovery_cost) +
        safe_number(base_calculation_inputs?.asset_recovery_cost),
      overhead_absorbed_cost: base_calculation_inputs?.overhead_absorbed_cost,
      recovery_hours_used: base_calculation_inputs?.recovery_hours_used,
    });
  }, [
    state?.operational_groups,
    asset_recovery_overlay.active_assets,
    base_calculation_inputs?.active_staff,
    productive_labour_type_rows,
    base_calculation_inputs?.labour_recovery_cost,
    base_calculation_inputs?.asset_recovery_cost,
    base_calculation_inputs?.overhead_absorbed_cost,
    base_calculation_inputs?.recovery_hours_used,
  ]);

  const calculation_inputs = useMemo(() => {
    return {
      ...base_calculation_inputs,
      active_assets: asset_recovery_overlay.active_assets,
      asset_recovery_rows: asset_recovery_overlay.asset_recovery_rows,

      productive_labour_type_rows,
      operational_group_recovery_rows,

      productive_asset_base_cost:
        asset_recovery_overlay.productive_asset_base_cost,
      support_asset_base_cost: asset_recovery_overlay.support_asset_base_cost,

      productive_asset_allocated_overhead_cost:
        asset_recovery_overlay.productive_asset_allocated_overhead_cost,
      support_asset_allocated_overhead_cost:
        asset_recovery_overlay.support_asset_allocated_overhead_cost,

      productive_asset_recovery_cost:
        asset_recovery_overlay.productive_asset_recovery_cost,
      support_asset_recovery_cost:
        asset_recovery_overlay.support_asset_recovery_cost,

      productive_asset_cost: asset_recovery_overlay.productive_asset_cost,
      support_asset_cost: asset_recovery_overlay.support_asset_cost,

      total_allocated_asset_overhead_cost:
        asset_recovery_overlay.total_allocated_asset_overhead_cost,
      total_asset_recovery_cost: asset_recovery_overlay.total_asset_recovery_cost,
    };
  }, [
    base_calculation_inputs,
    asset_recovery_overlay,
    productive_labour_type_rows,
    operational_group_recovery_rows,
  ]);

  const calculated = useMemo(() => {
    return calculate_cost_allocation(calculation_inputs);
  }, [calculation_inputs]);

  const status = useMemo(() => {
    return build_cost_allocation_status(calculated);
  }, [calculated]);

  const base_card = useMemo(() => {
    return build_cost_allocation_card(calculated);
  }, [calculated]);

  function handle_save_profile() {
    save_profile({
      active_allocation_profile_id:
        state?.active_allocation_profile_id || "live",
      allocation_profile_name: state?.allocation_profile_name,
      effective_from: state?.effective_from,
      active_recovery_model: calculated?.active_recovery_model,
      asset_labour_links: state?.asset_labour_links ?? [],
      operational_groups: state?.operational_groups ?? [],
    });
  }

  function handle_load_profile(active_allocation_profile_id) {
    const loaded = load_profile(active_allocation_profile_id);

    if (!loaded) {
      return;
    }

    set_field(
      "active_allocation_profile_id",
      loaded.active_allocation_profile_id ?? "live"
    );
    set_field(
      "allocation_profile_name",
      loaded.allocation_profile_name ?? "Default Allocation Profile"
    );
    set_field("effective_from", loaded.effective_from ?? "");
    set_field("asset_labour_links", loaded.asset_labour_links ?? []);
    set_field("operational_groups", loaded.operational_groups ?? []);
  }

  function handle_delete_profile(active_allocation_profile_id) {
    delete_profile(active_allocation_profile_id);
  }

  function handle_new_profile() {
    reset_state();
  }

  const card = {
    ...base_card,
    recovery_plan: {
      ...(base_card?.recovery_plan ?? {}),
      productive_asset_base_cost: calculated.productive_asset_base_cost,
      support_asset_base_cost: calculated.support_asset_base_cost,
      productive_asset_allocated_overhead_cost:
        calculated.productive_asset_allocated_overhead_cost,
      support_asset_allocated_overhead_cost:
        calculated.support_asset_allocated_overhead_cost,
      productive_asset_recovery_cost: calculated.productive_asset_recovery_cost,
      support_asset_recovery_cost: calculated.support_asset_recovery_cost,
      total_allocated_asset_overhead_cost:
        calculated.total_allocated_asset_overhead_cost,
      total_asset_recovery_cost: calculated.total_asset_recovery_cost,
      asset_recovery_rows: calculated.asset_recovery_rows,
      productive_labour_type_rows: calculated.productive_labour_type_rows,
      operational_group_recovery_rows:
        calculated.operational_group_recovery_rows,
    },
    profile: {
      allocation_profile_name: state?.allocation_profile_name ?? "",
      effective_from: state?.effective_from ?? "",
      profiles,
      active_profile_id:
        active_profile?.active_allocation_profile_id ??
        state?.active_allocation_profile_id ??
        "",
      active_profile_name:
        active_profile?.allocation_profile_name ??
        state?.allocation_profile_name ??
        "",
    },
  };

  const actions = {
    set_field,
    add_asset_labour_link,
    remove_asset_labour_link,
    add_operational_group,
    update_operational_group,
    remove_operational_group,
    reset_state,
    save_profile: handle_save_profile,
    load_profile: handle_load_profile,
    delete_profile: handle_delete_profile,
    new_profile: handle_new_profile,
  };

  const output_contract = {
    allocation_status: calculated.allocation_status,
    allocation_dependency_type: calculated.allocation_dependency_type,
    setup_warnings: calculated.setup_warnings,
    structural_warnings: calculated.structural_warnings,
    allocation_warnings: calculated.allocation_warnings,

    active_recovery_model: calculated.active_recovery_model,
    recovery_plan_target_per_driver:
      calculated.recovery_plan_target_per_driver,
    recovery_plan_split: calculated.recovery_plan_split,
    component_required_recovery: calculated.component_required_recovery,

    labour_share_percent: calculated.labour_share_percent,
    asset_share_percent: calculated.asset_share_percent,
    material_share_percent: calculated.material_share_percent,
    overhead_absorbed_percent: calculated.overhead_absorbed_percent,

    labour_recovery_cost: calculated.labour_recovery_cost,
    asset_recovery_cost: calculated.asset_recovery_cost,
    material_recovery_cost: calculated.material_recovery_cost,
    overhead_absorbed_cost: calculated.overhead_absorbed_cost,

    recovery_hours_used: calculated.recovery_hours_used,
    required_recovery_rate: calculated.required_recovery_rate,
    actual_recovery_rate: calculated.actual_recovery_rate,
    profit_or_deficit_per_recovery_hour:
      calculated.profit_or_deficit_per_recovery_hour,

    material_recovery_included: calculated.material_recovery_included,
    asset_recovery_included: calculated.asset_recovery_included,
    material_margin_status: calculated.material_margin_status,
    asset_utilisation_status: calculated.asset_utilisation_status,

    has_productive_asset_recovery_base:
      calculated.has_productive_asset_recovery_base,
    productive_asset_count: calculated.productive_asset_count,
    support_asset_count: calculated.support_asset_count,

    productive_asset_base_cost: calculated.productive_asset_base_cost,
    support_asset_base_cost: calculated.support_asset_base_cost,
    productive_asset_allocated_overhead_cost:
      calculated.productive_asset_allocated_overhead_cost,
    support_asset_allocated_overhead_cost:
      calculated.support_asset_allocated_overhead_cost,
    productive_asset_recovery_cost: calculated.productive_asset_recovery_cost,
    support_asset_recovery_cost: calculated.support_asset_recovery_cost,
    total_allocated_asset_overhead_cost:
      calculated.total_allocated_asset_overhead_cost,
    total_asset_recovery_cost: calculated.total_asset_recovery_cost,

    asset_recovery_rows: calculated.asset_recovery_rows,
    productive_labour_type_rows: calculated.productive_labour_type_rows,
    operational_group_recovery_rows:
      calculated.operational_group_recovery_rows,

    productive_asset_cost: calculated.productive_asset_cost,
    support_asset_cost: calculated.support_asset_cost,

    active_allocation_profile_id: calculated.active_allocation_profile_id,
    active_asset_labour_links: calculated.active_asset_labour_links,
    active_operational_groups: calculated.active_operational_groups,

    linked_staff_count: calculated.linked_staff_count,
    unlinked_staff_count: calculated.unlinked_staff_count,
    linked_asset_count: calculated.linked_asset_count,
    unlinked_asset_count: calculated.unlinked_asset_count,

    total_operational_groups: calculated.total_operational_groups,
    valid_operational_groups: calculated.valid_operational_groups,
    invalid_operational_groups: calculated.invalid_operational_groups,

    duplicate_link_warnings: calculated.duplicate_link_warnings,
    orphan_warnings: calculated.orphan_warnings,
    group_validation_warnings: calculated.group_validation_warnings,

    structure_valid: calculated.structure_valid,
    staff_coverage_percent: calculated.staff_coverage_percent,
    asset_coverage_percent: calculated.asset_coverage_percent,
    group_coverage_percent: calculated.group_coverage_percent,

    external_delivery_enabled: calculated.external_delivery_enabled,
    external_delivery_required: calculated.external_delivery_required,
    internal_capacity_shortfall: calculated.internal_capacity_shortfall,
  };

  return {
    status,
    card,
    actions,
    output_contract,
  };
}
