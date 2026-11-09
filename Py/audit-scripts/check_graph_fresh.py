"""
check_graph_fresh.py   (V6.1bj, DEV_TOOLING_BRIEF T1 staleness check)

READ-ONLY. Says whether .tmp\\repo_graph\\repo_graph.json still matches the source it scanned.
It re-hashes every file in app, hooks, lib, components (plus tsconfig.json) and compares with the fingerprint stored
in the JSON. Prints OK, or STALE with the changed / added / removed files, or MISSING if the graph was never built.

Run (from D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\check_graph_fresh.py
    python Py\\audit-scripts\\check_graph_fresh.py --dir <folder>      (default .tmp\\repo_graph)
Clipboard capture:
    & { python Py\\audit-scripts\\check_graph_fresh.py } *>&1 | Out-String -Width 250 | Set-Clipboard
Exit code: 0 = OK, 1 = STALE or MISSING (so precommit_check.py can use it). Output is plain ASCII.
Fix when STALE: python Py\\audit-scripts\\build_repo_graph.py
"""

import json
import os
import sys

import bm7_common as C
from build_repo_graph import source_fingerprint, JSON_NAME, TOOL_VERSION


def main():
    argv = sys.argv[1:]
    d = os.path.join(C.ROOT, ".tmp", "repo_graph")
    if "--dir" in argv:
        d = os.path.abspath(argv[argv.index("--dir") + 1])
    p = os.path.join(d, JSON_NAME)
    if not os.path.isfile(p):
        C.emit("MISSING repo graph at %s. Run: python Py\\audit-scripts\\build_repo_graph.py" % p)
        return 1
    with open(p, encoding="ascii") as f:
        g = json.load(f)
    if g.get("tool_version") != TOOL_VERSION:
        C.emit("STALE repo graph was built by tool version %s, now %s. Rebuild." % (g.get("tool_version"), TOOL_VERSION))
        return 1
    now = source_fingerprint()
    old = g["fingerprint"]
    if now["digest"] == old["digest"]:
        C.emit("OK repo graph is fresh: %d files, fingerprint %s, built %s" % (len(now["files"]), now["digest"][:12], g.get("generated_at")))
        return 0
    of, nf = old["files"], now["files"]
    changed = sorted(k for k in nf if k in of and nf[k] != of[k])
    added = sorted(k for k in nf if k not in of)
    removed = sorted(k for k in of if k not in nf)
    cfg = sorted(k for k in set(now["config"]) | set(old["config"]) if now["config"].get(k) != old["config"].get(k))
    C.emit("STALE repo graph (built %s): %d changed, %d added, %d removed, %d config" % (
        g.get("generated_at"), len(changed), len(added), len(removed), len(cfg)))
    for lab, lst in (("changed", changed), ("added", added), ("removed", removed), ("config", cfg)):
        for x in lst[:6]:
            C.emit("  %s: %s" % (lab, x))
        if len(lst) > 6:
            C.emit("  %s: ... %d more" % (lab, len(lst) - 6))
    C.emit("Rebuild: python Py\\audit-scripts\\build_repo_graph.py")
    return 1


if __name__ == "__main__":
    sys.exit(main())
