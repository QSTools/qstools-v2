import { traceNodes } from "./pilot-map/traceNodes.js";
import {
  buildAssetNodes,
  buildAssetOverheadPoolNodes,
  buildStaffNodes,
} from "./pilot-map/dynamicTraceNodes.js";
import {
  buildLabourTypeSourceNodes,
  buildAssetSourceNodes,
  buildOverheadPoolNode,
  buildOperationalGroupNodes,
} from "./pilot-map/costAllocationTraceNodes.js";
import {
  buildRateBuilderRecoveryRowsBoundaryNode,
  buildRateBuilderLabourRateNodes,
} from "./pilot-map/rateBuilderTraceNodes.js";
import {
  buildBusinessOutcomePerSourceBoundaryNode,
  buildBusinessOutcomeLabourSourceNodes,
  buildBusinessOutcomeAssetSourceNodes,
  buildBusinessOutcomeMaterialsNode,
  buildBusinessOutcomeGroupNodes,
} from "./pilot-map/businessOutcomeTraceNodes.js";
import {
  buildBusinessOutcomeRealCapacityBoundaryNodes,
  buildBusinessOutcomeLabourSourceRealCapacityNodes,
  buildBusinessOutcomeAssetSourceRealCapacityNodes,
  buildBusinessOutcomeMaterialsRealCapacityNodes,
  buildBusinessOutcomeGroupRealCapacityNodes,
} from "./pilot-map/businessOutcomeRealCapacityTraceNodes.js";
import {
  buildBusinessOutcomeAssumedCapacityBoundaryNodes,
  buildBusinessOutcomeLabourSourceAssumedCapacityNodes,
  buildBusinessOutcomeAssetSourceAssumedCapacityNodes,
  buildBusinessOutcomeMaterialsAssumedCapacityNode,
  buildBusinessOutcomeGroupAssumedCapacityNodes,
} from "./pilot-map/businessOutcomeAssumedCapacityTraceNodes.js";
import {
  buildBusinessOutcomeNonProductiveDistributionPoolNode,
  buildBusinessOutcomePureSupportGroupNodes,
  buildBusinessOutcomeGroupNonProductiveCostNodes,
} from "./pilot-map/businessOutcomeNonProductiveDistributionTraceNodes.js";

import { buildBusinessModellingNodes } from "./pilot-map/businessModellingTraceNodes.js";

export function buildTraceGraph(liveValues) {
  const nodes = [
    ...traceNodes,
    ...buildAssetOverheadPoolNodes(liveValues),
    ...buildAssetNodes(liveValues),
    ...buildStaffNodes(liveValues),
    ...buildLabourTypeSourceNodes(liveValues),
    ...buildAssetSourceNodes(liveValues),
    ...buildOverheadPoolNode(liveValues),
    ...buildOperationalGroupNodes(liveValues),
    ...buildRateBuilderRecoveryRowsBoundaryNode(liveValues),
    ...buildRateBuilderLabourRateNodes(liveValues),
    ...buildBusinessOutcomePerSourceBoundaryNode(liveValues),
    ...buildBusinessOutcomeLabourSourceNodes(liveValues),
    ...buildBusinessOutcomeAssetSourceNodes(liveValues),
    ...buildBusinessOutcomeMaterialsNode(liveValues),
    ...buildBusinessOutcomeGroupNodes(liveValues),
    ...buildBusinessOutcomeRealCapacityBoundaryNodes(liveValues),
    ...buildBusinessOutcomeLabourSourceRealCapacityNodes(liveValues),
    ...buildBusinessOutcomeAssetSourceRealCapacityNodes(liveValues),
    ...buildBusinessOutcomeMaterialsRealCapacityNodes(liveValues),
    ...buildBusinessOutcomeGroupRealCapacityNodes(liveValues),
    ...buildBusinessOutcomeAssumedCapacityBoundaryNodes(liveValues),
    ...buildBusinessOutcomeLabourSourceAssumedCapacityNodes(liveValues),
    ...buildBusinessOutcomeAssetSourceAssumedCapacityNodes(liveValues),
    ...buildBusinessOutcomeMaterialsAssumedCapacityNode(liveValues),
    ...buildBusinessOutcomeGroupAssumedCapacityNodes(liveValues),
    ...buildBusinessOutcomeNonProductiveDistributionPoolNode(liveValues),
    ...buildBusinessOutcomePureSupportGroupNodes(liveValues),
    ...buildBusinessOutcomeGroupNonProductiveCostNodes(liveValues),
    ...buildBusinessModellingNodes(liveValues),
  ];

  const nodeById = new Map(nodes.map((node) => [node.node_id, node]));

  const edges = nodes.flatMap((node) =>
    (node.inputs ?? []).map((from_node_id) => ({
      edge_id: `${from_node_id}__to__${node.node_id}`,
      from_node_id,
      to_node_id: node.node_id,
      relationship_type: "direct_input",
    }))
  );

  return { nodes, nodeById, edges };
}

