"use client";

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
 * CollapsibleSection manages its own open state internally and exposes
 * no imperative API, and children of a closed section are not rendered
 * into the DOM at all (not just hidden) - so a nested target genuinely
 * doesn't exist in the DOM until every ancestor above it is open. This
 * component opens each ancestor in turn (via ancestor_ids, outermost
 * first), waiting a tick after each click for React to render the next
 * level before searching for it, then opens and scrolls to the real
 * target last.
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
  function open_if_closed(el) {
    if (!el) return;
    const toggle_button = el.querySelector(':scope > button[aria-expanded="false"]');
    if (toggle_button) {
      toggle_button.click();
    }
  }

  function wait_a_tick() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function handle_click() {
    if (typeof document === "undefined") return;

    for (const button_text of pre_toggle_labels) {
      const plain_toggle = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent.trim() === button_text
      );
      if (plain_toggle) {
        plain_toggle.click();
        await wait_a_tick();
      }
    }

    for (const ancestor_id of ancestor_ids) {
      const ancestor_el = document.getElementById(ancestor_id);
      if (!ancestor_el) return;
      open_if_closed(ancestor_el);
      await wait_a_tick();
    }

    const target = document.getElementById(target_id);
    if (!target) return;

    open_if_closed(target);
    await wait_a_tick();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button type="button" className="ui-inline-link" onClick={handle_click}>
      {label}
    </button>
  );
}