"""
Scaling invariant check (R2 step 2a): for an EXACT multiple of the base staff count, every extensive figure in the
scaled expected file must equal the base figure x factor. Any other result means the scaling (or the expected
script) changed the shape, so the app comparison would not be telling you anything clean.

  python check_scaling.py expected_<base>_layer2.json expected_<scaled>_layer2.json

Aggregate nodes are matched by id. Group nodes are matched by group REF (the uuid5 ids differ between recipes).
Per-asset and per-row nodes are skipped: copies multiply the number of rows, so they are checked through the group roll-ups.
Rates and percentages (not extensive) must be EQUAL, not scaled.
"""
import json
import re
import sys

RATE_WORDS = ("rate", "per_hour", "per_driver", "percent", "markup")
# Whole-word match (F-10b regression, 2026-10-27): a plain substring test classed "operated_recovery_hours" as a rate
# because "operated" contains "rate". A word must start the key or follow a "." or "_".
RATE_RE = re.compile(r"(?:^|[._])(?:" + "|".join(RATE_WORDS) + r")")


def is_rate(key):
    return RATE_RE.search(key) is not None


def load(p):
    return json.load(open(p, encoding="utf-8"))


def by_ref(d):
    out = {}
    names = d["group_names"]
    for k, v in d["nodes"].items():
        m = re.match(r"^(business_outcome|cost_allocation)\.group\.([0-9a-f-]{36})\.(.+)$", k)
        if m and m.group(2) in names:
            out[(m.group(1), names[m.group(2)].split()[0], m.group(3))] = v
    return out


def main(base_path, scaled_path):
    b, s = load(base_path), load(scaled_path)
    f = float(sys.argv[3]) if len(sys.argv) > 3 else None
    if f is None:
        raise SystemExit("pass the factor as the third argument (scaled staff / base staff)")
    bad = 0
    total = 0
    for k, v in b["nodes"].items():
        if re.search(r"\.group\.|\.asset\.|\.row\.|\.staff\.", k):
            continue
        if k not in s["nodes"]:
            continue
        total += 1
        rate = is_rate(k)
        exp = v if rate else v * f
        tol = max(1.0 * f, abs(exp) * 1e-4)
        if abs(s["nodes"][k] - exp) > tol:
            bad += 1
            print(f"  FAIL {k}: scaled {s['nodes'][k]:,.4f} vs {'equal' if rate else 'x factor'} {exp:,.4f}")
    gb, gs = by_ref(b), by_ref(s)
    for k, v in gb.items():
        if k not in gs:
            continue
        total += 1
        rate = is_rate(k[2])
        exp = v if rate else v * f
        tol = max(1.0 * f, abs(exp) * 1e-4)
        if abs(gs[k] - exp) > tol:
            bad += 1
            print(f"  FAIL {k}: scaled {gs[k]:,.4f} vs {'equal' if rate else 'x factor'} {exp:,.4f}")
    print(f"scaling invariant (factor {f:g}): {total - bad} of {total} PASS")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
