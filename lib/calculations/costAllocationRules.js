function safe_array(value) {
  return Array.isArray(value) ? value : [];
}

function safe_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function make_warning(message) {
  return message;
}

function make_allocation_warning(warning_key, message) {
  return {
    warning_key,
    message,
  };
}

export function build_cost_allocation_inputs({
  recovery_summary,
  labour,
  assets,
  allocation_state,
}) {
  const recovery_outputs = recovery_summary?.output_contract ?? recovery_summary ?? {};

  const active_staff = Array.isArray(labour?.active_staff)
    ? labour.active_staff
    : [];

  const active_assets = Array.isArray(assets?.active_assets)
    ? assets.active_assets
    : [];

  return {
    active_recovery_model:
      recovery_outputs?.active_recovery_model ?? "labour_only",

    recovery_summary_ready:
      recovery_outputs?.recovery_summary_ready === true,
    recovery_summary_status:
      recovery_outputs?.recovery_summary_status ?? "blocked",
    recovery_summary_warnings:
      safe_array(recovery_outputs?.recovery_summary_warnings),
    recovery_model: recovery_outputs?.recovery_model ?? "labour_only",
    recovery_plan_target_per_driver: safe_number(
      recovery_outputs?.recovery_plan_target_per_driver
    ),
    recovery_plan_split: recovery_outputs?.recovery_plan_split ?? null,
    component_required_recovery:
      recovery_outputs?.component_required_recovery ?? null,
    labour_recovery_cost: safe_number(recovery_outputs?.labour_recovery_cost),
    asset_recovery_cost: safe_number(recovery_outputs?.asset_recovery_cost),
    overhead_absorbed_cost: safe_number(
      recovery_outputs?.overhead_absorbed_cost
    ),
    required_labour_recovery_rate: safe_number(
      recovery_outputs?.required_labour_recovery_rate
    ),
    required_asset_recovery: safe_number(
      recovery_outputs?.required_asset_recovery
    ),
    business_type: recovery_outputs?.business_type ?? "labour_based",
    activity_driver_type: recovery_outputs?.activity_driver_type ?? "hours",
    activity_driver_value: safe_number(recovery_outputs?.activity_driver_value),
    margin_pool: safe_number(recovery_outputs?.margin_pool),
    total_cost_burden: safe_number(recovery_outputs?.total_cost_burden),
    net_position: safe_number(recovery_outputs?.net_position),
    model_trust_state: recovery_outputs?.model_trust_state ?? "blocked",

    labour_share_percent: safe_number(
      recovery_outputs?.labour_share_percent
    ),

    asset_share_percent: safe_number(
      recovery_outputs?.asset_share_percent
    ),

    overhead_share_percent: safe_number(
      recovery_outputs?.overhead_share_percent
    ),

    active_staff: active_staff.map((staff) => ({
      staff_id: staff?.staff_id ?? "",
      staff_name: staff?.staff_name ?? "Unnamed staff",
      staff_role: staff?.staff_role ?? "",
      labour_class: staff?.labour_class ?? "",
      is_active: Boolean(staff?.is_active),
      productive_hours: safe_number(staff?.productive_hours),
    })),

    active_assets: active_assets.map((asset) => ({
      asset_id: asset?.asset_id ?? "",
      asset_name: asset?.asset_name ?? "Unnamed asset",
      is_active: Boolean(asset?.is_active),
    })),

    allocation_profile_name:
      allocation_state?.allocation_profile_name ?? "Default Allocation Profile",

    effective_from: allocation_state?.effective_from ?? "",

    asset_labour_links: safe_array(allocation_state?.asset_labour_links),

    operational_groups: safe_array(allocation_state?.operational_groups),

    active_allocation_profile_id:
      allocation_state?.active_allocation_profile_id ?? "live",

    external_delivery_enabled:
      allocation_state?.external_delivery_enabled === true,
    external_delivery_note: allocation_state?.external_delivery_note ?? "",
  };
}

