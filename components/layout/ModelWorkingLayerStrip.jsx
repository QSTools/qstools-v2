"use client";

// R3 slice 5, lever batch L3 (Business Modelling brief, Addendum 57). The second strip under the Model mode banner.
// Shown only when the working layer holds at least one nudge or lever record; it listens to its own subscription (modelWorkingLayer.js), because the
// mode banner reads the mode once per load. Working: "Working changes, not yet accepted" with Accept and Discard. Accepted: "Changes accepted on <date>"
// with Discard. Discard asks first, in the strip itself (no browser dialog). Everything is stored by modelWorkingLayer.js; this file holds no storage.
// Styling uses the existing styles/ui-system.css classes only.

import { useState, useSyncExternalStore } from "react";
import {
  LAYER_TEXT,
  STATUS_WORKING,
  accept_working_layer,
  discard_working_layer,
  format_accepted_date,
  get_layer_summary,
  get_server_layer_summary,
  subscribe_to_layer,
} from "@/lib/storage/modelWorkingLayer";

export default function ModelWorkingLayerStrip() {
  const summary = useSyncExternalStore(subscribe_to_layer, get_layer_summary, get_server_layer_summary);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  if (summary.count === 0) return null;

  const accept = () => {
    const result = accept_working_layer();
    setMessage(result.ok ? "" : result.message);
  };
  const discard = () => {
    const result = discard_working_layer();
    setConfirming(false);
    setMessage(result.ok ? "" : result.message);
  };

  const working = summary.status === STATUS_WORKING;
  const date = format_accepted_date(summary.accepted_at);
  const heading = working ? LAYER_TEXT.working : LAYER_TEXT.accepted_on + (date ? " " + date : "");

  return (
    <div role="status" className="ui-section-muted ui-actions mb-4">
      <span className="ui-pill ui-pill-warning">{heading}</span>
      {summary.relocked ? <span className="ui-help">{LAYER_TEXT.relocked}</span> : null}
      {confirming ? (
        <>
          <span>{LAYER_TEXT.confirm}</span>
          <button type="button" className="ui-button-danger" onClick={discard}>
            {LAYER_TEXT.discard}
          </button>
          <button type="button" className="ui-button-secondary" onClick={() => setConfirming(false)}>
            {LAYER_TEXT.cancel}
          </button>
        </>
      ) : (
        <>
          {working ? (
            <button type="button" className="ui-button-primary" onClick={accept}>
              {LAYER_TEXT.accept}
            </button>
          ) : null}
          <button type="button" className="ui-button-secondary" onClick={() => setConfirming(true)}>
            {LAYER_TEXT.discard}
          </button>
        </>
      )}
      {message ? <span className="ui-help">{message}</span> : null}
    </div>
  );
}
