import {
  build_cost_allocation_inputs,
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";
import {
  build_active_maps,
  calculate_coverage_percent,
  get_active_groups,
  get_active_links,
} from "@/lib/calculations/cost-allocation/costAllocationMaps";
import {
  get_duplicate_link_warnings,
  get_structure_valid,
  has_component_required_recovery,
  normalise_recovery_model,
  validate_groups,
} from "@/lib/calculations/cost-allocation/costAllocationValidation";
import {
  get_allocation_dependency_type,
  get_allocation_status,
} from "@/lib/calculations/cost-allocation/costAllocationStatus";
import { build_cost_allocation_warnings } from "@/lib/calculations/cost-allocation/costAllocationWarnings";

export { build_cost_allocation_inputs };

function get_asset_base_cost(asset = {}) {
  return safe_number(
    asset.base_asset_cost_annual ?? asset.total_asset_cost_annual
  );
}

function get_asset_allocated_overhead_cost(asset = {}) {
  return safe_number(asset.allocated_asset_overhead_cost_annual);
}

function get_asset_recovery_cost(asset = {}) {
  const explicit_recovery_cost = asset.asset_recovery_cost_annual;

  if (explicit_recovery_cost !== undefined && explicit_recovery_cost !== null) {
    return safe_number(explicit_recovery_cost);
  }

  return get_asset_base_cost(asset) + get_asset_allocated_overhead_cost(asset);
}

function normalise_asset_for_cost_allocation(asset = {}) {
  const base_asset_cost_annual = get_asset_base_cost(asset);
  const allocated_asset_overhead_cost_annual =
    get_asset_allocated_overhead_cost(asset);
  const asset_recovery_cost_annual = get_asset_recovery_cost(asset);
  const recovery_hours_used = safe_number(asset.asset_recovery_hours_used);

  const asset_recovery_rate_per_hour =
    recovery_hours_used > 0
      ? asset_recovery_cost_annual / recovery_hours_used
      : 0;

  return {
    ...asset,
    base_asset_cost_annual,
    allocated_asset_overhead_cost_annual,
    asset_recovery_cost_annual,
    asset_recovery_hours_used: recovery_hours_used,
    asset_recovery_rate_per_hour,
    cost_allocation_asset_cost_annual: asset_recovery_cost_annual,
  };
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

function build_working_unit_linked_sets(active_groups = []) {
  const linked_staff_ids = new Set();
  const linked_asset_ids = new Set();

  safe_array(active_groups).forEach((group) => {
    get_group_staff_ids(group).forEach((staff_id) => {
      if (staff_id) {
        linked_staff_ids.add(staff_id);
      }
    });

    get_group_asset_ids(group).forEach((asset_id) => {
      if (asset_id) {
        linked_asset_ids.add(asset_id);
      }
    });
  });

  return {
    linked_staff_ids,
    linked_asset_ids,
  };
}

function get_labour_driver_id(row = {}) {
  return (
    row.labour_type_id ||
    row.labour_type_key ||
    row.staff_id ||
    row.id ||
    ""
  );
}

function get_staff_source_ids(row = {}) {
  if (Array.isArray(row.source_staff_ids)) {
    return row.source_staff_ids.filter(Boolean);
  }

  if (row.staff_id) {
    return [row.staff_id];
  }

  return [];
}

function build_labour_driver_maps({
  active_staff = [],
  productive_labour_type_rows = [],
}) {
  const labour_driver_map = new Map();

  safe_array(productive_labour_type_rows).forEach((row, index) => {
    const labour_driver_id =
      get_labour_driver_id(row) || `labour-driver-${index}`;

    labour_driver_map.set(labour_driver_id, {
      ...row,
      labour_driver_id,
      labour_driver_label:
        row.labour_type_label ||
        row.label ||
        "Unclassified productive labour",
      total_productive_hours: safe_number(row.total_productive_hours),
      total_labour_cost: safe_number(row.total_labour_cost),
      weighted_recovery_rate: safe_number(row.weighted_recovery_rate),
      source_staff_ids: get_staff_source_ids(row),
      source_type: "productive_labour_type",
    });
  });

  safe_array(active_staff).forEach((staff) => {
    if (!staff?.staff_id || labour_driver_map.has(staff.staff_id)) {
      return;
    }

    labour_driver_map.set(staff.staff_id, {
      labour_driver_id: staff.staff_id,
      labour_driver_label:
        staff.staff_name ||
        staff.staff_role ||
        staff.labour_class ||
        "Productive labour",
      total_productive_hours: safe_number(staff.productive_hours),
      total_labour_cost: safe_number(staff.total_labour_cost_annual),
      weighted_recovery_rate: safe_number(
        staff.weighted_recovery_rate ||
          staff.productive_labour_cost_rate ||
          staff.labour_cost_rate
      ),
      source_staff_ids: [staff.staff_id],
      source_type: "active_staff",
    });
  });

  return labour_driver_map;
}

function build_working_unit_linked_driver_sets({
  active_groups = [],
  labour_driver_map,
}) {
  const linked_labour_driver_ids = new Set();
  const linked_staff_ids = new Set();
  const linked_asset_ids = new Set();

  safe_array(active_groups).forEach((group) => {
    get_group_staff_ids(group).forEach((labour_driver_id) => {
      const driver = labour_driver_map.get(labour_driver_id);

      if (driver) {
        linked_labour_driver_ids.add(labour_driver_id);
        safe_array(driver.source_staff_ids).forEach((staff_id) => {
          if (staff_id) {
            linked_staff_ids.add(staff_id);
          }
        });
        return;
      }

      if (labour_driver_id) {
        linked_staff_ids.add(labour_driver_id);
      }
    });

    get_group_asset_ids(group).forEach((asset_id) => {
      if (asset_id) {
        linked_asset_ids.add(asset_id);
      }
    });
  });

  return {
    linked_labour_driver_ids,
    linked_staff_ids,
    linked_asset_ids,
  };
}

function build_working_unit_orphan_warnings({
  active_staff = [],
  active_assets = [],
  linked_staff_ids = new Set(),
  linked_asset_ids = new Set(),
}) {
  const warnings = [];

  safe_array(active_staff).forEach((staff) => {
    const staff_id = staff?.staff_id;

    if (staff_id && !linked_staff_ids.has(staff_id)) {
      warnings.push({
        warning_key: "staff_not_in_working_unit",
        message: `${
          staff.staff_name || staff.name || "A staff member"
        } is not included in any working unit.`,
      });
    }
  });

  safe_array(active_assets).forEach((asset) => {
    const asset_id = asset?.asset_id;

    if (asset_id && !linked_asset_ids.has(asset_id)) {
      warnings.push({
        warning_key: "asset_not_in_working_unit",
        message: `${
          asset.asset_name || asset.name || "An asset"
        } is not included in any working unit.`,
      });
    }
  });

  return warnings;
}

function normalise_working_unit_groups({
  active_groups = [],
  active_staff_map,
  active_asset_map,
  labour_driver_map = new Map(),
}) {
  return safe_array(active_groups).map((group, index) => {
    const staff_ids = get_group_staff_ids(group);
    const asset_ids = get_group_asset_ids(group);

    const valid_staff_ids = staff_ids.filter((staff_id) =>
      active_staff_map.has(staff_id) || labour_driver_map.has(staff_id)
    );

    const valid_asset_ids = asset_ids.filter((asset_id) =>
      active_asset_map.has(asset_id)
    );

    const missing_staff_ids = staff_ids.filter(
      (staff_id) => !active_staff_map.has(staff_id)
    );

    const missing_asset_ids = asset_ids.filter(
      (asset_id) => !active_asset_map.has(asset_id)
    );

    const has_productive_labour = valid_staff_ids.length > 0;
    const has_productive_assets = valid_asset_ids.length > 0;
    const labour_driver_rows = valid_staff_ids
      .map((staff_id) => labour_driver_map.get(staff_id))
      .filter(Boolean);

    const is_valid =
      (has_productive_labour || has_productive_assets) &&
      missing_staff_ids.length === 0 &&
      missing_asset_ids.length === 0;

    return {
      ...group,
      group_id:
        group.group_id || group.operational_group_id || group.id || `group-${index}`,
      group_name:
        group.group_name || group.name || `Working Unit ${index + 1}`,
      required_staff_ids: staff_ids,
      required_asset_ids: asset_ids,
      valid_staff_ids,
      valid_asset_ids,
      missing_staff_ids,
      missing_asset_ids,
      labour_driver_ids: valid_staff_ids,
      labour_driver_rows,
      has_productive_labour,
      has_productive_assets,
      is_valid,
    };
  });
}

function build_working_unit_validation_warnings(validated_groups = []) {
  const warnings = [];

  safe_array(validated_groups).forEach((group) => {
    if (group.is_valid) {
      return;
    }

    if (
      !group.has_productive_labour &&
      !group.has_productive_assets &&
      group.missing_staff_ids.length === 0 &&
      group.missing_asset_ids.length === 0
    ) {
      warnings.push({
        warning_key: "working_unit_empty",
        group_id: group.group_id,
        message: `${group.group_name} has no productive labour or productive assets selected.`,
      });
    }

    if (group.missing_staff_ids.length > 0) {
      warnings.push({
        warning_key: "working_unit_missing_staff",
        group_id: group.group_id,
        message: `${group.group_name} includes staff that are no longer active.`,
      });
    }

    if (group.missing_asset_ids.length > 0) {
      warnings.push({
        warning_key: "working_unit_missing_asset",
        group_id: group.group_id,
        message: `${group.group_name} includes assets that are no longer active.`,
      });
    }
  });

  return warnings;
}

function get_working_unit_structure_valid({
  active_recovery_model,
  asset_recovery_selected,
  duplicate_link_warnings,
  active_staff_count,
  active_asset_count,
  linked_staff_count,
  linked_asset_count,
  total_operational_groups,
  invalid_operational_groups,
}) {
  if (duplicate_link_warnings.length > 0) {
    return false;
  }

  if (total_operational_groups <= 0) {
    return false;
  }

  if (invalid_operational_groups > 0) {
    return false;
  }

  if (active_staff_count > 0 && linked_staff_count <= 0) {
    return false;
  }

  if (asset_recovery_selected && active_asset_count > 0 && linked_asset_count <= 0) {
    return false;
  }

  return true;
}

function build_operational_group_cost_rows({
  validated_groups = [],
  labour_driver_map,
  active_asset_map,
  overhead_cost = 0,
}) {
  const initial_rows = safe_array(validated_groups).map((group) => {
    const labour_drivers = get_group_staff_ids(group)
      .map((labour_driver_id) => labour_driver_map.get(labour_driver_id))
      .filter(Boolean);

    const assets = get_group_asset_ids(group)
      .map((asset_id) => active_asset_map.get(asset_id))
      .filter(Boolean);

    const annual_labour_cost = labour_drivers.reduce(
      (sum, driver) => sum + safe_number(driver.total_labour_cost),
      0
    );

    const annual_asset_cost = assets.reduce(
      (sum, asset) => sum + get_asset_recovery_cost(asset),
      0
    );

    const group_productive_hours = labour_drivers.reduce(
      (sum, driver) => sum + safe_number(driver.total_productive_hours),
      0
    );

    const group_asset_utilisation_hours = assets.reduce(
      (sum, asset) => sum + safe_number(asset.utilisation_hours_annual),
      0
    );

    const group_capacity_hours =
      group_productive_hours > 0
        ? group_productive_hours
        : group_asset_utilisation_hours;

    return {
      group_id: group.group_id,
      group_name: group.group_name,
      labour_driver_ids: labour_drivers.map((driver) => driver.labour_driver_id),
      labour_driver_labels: labour_drivers.map(
        (driver) => driver.labour_driver_label
      ),
      selected_asset_ids: assets.map((asset) => asset.asset_id),
      selected_asset_names: assets.map(
        (asset) => asset.asset_name || "Unnamed asset"
      ),
      annual_labour_cost,
      annual_asset_cost,
      group_productive_hours,
      group_asset_utilisation_hours,
      group_capacity_hours,
      annual_overhead_allocation: 0,
      total_group_annual_cost: annual_labour_cost + annual_asset_cost,
      group_recovery_basis_label:
        group_capacity_hours > 0 ? "Operating hours" : "Unassigned capacity",
      group_required_recovery_rate:
        group_capacity_hours > 0
          ? (annual_labour_cost + annual_asset_cost) / group_capacity_hours
          : 0,
    };
  });

  const total_capacity_hours = initial_rows.reduce(
    (sum, row) => sum + safe_number(row.group_capacity_hours),
    0
  );
  const valid_rows = initial_rows.filter((row) => row.group_capacity_hours > 0);
  const equal_overhead_share =
    total_capacity_hours <= 0 && valid_rows.length > 0
      ? safe_number(overhead_cost) / valid_rows.length
      : 0;

  return initial_rows.map((row) => {
    const annual_overhead_allocation =
      total_capacity_hours > 0
        ? safe_number(overhead_cost) *
          (safe_number(row.group_capacity_hours) / total_capacity_hours)
        : row.group_capacity_hours > 0
          ? equal_overhead_share
          : 0;

    const total_group_annual_cost =
      row.annual_labour_cost +
      row.annual_asset_cost +
      annual_overhead_allocation;

    return {
      ...row,
      annual_overhead_allocation,
      total_group_annual_cost,
      group_required_recovery_rate:
        row.group_capacity_hours > 0
          ? total_group_annual_cost / row.group_capacity_hours
          : 0,
    };
  });
}

function sum_rows(rows = [], key) {
  return safe_array(rows).reduce((sum, row) => sum + safe_number(row?.[key]), 0);
}

export function calculate_cost_allocation(inputs = {}) {
  const active_staff = safe_array(inputs?.active_staff);
  const active_assets = safe_array(inputs?.active_assets).map(
    normalise_asset_for_cost_allocation
  );

  const productive_assets = active_assets.filter(
    (asset) => asset?.asset_type === "productive"
  );
  const support_assets = active_assets.filter(
    (asset) => asset?.asset_type === "support"
  );

  const productive_asset_base_cost =
    inputs?.productive_asset_base_cost !== undefined
      ? safe_number(inputs?.productive_asset_base_cost)
      : productive_assets.reduce(
          (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
          0
        );

  const support_asset_base_cost =
    inputs?.support_asset_base_cost !== undefined
      ? safe_number(inputs?.support_asset_base_cost)
      : support_assets.reduce(
          (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
          0
        );

  const productive_asset_allocated_overhead_cost =
    inputs?.productive_asset_allocated_overhead_cost !== undefined
      ? safe_number(inputs?.productive_asset_allocated_overhead_cost)
      : productive_assets.reduce(
          (sum, asset) =>
            sum + safe_number(asset.allocated_asset_overhead_cost_annual),
          0
        );

  const support_asset_allocated_overhead_cost =
    inputs?.support_asset_allocated_overhead_cost !== undefined
      ? safe_number(inputs?.support_asset_allocated_overhead_cost)
      : support_assets.reduce(
          (sum, asset) =>
            sum + safe_number(asset.allocated_asset_overhead_cost_annual),
          0
        );

  const productive_asset_recovery_cost =
    inputs?.productive_asset_recovery_cost !== undefined
      ? safe_number(inputs?.productive_asset_recovery_cost)
      : productive_assets.reduce(
          (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
          0
        );

  const support_asset_recovery_cost =
    inputs?.support_asset_recovery_cost !== undefined
      ? safe_number(inputs?.support_asset_recovery_cost)
      : support_assets.reduce(
          (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
          0
        );

  const total_allocated_asset_overhead_cost =
    inputs?.total_allocated_asset_overhead_cost !== undefined
      ? safe_number(inputs?.total_allocated_asset_overhead_cost)
      : productive_asset_allocated_overhead_cost +
        support_asset_allocated_overhead_cost;

  const total_asset_recovery_cost =
    inputs?.total_asset_recovery_cost !== undefined
      ? safe_number(inputs?.total_asset_recovery_cost)
      : productive_asset_recovery_cost + support_asset_recovery_cost;

  const asset_recovery_rows = safe_array(inputs?.asset_recovery_rows);
  const productive_labour_type_rows = safe_array(
    inputs?.productive_labour_type_rows
  );
  const operational_group_recovery_rows = safe_array(
    inputs?.operational_group_recovery_rows
  );

  const { active_staff_map, active_asset_map } = build_active_maps(
    active_staff,
    active_assets
  );

  const labour_driver_map = build_labour_driver_maps({
    active_staff,
    productive_labour_type_rows,
  });

  const active_links = get_active_links(
    inputs?.asset_labour_links,
    active_staff_map,
    active_asset_map
  );

  const duplicate_link_warnings = get_duplicate_link_warnings(active_links);

  const active_groups = get_active_groups(inputs?.operational_groups);

  const validated_groups = normalise_working_unit_groups({
    active_groups,
    active_staff_map,
    active_asset_map,
    labour_driver_map,
  });

  const group_validation_warnings =
    build_working_unit_validation_warnings(validated_groups);

  const {
    linked_labour_driver_ids,
    linked_staff_ids,
    linked_asset_ids,
  } = build_working_unit_linked_driver_sets({
    active_groups: validated_groups,
    labour_driver_map,
  });

  const linked_staff_count = linked_staff_ids.size;
  const linked_asset_count = linked_asset_ids.size;
  const linked_labour_driver_count = linked_labour_driver_ids.size;

  const unlinked_staff_count = Math.max(
    active_staff.length - linked_staff_count,
    0
  );

  const unlinked_asset_count = Math.max(
    active_assets.length - linked_asset_count,
    0
  );

  const valid_operational_groups = validated_groups.filter(
    (group) => group?.is_valid
  ).length;

  const invalid_operational_groups = validated_groups.filter(
    (group) => !group?.is_valid
  ).length;

  const orphan_warnings = build_working_unit_orphan_warnings({
    active_staff,
    active_assets,
    linked_staff_ids,
    linked_asset_ids,
  });

  const operational_group_cost_rows = build_operational_group_cost_rows({
    validated_groups,
    labour_driver_map,
    active_asset_map,
    overhead_cost: safe_number(inputs?.overhead_absorbed_cost),
  });

  const total_grouped_labour_cost = sum_rows(
    operational_group_cost_rows,
    "annual_labour_cost"
  );
  const total_grouped_asset_cost = sum_rows(
    operational_group_cost_rows,
    "annual_asset_cost"
  );
  const total_grouped_overhead_cost = sum_rows(
    operational_group_cost_rows,
    "annual_overhead_allocation"
  );
  const total_grouped_operating_cost = sum_rows(
    operational_group_cost_rows,
    "total_group_annual_cost"
  );

  const labour_cost_base =
    safe_number(inputs?.total_people_cost_annual) ||
    safe_number(inputs?.labour_recovery_cost) ||
    productive_labour_type_rows.reduce(
      (sum, row) => sum + safe_number(row.total_labour_cost),
      0
    );
  const asset_cost_base =
    safe_number(inputs?.total_asset_cost_annual) ||
    safe_number(inputs?.asset_recovery_cost) ||
    total_asset_recovery_cost;
  const overhead_cost_base =
    safe_number(inputs?.total_business_overheads) ||
    safe_number(inputs?.overhead_absorbed_cost);

  const unassigned_labour_cost = Math.max(
    labour_cost_base - total_grouped_labour_cost,
    0
  );
  const unassigned_asset_cost = Math.max(
    asset_cost_base - total_grouped_asset_cost,
    0
  );
  const unassigned_overhead_cost = Math.max(
    overhead_cost_base - total_grouped_overhead_cost,
    0
  );
  const total_unassigned_cost =
    unassigned_labour_cost + unassigned_asset_cost + unassigned_overhead_cost;

  const productive_asset_utilisation_hours_annual = productive_assets.reduce(
    (sum, asset) => sum + safe_number(asset.utilisation_hours_annual),
    0
  );

  const has_productive_asset_zero_utilisation = productive_assets.some(
    (asset) => safe_number(asset.utilisation_hours_annual) <= 0
  );

  const has_asset_without_labour_driver_group = validated_groups.some(
    (group) => group.has_productive_assets && !group.has_productive_labour
  );

  const has_labour_without_productive_capacity_group =
    operational_group_cost_rows.some((group) => {
      return (
        group.labour_driver_ids.length > 0 &&
        safe_number(group.group_capacity_hours) <= 0
      );
    });

  const staff_coverage_percent = calculate_coverage_percent(
    linked_staff_count,
    active_staff.length
  );

  const asset_coverage_percent = calculate_coverage_percent(
    linked_asset_count,
    active_assets.length
  );

  const group_coverage_percent = calculate_coverage_percent(
    valid_operational_groups,
    validated_groups.length
  );

  const total_productive_hours = active_staff.reduce(
    (sum, staff) => sum + safe_number(staff?.productive_hours),
    0
  );

  const recovery_summary_ready = inputs?.recovery_summary_ready === true;

  const missing_recovery_plan_target =
    safe_number(inputs?.recovery_plan_target_per_driver) <= 0;

  const missing_component_required_recovery = !has_component_required_recovery(
    inputs?.component_required_recovery
  );

  const labour_share_percent = safe_number(inputs?.labour_share_percent);
  const asset_share_percent = safe_number(inputs?.asset_share_percent);
  const material_share_percent = safe_number(inputs?.material_share_percent);

  const overhead_absorbed_percent = safe_number(
    inputs?.overhead_absorbed_percent ?? inputs?.overhead_share_percent
  );

  const overhead_share_percent = overhead_absorbed_percent;

  const has_internal_capacity_shortfall =
    labour_share_percent > 0 && total_productive_hours <= 0;

  const external_delivery_enabled = inputs?.external_delivery_enabled === true;
  const external_delivery_required = has_internal_capacity_shortfall;

  const asset_recovery_selected =
    asset_share_percent > 0 || inputs?.asset_recovery_included === true;

  const material_recovery_selected =
    material_share_percent > 0 || inputs?.material_recovery_included === true;

  const has_productive_asset_recovery_base =
    inputs?.has_productive_asset_recovery_base === true ||
    productive_assets.length > 0;

  const has_asset_structure_issue =
    asset_recovery_selected &&
    (!has_productive_asset_recovery_base ||
      active_assets.length === 0 ||
      linked_asset_count === 0 ||
      invalid_operational_groups > 0);

  const structure_valid = get_working_unit_structure_valid({
    active_recovery_model: inputs?.active_recovery_model,
    asset_recovery_selected,
    duplicate_link_warnings,
    active_staff_count: active_staff.length,
    active_asset_count: active_assets.length,
    linked_staff_count,
    linked_asset_count,
    total_operational_groups: validated_groups.length,
    invalid_operational_groups,
  });

  const has_low_staff_coverage =
    active_staff.length > 0 && staff_coverage_percent < 70;

  const has_low_asset_coverage =
    active_assets.length > 0 && asset_coverage_percent < 70;

  const has_low_group_coverage =
    validated_groups.length > 0 && group_coverage_percent < 70;

  const has_low_coverage =
    has_low_staff_coverage || has_low_asset_coverage || has_low_group_coverage;

  const {
    setup_warnings,
    structural_warnings,
    allocation_warnings,
  } = build_cost_allocation_warnings({
    recovery_summary_ready,
    missing_recovery_plan_target,
    missing_component_required_recovery,
    structure_valid,
    unlinked_staff_count,
    unlinked_asset_count,
    has_low_staff_coverage,
    has_low_asset_coverage,
    has_low_group_coverage,
    has_internal_capacity_shortfall,
    external_delivery_required,
    external_delivery_enabled,
    has_asset_structure_issue,
    has_no_labour_cost: labour_cost_base <= 0,
    has_no_productive_labour_driver: labour_driver_map.size <= 0,
    has_productive_asset_zero_utilisation,
    has_asset_without_labour_driver_group,
    has_labour_without_productive_capacity_group,
    has_unassigned_cost: total_unassigned_cost > 0,
    has_no_operational_groups: validated_groups.length <= 0,
    duplicate_link_warnings,
    invalid_operational_groups,
  });

  const allocation_dependency_type = get_allocation_dependency_type({
    has_internal_capacity_shortfall,
    external_delivery_required:
      external_delivery_required && external_delivery_enabled,
    has_asset_structure_issue,
  });

  const allocation_status = get_allocation_status({
    recovery_summary_ready,
    missing_recovery_plan_target,
    missing_component_required_recovery,
    structure_valid,
    has_asset_structure_issue,
    has_internal_capacity_shortfall,
    external_delivery_enabled,
    has_low_coverage,
  });

  return {
    active_recovery_model: normalise_recovery_model(
      inputs?.active_recovery_model ?? "labour_led"
    ),
    recovery_model: normalise_recovery_model(
      inputs?.recovery_model ?? inputs?.active_recovery_model ?? "labour_led"
    ),
    recovery_plan_target_per_driver: safe_number(
      inputs?.recovery_plan_target_per_driver
    ),
    recovery_plan_split: inputs?.recovery_plan_split ?? null,
    component_required_recovery: inputs?.component_required_recovery ?? null,

    labour_share_percent,
    asset_share_percent,
    material_share_percent,
    overhead_absorbed_percent,
    overhead_share_percent,

    labour_recovery_cost: safe_number(inputs?.labour_recovery_cost),
    asset_recovery_cost: safe_number(inputs?.asset_recovery_cost),
    material_recovery_cost: safe_number(inputs?.material_recovery_cost),
    overhead_absorbed_cost: safe_number(inputs?.overhead_absorbed_cost),

    required_labour_recovery_rate: safe_number(
      inputs?.required_labour_recovery_rate
    ),
    required_asset_recovery: safe_number(inputs?.required_asset_recovery),
    required_material_recovery: safe_number(inputs?.required_material_recovery),
    recovery_hours_used: safe_number(inputs?.recovery_hours_used),
    required_recovery_rate: safe_number(inputs?.required_recovery_rate),
    actual_recovery_rate: safe_number(inputs?.actual_recovery_rate),
    profit_or_deficit_per_recovery_hour: safe_number(
      inputs?.profit_or_deficit_per_recovery_hour
    ),

    material_recovery_included: material_recovery_selected,
    asset_recovery_included: asset_recovery_selected,
    material_margin_status: inputs?.material_margin_status ?? "not_selected",
    asset_utilisation_status:
      inputs?.asset_utilisation_status ?? "not_selected",

    has_productive_asset_recovery_base,
    productive_asset_count: productive_assets.length,
    support_asset_count: support_assets.length,

    productive_asset_base_cost,
    support_asset_base_cost,
    productive_asset_allocated_overhead_cost,
    support_asset_allocated_overhead_cost,
    productive_asset_recovery_cost,
    support_asset_recovery_cost,
    total_allocated_asset_overhead_cost,
    total_asset_recovery_cost,

    asset_recovery_rows,
    productive_labour_type_rows,
    operational_group_recovery_rows,
    operational_group_cost_rows,

    total_grouped_labour_cost,
    total_grouped_asset_cost,
    total_grouped_overhead_cost,
    total_grouped_operating_cost,
    unassigned_labour_cost,
    unassigned_asset_cost,
    unassigned_overhead_cost,
    total_unassigned_cost,
    productive_asset_utilisation_hours_annual,
    group_recovery_basis_label: "Operating hours",
    group_required_recovery_rate:
      operational_group_cost_rows.length > 0
        ? operational_group_cost_rows.reduce(
            (highest, group) =>
              Math.max(highest, safe_number(group.group_required_recovery_rate)),
            0
          )
        : 0,

    productive_asset_cost: productive_asset_recovery_cost,
    support_asset_cost: support_asset_recovery_cost,

    business_type: inputs?.business_type ?? "labour_based",
    activity_driver_type: inputs?.activity_driver_type ?? "hours",
    activity_driver_value: safe_number(inputs?.activity_driver_value),
    margin_pool: safe_number(inputs?.margin_pool),
    total_cost_burden: safe_number(inputs?.total_cost_burden),
    net_position: safe_number(inputs?.net_position),
    model_trust_state: inputs?.model_trust_state ?? "blocked",

    allocation_status,
    allocation_dependency_type,
    setup_warnings,
    structural_warnings,
    allocation_warnings,

    active_allocation_profile_id:
      inputs?.active_allocation_profile_id ?? "live",
    allocation_profile_name:
      inputs?.allocation_profile_name ?? "Default Allocation Profile",
    effective_from: inputs?.effective_from ?? "",

    active_staff,
    active_assets,
    active_asset_labour_links: active_links,
    active_operational_groups: validated_groups,

    linked_staff_count,
    linked_labour_driver_count,
    unlinked_staff_count,
    linked_asset_count,
    unlinked_asset_count,

    total_active_staff: active_staff.length,
    total_active_assets: active_assets.length,

    total_operational_groups: validated_groups.length,
    valid_operational_groups,
    invalid_operational_groups,

    duplicate_link_warnings,
    orphan_warnings,
    group_validation_warnings,

    structure_valid,
    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,

    external_delivery_enabled,
    external_delivery_required,
    internal_capacity_shortfall: has_internal_capacity_shortfall,
  };
}
