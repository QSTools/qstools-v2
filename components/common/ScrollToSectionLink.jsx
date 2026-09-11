"use client";

import { scroll_to_section } from "@/lib/utils/scrollToSection";

/**
 * ScrollToSectionLink
 *
 * A reusable inline text link for use inside blurb/summary paragraphs
 * that need to point at a CollapsibleSection elsewhere on the same page,
 * even when that section is nested inside one or more other collapsed
 * CollapsibleSections (like nested folders), and even when it's also
 * gated behind a separate plain-button toggle that isn't a
 * CollapsibleSection at all (e.g. a "Show breakdown" button that shows/
 * hides a whole block above the CollapsibleSection tree).
 *
 * Navigation logic lives in lib/utils/scrollToSection.js (extracted
 * 2026-09-12 so the same open/scroll engine can be reused by
 * non-text-link consumers, e.g. the Health Gauge's click-through).
 *
 * ancestor_ids: ordered array of ids, outermost CollapsibleSection first,
 * innermost last, NOT including target_id itself. Pass [] or omit for a
 * top-level, non-nested target.
 *
 * pre_toggle_labels: ordered array of exact button text labels for any
 * plain (non-CollapsibleSection) toggle buttons that must be clicked
 * BEFORE the ancestor_ids chain is even searchable in the DOM - e.g. a
 * "Show breakdown" button. Only clicked if a button with that exact
 * text is currently found on the page. Pass [] or omit if not needed.
 */
export default function ScrollToSectionLink({
  label,
  target_id,
  ancestor_ids = [],
  pre_toggle_labels = [],
}) {
  function handle_click() {
    scroll_to_section({ target_id, ancestor_ids, pre_toggle_labels });
  }

  return (
    <button type="button" className="ui-inline-link" onClick={handle_click}>
      {label}
    </button>
  );
}