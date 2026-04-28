"use client";

import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import GeneralOverheadStatusStrip from "@/components/general-overheads/GeneralOverheadStatusStrip";
import GeneralOverheadMainCard from "@/components/general-overheads/GeneralOverheadMainCard";
import GeneralOverheadHelpPanel from "@/components/general-overheads/GeneralOverheadHelpPanel";

export default function GeneralOverheadsPage() {
  const { status, card } = useGeneralOverheads();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-hero">
          <div className="ui-hero-inner">
            <div className="ui-kicker">General Overheads</div>
            <h1 className="ui-hero-title">General overheads builder</h1>
            <p className="ui-hero-copy">
              Clean up the P&amp;L overhead section into clear business cost
              categories before sending the locked total into Cost Summary.
            </p>
            <p className="ui-help">
              Use this page to confirm which overheads belong in General
              Overheads before Labour, Assets, and Cost Summary consume the
              final business cost position.
            </p>
          </div>
        </section>

        <GeneralOverheadStatusStrip {...status} />
        <GeneralOverheadMainCard {...card} />
        <GeneralOverheadHelpPanel />
      </div>
    </main>
  );
}