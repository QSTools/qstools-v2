"use client";

import { useState, useRef } from "react";

export default function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  children,
}) {
  const [is_open, set_is_open] = useState(defaultOpen);
  const details_ref = useRef(null);

  function handle_close() {
    if (!details_ref.current) return;

    details_ref.current.open = false;
    set_is_open(false);

    requestAnimationFrame(() => {
      details_ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <details
      ref={details_ref}
      open={is_open}
      onToggle={(event) => set_is_open(event.currentTarget.open)}
      className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]"
    >
      <summary className="ui-collapsible-summary flex cursor-pointer list-none items-center justify-between gap-3 px-4">
        <div className="ui-stack-sm">
          <div className="ui-collapsible-title">{title}</div>
          <div className="ui-help">{summary}</div>
        </div>

        <span className="text-sm text-[var(--text-muted)]">
          {is_open ? "Hide" : "Show"}
        </span>
      </summary>

      <div className="px-4 pb-4">
        {children}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={handle_close}
          >
            Hide
          </button>
        </div>
      </div>
    </details>
  );
}