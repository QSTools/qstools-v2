export function buildLabourProfileRows({
  profiles = [],
  active_profile_id = "",
}) {
  return [...profiles]
    .sort((left, right) => {
      const left_time = new Date(
        left.updated_at || left.created_at || 0
      ).getTime();
      const right_time = new Date(
        right.updated_at || right.created_at || 0
      ).getTime();
      return right_time - left_time;
    })
    .map((profile) => {
      const data = profile?.data ?? {};

      return {
        profile_id: profile?.profile_id ?? "",
        staff_id: data.staff_id ?? "",
        staff_name: data.staff_name || "Unnamed staff",
        staff_role: data.staff_role || "No role",
        labour_class: data.labour_class || "No class",
        is_current: profile?.profile_id === active_profile_id,
        updated_at_label: profile?.updated_at || profile?.created_at || "",
      };
    });
}