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

export function build_cost_allocation_inputs({
  recovery_summary,
  labour,
  assets,
  allocation_state,
}) {
  const recovery_outputs = recovery_summary?.output_contract ?? {};

  const active_staff = Array.isArray(labour?.active_staff)
    ? labour.active_staff
    : [];

  const active_assets = Array.isArray(assets?.active_assets)
    ? assets.active_assets
    : [];

  return {
    active_recovery_model:
      recovery_outputs?.active_recovery_model ?? "labour_only",

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

  return {
    active_recovery_model: inputs?.active_recovery_model ?? "labour_only",
    labour_share_percent: safe_number(inputs?.labour_share_percent),
    asset_share_percent: safe_number(inputs?.asset_share_percent),
    overhead_share_percent: safe_number(inputs?.overhead_share_percent),

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
  };
}