"use client";

import useFixedAssetRegister from "@/hooks/useFixedAssetRegister";
import FixedAssetRegisterImportPanel from "@/components/imports/FixedAssetRegisterImportPanel";
import FixedAssetRegisterPreviewTable from "@/components/imports/FixedAssetRegisterPreviewTable";
import NextStepFooter from "@/components/navigation/NextStepFooter";

/**
 * /imports - Data Imports hub
 *
 * NEW 2026-09-12. First step toward a single, central place for every
 * Xero import (P&L, Revenue/COGS, Balance Sheet, Fixed Asset Register),
 * matching how a single future Xero API connection will be able to
 * pull multiple report types from one place. Deliberately starts small:
 * only the Fixed Asset Register import lives here for now - Balance
 * Sheet's own import stays on /balance-sheet (already shipped, working,
 * not touched) until a real, deliberate migration happens later, not
 * forced through alongside this new feature.
 */
export default function ImportsPage() {
  const {
    assets,
    import_warnings,
    source_filename,
    imported_at,
    has_data,
    is_importing,
    import_error,
    importFile,
    setAssetIncluded,
  } = useFixedAssetRegister();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Data Imports</div>
            <div className="ui-display">Bring in real data from Xero</div>
            <p className="ui-lead">
              The start of a single place for every Xero import. Only the Fixed Asset Register lives here
              for now - Balance Sheet&apos;s import is still on its own page.
            </p>
          </div>
        </section>

        <section className="ui-section">
          <FixedAssetRegisterImportPanel
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
              <FixedAssetRegisterPreviewTable assets={assets} onSetIncluded={setAssetIncluded} />
            </div>
          </section>
        )}

        <NextStepFooter nextHref="/assets" nextLabel="Next: Assets" />
      </div>
    </main>
  );
}