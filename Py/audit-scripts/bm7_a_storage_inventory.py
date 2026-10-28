"""
bm7_a_storage_inventory.py

BM-7 audit, part A. READ-ONLY (changes no files).

Question: which files touch localStorage / sessionStorage / indexedDB, what keys
do they read, write and remove, and is every access to a key behind ONE gate (a
storage module) or scattered across hooks, components and selectors?

Output sections:
  1  every file touching storage (role, R/W/X counts, keys, effect and guard flags)
  2  master key table (key -> reader files, writer files, single-gate or scattered)
  3  direct access outside storage modules (the suspects for "hooks reading
     localStorage directly")
  4  storage helper functions found (one-argument wrappers) and unresolved keys
  5  other storage surfaces (bare references, clear(), 'storage' events, indexedDB)
  6  storage mentions outside app / hooks / lib / components

Run (from repo root):  python Py\\audit-scripts\\bm7_a_storage_inventory.py
Output is plain ASCII on stdout; the PowerShell block copies it to the clipboard.
Set BM7_ALL=1 to lift the line caps.
Limits: heuristic regex scan, see bm7_common.py.
"""

import os
import re
from bm7_common import (ROOT, code_files, analyze, accesses, build_defs, DEFS, effect_report,
                        emit, head, cap, build_consts, KEY_CONSTS)


