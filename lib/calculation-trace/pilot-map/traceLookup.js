import { traceEdges } from "./traceEdges.js";
import { traceNodes } from "./traceNodes.js";

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
