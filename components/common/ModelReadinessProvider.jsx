"use client";

import { ModelReadinessContext, useModelReadinessOwn } from "@/hooks/useModelReadiness";

// R2 item b (2026-10-24): one shared model-readiness per page. Business Outcome mounted
// useModuleReconciliation (which builds P&L, General Overheads, Labour, Assets and Opening
// Hours) nine times through useBusinessSummary / useRevenueSummary / useRecoverySummary.
// Wrap a route in this provider and every useModelReadiness below it reads this one result.
export default function ModelReadinessProvider({ children }) {
  const value = useModelReadinessOwn();
  return <ModelReadinessContext.Provider value={value}>{children}</ModelReadinessContext.Provider>;
}