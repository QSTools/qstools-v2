"use client";

// R3 slice 2 batch 2 (Business Modelling brief, Addendum 17). The baseline lock card on the Model Readiness page: lock the baseline
// when the gate allows it, show why not when it does not, and unlock deliberately (a warning panel, then a second click).
// The page passes in the live readiness result (status). Everything that touches storage goes through lib/storage/modelBaselineLock.js
// and modelStorage.js; this file reads no storage key itself and saves nothing in an effect (so no has_loaded guard is needed).
// "Settled" = the 28 real keys have not changed (volatile fields ignored) for SETTLE_MS; checked every 500 ms until settled, then stops.
// The lock re-checks the data at the click, so a change after the card showed "settled" is refused with a plain message.
// Styling uses the existing styles/ui-system.css classes only (theme variables). No inline colours.

import { useCallback, useEffect, useState } from "react";
import { get_mode } from "@/lib/storage/modelStorage";
import {
  UNLOCK_WARNING,
  check_lock_gate,
  fingerprint_real,
  get_lock_state,
  lock_baseline,
  settle_step,
  unlock_baseline,
} from "@/lib/storage/modelBaselineLock";

const POLL_MS = 500;

function when(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("en-NZ");
}

function read_view() {
  return { mode: get_mode(), lock: get_lock_state() };
}

export default function BaselineLockCard({ status = {} }) {
  const [view, setView] = useState(null); // null until the client has read storage (avoids a hydration mismatch)
  const [settled_fp, setSettledFp] = useState("");
  const [restart, setRestart] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(() => setView(read_view()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const watching = view !== null && view.mode !== "model" && !view.lock.locked;

  useEffect(() => {
    if (!watching) return undefined;
    let state = null;
    let timer = null;
    const tick = () => {
      const fp = fingerprint_real();
      const step = settle_step(state, fp, Date.now());
      state = step.state;
      if (step.settled) {
        setSettledFp(fp);
        clearInterval(timer);
      } else {
        setSettledFp("");
      }
    };
    tick();
    timer = setInterval(tick, POLL_MS);
    return () => clearInterval(timer);
  }, [watching, restart]);

  if (view === null) return null;

  const { mode, lock } = view;
  const settled = settled_fp !== "";
  const readiness = {
    loaded: settled,
    overall_status: status.overall_status,
    blocking_count: Array.isArray(status.blocking_items) ? status.blocking_items.length : 0,
    warning_count: Array.isArray(status.warning_items) ? status.warning_items.length : 0,
    checked_at: status.last_checked_at || "",
  };
  const gate = check_lock_gate({
    mode,
    locked: lock.locked,
    readiness,
    settled_fingerprint: settled_fp,
    current_fingerprint: settled_fp,
  });

  const do_lock = () => {
    const result = lock_baseline({ readiness, settled_fingerprint: settled_fp });
    setMessage(result.ok ? "Baseline locked." : result.message);
    if (!result.ok && result.reason === "not_settled") setRestart((n) => n + 1);
    refresh();
  };

  const do_unlock = () => {
    const result = unlock_baseline({ confirmed: true });
    setMessage(result.ok ? "Baseline unlocked. Lock it again when the corrections are done." : result.message);
    setConfirming(false);
    refresh();
  };

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Baseline</div>
          <div className="ui-row-between">
            <div className="ui-card-title-sm">{lock.locked ? "Locked" : "Not locked"}</div>
            <span className={lock.locked ? "ui-pill ui-pill-good" : "ui-pill ui-pill-warning"}>
              {lock.locked ? "Model mode available" : "Model mode needs a locked baseline"}
            </span>
          </div>
          {lock.locked ? (
            <p className="ui-help">
              Locked on {when(lock.locked_at)} (lock number {lock.generation}).
              {lock.readiness
                ? " Checks at the time: " + lock.readiness.overall_status + ", " + lock.readiness.blocking_count + " blocking, " + lock.readiness.warning_count + " warnings."
                : ""}
            </p>
          ) : (
            <p className="ui-help">
              Locking saves a copy of your settled business as the baseline. Model mode works on top of it and never changes your real data.
            </p>
          )}
        </div>

        {mode === "model" ? (
          <p className="ui-help">Model mode is on. Switch back to baseline mode to lock or unlock the baseline.</p>
        ) : lock.locked ? (
          confirming ? (
            <div className="ui-section-muted ui-stack-sm">
              <span className="ui-pill ui-pill-warning">Unlock the baseline?</span>
              <p className="ui-help">{UNLOCK_WARNING}</p>
              <div className="ui-actions">
                <button type="button" className="ui-button-danger" onClick={do_unlock}>
                  Confirm unlock
                </button>
                <button type="button" className="ui-button-secondary" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="ui-actions">
              <button type="button" className="ui-button-secondary" onClick={() => { setMessage(""); setConfirming(true); }}>
                Unlock baseline
              </button>
            </div>
          )
        ) : (
          <div className="ui-stack-sm">
            {!settled ? (
              <p className="ui-help">Checking that your data has stopped changing...</p>
            ) : gate.ok ? (
              <p className="ui-help">The checks are clear and your data is settled. The baseline can be locked.</p>
            ) : (
              gate.reasons.map((reason) => (
                <p key={reason.code} className="ui-help">
                  {reason.message}
                </p>
              ))
            )}
            <div className="ui-actions">
              <button type="button" className="ui-button-primary" disabled={!gate.ok} onClick={do_lock}>
                Lock baseline
              </button>
            </div>
          </div>
        )}

        {message ? <p className="ui-help" role="status">{message}</p> : null}
      </div>
    </section>
  );
}
