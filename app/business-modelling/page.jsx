import Link from "next/link";
import NextStepFooter from "@/components/navigation/NextStepFooter";

// R3 batch 6 (2026-10-30): holding page. The old lever and scenario tools are retired; the thin page arrives in slice 5.
// No hooks and no calculations here.
export default function BusinessModellingPage() {
  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Business Modelling</div>
            <div className="ui-card-title-sm">This page is being rebuilt</div>
            <p className="ui-help">
              The old lever and scenario tools have been retired. Modelling now works on the real pages in
              Model mode: lock a baseline on Model Readiness, then switch to Model mode. The summary and the
              floor, start and ceiling spread return to this page in a later slice.
            </p>
            <div className="ui-actions">
              <Link href="/model-readiness" className="ui-inline-link">Model Readiness (lock the baseline)</Link>
              <Link href="/dev/model-mode" className="ui-inline-link">Model mode switch</Link>
            </div>
          </div>
        </section>
        <NextStepFooter nextHref="/quote-checker" nextLabel="Next: Quote Checker" />
      </div>
    </main>
  );
}