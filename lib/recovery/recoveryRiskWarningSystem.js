const WARNING_SEVERITY = {
  BLOCKING: "blocking",
  REVIEW: "review",
  INFO: "info",
};

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

export function build_recovery_warning({
  warning_id,
  severity = WARNING_SEVERITY.REVIEW,
  module = "recovery",
  cost_stream = "general",
  driver = "unknown",
  message,
  review_action,
  context = {},
}) {
  return {
    warning_id,
    severity: normalise_severity(severity),
    module,
    cost_stream,
    driver,
    message: message || "Review this recovery setup.",
    review_action: review_action || "Review the recovery setup before relying on this result.",
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
        module,
        cost_stream: "all",
        driver: "share_percent",
        message: `Recovery shares total ${recovery_share_total_percent}%, leaving ${unallocated_share_percent}% unallocated.`,
        review_action:
          "Allocate the remaining recovery share before trusting the recovery model.",
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
        module,
        cost_stream: "all",
        driver: "share_percent",
        message: `Recovery shares total ${recovery_share_total_percent}%, which over-allocates the recovery burden by ${over_allocated_share_percent}%.`,
        review_action:
          "Reduce recovery shares so the total equals 100%.",
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
        module,
        cost_stream: "all",
        driver: "share_percent",
        message: "Recovery shares total 100%.",
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
          module,
          cost_stream,
          driver,
          message: `${cost_stream} has cost assigned but no recovery share.`,
          review_action:
            "Assign a recovery share or confirm this cost stream is intentionally excluded.",
          context: row,
        })
      );
    }

    if (share_percent > 0 && !driver_enabled) {
      warnings.push(
        build_recovery_warning({
          warning_id: `${cost_stream}_share_without_driver`,
          severity: WARNING_SEVERITY.BLOCKING,
          module,
          cost_stream,
          driver,
          message: `${cost_stream} has a recovery share but the recovery driver is disabled.`,
          review_action:
            "Enable a recovery driver or remove this recovery share.",
          context: row,
        })
      );
    }

    if (share_percent > 0 && driver_quantity <= 0) {
      warnings.push(
        build_recovery_warning({
          warning_id: `${cost_stream}_share_with_zero_driver_quantity`,
          severity: WARNING_SEVERITY.BLOCKING,
          module,
          cost_stream,
          driver,
          message: `${cost_stream} has a recovery share but the selected driver quantity is zero.`,
          review_action:
            "Enter a valid recovery driver quantity before relying on this recovery rate.",
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
  };
}

export { WARNING_SEVERITY };