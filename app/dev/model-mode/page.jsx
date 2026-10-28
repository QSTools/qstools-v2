"use client";

// DEV-ONLY page (R3 slice 1, batch 4; Business Modelling brief Addendum 12). Not linked from the sidebar.
// Shows the Model mode state, lets the developer copy the baseline (dev button, deleted at slice 2 when the real lock replaces it),
// switch Model mode on and off, and shows what the pages did while Model mode was on (counters for this tab).
// It reads browser storage directly ONLY to display it. Every change goes through lib/storage/modelStorage.js.
// Full page links (not client navigation) are used on purpose so every page re-reads its storage after a mode switch.

import { useCallback, useEffect, useState } from "react";

import {
  clear_session_log,
  get_mode,
  get_model_stats,
  get_session_log,
  has_complete_baseline,
  reset_model_stats,
  set_mode,
  take_baseline_snapshot,
} from "@/lib/storage/modelStorage";
import { MODELLED_KEYS, NEW_KEYS, baseline_entry_key } from "@/lib/storage/modelStorageRegistry";

const PAGE_LINKS = [
  ["General Overheads", "/general-overheads"],
  ["Labour", "/labour"],
  ["Assets", "/assets"],
  ["Opening Hours", "/opening-hours"],
  ["Cost Allocation", "/cost-allocation"],
  ["Rate Builder", "/rate-builder"],
  ["Business Outcome", "/business-outcome"],
  ["Business Modelling", "/business-modelling"],
  ["Calculation trace", "/calculation-trace"],
];

const LIMIT_CHARS = 5000000; // a browser keeps about 5 MB of localStorage per site (Addendum 12 item 7)

const button_style = { padding: "6px 12px", border: "1px solid #888", borderRadius: 4, background: "#f3f3f3", cursor: "pointer", marginRight: 8 };

function read_status() {
  const store = window.localStorage;
  const rows = MODELLED_KEYS.map((entry) => {
    const real = store.getItem(entry.key);
    const baseline = store.getItem(baseline_entry_key(entry.code));
    let relation = "both absent";
    if (real !== null && baseline !== null) relation = real === baseline ? "same" : "differs";
    else if (real !== null) relation = "real only";
    else if (baseline !== null) relation = "baseline only";
    return {
      code: entry.code,
      key: entry.key,
      real_length: real === null ? null : real.length,
      baseline_length: baseline === null ? null : baseline.length,
      relation,
    };
  });
  let used = 0;
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    used += key.length + (store.getItem(key) || "").length;
  }
  let meta = null;
  try {
    meta = JSON.parse(store.getItem(NEW_KEYS.baseline_meta) || "null");
  } catch {
    meta = null;
  }
  const new_keys = Object.entries(NEW_KEYS).map(([name, key]) => {
    const value = store.getItem(key);
    return { name, key, length: value === null ? null : value.length, value: value !== null && value.length <= 300 ? value : null };
  });
  return {
    mode: get_mode(),
    complete: has_complete_baseline(),
    meta,
    rows,
    used,
    new_keys,
    memory: get_model_stats(),
    session: get_session_log(),
  };
}

export default function ModelModeDevPage() {
  const [status, set_status] = useState(null);
  const [message, set_message] = useState("");

  const refresh = useCallback(() => {
    try {
      set_status(read_status());
    } catch (error) {
      set_message("Could not read storage: " + String(error && error.message));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = (label, action) => {
    const result = action();
    set_message(label + ": " + JSON.stringify(result));
    refresh();
  };

  if (!status) {
    return (
      <main className="ui-page">
        <p className="ui-help">Reading storage...</p>
        {message ? <p className="ui-help">{message}</p> : null}
      </main>
    );
  }

  const { mode, complete, meta, rows, used, new_keys, memory, session } = status;
  const session_items = Object.entries(session.items || {});

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-kicker">Dev - R3 slice 1</div>
              <h1 className="ui-card-title">Model mode (developer controls)</h1>
              <p className="ui-help">
                Mode: <strong>{mode === "model" ? "MODEL MODE ON" : "baseline (normal)"}</strong>
                {" | "}baseline copy: {complete ? "complete" : "none or incomplete"}
                {meta && complete ? " (taken " + meta.taken_at + ", " + meta.codes.length + " keys present, " + meta.absent_codes.length + " absent, locked: " + String(meta.locked) + ")" : ""}
                {" | "}storage used: about {used.toLocaleString("en-NZ")} of {LIMIT_CHARS.toLocaleString("en-NZ")} characters
              </p>
            </div>
          </div>

          <div className="ui-stack">
            <div>
              <button style={button_style} disabled={mode === "model"} onClick={() => run("Copy baseline", take_baseline_snapshot)}>
                Copy baseline now (dev)
              </button>
              <button style={button_style} disabled={mode === "model"} onClick={() => run("Enter Model mode", () => set_mode("model"))}>
                Enter Model mode
              </button>
              <button style={button_style} disabled={mode !== "model"} onClick={() => run("Back to baseline mode", () => set_mode("baseline"))}>
                Back to baseline mode
              </button>
              <button style={button_style} onClick={refresh}>Refresh</button>
              <button
                style={button_style}
                onClick={() => {
                  reset_model_stats();
                  clear_session_log();
                  set_message("Log cleared.");
                  refresh();
                }}
              >
                Clear log
              </button>
            </div>
            {message ? <p className="ui-help">{message}</p> : null}
            <p className="ui-help">
              Copying the baseline is refused while Model mode is on. After a mode switch open the pages from the links below
              (full page loads), because each page reads its storage once when it opens.
            </p>
            <p className="ui-help">
              {PAGE_LINKS.map(([label, href]) => (
                <span key={href}>
                  <a href={href}>{label}</a>{" | "}
                </span>
              ))}
            </p>
          </div>
        </section>

        <section className="ui-card">
          <div className="ui-kicker">What pages did in Model mode (this browser tab, since the log was last cleared)</div>
          <p className="ui-help">
            Harmless write-backs (only timestamps or ids changed): {session.noop_writes}. Real differences discarded (slice 1 stores none):{" "}
            {session.dropped_writes}. Writes to unmodelled or unregistered keys blocked: {session.blocked_writes}.
            This page load only: {memory.noop_writes} / {memory.dropped_writes} / {memory.blocked_writes}.
          </p>
          {session_items.length > 0 ? (
            <pre className="ui-help">{session_items.map(([id, count]) => count + " x " + id).join("\n")}</pre>
          ) : (
            <p className="ui-help">Nothing discarded or blocked.</p>
          )}
        </section>

        <section className="ui-card">
          <div className="ui-kicker">The new keys</div>
          <pre className="ui-help">
            {new_keys.map((item) => item.key + "  " + (item.length === null ? "(absent)" : item.length + " chars") + (item.value ? "  " + item.value : "")).join("\n")}
          </pre>
        </section>

        <section className="ui-card">
          <div className="ui-kicker">Modelled keys: real data against the baseline copy</div>
          <pre className="ui-help">
            {rows
              .map((row) => row.code + "  " + row.key.padEnd(52) + " real " + String(row.real_length ?? "-").padStart(8) + "  baseline " + String(row.baseline_length ?? "-").padStart(8) + "  " + row.relation)
              .join("\n")}
          </pre>
        </section>
      </div>
    </main>
  );
}