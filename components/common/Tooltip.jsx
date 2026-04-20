"use client";

import { useState } from "react";

export default function Tooltip({ text }) {
  const [is_open, set_is_open] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => set_is_open(true)}
      onMouseLeave={() => set_is_open(false)}
    >
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-card-muted)] text-xs font-semibold text-[var(--text-muted)]"
        onFocus={() => set_is_open(true)}
        onBlur={() => set_is_open(false)}
        aria-label="More information"
      >
        ?
      </button>

      {is_open ? (
        <span className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-3 text-sm leading-6 text-[var(--text-secondary)] shadow-lg">
          {text}
        </span>
      ) : null}
    </span>
  );
}