export function getTraceNode(graph, nodeId) {
  return graph?.nodeById?.get(nodeId) ?? null;
}

export function getIncomingEdges(graph, nodeId) {
  return (graph?.edges ?? []).filter((edge) => edge.to_node_id === nodeId);
}

export function getOutgoingEdges(graph, nodeId) {
  return (graph?.edges ?? []).filter((edge) => edge.from_node_id === nodeId);
}

export function getTraceNodesByModule(graph, moduleName) {
  return (graph?.nodes ?? []).filter((node) => node.module_name === moduleName);
}

export function getUpstreamTrace(graph, nodeId, visited = new Set()) {
  if (visited.has(nodeId)) {
    return { node: getTraceNode(graph, nodeId), incoming: [], cycleDetected: true };
  }

  const next_visited = new Set(visited);
  next_visited.add(nodeId);

  const node = getTraceNode(graph, nodeId);
  const incomingEdges = getIncomingEdges(graph, nodeId);

  return {
    node,
    incoming: incomingEdges.map((edge) => ({
      edge,
      from: getUpstreamTrace(graph, edge.from_node_id, next_visited),
    })),
    cycleDetected: false,
  };
}

export function getDownstreamTrace(graph, nodeId, visited = new Set()) {
  if (visited.has(nodeId)) {
    return { node: getTraceNode(graph, nodeId), outgoing: [], cycleDetected: true };
  }

  const next_visited = new Set(visited);
  next_visited.add(nodeId);

  const node = getTraceNode(graph, nodeId);
  const outgoingEdges = getOutgoingEdges(graph, nodeId);

  return {
    node,
    outgoing: outgoingEdges.map((edge) => ({
      edge,
      to: getDownstreamTrace(graph, edge.to_node_id, next_visited),
    })),
    cycleDetected: false,
  };
}

export function getMissingTraceEndpoints(graph) {
  const nodeIds = new Set((graph?.nodes ?? []).map((node) => node.node_id));

  return (graph?.edges ?? []).flatMap((edge) => {
    const missing = [];

    if (!nodeIds.has(edge.from_node_id)) {
      missing.push({ edge_id: edge.edge_id, endpoint: "from_node_id", node_id: edge.from_node_id });
    }

    if (!nodeIds.has(edge.to_node_id)) {
      missing.push({ edge_id: edge.edge_id, endpoint: "to_node_id", node_id: edge.to_node_id });
    }

    return missing;
  });
}

export function getDuplicateTraceNodeIds(graph) {
  const seen = new Set();
  const duplicates = new Set();

  (graph?.nodes ?? []).forEach((node) => {
    if (seen.has(node.node_id)) {
      duplicates.add(node.node_id);
    }
    seen.add(node.node_id);
  });

  return Array.from(duplicates);
}

export function getTraceIntegrityReport(graph) {
  return {
    nodeCount: graph?.nodes?.length ?? 0,
    edgeCount: graph?.edges?.length ?? 0,
    duplicateNodeIds: getDuplicateTraceNodeIds(graph),
    missingEndpoints: getMissingTraceEndpoints(graph),
  };
}

export function resolveTraceValue(node, liveValues) {
  if (!node || typeof node.resolve !== "function") {
    return null;
  }

  try {
    return node.resolve(liveValues);
  } catch (error) {
    return null;
  }
}