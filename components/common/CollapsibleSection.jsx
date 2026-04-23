"use client";

import { useState } from "react";

export default function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  children,
}) {
  const [is_open, set_is_open] = useState(defaultOpen);

  function toggle_section() {
    set_is_open((current) => !current);
  }

  function close_section() {
    set_is_open(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <button
        type="button"
        onClick={toggle_section}
        className="ui-collapsible-summary flex w-full items-center justify-between px-4 py-4 text-left"
        aria-expanded={is_open}
      >
        <div className="flex w-full items-center justify-between gap-4">
          <div className="ui-collapsible-title">{title}</div>

          {summary ? (
            <div className="ui-collapsible-value">
              {summary}
            </div>
          ) : null}
        </div>

        <span className="ml-4 text-sm text-[var(--text-muted)]">
          {is_open ? "Hide" : "Show"}
        </span>
      </button>

      {is_open && (
        <div className="px-4 pb-4">
          {children}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={close_section}
            >
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}