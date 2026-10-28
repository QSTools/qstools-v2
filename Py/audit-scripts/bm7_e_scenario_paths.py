"""
bm7_e_scenario_paths.py

BM-7 audit, part E. READ-ONLY (changes no files).

Question (Business Modelling brief Addendum 4 item 8): can a scenario add or
remove a row without touching real data? For each part of the scenario path
(Labour staff, Assets, Cost Allocation placement, COGS, General Overheads, P&L)
this shows the storage keys, the shape of the default saved state (is the thing a
LIST of rows or a computed value?), the load / save functions, and where the
numbers enter the chain.

Also answers three smaller audit questions:
  - where COGS enters the chain and how much of it comes from the P&L (the
    "added COGS line" design question)
  - which existing figure is the "minimum recoverable rate" (Addendum 3 item 3)
  - which Business Outcome view Business Modelling reads (BM-8)

Run (from repo root):  python Py\\audit-scripts\\bm7_e_scenario_paths.py
Plain ASCII on stdout. BM7_ALL=1 lifts the line caps.
"""

import re
from bm7_common import (ROOT, code_files, analyze, accesses, build_defs, DEFS, balanced, line_of,
                        emit, head, cap)
from bm7_d_seams_and_rebuilds import split_entries

CONCERNS = [
    ("LABOUR / STAFF", r"labour|staff|employee"),
    ("ASSETS", r"asset"),
    ("COST ALLOCATION (placement / assignments)", r"cost_?allocation|allocation|assignment"),
    ("REVENUE / COGS", r"cogs|revenue"),
    ("GENERAL OVERHEADS", r"overhead"),
    ("P&L", r"pnl|profit_?and_?loss|profitandloss"),
]
DEFAULT_NAME = re.compile(r"(?:export\s+)?const\s+((?:DEFAULT|EMPTY|INITIAL)\w*|default\w*|initial\w*|empty\w*)\s*=\s*\{")
FN_NAME = re.compile(r"load|save|read|write|get|set|clear|migrate|default|normali[sz]e|sanitis|sanitiz|create", re.I)


def vtype(entry):
    if ":" not in entry:
        return "shorthand"
    v = entry.split(":", 1)[1].strip()
    if v.startswith("["):
        return "LIST"
    if v.startswith("{"):
        return "object"
    if re.match(r"-?\d", v):
        return "number"
    if v[:1] in "'\"`":
        return "string"
    if v in ("true", "false"):
        return "bool"
    if v == "null":
        return "null"
    return "expr"


