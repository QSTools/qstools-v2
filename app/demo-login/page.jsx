"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function DemoLoginForm() {
  const searchParams = useSearchParams();
  const next_path = searchParams.get("next") || "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [is_submitting, set_is_submitting] = useState(false);

  async function handle_submit(event) {
    event.preventDefault();

    setError("");
    set_is_submitting(true);

    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      if (!response.ok) {
        setError("Incorrect password.");
        set_is_submitting(false);
        return;
      }

      window.location.href = next_path;
    } catch {
      setError("Login failed. Try again.");
      set_is_submitting(false);
    }
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <p className="ui-kicker">QS Tools Demo</p>

        <h1>Private demo access</h1>

        <p className="ui-help">Enter the demo password to continue.</p>

        <form onSubmit={handle_submit} className="ui-stack">
          <label className="ui-label" htmlFor="demo-password">
            Password
          </label>

          <input
            id="demo-password"
            className="ui-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
          />

          {error ? (
            <p className="ui-help" role="alert">
              {error}
            </p>
          ) : null}

          <div className="ui-actions">
            <button
              className="ui-button-primary"
              type="submit"
              disabled={is_submitting}
            >
              {is_submitting ? "Checking..." : "Enter demo"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default function DemoLoginPage() {
  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <Suspense
          fallback={
            <section className="ui-section">
              <div className="ui-panel">
                <p className="ui-help">Loading demo access...</p>
              </div>
            </section>
          }
        >
          <DemoLoginForm />
        </Suspense>
      </div>
    </main>
  );
}