def main():
    files = code_files()
    build_defs()
    emit("BM-7 A. STORAGE INVENTORY   root: " + ROOT)
    touching = []
    for rel in files:
        d = analyze(rel)
        acc = accesses(rel)
        if acc or d["bare"] or d["idb"] or d["storage_event"]:
            touching.append(rel)
    emit("Scanned %d files in app, hooks, lib, components. %d touch storage." % (len(files), len(touching)))

    # ---- 1
    head("1. FILES TOUCHING STORAGE   (role | R W X | file | keys | flags)")
    rows = []
    for rel in touching:
        d = analyze(rel)
        acc = accesses(rel)
        cnt = {"R": 0, "W": 0, "X": 0}
        keys = {"R": set(), "W": set(), "X": set()}
        for a in acc:
            if a["op"] in cnt:
                cnt[a["op"]] += 1
                keys[a["op"]].update(a["keys"])
        allk = sorted(set().union(*keys.values()))
        flags = []
        eff = effect_report(rel)
        writes_in_effect = [e for e in eff if e["keys"]["W"] or e["keys"]["X"]]
        if writes_in_effect:
            g = all(e["guard_in_effect"] or e["guard_in_file"] for e in writes_in_effect)
            flags.append("save-effect(%d)%s" % (len(writes_in_effect), "" if g else " NO-GUARD"))
        if any(a["via"] for a in acc):
            flags.append("via-wrapper")
        if d["bare"]:
            flags.append("bare-ref(%d)" % d["bare"])
        if d["idb"]:
            flags.append("indexedDB")
        if d["storage_event"]:
            flags.append("storage-event")
        if any(a["store"] == "sessionStorage" for a in acc):
            flags.append("sessionStorage")
        rows.append((d["role"], rel, "%d %d %d" % (cnt["R"], cnt["W"], cnt["X"]),
                     ", ".join(allk) if allk else "-", " ".join(flags)))
    rows.sort()
    for line in cap(["%-9s | %-5s | %s | %s | %s" % (r[0], r[2], r[1], r[3], r[4]) for r in rows], 120):
        emit(line)

    # ---- 2
    head("2. MASTER KEY TABLE   (key | readers | writers | removers | gate)")
    table = {}
    for rel in touching:
        role = analyze(rel)["role"]
        for a in accesses(rel):
            if a["op"] not in "RWX":
                continue
            for k in a["keys"]:
                t = table.setdefault(k, {"R": set(), "W": set(), "X": set(), "roles": set()})
                t[a["op"]].add(rel)
                t["roles"].add(role)
    lines = []
    for k in sorted(table):
        t = table[k]
        files_all = t["R"] | t["W"] | t["X"]
        gate = "SINGLE-GATE" if files_all and all(analyze(f)["role"] == "storage" for f in files_all) else "SCATTERED"
        if len(files_all) == 1:
            gate = "ONE FILE (" + analyze(next(iter(files_all)))["role"] + ")"
        lines.append("%s   [%s]" % (k, gate))
        for lab, op in (("read by", "R"), ("written by", "W"), ("removed by", "X")):
            if t[op]:
                lines.append("      %-10s %s" % (lab, "; ".join(sorted(t[op]))))
    for line in cap(lines, 220):
        emit(line)
    emit("")
    emit("%d distinct key / key-pattern(s) accessed." % len(table))

    # ---- 3
    head("3. DIRECT STORAGE ACCESS OUTSIDE STORAGE MODULES (suspects)")
    sus = []
    for rel in touching:
        d = analyze(rel)
        if d["role"] == "storage":
            continue
        acc = [a for a in accesses(rel) if a["op"] in "RWXC"]
        if not acc:
            continue
        direct = [a for a in acc if not a["via"]]
        via = [a for a in acc if a["via"]]
        ks = sorted(set(k for a in acc for k in a["keys"]))
        sus.append("%-9s %s   direct:%d via-helper:%d   keys: %s" % (
            d["role"], rel, len(direct), len(via), ", ".join(ks) if ks else "-"))
    sus.sort()
    for line in cap(sus, 100):
        emit(line)
    if not sus:
        emit("none")

    # ---- 4
    head("4. STORAGE HELPER FUNCTIONS (take the key as an argument) AND UNRESOLVED KEYS")
    wr = []
    for (rel, name), df in sorted(DEFS.items()):
        if df["wrap"]:
            wr.append("%s :: %s(%s)   ops %s" % (rel, name, ", ".join(df["params"]),
                                                   ",".join("%s@arg%d" % (o, k) for o, k in sorted(df["wrap"]))))
    for line in cap(wr, 60):
        emit(line)
    if not wr:
        emit("none found")
    emit("")
    emit("Unresolved or computed key arguments (kind unresolved / expr):")
    un = []
    for rel in touching:
        for a in accesses(rel):
            if a["op"] in "RWX" and a["kind"] in ("unresolved", "expr"):
                un.append("%s:%d  %s  arg=%s  kind=%s" % (rel, a["line"], a["op"], a["arg"][:40], a["kind"]))
    for line in cap(un, 40):
        emit(line)
    if not un:
        emit("none")

    # ---- 5
    head("5. OTHER STORAGE SURFACES")
    oth = []
    for rel in touching:
        d = analyze(rel)
        acc = accesses(rel)
        bits = []
        if d["bare"]:
            bits.append("bare reference x%d (alias / Object.keys / typeof)" % d["bare"])
        if any(a["op"] == "C" for a in acc):
            bits.append("clear()")
        if any(a["op"] == "K" for a in acc):
            bits.append("key()/length enumeration")
        if d["storage_event"]:
            bits.append("listens to the 'storage' event")
        if d["idb"]:
            bits.append("indexedDB")
        if bits:
            oth.append("%s : %s" % (rel, "; ".join(bits)))
    for line in cap(oth, 50):
        emit(line)
    if not oth:
        emit("none")

    # ---- 6
    head("6. STORAGE MENTIONS OUTSIDE app / hooks / lib / components")
    out = []
    for sub in ("tools", "scripts", "public", "data"):
        base = os.path.join(ROOT, sub)
        for dp, dn, fn in os.walk(base):
            dn[:] = [x for x in dn if x not in ("node_modules", ".next", ".git")]
            for f in fn:
                if f.endswith((".js", ".jsx", ".ts", ".tsx", ".mjs", ".html")):
                    p = os.path.join(dp, f)
                    try:
                        t = open(p, encoding="utf-8", errors="ignore").read()
                    except OSError:
                        continue
                    n = len(re.findall(r"localStorage|sessionStorage|indexedDB", t))
                    if n:
                        out.append("%s : %d mention(s)" % (os.path.relpath(p, ROOT).replace("\\", "/"), n))
    for f in sorted(os.listdir(ROOT)):
        if f.endswith((".js", ".mjs", ".ts")) and os.path.isfile(os.path.join(ROOT, f)):
            t = open(os.path.join(ROOT, f), encoding="utf-8", errors="ignore").read()
            n = len(re.findall(r"localStorage|sessionStorage|indexedDB", t))
            if n:
                out.append("%s : %d mention(s)" % (f, n))
    for line in cap(sorted(out), 40):
        emit(line)
    if not out:
        emit("none")

    # ---- key constants never accessed
    head("7. KEY CONSTANTS DEFINED BUT NOT SEEN IN ANY STORAGE CALL (dead or indirect)")
    build_consts()
    accessed = set(table.keys())
    dead = []
    for name, vals in sorted(KEY_CONSTS.items()):
        for v, rel in vals:
            if v.startswith("qs_") and v not in accessed:
                dead.append("%s = %s   (%s)" % (name, v, rel))
    for line in cap(dead, 30):
        emit(line)
    if not dead:
        emit("none")
    emit("")
    emit("End of A.")


if __name__ == "__main__":
    main()
