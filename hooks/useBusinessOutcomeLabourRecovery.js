"use client";

import { useEffect, useState } from "react";
import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useCostAllocation from "@/hooks/useCostAllocation";
import { readRateBuilderLabourSourceRates } from "@/lib/storage/rateBuilderLabourSourceRatesStorage";

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function build_overhead_rate_map(rate_builder_labour_recovery_rows = []) {
  const map = new Map();

  rate_builder_labour_recovery_rows.forEach((row) => {
    map.set(row.labour_source_type_id, {
      allocated_business_overhead_recovery_rate: to_number(
        row.allocated_business_overhead_recovery_rate
      ),
      has_overhead_data: true,
    });
  });

  return map;
}

function build_labour_recovery_rows(
  productive_staff_type_rates = [],
  overhead_rate_map,
  charge_out_rates_by_labour_source = {}
) {
  return productive_staff_type_rates.map((staff_type) => {
    const labour_source_type_id = staff_type.staff_type_id;
    const labour_cost_rate = to_number(staff_type.weighted_productive_hourly_rate);
    const productive_hours = to_number(staff_type.total_productive_hours);

    const overhead_entry = overhead_rate_map.get(labour_source_type_id);
    const overhead_rate = overhead_entry
      ? overhead_entry.allocated_business_overhead_recovery_rate
      : 0;
    const has_overhead_data = Boolean(overhead_entry);

    const true_cost_per_hour = labour_cost_rate + overhead_rate;

    const charge_out_rate = to_number(
      charge_out_rates_by_labour_source?.[labour_source_type_id]
    );

    const has_rate = charge_out_rate > 0;
    const rate_gap = round_currency(charge_out_rate - true_cost_per_hour);

    const recovery_status = !has_rate
      ? "not_ready"
      : rate_gap >= 0
      ? "recovering"
      : "shortfall";

    return {
      labour_source_type_id,
      labour_source_type_name: staff_type.staff_type_name,
      true_cost_per_hour: round_currency(true_cost_per_hour),
      charge_out_rate: round_currency(charge_out_rate),
      productive_hours,
      rate_gap,
      has_overhead_data,
      recovery_status,
    };
  });
}

function build_weighted_summary(labour_recovery_rows = []) {
  const total_hours = labour_recovery_rows.reduce(
    (sum, row) => sum + to_number(row.productive_hours),
    0
  );

  const rows_with_rate = labour_recovery_rows.filter(
    (row) => row.recovery_status !== "not_ready"
  );
  const hours_with_rate = rows_with_rate.reduce(
    (sum, row) => sum + to_number(row.productive_hours),
    0
  );

  const weighted_true_cost_per_hour =
    total_hours > 0
      ? round_currency(
          labour_recovery_rows.reduce(
            (sum, row) => sum + row.true_cost_per_hour * to_number(row.productive_hours),
            0
          ) / total_hours
        )
      : 0;

  const weighted_charge_out_rate =
    hours_with_rate > 0
      ? round_currency(
          rows_with_rate.reduce(
            (sum, row) => sum + row.charge_out_rate * to_number(row.productive_hours),
            0
          ) / hours_with_rate
        )
      : 0;

  const weighted_profit_per_hour =
    hours_with_rate > 0
      ? round_currency(
          rows_with_rate.reduce(
            (sum, row) => sum + row.rate_gap * to_number(row.productive_hours),
            0
          ) / hours_with_rate
        )
      : 0;

  return {
    weighted_true_cost_per_hour,
    weighted_charge_out_rate,
    weighted_profit_per_hour,
    hours_covered_by_saved_rate: hours_with_rate,
    total_hours,
    rate_coverage_percent:
      total_hours > 0 ? round_currency((hours_with_rate / total_hours) * 100) : 0,
  };
}

export default function useBusinessOutcomeLabourRecovery() {
  const labour = useLabour();
  const cost_allocation = useCostAllocation();

  const [charge_out_rates_by_labour_source, set_charge_out_rates] = useState({});

  useEffect(() => {
    set_charge_out_rates(readRateBuilderLabourSourceRates());
  }, []);

  const productive_staff_type_rates =
    labour?.output_contract?.productive_staff_type_rates ?? [];

  const rate_builder_labour_recovery_rows =
    cost_allocation?.output_contract?.rate_builder_labour_recovery_rows ?? [];

  const overhead_rate_map = useMemo(() => {
    return build_overhead_rate_map(rate_builder_labour_recovery_rows);
  }, [rate_builder_labour_recovery_rows]);

  const labour_recovery_rows = useMemo(() => {
    return build_labour_recovery_rows(
      productive_staff_type_rates,
      overhead_rate_map,
      charge_out_rates_by_labour_source
    );
  }, [productive_staff_type_rates, overhead_rate_map, charge_out_rates_by_labour_source]);

  const shortfall_rows = labour_recovery_rows.filter(
    (row) => row.recovery_status === "shortfall"
  );

  const not_ready_rows = labour_recovery_rows.filter(
    (row) => row.recovery_status === "not_ready"
  );

  const missing_overhead_rows = labour_recovery_rows.filter(
    (row) => !row.has_overhead_data
  );

  const sorted_by_gap = [...labour_recovery_rows].sort(
    (a, b) => a.rate_gap - b.rate_gap
  );

  const weakest_contribution_area = sorted_by_gap[0]
    ? {
        value: {
          labour_source_type_name: sorted_by_gap[0].labour_source_type_name,
          rate_gap: sorted_by_gap[0].rate_gap,
        },
        status: "available",
      }
    : { value: null, status: "deferred", reason: "No labour recovery rows available." };

  const strongest_contribution_area = sorted_by_gap[sorted_by_gap.length - 1]
    ? {
        value: {
          labour_source_type_name:
            sorted_by_gap[sorted_by_gap.length - 1].labour_source_type_name,
          rate_gap: sorted_by_gap[sorted_by_gap.length - 1].rate_gap,
        },
        status: "available",
      }
    : { value: null, status: "deferred", reason: "No labour recovery rows available." };

  const weighted_summary = build_weighted_summary(labour_recovery_rows);

  return {
    labour_recovery_rows,
    shortfall_row_count: shortfall_rows.length,
    shortfall_rows,
    not_ready_row_count: not_ready_rows.length,
    not_ready_rows,
    missing_overhead_row_count: missing_overhead_rows.length,
    weighted_summary,
    strongest_contribution_area,
    weakest_contribution_area,
    data_status: labour_recovery_rows.length > 0 ? "ready" : "no_labour_sources",
  };
}


