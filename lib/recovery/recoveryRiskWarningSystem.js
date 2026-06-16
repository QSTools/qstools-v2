const WARNING_SEVERITY = {
  BLOCKING: "blocking",
  REVIEW: "review",
  INFO: "info",
};

const WARNING_PRIORITY = {
  SOURCE_TRUST: 10,
  GROSS_PROFIT: 20,
  RECOVERY_RATE: 30,
  RECOVERY_STREAM: 40,
  SHARE_TOTAL: 50,
  DRIVER: 60,
  INFO: 90,
};

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function round_percent(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function normalise_severity(severity) {
  if (
    severity === WARNING_SEVERITY.BLOCKING ||
    severity === WARNING_SEVERITY.REVIEW ||
    severity === WARNING_SEVERITY.INFO
  ) {
    return severity;
  }

  return WARNING_SEVERITY.REVIEW;
}

function normalise_priority(priority) {
  const parsed = Number(priority);
  return Number.isFinite(parsed) ? parsed : WARNING_PRIORITY.INFO;
}

export function build_recovery_warning({
  warning_id,
  severity = WARNING_SEVERITY.REVIEW,
  priority = WARNING_PRIORITY.INFO,
  module = "recovery",
  cost_stream = "general",
  driver = "unknown",
  message,
  headline,
  plain_english,
  review_action,
  cause,
  effect,
  cascade_effect,
  carry_forward_message,
  audit_location,
  context = {},
}) {
  const resolved_message = message || "Review this recovery setup.";

  return {
    warning_id,
    severity: normalise_severity(severity),
    priority: normalise_priority(priority),
    module,
    cost_stream,
    driver,

    message: resolved_message,
    headline: headline || resolved_message,
    plain_english: plain_english || resolved_message,

    review_action:
      review_action || "Review the recovery setup before relying on this result.",

    cause: cause || "",
    effect: effect || "",
    cascade_effect: cascade_effect || "",
    carry_forward_message: carry_forward_message || "",
    audit_location: audit_location || "",

    context,
  };
}

export function build_share_warning_summary(warnings = []) {
  const rows = Array.isArray(warnings) ? warnings : [];

  const blocking_share_warning_count = rows.filter(
    (warning) => warning.severity === WARNING_SEVERITY.BLOCKING
  ).length;

  const review_share_warning_count = rows.filter(
    (warning) => warning.severity === WARNING_SEVERITY.REVIEW
  ).length;

  const info_share_warning_count = rows.filter(
    (warning) => warning.severity === WARNING_SEVERITY.INFO
  ).length;

  return {
    share_warning_count: rows.length,
    blocking_share_warning_count,
    review_share_warning_count,
    info_share_warning_count,
    has_blocking_share_warnings: blocking_share_warning_count > 0,
    has_review_share_warnings: review_share_warning_count > 0,
    share_warning_rows: rows,
  };
}

export function sort_recovery_warnings_by_priority(warnings = []) {
  const rows = Array.isArray(warnings) ? warnings : [];

  return [...rows].sort((a, b) => {
    const priority_a = normalise_priority(a?.priority);
    const priority_b = normalise_priority(b?.priority);

    if (priority_a !== priority_b) {
      return priority_a - priority_b;
    }

    const severity_rank = {
      [WARNING_SEVERITY.BLOCKING]: 1,
      [WARNING_SEVERITY.REVIEW]: 2,
      [WARNING_SEVERITY.INFO]: 3,
    };

    return (
      (severity_rank[a?.severity] || 99) -
      (severity_rank[b?.severity] || 99)
    );
  });
}

export function build_recovery_warning_hierarchy(warnings = []) {
  const sorted_warnings = sort_recovery_warnings_by_priority(warnings);

  const blocking_warnings = sorted_warnings.filter(
    (warning) => warning.severity === WARNING_SEVERITY.BLOCKING
  );

  const review_warnings = sorted_warnings.filter(
    (warning) => warning.severity === WARNING_SEVERITY.REVIEW
  );

  const info_warnings = sorted_warnings.filter(
    (warning) => warning.severity === WARNING_SEVERITY.INFO
  );

  const primary_warning =
    blocking_warnings[0] || review_warnings[0] || info_warnings[0] || null;

  const cascade_warnings = primary_warning
    ? sorted_warnings.filter(
        (warning) => warning.warning_id !== primary_warning.warning_id
      )
    : [];

  return {
    primary_warning,
    cascade_warnings,
    recovery_failure_path: sorted_warnings,
    has_primary_warning: Boolean(primary_warning),
    has_blocking_warning: blocking_warnings.length > 0,
    has_review_warning: review_warnings.length > 0,
    blocking_warning_count: blocking_warnings.length,
    review_warning_count: review_warnings.length,
    info_warning_count: info_warnings.length,
    warning_count: sorted_warnings.length,
  };
}

export function check_recovery_share_total({
  module = "cost_allocation",
  share_rows = [],
  tolerance_percent = 0.01,
}) {
  const rows = Array.isArray(share_rows) ? share_rows : [];

  const recovery_share_total_percent = round_percent(
    rows.reduce((total, row) => total + to_number(row.share_percent), 0)
  );

  const unallocated_share_percent = Math.max(
    0,
    round_percent(100 - recovery_share_total_percent)
  );

  const over_allocated_share_percent = Math.max(
    0,
    round_percent(recovery_share_total_percent - 100)
  );

  const warnings = [];

  if (recovery_share_total_percent < 100 - tolerance_percent) {
    warnings.push(
      build_recovery_warning({
        warning_id: "recovery_share_below_100",
        severity: WARNING_SEVERITY.BLOCKING,
        priority: WARNING_PRIORITY.SHARE_TOTAL,
        module,
        cost_stream: "all",
        driver: "share_percent",
        headline: "Recovery shares are below 100%",
        message: `Recovery shares total ${recovery_share_total_percent}%, leaving ${unallocated_share_percent}% unallocated.`,
        plain_english:
          "Some of the recovery burden has not been assigned to a recovery stream.",
        review_action:
          "Allocate the remaining recovery share before trusting the recovery model.",
        cause: "Recovery share total is below 100%.",
        effect: "The recovery model is incomplete.",
        cascade_effect:
          "Required recovery rates may be understated because not all costs are allocated.",
        carry_forward_message:
          "Cost Allocation cannot be trusted until recovery shares total 100%.",
        audit_location: "Cost Allocation recovery share setup",
        context: {
          recovery_share_total_percent,
          unallocated_share_percent,
          over_allocated_share_percent,
        },
      })
    );
  }

  if (recovery_share_total_percent > 100 + tolerance_percent) {
    warnings.push(
      build_recovery_warning({
        warning_id: "recovery_share_above_100",
        severity: WARNING_SEVERITY.BLOCKING,
        priority: WARNING_PRIORITY.SHARE_TOTAL,
        module,
        cost_stream: "all",
        driver: "share_percent",
        headline: "Recovery shares are above 100%",
        message: `Recovery shares total ${recovery_share_total_percent}%, which over-allocates the recovery burden by ${over_allocated_share_percent}%.`,
        plain_english:
          "The same recovery burden is being over-allocated across the recovery streams.",
        review_action: "Reduce recovery shares so the total equals 100%.",
        cause: "Recovery share total is above 100%.",
        effect: "The recovery model is overstating the recovery burden.",
        cascade_effect:
          "Required recovery rates may be overstated because costs are being over-allocated.",
        carry_forward_message:
          "Cost Allocation cannot be trusted until recovery shares total 100%.",
        audit_location: "Cost Allocation recovery share setup",
        context: {
          recovery_share_total_percent,
          unallocated_share_percent,
          over_allocated_share_percent,
        },
      })
    );
  }

  if (Math.abs(recovery_share_total_percent - 100) <= tolerance_percent) {
    warnings.push(
      build_recovery_warning({
        warning_id: "recovery_share_balanced",
        severity: WARNING_SEVERITY.INFO,
        priority: WARNING_PRIORITY.INFO,
        module,
        cost_stream: "all",
        driver: "share_percent",
        headline: "Recovery shares total 100%",
        message: "Recovery shares total 100%.",
        plain_english:
          "The recovery burden has been fully assigned across the selected recovery streams.",
        review_action:
          "No share total action required. Review individual drivers before relying on the model.",
        context: {
          recovery_share_total_percent,
          unallocated_share_percent,
          over_allocated_share_percent,
        },
      })
    );
  }

  return {
    recovery_share_total_percent,
    unallocated_share_percent,
    over_allocated_share_percent,
    share_total_warnings: warnings,
  };
}

export function check_recovery_driver_rows({
  module = "cost_allocation",
  driver_rows = [],
}) {
  const rows = Array.isArray(driver_rows) ? driver_rows : [];
  const warnings = [];

  rows.forEach((row) => {
    const cost_stream = row.cost_stream || "general";
    const driver = row.driver || row.driver_name || "unknown";
    const share_percent = to_number(row.share_percent);
    const cost_value = to_number(row.cost_value);
    const driver_quantity = to_number(row.driver_quantity);
    const driver_enabled = row.driver_enabled !== false;

    if (cost_value > 0 && share_percent <= 0) {
      warnings.push(
        build_recovery_warning({
          warning_id: `${cost_stream}_cost_without_share`,
          severity: WARNING_SEVERITY.REVIEW,
          priority: WARNING_PRIORITY.DRIVER,
          module,
          cost_stream,
          driver,
          headline: `${cost_stream} has cost but no recovery share`,
          message: `${cost_stream} has cost assigned but no recovery share.`,
          plain_english:
            "This cost stream exists, but it is not currently being recovered through the model.",
          review_action:
            "Assign a recovery share or confirm this cost stream is intentionally excluded.",
          cause: "Cost exists without a recovery share.",
          effect: "The recovery burden may be understated.",
          audit_location: "Cost Allocation recovery driver setup",
          context: row,
        })
      );
    }

    if (share_percent > 0 && !driver_enabled) {
      warnings.push(
        build_recovery_warning({
          warning_id: `${cost_stream}_share_without_driver`,
          severity: WARNING_SEVERITY.BLOCKING,
          priority: WARNING_PRIORITY.DRIVER,
          module,
          cost_stream,
          driver,
          headline: `${cost_stream} has share but no active driver`,
          message: `${cost_stream} has a recovery share but the recovery driver is disabled.`,
          plain_english:
            "This cost stream is meant to recover cost, but the driver needed to calculate recovery is disabled.",
          review_action: "Enable a recovery driver or remove this recovery share.",
          cause: "Recovery share exists but driver is disabled.",
          effect: "The recovery rate cannot be trusted.",
          audit_location: "Cost Allocation recovery driver setup",
          context: row,
        })
      );
    }

    if (share_percent > 0 && driver_quantity <= 0) {
      warnings.push(
        build_recovery_warning({
          warning_id: `${cost_stream}_share_with_zero_driver_quantity`,
          severity: WARNING_SEVERITY.BLOCKING,
          priority: WARNING_PRIORITY.DRIVER,
          module,
          cost_stream,
          driver,
          headline: `${cost_stream} has zero driver quantity`,
          message: `${cost_stream} has a recovery share but the selected driver quantity is zero.`,
          plain_english:
            "This cost stream has recovery assigned, but there is no driver quantity to spread the cost across.",
          review_action:
            "Enter a valid recovery driver quantity before relying on this recovery rate.",
          cause: "Recovery share exists but driver quantity is zero.",
          effect: "The required recovery rate cannot be calculated reliably.",
          audit_location: "Cost Allocation recovery driver setup",
          context: row,
        })
      );
    }
  });

  return {
    driver_warning_rows: warnings,
  };
}

export function build_recovery_share_warning_system({
  module = "cost_allocation",
  share_rows = [],
  driver_rows = [],
  tolerance_percent = 0.01,
}) {
  const share_total_result = check_recovery_share_total({
    module,
    share_rows,
    tolerance_percent,
  });

  const driver_result = check_recovery_driver_rows({
    module,
    driver_rows,
  });

  const warning_rows = [
    ...share_total_result.share_total_warnings,
    ...driver_result.driver_warning_rows,
  ];

  return {
    module,
    recovery_share_total_percent:
      share_total_result.recovery_share_total_percent,
    unallocated_share_percent: share_total_result.unallocated_share_percent,
    over_allocated_share_percent:
      share_total_result.over_allocated_share_percent,
    ...build_share_warning_summary(warning_rows),
    ...build_recovery_warning_hierarchy(warning_rows),
  };
}

export function build_recovery_summary_warning_system({
  business_summary_trusted = true,
  margin_pool = 0,
  total_cost_burden = 0,
  current_recovery_rate = 0,
  required_recovery_rate = 0,
  labour_recovery_clean = true,
  asset_recovery_clean = true,
  material_recovery_clean = true,
  context = {},
}) {
  const warnings = [];

  const safe_margin_pool = round_currency(margin_pool);
  const safe_total_cost_burden = round_currency(total_cost_burden);
  const recovery_gap = round_currency(safe_margin_pool - safe_total_cost_burden);

  const safe_current_recovery_rate = round_currency(current_recovery_rate);
  const safe_required_recovery_rate = round_currency(required_recovery_rate);
  const recovery_rate_gap = round_currency(
    safe_current_recovery_rate - safe_required_recovery_rate
  );

  if (!business_summary_trusted) {
    warnings.push(
      build_recovery_warning({
        warning_id: "business_summary_not_trusted",
        severity: WARNING_SEVERITY.BLOCKING,
        priority: WARNING_PRIORITY.SOURCE_TRUST,
        module: "recovery_summary",
        cost_stream: "all",
        driver: "business_summary",
        headline: "Business Summary is not trusted yet",
        message:
          "Business Summary has not produced a trusted commercial model yet.",
        plain_english:
          "Recovery Summary cannot give a final recovery position until the source model is trusted.",
        review_action:
          "Review Business Summary before relying on the Recovery Summary result.",
        cause: "The upstream commercial model is not trusted.",
        effect: "Recovery calculations may be based on incomplete or unstable inputs.",
        cascade_effect:
          "Margin pool, cost burden, and required recovery rate should be treated as provisional.",
        carry_forward_message:
          "Do not rely on Cost Allocation until Business Summary is trusted.",
        audit_location: "Business Summary",
        context,
      })
    );
  }

  if (safe_margin_pool < safe_total_cost_burden) {
    warnings.push(
      build_recovery_warning({
        warning_id: "margin_pool_below_cost_burden",
        severity: WARNING_SEVERITY.BLOCKING,
        priority: WARNING_PRIORITY.GROSS_PROFIT,
        module: "recovery_summary",
        cost_stream: "all",
        driver: "gross_profit",
        headline: "Gross profit is below total cost burden",
        message: `Margin pool is below total cost burden by $${Math.abs(
          recovery_gap
        ).toLocaleString()}.`,
        plain_english:
          "The business does not currently generate enough gross profit to carry its structure.",
        review_action:
          "Review labour recovery, asset recovery, material margin, and overhead burden.",
        cause: "Gross profit pool is smaller than the total cost burden.",
        effect:
          "The business is structurally under-recovered before allocation is tested.",
        cascade_effect:
          "The required recovery rate increases because the margin pool cannot carry the current structure.",
        carry_forward_message:
          "Cost Allocation receives a recovery pressure gap from Recovery Summary.",
        audit_location: "Recovery Summary margin pool test",
        context: {
          ...context,
          margin_pool: safe_margin_pool,
          total_cost_burden: safe_total_cost_burden,
          recovery_gap,
        },
      })
    );
  }

  if (safe_current_recovery_rate < safe_required_recovery_rate) {
    warnings.push(
      build_recovery_warning({
        warning_id: "required_recovery_rate_not_met",
        severity: WARNING_SEVERITY.BLOCKING,
        priority: WARNING_PRIORITY.RECOVERY_RATE,
        module: "recovery_summary",
        cost_stream: "all",
        driver: "recovery_rate",
        headline: "Required recovery level is not being met",
        message: `Current recovery is $${safe_current_recovery_rate.toLocaleString()}/hr against a required $${safe_required_recovery_rate.toLocaleString()}/hr.`,
        plain_english:
          "The selected recovery driver is not carrying enough recovery per hour.",
        review_action:
          "Review pricing, recoverable capacity, productive hours, and recovery assumptions.",
        cause: "Current recovery rate is below required recovery rate.",
        effect: "Each recoverable hour is priced below the required recovery level.",
        cascade_effect:
          "The recovery shortfall will continue unless pricing, productivity, or cost structure changes.",
        carry_forward_message:
          "Cost Allocation must test whether the operating structure can support this required recovery level.",
        audit_location: "Recovery Summary recovery rate test",
        context: {
          ...context,
          current_recovery_rate: safe_current_recovery_rate,
          required_recovery_rate: safe_required_recovery_rate,
          recovery_rate_gap,
        },
      })
    );
  }

  if (!labour_recovery_clean || !asset_recovery_clean || !material_recovery_clean) {
    warnings.push(
      build_recovery_warning({
        warning_id: "recovery_stream_cross_subsidy_risk",
        severity: WARNING_SEVERITY.REVIEW,
        priority: WARNING_PRIORITY.RECOVERY_STREAM,
        module: "recovery_summary",
        cost_stream: "all",
        driver: "recovery_streams",
        headline: "Recovery streams need review",
        message:
          "One or more recovery streams may be carrying cost that should stand on its own.",
        plain_english:
          "Labour, assets, and materials should recover their own burden rather than hiding pressure inside another stream.",
        review_action:
          "Review labour recovery, asset recovery, and material margin separately.",
        cause: "One or more recovery streams are not clean.",
        effect: "The business may be hiding under-recovery inside another stream.",
        cascade_effect:
          "Material margin may be masking labour or asset under-recovery.",
        carry_forward_message:
          "Business Outcome should later test actual recovery by stream.",
        audit_location: "Recovery Summary recovery stream tests",
        context: {
          ...context,
          labour_recovery_clean,
          asset_recovery_clean,
          material_recovery_clean,
        },
      })
    );
  }

  if (warnings.length === 0) {
    warnings.push(
      build_recovery_warning({
        warning_id: "recovery_strategy_can_be_carried_forward",
        severity: WARNING_SEVERITY.INFO,
        priority: WARNING_PRIORITY.INFO,
        module: "recovery_summary",
        cost_stream: "all",
        driver: "recovery_strategy",
        headline: "Recovery strategy can be carried forward",
        message: "Recovery strategy can be carried forward.",
        plain_english:
          "The recovery model has passed the main Recovery Summary checks.",
        review_action:
          "Continue to Cost Allocation to test whether the operating structure can deliver this recovery model.",
        carry_forward_message:
          "Cost Allocation can test the operating structure against this recovery strategy.",
        audit_location: "Recovery Summary",
        context,
      })
    );
  }

  const hierarchy = build_recovery_warning_hierarchy(warnings);

  return {
    recovery_warning_rows: warnings,
    primary_recovery_warning: hierarchy.primary_warning,
    cascade_recovery_warnings: hierarchy.cascade_warnings,
    recovery_failure_path: hierarchy.recovery_failure_path,
    has_primary_recovery_warning: hierarchy.has_primary_warning,
    has_blocking_recovery_warning: hierarchy.has_blocking_warning,
    has_review_recovery_warning: hierarchy.has_review_warning,
    blocking_recovery_warning_count: hierarchy.blocking_warning_count,
    review_recovery_warning_count: hierarchy.review_warning_count,
    info_recovery_warning_count: hierarchy.info_warning_count,
    recovery_warning_count: hierarchy.warning_count,
  };
}

export { WARNING_SEVERITY, WARNING_PRIORITY };