// R3 slice 1 batch 5 (Business Modelling brief, Addendum 12 owner answer E, Addendum 13 item 9).
// Routes that Model mode does not cover (their storage keys are unmodelled or excluded). In Model mode the gate shows a
// notice instead of the page, so the page never mounts. Pure module (no React, no storage) so plain node can test it.
// Wording lives here so it is easy to change. ASCII only.

export const UNMODELLED_ROUTES = [
  "/quote-engine",
  "/quote-checker",
  "/quick-start",
  "/labour-rate-reality-check",
  "/scheduling",
];

export function is_unmodelled_route(pathname) {
  if (typeof pathname !== "string" || pathname === "") return false;
  const clean = pathname.split("?")[0].split("#")[0];
  const trimmed = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  return UNMODELLED_ROUTES.some((route) => trimmed === route || trimmed.startsWith(route + "/"));
}

export const MODEL_MODE_TEXT = {
  banner_label: "MODEL MODE",
  banner: "You are viewing the baseline business. Edits are not saved yet.",
  back_button: "Back to baseline mode",
  notice_title: "Not available in Model mode",
  notice_body: "This page is not part of Model mode, so it is not shown while Model mode is on. Nothing on it can reach your data.",
  notice_link: "Go to Business Outcome",
  notice_link_href: "/business-outcome",
};