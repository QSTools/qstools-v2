// Mirra v6.0 - Dev Tools - Generic JSON download helper
// Extracted from calculation-trace/page.jsx (session 10) so any page can
// reuse the same "download what I'm looking at as JSON" pattern instead
// of a one-off console script. Browser download only - matches the
// session 9 rule (capture by download, never clipboard).

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}