def main():
    files = code_files()
    build_defs()
    emit("BM-7 E. SCENARIO PATHS   root: " + ROOT)

    key_files = {}
    for rel in files:
        for a in accesses(rel):
            if a["op"] in "RWX":
                for k in a["keys"]:
                    key_files.setdefault(k, {"R": set(), "W": set(), "X": set()})[a["op"]].add(rel)

    for title, rx in CONCERNS:
        head("PATH: " + title)
        pat = re.compile(rx, re.I)
        keys = sorted(k for k in key_files if pat.search(k))
        emit("Storage keys:")
        if not keys:
            emit("    none matched by key name")
        for k in keys:
            f = key_files[k]
            emit("    %s   read %d file(s), written %d, removed %d" % (k, len(f["R"]), len(f["W"]), len(f["X"])))
            gate = sorted(set(analyze(x)["role"] for x in (f["R"] | f["W"] | f["X"])))
            emit("        touched from roles: " + ", ".join(gate))

        cand = set()
        for k in keys:
            cand.update(key_files[k]["R"] | key_files[k]["W"])
        cand = sorted(c for c in cand if analyze(c)["role"] in ("storage", "hook", "lib", "selector"))
        emit("Default saved-state shapes in the files that touch those keys:")
        shown = 0
        for rel in cand:
            d = analyze(rel)
            for m in DEFAULT_NAME.finditer(d["mk"]):
                o = m.end() - 1
                c = balanced(d["mk"], o, "{", "}")
                if c < 0:
                    continue
                entries = split_entries(d["clean"], d["mk"], o, c)
                parts = []
                for e in entries[:40]:
                    name = e.split(":", 1)[0].strip()[:30]
                    parts.append("%s=%s" % (name, vtype(e)))
                lists = [p for p in parts if p.endswith("=LIST")]
                emit("    %s:%d %s   %d field(s)%s" % (
                    rel, line_of(d["text"], o), m.group(1), len(entries),
                    ("   LISTS: " + ", ".join(p.split("=")[0] for p in lists)) if lists else "   (no list fields)"))
                for chunk in cap(["        " + ", ".join(parts[i:i + 6]) for i in range(0, len(parts), 6)], 8):
                    emit(chunk)
                shown += 1
        if not shown:
            emit("    none found (state may be built inline, review the files below)")

        emit("Load / save style functions in those files:")
        fl = []
        for rel in cand:
            for (r2, n2), df in sorted(DEFS.items()):
                if r2 == rel and FN_NAME.search(n2) and not n2.startswith("use"):
                    fl.append("    %s :: %s(%s)" % (rel, n2, ", ".join(p for p in df["params"] if p)[:60]))
        for line in cap(fl, 24):
            emit(line)
        if not fl:
            emit("    none")

        emit("Where the term enters the chain (hooks / lib / selectors, by mentions):")
        hits = []
        for rel in files:
            d = analyze(rel)
            if d["role"] in ("component", "layout", "page"):
                continue
            n = len(re.findall(rx, d["mk"], re.I))
            if n >= 4:
                hits.append((n, rel, d["role"]))
        hits.sort(key=lambda x: (-x[0], x[1]))
        for line in cap(["    %4d  %-9s %s" % (n, role, rel) for n, rel, role in hits], 10):
            emit(line)

    head("COGS: WHERE IT ENTERS, AND HOW MUCH OF IT COMES FROM THE P&L")
    rows = []
    for rel in files:
        d = analyze(rel)
        if d["role"] in ("component", "layout", "page"):
            continue
        n = len(re.findall(r"cogs|cost_of_goods|costofgoods", d["mk"], re.I))
        p = len(re.findall(r"pnl|profit_?and_?loss|profitandloss", d["mk"], re.I))
        if n >= 3:
            rows.append((n, rel, p))
    rows.sort(key=lambda x: (-x[0], x[1]))
    for line in cap(["%4d cogs mentions | %3d p&l mentions | %s" % (n, p, rel) for n, rel, p in rows], 25):
        emit(line)
    emit("Files with both counts high are where COGS is read from the P&L. A scenario COGS line")
    emit("needs an injection point downstream of that read, or a copy of the P&L inputs.")

    head("WHICH FIGURE IS THE 'MINIMUM RECOVERABLE RATE'?   (Addendum 3 item 3)")
    ident = re.compile(r"\b(?:min(?:imum)?_?recover\w*|required_?(?:asset_?)?recovery_?rate\w*|group_?min\w*|"
                       r"breakeven_?rate\w*|floor_?rate\w*|recovery_?rate\w*|minimum_?rate\w*)\b", re.I)
    names = {}
    for rel in files:
        d = analyze(rel)
        if d["role"] in ("component", "layout"):
            continue
        for m in ident.finditer(d["mk"]):
            names.setdefault(m.group(0), {})
            names[m.group(0)][rel] = names[m.group(0)].get(rel, 0) + 1
    lines = []
    for n, fl in sorted(names.items(), key=lambda kv: -sum(kv[1].values())):
        top = sorted(fl.items(), key=lambda kv: -kv[1])[:3]
        lines.append("%-40s %4d use(s) in %2d file(s): %s" % (n, sum(fl.values()), len(fl), "; ".join(f for f, _ in top)))
    for line in cap(lines, 30):
        emit(line)
    if not lines:
        emit("none matched")

    head("WHICH BUSINESS OUTCOME VIEW DOES BUSINESS MODELLING READ?   (BM-8)")
    bm = [r for r in files if "usebusinessmodelling" in r.lower() or r.startswith("app/business-modelling")]
    if not bm:
        emit("no Business Modelling hook or page found")
    for rel in bm:
        d = analyze(rel)
        imps = sorted(set(t for _, _, t, _ in d["imports"] if t and ("outcome" in t.lower() or "general-overheads" in t.lower()
                                                                     or "GeneralOverheads" in t)))
        toks = {}
        for m in re.finditer(r"\b(view_?[ab]\w*|per_source\w*|modelled_per_source\w*|viewB\w*|viewA\w*)\b", d["mk"], re.I):
            toks[m.group(1)] = toks.get(m.group(1), 0) + 1
        emit("%s" % rel)
        emit("    imports Business Outcome / Overheads: " + (", ".join(imps) if imps else "none"))
        emit("    view tokens: " + (", ".join("%s x%d" % kv for kv in sorted(toks.items(), key=lambda kv: -kv[1])[:8]) or "none"))
    emit("")
    emit("End of E.")


if __name__ == "__main__":
    main()
