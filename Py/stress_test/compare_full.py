"""
Compare a calculation trace snapshot with expected_<id>_layer2.json: trace NODES and the Cost Allocation
RAW dump (the snapshot's cost_allocation_raw section).

  python compare_full.py expected_scenario_a_layer2.json calculation_trace_snapshot_<n>.json

PASS when |actual - expected| <= tol, where tol is the entry's own tolerance if it has one (rates, rounded
to 2 dp in the app) else max(1.00, 0.0001 x |expected|) - same rule as compare_trace.py.
Exit code 1 if anything FAILS or is MISSING, so it can sit in the regression suite.
"""
import json
import sys


def resolve(obj, path):
    for step in path:
        if isinstance(step, dict):
            obj = next((x for x in obj if all(x.get(k) == v for k, v in step.items())), None)
        else:
            obj = obj.get(step) if isinstance(obj, dict) else None
        if obj is None:
            return None
    return obj


def default_tol(e):
    return max(1.0, 0.0001 * abs(e))


def main(exp_path, snap_path):
    exp = json.load(open(exp_path, encoding="utf-8"))
    snap = json.load(open(snap_path, encoding="utf-8"))
    actual = {n["node_id"]: n.get("resolved_value") for n in snap["nodes"]}
    raw = snap.get("cost_allocation_raw") or {}
    names = exp.get("group_names", {})
    tols = exp.get("tolerances", {})
    bad = 0
    total = 0
    print(f'Expected as of {exp["as_of"]}; snapshot captured {snap.get("captured_at")}')
    print(f'Snapshot integrity: {snap.get("integrity_report")}\n')

    def label(node):
        return ".".join(names.get(p, p) for p in node.split("."))

    def row(name, e, a, tol):
        nonlocal bad, total
        total += 1
        if a is None:
            bad += 1
            print(f"{name[:70]:70} {e:>16,.4f} {'(missing)':>16} {'':>12}  MISSING")
            return
        d = a - e
        ok = abs(d) <= tol
        bad += 0 if ok else 1
        print(f"{name[:70]:70} {e:>16,.4f} {a:>16,.4f} {d:>12,.4f}  {'PASS' if ok else 'FAIL'}")

    print("--- trace nodes ---")
    print(f'{"node":70} {"expected":>16} {"actual":>16} {"diff":>12}  result')
    for node, e in exp["nodes"].items():
        row(label(node), e, actual.get(node), tols.get(node, default_tol(e)))
    print("\n--- Cost Allocation raw dump ---")
    for c in exp.get("raw_checks", []):
        e = c["expected"]
        row(c["label"], e, resolve(raw, c["path"]), c["tol"] if c.get("tol") is not None else default_tol(e))
    print("\n--- derived checks (expected = const + coef x app percent / 100) ---")
    for c in exp.get("derived_checks", []):
        pct = resolve(raw, c["percent_path"])
        if pct is None:
            e = 0.0
            a = None
        else:
            e = c["const"] + c["coef"] * pct / 100.0
            a = actual.get(c["key"]) if c["kind"] == "node" else resolve(raw, c["path"])
        row(f'{c["label"]} (share {pct})', e, a, c["tol"] if c.get("tol") is not None else default_tol(e))
    print(f"\n{total - bad} of {total} passed.")
    print("NOTE: asset interest uses the NZ calendar date the page ran on; re-generate with --as-of set to that date if only interest nodes fail.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:3]))
