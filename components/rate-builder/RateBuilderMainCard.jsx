"use client";

import RateBuilderLineCalculator from "@/components/rate-builder/RateBuilderLineCalculator";

export default function RateBuilderMainCard() {
  return (
    <section className="flex flex-col gap-5">
      <RateBuilderLineCalculator />

      <section className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Coming later
        </p>

        <h2 className="mt-2 text-lg font-semibold text-white">
          Recovery comparison and saved rate models
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          This area will later compare the calculated effective rate against the
          recovery target, saved business templates, and business outcome
          requirements. The first build is focused only on defining charge
          lines and calculating the effective output-unit rate.
        </p>
      </section>
    </section>
  );
}