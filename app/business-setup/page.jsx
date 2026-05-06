"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import useBusinessSetup from "@/hooks/useBusinessSetup";
import BusinessSetupStatusStrip from "@/components/business-setup/BusinessSetupStatusStrip";
import BusinessSetupMainCard from "@/components/business-setup/BusinessSetupMainCard";
import BusinessSetupHelpPanel from "@/components/business-setup/BusinessSetupHelpPanel";

export default function BusinessSetupPage() {
  const router = useRouter();
  const [show_next_step, setShowNextStep] = useState(false);

  const {
    status,
    card,
    updateBusinessSetupField,
    saveBusinessSetup,
    resetBusinessSetup,
  } = useBusinessSetup();

  function handleSaveBusinessSetup() {
    const setup_complete = saveBusinessSetup();

    if (setup_complete) {
      setShowNextStep(true);
    }
  }

  function handleContinueToLabour() {
    router.push("/labour");
  }

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-hero">
          <div className="ui-hero-inner">
            <div className="ui-kicker">Business setup</div>

            <h1 className="ui-hero-title">Business setup</h1>

            <p className="ui-hero-copy">
              Create your business profile and choose how QS Tools should
              interpret the business model.
            </p>

            <p className="ui-help">
              Labour-based businesses recover cost through productive hours.
              Product-based businesses recover cost through units sold.
            </p>
          </div>
        </section>

        <BusinessSetupStatusStrip status={status} />

        <BusinessSetupMainCard
          card={card}
          show_next_step={show_next_step}
          updateBusinessSetupField={updateBusinessSetupField}
          saveBusinessSetup={handleSaveBusinessSetup}
          resetBusinessSetup={resetBusinessSetup}
          continueToNextStep={handleContinueToLabour}
        />

        <BusinessSetupHelpPanel />
      </div>
    </main>
  );
}