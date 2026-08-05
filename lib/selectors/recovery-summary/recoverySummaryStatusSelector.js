import {
  blocking_warning_keys,
  get_model_label,
  get_total_recovery_cost,
  get_warning_label,
  normalise_recovery_model,
  resolve_share_percent,
} from "@/lib/selectors/recovery-summary/recoverySummarySelectorHelpers";

export function buildRecoverySummaryStatus({ calculated = {} } = {}) {
  const warning_items = (calculated.warnings ?? []).map((warning_key) => ({
    warning_key,
    label: get_warning_label(warning_key),
  }));

  const has_blocking_driver =
    (calculated.warnings ?? []).includes("no_activity_driver") ||
    (calculated.warnings ?? []).includes("no_required_recovery_per_driver");

  const has_blocking_warning = warning_items.some((warning) =>
    blocking_warning_keys.has(warning.warning_key)
  );

  const has_commercial_warnings =
    warning_items.length > 0 && !has_blocking_warning;

  const recovery_summary_status =
    has_blocking_driver || has_blocking_warning
      ? "blocked"
      : calculated.model_trust_state !== "ready" &&
          calculated.model_trust_state !== "warning"
        ? "not_trusted"
        : warning_items.length === 0
          ? "ready"
          : "ready_with_warnings";

  const recovery_summary_ready =
    recovery_summary_status === "ready" ||
    recovery_summary_status === "ready_with_warnings";

  const active_recovery_model = normalise_recovery_model(
    calculated.active_recovery_model
  );

  const total_recovery_cost = get_total_recovery_cost(calculated);

  const labour_share_percent = resolve_share_percent({
    displayed_percent: calculated.labour_share_percent ?? 100,
    component_cost: calculated.labour_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const asset_share_percent = resolve_share_percent({
    displayed_percent: calculated.asset_share_percent ?? 0,
    component_cost: calculated.asset_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const material_share_percent = resolve_share_percent({
    displayed_percent: calculated.material_share_percent ?? 0,
    component_cost: calculated.material_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const overhead_absorbed_percent = resolve_share_percent({
    displayed_percent:
      calculated.overhead_absorbed_percent ??
      calculated.overhead_share_percent ??
      0,
    component_cost: calculated.overhead_absorbed_cost,
    total_cost: total_recovery_cost,
  });

  return {
    recovery_summary_ready,
    recovery_summary_status,
    recovery_summary_warnings: warning_items,
    recovery_summary_usable: recovery_summary_ready,
    has_blocking_warnings: has_blocking_warning,
    has_commercial_warnings,

    active_recovery_model,
    active_recovery_model_label: get_model_label(active_recovery_model),

    labour_share_percent,
    asset_share_percent,
    material_share_percent,
    overhead_absorbed_percent,
    overhead_share_percent: overhead_absorbed_percent,

    explained_recovery_total: calculated.explained_recovery_total ?? 100,

    recovery_ready: recovery_summary_ready,
    warning_count: warning_items.length,
    warning_items,
  };
}
