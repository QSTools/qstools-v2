"""
Compare a calculation trace snapshot (saved from the trace page) with the
independent expected values from generate_business.py.

  python compare_trace.py expected_scenario_a.json calculation_trace_snapshot_<n>.json

PASS when |actual - expected| <= max(1.00, 0.0001 x |expected|): one dollar, or
0.01 percent for large figures (allows per-row rounding in the app).
Exit code 1 if any node FAILS or is MISSING, so it can run in the regression suite.
"""
import json
import sys


def main(exp_path, snap_path):
    exp = json.load(open(exp_path, encoding="utf-8"))
    snap = json.load(open(snap_path, encoding="utf-8"))
    actual = {n["node_id"]: n.get("resolved_value") for n in snap["nodes"]}
    print(f'Expected as of {exp["as_of"]}; snapshot captured {snap.get("captured_at")}')
    print(f'Snapshot integrity: {snap.get("integrity_report")}\n')
    bad = 0
    print(f'{"node":55} {"expected":>16} {"actual":>16} {"diff":>12}  result')
    names = exp.get("group_names", {})

    def label(node):
        parts = node.split(".")
        return ".".join(names.get(p, p) for p in parts)[:55]

    for node, e in exp["nodes"].items():
        a = actual.get(node)
        if a is None:
            print(f"{label(node):55} {e:>16,.2f} {'(missing)':>16} {'':>12}  MISSING")
            bad += 1
            continue
        d = a - e
        ok = abs(d) <= max(1.0, 0.0001 * abs(e))
        bad += 0 if ok else 1
        print(f"{label(node):55} {e:>16,.2f} {a:>16,.2f} {d:>12,.2f}  {'PASS' if ok else 'FAIL'}")
    print(f"\n{len(exp['nodes']) - bad} of {len(exp['nodes'])} passed.")
    print("NOTE: asset interest uses the NZ calendar date the page ran on (captured_at is UTC, so it can show the day before).")
    print("      If only asset-interest nodes fail, re-generate with --as-of set to that NZ date.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:3]))
