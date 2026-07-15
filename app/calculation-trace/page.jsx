import {
  calculationTracePilotMeta,
  traceEdges,
  traceNodes,
} from "@/lib/calculation-trace/calculationTracePilotMap";

import {
  getIncomingEdges,
  getTraceIntegrityReport,
  getTraceNode,
  getUpstreamTrace,
} from "@/lib/calculation-trace/calculationTraceSelectors";

function StatusPill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
      {children}
    </span>
  );
}

function WarningPill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
      {children}
    </span>
  );
}

function TraceNodeCard({ node }) {
  if (!node) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
        Missing trace node.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StatusPill>{node.module_name}</StatusPill>
        {node.is_root_input ? <WarningPill>root input</WarningPill> : null}
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          {node.value_source}
        </span>
      </div>

      <h3 className="text-base font-semibold text-slate-50">{node.display_label}</h3>

      <p className="mt-1 font-mono text-xs text-slate-400">{node.node_id}</p>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Formula / rule text</p>
        <p className="mt-1 text-sm text-slate-200">{node.formula_text || "No formula text recorded."}</p>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
        <p>
          <span className="text-slate-500">Brief:</span> {node.brief_reference}
        </p>
        <p>
          <span className="text-slate-500">Verified:</span> {node.last_verified_against}
        </p>
        <p>
          <span className="text-slate-500">Source file:</span> {node.source_file ?? "deferred"}
        </p>
        <p>
          <span className="text-slate-500">Status:</span> {node.implementation_status}
        </p>
      </div>
    </div>
  );
}

function IncomingEdgeList({ nodeId }) {
  const incomingEdges = getIncomingEdges(nodeId);

  if (incomingEdges.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No incoming edges. This node is treated as a pilot-scope root or boundary.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {incomingEdges.map((edge) => {
        const fromNode = getTraceNode(edge.from_node_id);

        return (
          <div key={edge.edge_id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{edge.relationship_type}</StatusPill>
              <span className="font-mono text-xs text-slate-400">{edge.edge_id}</span>
            </div>

            <p className="mt-2 text-sm text-slate-300">
              From: <span className="text-slate-100">{fromNode?.display_label ?? edge.from_node_id}</span>
            </p>

            <p className="mt-1 text-xs text-slate-500">{edge.notes}</p>
          </div>
        );
      })}
    </div>
  );
}

function flattenUpstreamTrace(trace, depth = 0, rows = []) {
  if (!trace?.node) {
    return rows;
  }

  rows.push({
    node: trace.node,
    depth,
    cycleDetected: trace.cycleDetected,
  });

  trace.incoming?.forEach((item) => {
    flattenUpstreamTrace(item.from, depth + 1, rows);
  });

  return rows;
}

export default function CalculationTracePage() {
  const selectedNodeId = calculationTracePilotMeta.selected_initial_output;
  const selectedNode = getTraceNode(selectedNodeId);
  const integrityReport = getTraceIntegrityReport();
  const upstreamTrace = getUpstreamTrace(selectedNodeId);
  const upstreamRows = flattenUpstreamTrace(upstreamTrace);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">
                Calculation Trace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Required Recovery Per Driver
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Read-only trace view for the locked source-module-level pilot. This page shows how the selected number was built. It does not calculate or decide the number.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusPill>{calculationTracePilotMeta.status}</StatusPill>
              <WarningPill>code verification deferred</WarningPill>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Nodes</p>
            <p className="mt-2 text-2xl font-semibold">{integrityReport.nodeCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Edges</p>
            <p className="mt-2 text-2xl font-semibold">{integrityReport.edgeCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Missing endpoints</p>
            <p className="mt-2 text-2xl font-semibold">{integrityReport.missingEndpoints.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Duplicates</p>
            <p className="mt-2 text-2xl font-semibold">
              {integrityReport.duplicateNodeIds.length + integrityReport.duplicateEdgeIds.length}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Selected output node</h2>
            <TraceNodeCard node={selectedNode} />

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h2 className="text-lg font-semibold">Incoming relationships</h2>
              <div className="mt-4">
                <IncomingEdgeList nodeId={selectedNodeId} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-lg font-semibold">Manual proof result</h2>
            <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-sm text-slate-200">
              <p>total_cost_burden = 245,000</p>
              <p>activity_driver_value = 1,500</p>
              <p>required_recovery_per_driver = 245,000 / 1,500</p>
              <p>required_recovery_per_driver = 163.3333333333</p>
              <p>$163.33 per productive hour</p>
            </div>

            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              Representative proof only. This is not live business data and must not be used as a calculator.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">Upstream trace path</h2>

          <div className="mt-4 space-y-3">
            {upstreamRows.map((row, index) => (
              <div
                key={`${row.node.node_id}-${index}`}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                style={{ marginLeft: `${Math.min(row.depth, 6) * 16}px` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill>{row.node.module_name}</StatusPill>
                  {row.node.is_root_input ? <WarningPill>root</WarningPill> : null}
                  {row.cycleDetected ? <WarningPill>cycle detected</WarningPill> : null}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-100">{row.node.display_label}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{row.node.node_id}</p>
                <p className="mt-2 text-xs text-slate-400">{row.node.formula_text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">Deferred boundaries</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              P&L / Module Reconciliation trace layer is deferred.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              Business Outcome and Business Modelling tracing are outside this pilot.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              Code-level verification and source_file population are deferred.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              Calculation Trace is not a downstream dependency.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
