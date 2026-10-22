import {
  calculationTracePilotMeta,
  traceEdges,
  traceNodes,
} from "../lib/calculation-trace/calculationTracePilotMap.js";

import {
  getDuplicateTraceEdgeIds,
  getDuplicateTraceNodeIds,
  getMissingTraceEndpoints,
  getTraceNode,
  getUpstreamTrace,
} from "../lib/calculation-trace/calculationTraceSelectors.js";

const selectedOutput = calculationTracePilotMeta.selected_initial_output;

const report = {
  nodeCount: traceNodes.length,
  edgeCount: traceEdges.length,
  selectedOutput,
  selectedOutputExists: Boolean(getTraceNode(selectedOutput)),
  duplicateNodeIds: getDuplicateTraceNodeIds(),
  duplicateEdgeIds: getDuplicateTraceEdgeIds(),
  missingEndpoints: getMissingTraceEndpoints(),
  upstreamTraceExists: Boolean(getUpstreamTrace(selectedOutput)?.node),
};

console.log(JSON.stringify(report, null, 2));

if (report.nodeCount !== 41) {
  throw new Error(`Expected 41 trace nodes, found ${report.nodeCount}`);
}

if (report.edgeCount !== 41) {
  throw new Error(`Expected 41 trace edges, found ${report.edgeCount}`);
}

if (!report.selectedOutputExists) {
  throw new Error(`Selected output node not found: ${selectedOutput}`);
}

if (report.duplicateNodeIds.length > 0) {
  throw new Error(`Duplicate trace node ids found: ${report.duplicateNodeIds.join(", ")}`);
}

if (report.duplicateEdgeIds.length > 0) {
  throw new Error(`Duplicate trace edge ids found: ${report.duplicateEdgeIds.join(", ")}`);
}

if (report.missingEndpoints.length > 0) {
  throw new Error(`Missing trace endpoints found: ${JSON.stringify(report.missingEndpoints)}`);
}

console.log("Calculation trace integrity check passed.");
