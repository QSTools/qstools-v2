"use client";

import { useMemo, useState } from "react";

import ExportJsonButton from "@/components/dev-tools/ExportJsonButton";
import { calculationTracePilotMeta } from "@/lib/calculation-trace/pilot-map/pilotMeta";
import { useCalculationTraceLiveValues } from "@/lib/calculation-trace/calculationTraceLiveValues";
import {
  buildTraceGraph,
  getIncomingEdges,
  getOutgoingEdges,
  getTraceNode,
  getTraceIntegrityReport,
  getUpstreamTrace,
  resolveTraceValue,
} from "@/lib/calculation-trace/calculationTraceSelectors";

function formatTraceValue(value, format) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not available";
  }

  const number_value = Number(value);
  if (!Number.isFinite(number_value)) {
    return "Not available";
  }

  if (format === "currency") {
    return number_value.toLocaleString("en-NZ", {
      style: "currency",
      currency: "NZD",
      maximumFractionDigits: 0,
    });
  }

  if (format === "currency_per_unit") {
    return number_value.toLocaleString("en-NZ", {
      style: "currency",
      currency: "NZD",
      maximumFractionDigits: 2,
    });
  }

  return number_value.toLocaleString("en-NZ", { maximumFractionDigits: 2 });
}

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

function TraceNodeCard({ node, liveValues }) {
  if (!node) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
        Missing trace node.
      </div>
    );
  }

  const resolved_value = resolveTraceValue(node, liveValues);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StatusPill>{node.module_name}</StatusPill>
        {node.is_root_input ? <WarningPill>root input</WarningPill> : null}
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          {node.implementation_status}
        </span>
      </div>

      <h3 className="text-base font-semibold text-slate-50">{node.display_label}</h3>

      <p className="mt-1 font-mono text-xs text-slate-400">{node.node_id}</p>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Live value</p>
        <p className="mt-1 font-mono text-lg text-cyan-200">
          {formatTraceValue(resolved_value, node.value_format)}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Formula / rule text</p>
        <p className="mt-1 text-sm text-slate-200">{node.formula_text || "No formula text recorded."}</p>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
        <p><span className="text-slate-500">Brief:</span> {node.brief_reference}</p>
        <p><span className="text-slate-500">Verified:</span> {node.last_verified_against}</p>
        <p><span className="text-slate-500">Source file:</span> {node.source_file ?? "deferred"}</p>
        <p><span className="text-slate-500">Status:</span> {node.implementation_status}</p>
      </div>
    </div>
  );
}

