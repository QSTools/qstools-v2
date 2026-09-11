export function open_if_closed(el) {
  if (!el) return;
  const toggle_button = el.querySelector(':scope > button[aria-expanded="false"]');
  if (toggle_button) {
    toggle_button.click();
  }
}

function wait_a_tick() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

export async function scroll_to_section({ target_id, ancestor_ids = [], pre_toggle_labels = [] }) {
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