"""
bm7_b_reach_map.py

BM-7 audit, part B. READ-ONLY (changes no files).

Question: for each page (and each hook), which storage keys can it reach through
its imports, and by which chain? This is the core of "can every page be pointed
at the modelled copy": if every path to a key goes through one storage module, a
mode-aware swap there covers the page; if a hook or component touches the key
directly, that file is a leak.

Reach follows import edges, so it OVER-states: a file that imports a storage
module may not call it. Part C (mounts) is the tighter view of what actually
runs. Pages are tagged by the R3 scope:
  TIER1     general-overheads, rate-builder
  SCENARIO  labour, assets, cost-allocation, revenue-cogs (and p-and-l for COGS)
  READS     business-outcome, business-modelling
  OTHER     everything else

Output sections: 1 page matrix (scoped pages x keys), 2 per-page chains for scoped
pages, 3 hook reach table, 4 pages outside scope that share keys with scoped pages.

Run (from repo root):  python Py\\audit-scripts\\bm7_b_reach_map.py
Plain ASCII on stdout. BM7_ALL=1 lifts the line caps.
"""

import re
from bm7_common import (ROOT, code_files, analyze, accesses, build_defs, import_edges, bfs, chain,
                        emit, head, cap, short)

TIER1 = ("general-overheads", "rate-builder")
SCENARIO = ("labour", "assets", "cost-allocation", "revenue-cogs", "p-and-l")
READS = ("business-outcome", "business-modelling")


def tag(rel):
    for t, names in (("TIER1", TIER1), ("SCENARIO", SCENARIO), ("READS", READS)):
        for n in names:
            if "/" + n + "/" in "/" + rel or rel.startswith("app/" + n):
                return t
    return "OTHER"


def keys_by_file(files):
    kf = {}
    for rel in files:
        k = {}
        for a in accesses(rel):
            if a["op"] in "RWX":
                for key in a["keys"]:
                    k.setdefault(key, set()).add(a["op"])
        if k:
            kf[rel] = k
    return kf


def reach(start, kf):
    parent = bfs(start, import_edges)
    found = {}
    for node in parent:
        if node in kf:
            for key, ops in kf[node].items():
                e = found.setdefault(key, {"ops": set(), "via": {}})
                for op in ops:
                    e["ops"].add(op)
                    e["via"].setdefault(op, node)
    return parent, found


def main():
    files = code_files()
    build_defs()
    kf = keys_by_file(files)
    pages = [r for r in files if analyze(r)["role"] == "page"]
    emit("BM-7 B. REACH MAP   root: " + ROOT)
    emit("%d pages, %d files touch storage, %d distinct keys." % (
        len(pages), len(kf), len(set(k for v in kf.values() for k in v))))

    results = {}
    for p in pages:
        results[p] = reach(p, kf)

    allkeys = sorted(set(k for p in pages for k in results[p][1]))
    scoped = [p for p in pages if tag(p) != "OTHER"]

    head("1. PAGE x KEY MATRIX   (scoped pages; R W X = reachable operation)")
    if not scoped:
        emit("No page matched the scope names - check route folder names under app/.")
    for p in sorted(scoped, key=lambda x: (tag(x), x)):
        found = results[p][1]
        parts = []
        for k in sorted(found):
            parts.append("%s[%s]" % (k, "".join(sorted(found[k]["ops"]))))
        emit("%-8s %s  (%d files in reach)" % (tag(p), p, len(results[p][0])))
        emit("         " + ("; ".join(parts) if parts else "no storage keys reachable"))

    head("2. HOW EACH SCOPED PAGE REACHES EACH KEY   (first import chain found, per operation)")
    out = []
    for p in sorted(scoped, key=lambda x: (tag(x), x)):
        parent, found = results[p]
        out.append("%s  %s" % (tag(p), p))
        for k in sorted(found):
            for op in sorted(found[k]["via"]):
                node = found[k]["via"][op]
                role = analyze(node)["role"]
                ch = chain(parent, node)
                out.append("    %s %s  touched in %s [%s]" % (op, k, node, role))
                out.append("        chain: " + " > ".join(short(c) for c in ch))
    for line in cap(out, 260):
        emit(line)

    head("3. HOOK REACH   (hook file | keys reachable through imports | direct keys)")
    rows = []
    for rel in files:
        if analyze(rel)["role"] != "hook" and not re.match(r"use[A-Z]", rel.split("/")[-1]):
            continue
        parent, found = reach(rel, kf)
        direct = kf.get(rel, {})
        if not found:
            continue
        w = sorted(k for k, v in found.items() if "W" in v["ops"] or "X" in v["ops"])
        rows.append((len(found), rel, sorted(found), w, sorted(direct)))
    rows.sort(key=lambda r: (-r[0], r[1]))
    for r in cap(["%2d key(s) | %s | writes: %s | direct: %s" % (
            r[0], r[1], ", ".join(r[3]) or "-", ", ".join(r[4]) or "-") for r in rows], 90):
        emit(r)

    head("4. KEYS SHARED BETWEEN SCOPED PAGES AND OTHER PAGES")
    scoped_keys = {}
    for p in scoped:
        for k in results[p][1]:
            scoped_keys.setdefault(k, set()).add(p)
    other_pages = [p for p in pages if p not in scoped]
    lines = []
    for k in sorted(scoped_keys):
        others = [p for p in other_pages if k in results[p][1]]
        lines.append("%s : scoped %d page(s), other %d page(s)%s" % (
            k, len(scoped_keys[k]), len(others), ("  e.g. " + ", ".join(short(o, 2) for o in others[:4])) if others else ""))
    for line in cap(lines, 60):
        emit(line)
    emit("")
    emit("End of B. Chains show the first import path found, not every path.")


if __name__ == "__main__":
    main()