function IncomingEdgeList({ graph, nodeId }) {
  const incomingEdges = getIncomingEdges(graph, nodeId);

  if (incomingEdges.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No incoming edges. This node is treated as a root input or boundary.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {incomingEdges.map((edge) => {
        const fromNode = getTraceNode(graph, edge.from_node_id);

        return (
          <div key={edge.edge_id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{edge.relationship_type}</StatusPill>
              <span className="font-mono text-xs text-slate-400">{edge.edge_id}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              From: <span className="text-slate-100">{fromNode?.display_label ?? edge.from_node_id}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

function OutgoingEdgeList({ graph, nodeId }) {
  const outgoingEdges = getOutgoingEdges(graph, nodeId);

  if (outgoingEdges.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Not currently used as an input to any other traced node.
      </p>
    );
  }

  const shared = outgoingEdges.length > 1;

  return (
    <div className="space-y-3">
      {shared ? <WarningPill>shared - feeds {outgoingEdges.length} nodes</WarningPill> : null}
      {outgoingEdges.map((edge) => {
        const toNode = getTraceNode(graph, edge.to_node_id);

        return (
          <div key={edge.edge_id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-sm text-slate-300">
              Feeds: <span className="text-slate-100">{toNode?.display_label ?? edge.to_node_id}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

function buildTraceSnapshot(graph, liveValues, integrityReport) {
  const nodes = (graph?.nodes ?? []).map((node) => ({
    node_id: node.node_id,
    display_label: node.display_label,
    module_name: node.module_name,
    is_root_input: node.is_root_input,
    value_format: node.value_format,
    implementation_status: node.implementation_status,
    inputs: node.inputs,
    resolved_value: resolveTraceValue(node, liveValues),
  }));

  return {
    captured_at: new Date().toISOString(),
    integrity_report: integrityReport,
    nodes,
    edges: graph?.edges ?? [],
    cost_allocation_raw: liveValues?.cost_allocation ?? null,
  };
}

function flattenUpstreamTrace(trace, depth = 0, rows = []) {
  if (!trace?.node) {
    return rows;
  }

  rows.push({ node: trace.node, depth, cycleDetected: trace.cycleDetected });

  trace.incoming?.forEach((item) => {
    flattenUpstreamTrace(item.from, depth + 1, rows);
  });

  return rows;
}

export default function CalculationTracePage() {
  const liveValues = useCalculationTraceLiveValues();

  const graph = useMemo(() => buildTraceGraph(liveValues), [liveValues]);

  const [selectedNodeId, setSelectedNodeId] = useState(calculationTracePilotMeta.selected_initial_output);
  const selectedNode = getTraceNode(graph, selectedNodeId);
  const integrityReport = getTraceIntegrityReport(graph);
  const upstreamTrace = getUpstreamTrace(graph, selectedNodeId);
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
                {selectedNode?.display_label ?? "Required Recovery Per Driver"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Live trace view. This page shows how the selected number was built, reading the
                same output_contract fields the real app pages read. It does not calculate or
                decide the number.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusPill>{calculationTracePilotMeta.status}</StatusPill>
              <select
                value={selectedNodeId}
                onChange={(event) => setSelectedNodeId(event.target.value)}
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-100"
              >
                <option value="business_summary.required_recovery_per_driver">Root: Business Summary</option>
                <option value="business_modelling.modelled_net_profit">Root: Business Modelling</option>
                <option value="rate_builder.labour_rate.supervisor_team_lead">Root: Rate Builder - Supervisor / Team Lead</option>
                <option value="rate_builder.labour_rate.operator_delivery_staff">Root: Rate Builder - Operator / Delivery Staff</option>
                <option value="rate_builder.labour_rate.all_productive">Root: Rate Builder - All Productive</option>
              </select>
              {!liveValues.is_hydrated ? <WarningPill>waiting for data to load</WarningPill> : null}
              <ExportJsonButton
                data={buildTraceSnapshot(graph, liveValues, integrityReport)}
                filenamePrefix="calculation_trace_snapshot"
                label="Download trace JSON"
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 hover:bg-cyan-400/20"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
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
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Selected output node</h2>
            <TraceNodeCard node={selectedNode} liveValues={liveValues} />

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h2 className="text-lg font-semibold">Incoming relationships</h2>
              <div className="mt-4">
                <IncomingEdgeList graph={graph} nodeId={selectedNodeId} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-lg font-semibold">Also feeds</h2>
            <p className="mt-1 text-xs text-slate-400">
              Other nodes this value also feeds into - a shared overhead pool or a split staff
              member's cost will show more than one entry here.
            </p>
            <div className="mt-4">
              <OutgoingEdgeList graph={graph} nodeId={selectedNodeId} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">Upstream trace path</h2>
          <div className="mt-4 space-y-3">
            {upstreamRows.map((row, index) => {
              const value = resolveTraceValue(row.node, liveValues);

              return (
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
                  <p className="mt-1 font-mono text-sm text-cyan-200">
                    {formatTraceValue(value, row.node.value_format)}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{row.node.formula_text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">Deferred boundaries</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              P&L / Module Reconciliation trace layer is deferred.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              Business Modelling: source rows and saved lever inputs are traced read-only; the legacy
              Baseline/Upside/Downside tools and the modelled_per_source rerun are not.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              cost_summary.total_cost_burden's internal arithmetic (costSummaryCalculations.js)
              was traced via its hook's inputs, not re-derived line by line this session.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              Calculation Trace is not a downstream dependency - nothing else in the app reads
              from it.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}