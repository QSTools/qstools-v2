"use client";

// R3 slice 1 batch 5 (Business Modelling brief, Addendum 13 item 9). Wraps the page area in app/layout.tsx.
// Mode OFF: renders the children untouched. Mode ON: a banner above every page; on routes Model mode does not cover
// (lib/config/modelModeRoutes.js) the children are NOT rendered at all, a notice is shown instead, so those pages never mount.
// Reads the mode only through get_mode() and switches back only through set_mode(); it touches no other storage.
// The mode only changes with a full page load (each page reads its storage once on mount), so it is read once per load.
// Children keep the same position in the tree whether or not the banner shows, so a page never remounts when it appears.

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { get_mode, set_mode } from "@/lib/storage/modelStorage";
import { is_unmodelled_route, MODEL_MODE_TEXT } from "@/lib/config/modelModeRoutes";

const subscribe = () => () => {};
const server_mode = () => null;

// Styling uses the existing styles/ui-system.css classes only (theme variables), so every theme works. No inline colours.

function BackToBaselineButton() {
  const [message, setMessage] = useState("");
  const back = () => {
    const result = set_mode("baseline");
    if (result && result.ok) {
      window.location.assign(window.location.pathname + window.location.search);
    } else {
      setMessage(result && result.message ? result.message : "The mode could not be changed.");
    }
  };
  return (
    <>
      <button type="button" className="ui-button-secondary" onClick={back}>
        {MODEL_MODE_TEXT.back_button}
      </button>
      {message ? <span className="ui-help">{message}</span> : null}
    </>
  );
}

function ModelModeBanner() {
  return (
    <div role="status" className="ui-section-muted ui-actions mb-4">
      <span className="ui-pill ui-pill-warning">{MODEL_MODE_TEXT.banner_label}</span>
      <span>{MODEL_MODE_TEXT.banner}</span>
      <BackToBaselineButton />
    </div>
  );
}

function ModelModeNotice() {
  return (
    <div className="ui-section-muted ui-stack-sm max-w-xl">
      <h1 className="ui-section-title">{MODEL_MODE_TEXT.notice_title}</h1>
      <p className="ui-help">{MODEL_MODE_TEXT.notice_body}</p>
      <div className="ui-actions">
        <Link href={MODEL_MODE_TEXT.notice_link_href} className="ui-inline-link">{MODEL_MODE_TEXT.notice_link}</Link>
        <BackToBaselineButton />
      </div>
    </div>
  );
}

export default function ModelModeGate({ children }) {
  const pathname = usePathname() || "";
  // Server and first client render see null (no mode known); the real mode is read on the client right after hydration.
  const mode = useSyncExternalStore(subscribe, get_mode, server_mode);
  const unmodelled = is_unmodelled_route(pathname);

  if (unmodelled && mode === null) return null; // never mount these pages before the mode is known
  if (unmodelled && mode === "model") {
    return (
      <>
        <ModelModeBanner />
        <ModelModeNotice />
      </>
    );
  }
  return (
    <>
      {mode === "model" ? <ModelModeBanner /> : null}
      {children}
    </>
  );
}