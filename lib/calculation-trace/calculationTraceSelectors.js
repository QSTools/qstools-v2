import { traceEdges, traceNodes } from "./calculationTracePilotMap.js";

export function getTraceNode(nodeId) {
  return traceNodes.find((node) => node.node_id === nodeId) ?? null;
}

export function getIncomingEdges(nodeId) {
  return traceEdges.filter((edge) => edge.to_node_id === nodeId);
}

export function getOutgoingEdges(nodeId) {
  return traceEdges.filter((edge) => edge.from_node_id === nodeId);
}

export function getTraceNodesByModule(moduleName) {
  return traceNodes.filter((node) => node.module_name === moduleName);
}

export function getUpstreamTrace(nodeId, visited = new Set()) {
  if (visited.has(nodeId)) {
    return {
      node: getTraceNode(nodeId),
      incoming: [],
      cycleDetected: true,
    };
  }

  visited.add(nodeId);

  const node = getTraceNode(nodeId);
  const incomingEdges = getIncomingEdges(nodeId);

  return {
    node,
    incoming: incomingEdges.map((edge) => ({
      edge,
      from: getUpstreamTrace(edge.from_node_id, new Set(visited)),
    })),
    cycleDetected: false,
  };
}

export function getDownstreamTrace(nodeId, visited = new Set()) {
  if (visited.has(nodeId)) {
    return {
      node: getTraceNode(nodeId),
      outgoing: [],
      cycleDetected: true,
    };
  }

  visited.add(nodeId);

  const node = getTraceNode(nodeId);
  const outgoingEdges = getOutgoingEdges(nodeId);

  return {
    node,
    outgoing: outgoingEdges.map((edge) => ({
      edge,
      to: getDownstreamTrace(edge.to_node_id, new Set(visited)),
    })),
    cycleDetected: false,
  };
}

export function getMissingTraceEndpoints() {
  const nodeIds = new Set(traceNodes.map((node) => node.node_id));

  return traceEdges.flatMap((edge) => {
    const missing = [];

    if (!nodeIds.has(edge.from_node_id)) {
      missing.push({
        edge_id: edge.edge_id,
        endpoint: "from_node_id",
        node_id: edge.from_node_id,
      });
    }

    if (!nodeIds.has(edge.to_node_id)) {
      missing.push({
        edge_id: edge.edge_id,
        endpoint: "to_node_id",
        node_id: edge.to_node_id,
      });
    }

    return missing;
  });
}

export function getDuplicateTraceNodeIds() {
  const seen = new Set();
  const duplicates = new Set();

  traceNodes.forEach((node) => {
    if (seen.has(node.node_id)) {
      duplicates.add(node.node_id);
    }

    seen.add(node.node_id);
  });

  return Array.from(duplicates);
}

export function getDuplicateTraceEdgeIds() {
  const seen = new Set();
  const duplicates = new Set();

  traceEdges.forEach((edge) => {
    if (seen.has(edge.edge_id)) {
      duplicates.add(edge.edge_id);
    }

    seen.add(edge.edge_id);
  });

  return Array.from(duplicates);
}

export function getTraceIntegrityReport() {
  return {
    nodeCount: traceNodes.length,
    edgeCount: traceEdges.length,
    duplicateNodeIds: getDuplicateTraceNodeIds(),
    duplicateEdgeIds: getDuplicateTraceEdgeIds(),
    missingEndpoints: getMissingTraceEndpoints(),
  };
}

