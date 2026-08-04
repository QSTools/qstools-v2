"use client";

import Link from "next/link";

function ActionButton({ action, variant = "secondary" }) {
  if (!action?.label || typeof action.onClick !== "function") {
    return null;
  }

  const class_name =
    variant === "primary" ? "ui-button-primary" : "ui-button-secondary";

  return (
    <button type="button" className={class_name} onClick={action.onClick}>
      {action.label}
    </button>
  );
}

export default function NextStepFooter({
  nextHref,
  nextLabel,
  primaryAction,
  secondaryAction,
}) {
  const has_actions = primaryAction?.label || secondaryAction?.label;
  const has_next = nextHref && nextLabel;

  if (!has_actions && !has_next) {
    return null;
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {has_actions ? (
            <div className="ui-actions">
              <ActionButton action={primaryAction} variant="primary" />
              <ActionButton action={secondaryAction} />
            </div>
          ) : null}

          {has_next ? (
            <div className="ui-actions md:justify-end">
              <Link href={nextHref} className="ui-button-primary">
                {nextLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
