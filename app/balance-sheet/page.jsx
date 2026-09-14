"use client";

import useBalanceSheet from "@/hooks/useBalanceSheet";
import BalanceSheetImportPanel from "@/components/balance-sheet/BalanceSheetImportPanel";
import BalanceSheetRatiosCard from "@/components/balance-sheet/BalanceSheetRatiosCard";
import BalanceSheetAccountsTable from "@/components/balance-sheet/BalanceSheetAccountsTable";
import NextStepFooter from "@/components/navigation/NextStepFooter";

export default function BalanceSheetPage() {
  const {
    has_data,
    as_at_date,
    accounts,
    totals,
    source_filename,
    imported_at,
    ratios,
    is_importing,
    import_error,
    importFile,
  } = useBalanceSheet();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <BalanceSheetImportPanel
            onImportFile={importFile}
            is_importing={is_importing}
            import_error={import_error}
            has_data={has_data}
            source_filename={source_filename}
            imported_at={imported_at}
          />
        </section>

        {has_data && (
          <section className="ui-section">
            <div className="ui-panel">
              <p className="ui-help" style={{ marginTop: 0 }}>
                As at {as_at_date || "unknown date"}.
              </p>
              <BalanceSheetRatiosCard ratios={ratios} />
            </div>
          </section>
        )}

        {has_data && (
          <section className="ui-section">
            <div className="ui-panel">
              <BalanceSheetAccountsTable accounts={accounts} totals={totals} />
            </div>
          </section>
        )}

        <NextStepFooter nextHref="/business-outcome" nextLabel="Next: Business Outcome" />
      </div>
    </main>
  );
}