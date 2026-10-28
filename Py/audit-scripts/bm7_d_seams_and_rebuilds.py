"""
bm7_d_seams_and_rebuilds.py

BM-7 audit, part D. READ-ONLY (changes no files).

Two questions.
  1. SEAMS. Which hooks and calculation functions already take an input or
     override object (so a modelled copy could be passed in), and which read
     storage with no parameters at all (no seam: the only way to redirect them is
     to change what the storage layer returns)?
  2. REBUILDS (bug class 6b). Which storage / selector / hook functions return an
     object built field by field (k: x.k, k: x?.k ...) with no spread? Those drop
     any field not in the list, which is how a modelled field would vanish.

Output sections:
  1  hooks: signature and storage reach (reads / writes), flagged NO-SEAM when a
     hook with no parameters reads storage
  2  seam vocabulary (overrides, scratch, modelled, baseline, scenario, lever)
     by file
  3  functions returning field-by-field objects without a spread

Run (from repo root):  python Py\\audit-scripts\\bm7_d_seams_and_rebuilds.py
Plain ASCII on stdout. BM7_ALL=1 lifts the line caps.
"""

import re
from bm7_common import (ROOT, code_files, analyze, build_defs, DEFS, balanced, line_of,
                        emit, head, cap)

SEAM_WORDS = re.compile(r"\b(overrides?|\w+_overrides|\w+Overrides|scratch\w*|modell?(?:ed|ing)\w*|"
                        r"baseline\w*|scenario\w*|lever\w*)\b")
MAPPED = [re.compile(r"(\w+)\s*:\s*[\w$]+(?:\??\.[\w$]+)*\??\.\1\b"),
          re.compile(r"(\w+)\s*:\s*[\w$]+\[\s*['\"]\1['\"]\s*\]")]


def split_entries(clean, mk, o, c):
    entries = []
    depth = 0
    start = o + 1
    for i in range(o + 1, c):
        ch = mk[i]
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        elif ch == "," and depth == 0:
            entries.append(clean[start:i].strip())
            start = i + 1
    last = clean[start:c].strip()
    if last:
        entries.append(last)
    return entries


def main():
    files = code_files()
    build_defs()
    emit("BM-7 D. SEAMS AND REBUILDS   root: " + ROOT)

    head("1. HOOKS: SIGNATURE AND STORAGE REACH")
    rows = []
    for (rel, name), df in sorted(DEFS.items()):
        if not re.match(r"use[A-Z]", name):
            continue
        if analyze(rel)["role"] not in ("hook", "storage", "lib", "component", "page"):
            continue
        r = len(df["keys"]["R"])
        w = len(df["keys"]["W"]) + len(df["keys"]["X"])
        params = [p for p in df["params"] if p]
        if not r and not w:
            continue
        flag = ""
        if not params and r:
            flag = "NO-SEAM (reads storage, takes nothing)"
        elif params and r:
            flag = "takes input (" + ", ".join(params)[:50] + ")"
        rows.append((0 if flag.startswith("NO-SEAM") else 1, rel, name, r, w, flag))
    rows.sort()
    out = ["%-60s reads %2d writes %2d  %s" % ("%s :: %s" % (rel, name), r, w, flag)
           for _, rel, name, r, w, flag in rows]
    for line in cap(out, 90):
        emit(line)
    if not out:
        emit("none")
    emit("")
    emit("NO-SEAM count: %d of %d hooks that reach storage." % (
        sum(1 for r in rows if r[0] == 0), len(rows)))

    head("2. SEAM VOCABULARY BY FILE   (overrides / scratch / modelled / baseline / scenario / lever)")
    rows = []
    for rel in files:
        d = analyze(rel)
        if d["role"] in ("component", "layout"):
            continue
        toks = {}
        for m in SEAM_WORDS.finditer(d["mk"]):
            toks[m.group(1)] = toks.get(m.group(1), 0) + 1
        if toks:
            top = sorted(toks.items(), key=lambda kv: -kv[1])[:5]
            rows.append((sum(toks.values()), rel, d["role"], ", ".join("%s x%d" % kv for kv in top)))
    rows.sort(key=lambda r: (-r[0], r[1]))
    for line in cap(["%4d | %-9s | %s | %s" % (n, role, rel, t) for n, rel, role, t in rows], 70):
        emit(line)
    if not rows:
        emit("none")

    head("3. FUNCTIONS RETURNING FIELD-BY-FIELD OBJECTS WITH NO SPREAD   (bug class 6b)")
    found = {}
    for (rel, name), df in DEFS.items():
        d = analyze(rel)
        if d["role"] not in ("storage", "selector", "lib", "hook", "calc"):
            continue
        mk, clean = d["mk"], d["clean"]
        body = mk[df["b"]:df["e"]]
        for m in re.finditer(r"\breturn\s*\(?\s*\{", body):
            o = df["b"] + m.end() - 1
            c = balanced(mk, o, "{", "}")
            if c < 0 or (rel, o) in found:
                continue
            entries = split_entries(clean, mk, o, c)
            mapped = sum(1 for e in entries if any(p.match(e) for p in MAPPED))
            spreads = sum(1 for e in entries if e.startswith("..."))
            if mapped >= 5:
                found[(rel, o)] = (mapped, spreads, len(entries), name, line_of(d["text"], o), d["role"])
    rows = sorted(found.items(), key=lambda kv: (kv[1][1] > 0, -kv[1][0], kv[0][0]))
    out = []
    for (rel, o), (mapped, spreads, total, name, line, role) in rows:
        verdict = "NO SPREAD" if spreads == 0 else "has spread (%d)" % spreads
        out.append("%-9s %s:%d %s()  mapped %d of %d entries  %s" % (role, rel, line, name, mapped, total, verdict))
    for line in cap(out, 70):
        emit(line)
    if not out:
        emit("none with 5 or more mapped fields")
    emit("")
    emit("Some of these rebuild on purpose (normalise / sanitise / migrate). Review the NO SPREAD")
    emit("ones that sit on a load, save or selector path for a stored record.")
    emit("End of D.")


if __name__ == "__main__":
    main()