function build_active_maps(active_staff, active_assets) {
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

function get_active_links(asset_labour_links, active_staff_map, active_asset_map) {
  return safe_array(asset_labour_links).filter((link) => {
    return (
      link?.is_active &&
      active_staff_map.has(link?.staff_id) &&
      active_asset_map.has(link?.asset_id)
    );
  });
}

function get_active_groups(operational_groups) {
  return safe_array(operational_groups).filter((group) => group?.is_active);
}

function get_duplicate_link_warnings(active_links) {
  const seen_pairs = new Set();
  const duplicate_link_warnings = [];

  active_links.forEach((link) => {
    const pair_key = `${link?.asset_id}__${link?.staff_id}`;

    if (seen_pairs.has(pair_key)) {
      duplicate_link_warnings.push(
        make_warning(
          `Duplicate active link detected for asset_id "${link?.asset_id}" and staff_id "${link?.staff_id}".`
        )
      );
      return;
    }

    seen_pairs.add(pair_key);
  });

  return duplicate_link_warnings;
}

function get_linked_sets(active_links) {
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

function get_orphan_warnings({
  active_staff,
  active_assets,
  linked_staff_ids,
  linked_asset_ids,
  active_groups,
}) {
  const orphan_warnings = [];

  const grouped_asset_ids = new Set();
  const grouped_staff_ids = new Set();

  active_groups.forEach((group) => {
    safe_array(group?.required_asset_ids).forEach((asset_id) => {
      if (asset_id) {
        grouped_asset_ids.add(asset_id);
      }
    });

    safe_array(group?.required_staff_ids).forEach((staff_id) => {
      if (staff_id) {
        grouped_staff_ids.add(staff_id);
      }
    });
  });

  active_staff.forEach((staff) => {
    if (!linked_staff_ids.has(staff?.staff_id)) {
      orphan_warnings.push(
        make_warning(`${staff?.staff_name ?? "Staff"} is not linked to any asset.`)
      );
    }

    if (!grouped_staff_ids.has(staff?.staff_id)) {
      orphan_warnings.push(
        make_warning(`${staff?.staff_name ?? "Staff"} is not included in any active group.`)
      );
    }
  });

  active_assets.forEach((asset) => {
    if (!linked_asset_ids.has(asset?.asset_id)) {
      orphan_warnings.push(
        make_warning(`${asset?.asset_name ?? "Asset"} is not linked to any staff.`)
      );
    }

    if (!grouped_asset_ids.has(asset?.asset_id)) {
      orphan_warnings.push(
        make_warning(
          `${asset?.asset_name ?? "Asset"} is not included in any active group.`
        )
      );
    }
  });

  return orphan_warnings;
}

function validate_groups({
  active_groups,
  active_asset_map,
  active_staff_map,
}) {
  const group_validation_warnings = [];
  const validated_groups = [];

  active_groups.forEach((group) => {
    const required_asset_ids = safe_array(group?.required_asset_ids).filter(Boolean);
    const required_staff_ids = safe_array(group?.required_staff_ids).filter(Boolean);

    const missing_asset_ids = required_asset_ids.filter(
      (asset_id) => !active_asset_map.has(asset_id)
    );

    const missing_staff_ids = required_staff_ids.filter(
      (staff_id) => !active_staff_map.has(staff_id)
    );

    const asset_requirement_met = missing_asset_ids.length === 0;
    const staff_requirement_met = missing_staff_ids.length === 0;

    const is_valid = asset_requirement_met && staff_requirement_met;

    if (!asset_requirement_met) {
      group_validation_warnings.push(
        make_warning(
          `${group?.group_name ?? "Group"} is invalid: missing required assets (${missing_asset_ids.join(", ")}).`
        )
      );
    }

    if (!staff_requirement_met) {
      group_validation_warnings.push(
        make_warning(
          `${group?.group_name ?? "Group"} is invalid: missing required staff (${missing_staff_ids.join(", ")}).`
        )
      );
    }

    validated_groups.push({
      ...group,
      required_asset_ids,
      required_staff_ids,
      is_valid,
      missing_asset_ids,
      missing_staff_ids,
    });
  });

  return {
    validated_groups,
    group_validation_warnings,
  };
}

function calculate_coverage_percent(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

function get_structure_valid({
  active_recovery_model,
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

  if (active_recovery_model === "labour_only") {
    return true;
  }

  if (active_recovery_model === "asset_driven") {
    return (
      active_staff_count > 0 &&
      active_asset_count > 0 &&
      linked_staff_count > 0 &&
      linked_asset_count > 0 &&
      total_operational_groups > 0 &&
      invalid_operational_groups === 0
    );
  }

  if (active_recovery_model === "hybrid") {
    return (
      linked_staff_count > 0 ||
      linked_asset_count > 0 ||
      total_operational_groups > 0
    );
  }

  return false;
}

function has_component_required_recovery(component_required_recovery) {
  return (
    component_required_recovery &&
    typeof component_required_recovery === "object" &&
    component_required_recovery.labour &&
    component_required_recovery.asset &&
    component_required_recovery.overhead
  );
}

function get_allocation_dependency_type({
  has_internal_capacity_shortfall,
  external_delivery_required,
  has_asset_structure_issue,
}) {
  const dependency_types = [];

  if (has_internal_capacity_shortfall) {
    dependency_types.push("internal_capacity");
  }

  if (external_delivery_required) {
    dependency_types.push("external_delivery");
  }

  if (has_asset_structure_issue) {
    dependency_types.push("asset_structure");
  }

  if (dependency_types.length === 0) {
    return "none";
  }

  if (dependency_types.length > 1) {
    return "mixed";
  }

  return dependency_types[0] ?? "unknown";
}

function get_allocation_status({
  recovery_summary_ready,
  missing_recovery_plan_target,
  missing_component_required_recovery,
  structure_valid,
  has_asset_structure_issue,
  has_internal_capacity_shortfall,
  external_delivery_enabled,
  has_low_coverage,
}) {
  if (
    !recovery_summary_ready ||
    missing_recovery_plan_target ||
    missing_component_required_recovery ||
    has_asset_structure_issue ||
    !structure_valid
  ) {
    return "not_supported";
  }

  if (has_internal_capacity_shortfall && external_delivery_enabled) {
    return "ready_with_dependency";
  }

  if (has_internal_capacity_shortfall || has_low_coverage) {
    return "strained";
  }

  return "ready";
}

export function calculate_cost_allocation(inputs = {}) {
  const active_staff = safe_array(inputs?.active_staff);
  const active_assets = safe_array(inputs?.active_assets);

  const { active_staff_map, active_asset_map } = build_active_maps(
    active_staff,
    active_assets
  );

  const active_links = get_active_links(
    inputs?.asset_labour_links,
    active_staff_map,
    active_asset_map
  );

  const duplicate_link_warnings = get_duplicate_link_warnings(active_links);

  const { linked_staff_ids, linked_asset_ids } = get_linked_sets(active_links);

  const active_groups = get_active_groups(inputs?.operational_groups);

  const { validated_groups, group_validation_warnings } = validate_groups({
    active_groups,
    active_asset_map,
    active_staff_map,
  });

  const linked_staff_count = linked_staff_ids.size;
  const linked_asset_count = linked_asset_ids.size;
  const unlinked_staff_count = Math.max(active_staff.length - linked_staff_count, 0);
  const unlinked_asset_count = Math.max(active_assets.length - linked_asset_count, 0);

  const valid_operational_groups = validated_groups.filter(
    (group) => group?.is_valid
  ).length;

  const invalid_operational_groups = validated_groups.filter(
    (group) => !group?.is_valid
  ).length;

  const orphan_warnings = get_orphan_warnings({
    active_staff,
    active_assets,
    linked_staff_ids,
    linked_asset_ids,
    active_groups: validated_groups,
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

  const structure_valid = get_structure_valid({
    active_recovery_model: inputs?.active_recovery_model,
    duplicate_link_warnings,
    active_staff_count: active_staff.length,
    active_asset_count: active_assets.length,
    linked_staff_count,
    linked_asset_count,
    total_operational_groups: validated_groups.length,
    invalid_operational_groups,
  });

  const recovery_summary_ready = inputs?.recovery_summary_ready === true;
  const missing_recovery_plan_target =
    safe_number(inputs?.recovery_plan_target_per_driver) <= 0;
  const missing_component_required_recovery =
    !has_component_required_recovery(inputs?.component_required_recovery);
  const labour_share_percent = safe_number(inputs?.labour_share_percent);
  const asset_share_percent = safe_number(inputs?.asset_share_percent);
  const overhead_share_percent = safe_number(inputs?.overhead_share_percent);
  const has_internal_capacity_shortfall =
    labour_share_percent > 0 && total_productive_hours <= 0;
  const external_delivery_enabled = inputs?.external_delivery_enabled === true;
  const external_delivery_required = has_internal_capacity_shortfall;
  const asset_recovery_selected = asset_share_percent > 0;
  const has_asset_structure_issue =
    asset_recovery_selected &&
    (active_assets.length === 0 ||
      linked_asset_count === 0 ||
      invalid_operational_groups > 0);
  const has_low_staff_coverage =
    active_staff.length > 0 && staff_coverage_percent < 70;
  const has_low_asset_coverage =
    active_assets.length > 0 && asset_coverage_percent < 70;
  const has_low_group_coverage =
    validated_groups.length > 0 && group_coverage_percent < 70;
  const has_low_coverage =
    has_low_staff_coverage || has_low_asset_coverage || has_low_group_coverage;

  const allocation_warnings = [];

  if (!recovery_summary_ready) {
    allocation_warnings.push(
      make_allocation_warning(
        "recovery_summary_not_ready",
        "Recovery Summary is not ready, so Cost Allocation is preview only."
      )
    );
  }

  if (missing_recovery_plan_target) {
    allocation_warnings.push(
      make_allocation_warning(
        "missing_recovery_plan_target",
        "Recovery plan target per driver is missing from Recovery Summary."
      )
    );
  }

  if (missing_component_required_recovery) {
    allocation_warnings.push(
      make_allocation_warning(
        "missing_component_required_recovery",
        "Component required recovery is missing from Recovery Summary."
      )
    );
  }

  if (!structure_valid) {
    allocation_warnings.push(
      make_allocation_warning(
        "structure_incomplete",
        "Allocation structure is incomplete for the selected recovery plan."
      )
    );
  }

  if (has_low_staff_coverage) {
    allocation_warnings.push(
      make_allocation_warning(
        "low_staff_coverage",
        "Staff coverage is low for the visible allocation structure."
      )
    );
  }

  if (has_low_asset_coverage) {
    allocation_warnings.push(
      make_allocation_warning(
        "low_asset_coverage",
        "Asset coverage is low for the visible allocation structure."
      )
    );
  }

  if (has_low_group_coverage) {
    allocation_warnings.push(
      make_allocation_warning(
        "low_group_coverage",
        "Operational group coverage is low for the visible allocation structure."
      )
    );
  }

  if (has_internal_capacity_shortfall) {
    allocation_warnings.push(
      make_allocation_warning(
        "internal_capacity_shortfall",
        "The recovery plan requires internal capacity beyond current productive staff hours."
      )
    );
  }

  if (external_delivery_required) {
    allocation_warnings.push(
      make_allocation_warning(
        "external_delivery_required",
        "This recovery plan requires visible external delivery capacity."
      )
    );
  }

  if (external_delivery_required && !external_delivery_enabled) {
    allocation_warnings.push(
      make_allocation_warning(
        "external_delivery_not_defined",
        "External delivery is required, but no external delivery assumption has been confirmed."
      )
    );
  }

  if (has_asset_structure_issue) {
    allocation_warnings.push(
      make_allocation_warning(
        "asset_recovery_without_asset_structure",
        "Asset recovery is selected, but asset structure is incomplete."
      )
    );
  }

  if (duplicate_link_warnings.length > 0) {
    allocation_warnings.push(
      make_allocation_warning(
        "duplicate_active_links",
        "Duplicate active asset-staff links exist."
      )
    );
  }

  if (unlinked_staff_count > 0) {
    allocation_warnings.push(
      make_allocation_warning(
        "orphan_staff",
        "Active staff are not fully linked in the allocation structure."
      )
    );
  }

  if (unlinked_asset_count > 0) {
    allocation_warnings.push(
      make_allocation_warning(
        "orphan_assets",
        "Active assets are not fully linked in the allocation structure."
      )
    );
  }

  if (invalid_operational_groups > 0) {
    allocation_warnings.push(
      make_allocation_warning(
        "invalid_operational_groups",
        "One or more operational groups are invalid."
      )
    );
  }

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
    active_recovery_model: inputs?.active_recovery_model ?? "labour_only",
    recovery_model: inputs?.recovery_model ?? inputs?.active_recovery_model ?? "labour_only",
    recovery_plan_target_per_driver: safe_number(
      inputs?.recovery_plan_target_per_driver
    ),
    recovery_plan_split: inputs?.recovery_plan_split ?? null,
    component_required_recovery: inputs?.component_required_recovery ?? null,
    labour_share_percent,
    asset_share_percent,
    overhead_share_percent,
    labour_recovery_cost: safe_number(inputs?.labour_recovery_cost),
    asset_recovery_cost: safe_number(inputs?.asset_recovery_cost),
    overhead_absorbed_cost: safe_number(inputs?.overhead_absorbed_cost),
    required_labour_recovery_rate: safe_number(
      inputs?.required_labour_recovery_rate
    ),
    required_asset_recovery: safe_number(inputs?.required_asset_recovery),
    business_type: inputs?.business_type ?? "labour_based",
    activity_driver_type: inputs?.activity_driver_type ?? "hours",
    activity_driver_value: safe_number(inputs?.activity_driver_value),
    margin_pool: safe_number(inputs?.margin_pool),
    total_cost_burden: safe_number(inputs?.total_cost_burden),
    net_position: safe_number(inputs?.net_position),
    model_trust_state: inputs?.model_trust_state ?? "blocked",

    allocation_status,
    allocation_dependency_type,
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
