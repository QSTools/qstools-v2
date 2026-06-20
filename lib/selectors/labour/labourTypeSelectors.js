import { to_number } from "@/lib/selectors/labour/labourFormatters";
import {
  get_staff_labour_cost,
  get_staff_productive_hours,
} from "@/lib/selectors/labour/labourSharedSelectors";

export function slugify_labour_type_id(value = "") {
  return (
    String(value || "unclassified_productive_labour")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "unclassified_productive_labour"
  );
}

export function format_labour_type_label(value = "") {
  const raw_value = String(value || "").trim();

  if (!raw_value) {
    return "Unclassified productive labour";
  }

  return raw_value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function get_productive_labour_type_key(staff = {}) {
  const labour_class = String(staff?.labour_class || "").trim();
  const staff_type_name = String(staff?.staff_type_name || "").trim();
  const staff_role = String(staff?.staff_role || "").trim();
  const staff_type = String(staff?.staff_type || "").trim();

  if (labour_class) {
    return {
      grouping_field: "labour_class",
      grouping_value: labour_class,
      labour_class,
      staff_role: "",
    };
  }

  if (staff_type_name) {
    return {
      grouping_field: "staff_type_name",
      grouping_value: staff_type_name,
      labour_class: "",
      staff_role: "",
    };
  }

  if (staff_role) {
    return {
      grouping_field: "staff_role",
      grouping_value: staff_role,
      labour_class: "",
      staff_role,
    };
  }

  if (staff_type) {
    return {
      grouping_field: "staff_type",
      grouping_value: staff_type,
      labour_class: "",
      staff_role: "",
    };
  }

  return {
    grouping_field: "unclassified",
    grouping_value: "Unclassified productive labour",
    labour_class: "",
    staff_role: "",
  };
}

export function get_staff_recovery_rate(staff = {}) {
  const existing_rate = to_number(
    staff?.productive_labour_cost_rate ?? staff?.labour_cost_rate
  );

  if (existing_rate > 0) {
    return existing_rate;
  }

  const productive_hours = get_staff_productive_hours(staff);
  const labour_cost = get_staff_labour_cost(staff);

  return productive_hours > 0 ? labour_cost / productive_hours : 0;
}

export function build_productive_labour_types(active_staff = []) {
  const groups = new Map();

  active_staff
    .filter((staff) => staff?.contributes_to_recovery_hours === true)
    .forEach((staff) => {
      const key_detail = get_productive_labour_type_key(staff);
      const labour_type_id = slugify_labour_type_id(key_detail.grouping_value);
      const group_key = `${key_detail.grouping_field}:${labour_type_id}`;
      const productive_hours = get_staff_productive_hours(staff);
      const labour_cost = get_staff_labour_cost(staff);
      const recovery_rate = get_staff_recovery_rate(staff);

      if (!groups.has(group_key)) {
        groups.set(group_key, {
          labour_type_id,
          labour_type_label: format_labour_type_label(
            key_detail.grouping_value
          ),
          labour_class: key_detail.labour_class,
          staff_role: key_detail.staff_role,
          staff_count: 0,
          total_productive_hours: 0,
          total_labour_cost: 0,
          weighted_recovery_rate: 0,
          highest_recovery_rate: 0,
          source_staff_ids: [],
        });
      }

      const group = groups.get(group_key);
      group.staff_count += 1;
      group.total_productive_hours += productive_hours;
      group.total_labour_cost += labour_cost;
      group.highest_recovery_rate = Math.max(
        group.highest_recovery_rate,
        recovery_rate
      );

      const source_staff_id =
        staff?.staff_id || staff?.profile_id || staff?.staff_name || "";

      if (source_staff_id) {
        group.source_staff_ids.push(source_staff_id);
      }
    });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      weighted_recovery_rate:
        group.total_productive_hours > 0
          ? group.total_labour_cost / group.total_productive_hours
          : 0,
    }))
    .sort((left, right) =>
      left.labour_type_label.localeCompare(right.labour_type_label)
    );
}