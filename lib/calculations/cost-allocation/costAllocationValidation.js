import { safe_array } from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

function make_warning(message) {
  return message;
}

export function normalise_recovery_model(value) {
  if (value === "labour_only") return "labour_led";
  if (value === "asset_driven") return "asset_led";

  if (
    value === "labour_led" ||
    value === "asset_led" ||
    value === "material_led" ||
    value === "hybrid"
  ) {
    return value;
  }

  return "labour_led";
}

export function get_duplicate_link_warnings(active_links) {
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

export function get_orphan_warnings({
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
        make_warning(
          `${staff?.staff_name ?? "Staff"} is not linked to any asset.`
        )
      );
    }

    if (!grouped_staff_ids.has(staff?.staff_id)) {
      orphan_warnings.push(
        make_warning(
          `${staff?.staff_name ?? "Staff"} is not included in any active group.`
        )
      );
    }
  });

  active_assets.forEach((asset) => {
    if (!linked_asset_ids.has(asset?.asset_id)) {
      orphan_warnings.push(
        make_warning(
          `${asset?.asset_name ?? "Asset"} is not linked to any staff.`
        )
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

export function validate_groups({
  active_groups,
  active_asset_map,
  active_staff_map,
}) {
  const group_validation_warnings = [];
  const validated_groups = [];

  active_groups.forEach((group) => {
    const required_asset_ids = safe_array(group?.required_asset_ids).filter(
      Boolean
    );
    const required_staff_ids = safe_array(group?.required_staff_ids).filter(
      Boolean
    );

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

export function get_structure_valid({
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

  const recovery_model = normalise_recovery_model(active_recovery_model);

  if (recovery_model === "labour_led" || recovery_model === "material_led") {
    return true;
  }

  if (recovery_model === "asset_led") {
    return (
      active_staff_count > 0 &&
      active_asset_count > 0 &&
      linked_staff_count > 0 &&
      linked_asset_count > 0 &&
      total_operational_groups > 0 &&
      invalid_operational_groups === 0
    );
  }

  if (recovery_model === "hybrid") {
    if (asset_recovery_selected) {
      return (
        linked_staff_count > 0 &&
        linked_asset_count > 0 &&
        total_operational_groups > 0 &&
        invalid_operational_groups === 0
      );
    }

    return (
      linked_staff_count > 0 ||
      linked_asset_count > 0 ||
      total_operational_groups > 0
    );
  }

  return false;
}

export function has_component_required_recovery(component_required_recovery) {
  return (
    component_required_recovery &&
    typeof component_required_recovery === "object" &&
    component_required_recovery.labour &&
    component_required_recovery.asset &&
    component_required_recovery.material &&
    component_required_recovery.overhead
  );
}
