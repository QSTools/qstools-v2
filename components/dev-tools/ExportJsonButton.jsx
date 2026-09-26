"use client";

// Mirra v6.0 - Dev Tools - Export JSON Button
// Drop this into any page to export whatever data object that page
// already has in scope, as a timestamped JSON download. Standing
// verification pattern (session 10) - replaces manual console
// localStorage-dump / fiber-tree-walk snapshot methods.
//
// Usage:
//   <ExportJsonButton data={someLiveObject} filenamePrefix="cost_allocation" />

import { downloadJson } from "@/lib/dev-tools/downloadJson";

export default function ExportJsonButton({
  data,
  filenamePrefix = "snapshot",
  label = "Download JSON",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={() => downloadJson(`${filenamePrefix}_${Date.now()}.json`, data)}
      className={
        className ||
        "inline-flex rounded-full border border-slate-400/30 bg-slate-400/10 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-400/20"
      }
    >
      {label}
    </button>
  );
}