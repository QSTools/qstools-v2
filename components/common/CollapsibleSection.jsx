"use client";

import { useState } from "react";

export default function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  children,
  id,
  force_open_token = undefined,
}) {
  const [is_open, set_is_open] = useState(
    Boolean(defaultOpen) || Boolean(force_open_token),
  );
  const [seen_open_token, set_seen_open_token] = useState(force_open_token);

  // Opt-in: opens the section when the parent hands down a new token.
  // Callers that never pass force_open_token behave exactly as before.
  if (force_open_token !== seen_open_token) {
    set_seen_open_token(force_open_token);
    if (force_open_token) set_is_open(true);
  }

  function toggle_section() {
    set_is_open((current) => !current);
  }

  function close_section() {
    set_is_open(false);
  }

  return (
    <div id={id} className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
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