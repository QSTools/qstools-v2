import { build_allocation_context } from "@/lib/calculations/cost-allocation/costAllocationRuleBuildContext";

export function calculate_cost_allocation(inputs = {}) {
  const context = build_allocation_context(inputs);

  return {
    ...inputs,
    ...context,
    cost_allocation_ready:
      context.allocation_status === "ready" ||
      context.allocation_status === "ready_with_dependency",
  };
}
