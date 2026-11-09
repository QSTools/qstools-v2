"""
check_calc_map_drift.py   (V6.1bj, DEV_TOOLING_BRIEF T3)

READ-ONLY. Compares the line hints in CALCULATION_MAP_v6_0.txt (the "L224" or "L55-L84" at the end of a formula line)
with the real code. For each hint it works out WHICH FILE (a file named in the same bullet, else the file last named in
the section or paragraph) and WHICH NAME (the function or field written just before the hint, else the first word of the
bullet), then looks for that name within +-TOL lines of the hinted range in that file.
Verdicts per hint:
  OK         the name is inside the hinted range (+-TOL lines)
  DRIFT      the name is in the file but elsewhere: the nearest line and the shift are printed
  NOT FOUND  the name does not occur in that file at all (renamed or removed, or the wrong file was inferred)
  UNCHECKED  no single file or no usable name could be worked out (not counted as a problem)
It only reports. It never edits the map. The map's own header says many hint numbers are approximate or known to be stale,
so expect DRIFT lines: the point is to see them, with the fix (the real line), before quoting a number from the map.

Run (from D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\check_calc_map_drift.py
    python Py\\audit-scripts\\check_calc_map_drift.py --tol 8        (default 5)
    python Py\\audit-scripts\\check_calc_map_drift.py --all          (list OK and UNCHECKED too)
Clipboard capture:
    & { python Py\\audit-scripts\\check_calc_map_drift.py } *>&1 | Out-String -Width 250 | Set-Clipboard
Exit code: 0 = no DRIFT and no NOT FOUND, 1 = at least one. First output line is the one-line summary. Plain ASCII.
Limits: heuristic text matching, not a parser. A name that occurs many times (a common field) can look OK by chance; a
file mentioned only in prose far from the bullet can be mis-inferred (shows as NOT FOUND: check by hand). Only the
sections after the header (from "1. P&L") are read. File names must be unique under app, hooks, lib, components.
Set CALCMAP_ROOT to point at another repo root (testing only).
"""

import os
import re
import sys

ROOT = os.environ.get("CALCMAP_ROOT") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
MAP = os.path.join(ROOT, "docs", "fin_mirra_v6.1", "Calculations", "CALCULATION_MAP_v6_0.txt")
SCAN = ("app", "hooks", "lib", "components")
EXTS = (".js", ".jsx", ".ts", ".tsx", ".mjs")
FILE_RE = re.compile(r"((?:[\w.\-]+/)*[\w.\-]+\.(?:jsx|js|tsx|ts|mjs))\b")
HINT_RE = re.compile(r"(?<![\w])L(\d+)(?:\s*[-\u2013]\s*L?(\d+))?(?![\w])")
IDENT_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")
HEAD_RE = re.compile(r"^(\d+(?:\.\d+)?)[ .]")
SKIP_WORDS = {"and", "the", "from", "line", "lines", "see", "for", "with", "none", "approx", "about", "to", "at", "in", "of", "by"}


def asc(s):
    return str(s).encode("ascii", "replace").decode("ascii")


def file_index():
    idx = {}
    for top in SCAN:
        for dp, dn, fn in os.walk(os.path.join(ROOT, top)):
            dn[:] = [d for d in dn if d not in ("node_modules", ".next", ".git", "__pycache__")]
            for f in fn:
                if f.endswith(EXTS):
                    rel = os.path.relpath(os.path.join(dp, f), ROOT).replace("\\", "/")
                    idx.setdefault(f, []).append(rel)
    return idx


def resolve_file(token, idx):
    base = token.replace("\\", "/")
    name = base.split("/")[-1]
    cands = idx.get(name, [])
    if "/" in base:
        cands = [c for c in cands if c.endswith(base)] or cands
    return cands[0] if len(cands) == 1 else None


def looks_like_name(t):
    # a calculation name is snake_case or camelCase; plain words ("labour", "Result", "GUARDS") are prose, not names
    if len(t) < 5 or t.lower() in SKIP_WORDS or t.isdigit():
        return False
    return "_" in t or re.search(r"[a-z][A-Z]", t) is not None


def main():
    argv = sys.argv[1:]
    tol = int(argv[argv.index("--tol") + 1]) if "--tol" in argv else 5
    show_all = "--all" in argv
    if not os.path.isfile(MAP):
        print("NOT FOUND: " + MAP)
        return 1
    idx = file_index()
    all_files = sorted(r for v in idx.values() for r in v)
    moved = 0
    cache = {}

    def code_lines(rel):
        if rel not in cache:
            with open(os.path.join(ROOT, rel), encoding="utf-8-sig", errors="replace") as f:
                cache[rel] = f.read().split("\n")
        return cache[rel]

    lines = open(MAP, encoding="utf-8-sig", errors="replace").read().split("\n")
    start = next((i for i, l in enumerate(lines) if l.startswith("1. P&L")), 0)
    rows = []
    section = "-"
    section_file = None
    cur_file = None
    bullet_start = start
    for i in range(start, len(lines)):
        l = lines[i]
        h = HEAD_RE.match(l)
        if h and (l[:1].isdigit()) and not l.startswith("0."):
            section = h.group(1)
            fm = FILE_RE.search(l)
            f = resolve_file(fm.group(1), idx) if fm else None
            if "." not in section:
                section_file = f
            cur_file = f or section_file
        if l.startswith("- ") or not l.strip():
            bullet_start = i
        # file mentions update the running file; each hint prefers the closest mention before it on its own bullet text
        for hm in HINT_RE.finditer(l):
            lo = int(hm.group(1))
            hi = int(hm.group(2)) if hm.group(2) else lo
            if hi < lo:
                lo, hi = hi, lo
            before = l[:hm.start()]
            btext = " ".join(lines[bullet_start:i]) + " " + before
            fms = [m for m in FILE_RE.finditer(btext)]
            rel = None
            if fms:
                rel = resolve_file(fms[-1].group(1), idx)
                if not rel and idx:
                    rel = None
            if rel is None and not fms:
                rel = cur_file
            # name: identifier immediately before the hint, else the head word of the bullet
            toks = IDENT_RE.findall(before[-60:])
            # a bullet written "- name = formula   L224" is about the LEFT-HAND name; the last word before the hint is just a
            # term of the formula. Only in lines that are not assignments does the word before the hint name the thing.
            assign = re.match(r"\s*-\s*[A-Za-z_][A-Za-z0-9_]*\s*=", lines[bullet_start]) is not None
            name = toks[-1] if (toks and not assign and looks_like_name(toks[-1])) else None
            if not name:
                head = re.match(r"\s*-\s*([A-Za-z_][A-Za-z0-9_]*)", lines[bullet_start] if lines[bullet_start].startswith("- ") else "")
                name = head.group(1) if head and looks_like_name(head.group(1)) else None
            if not rel or not name:
                rows.append(("UNCHECKED", section, i + 1, name or "-", rel or "-", lo, hi, "no single file or no usable name", None))
                continue
            src = code_lines(rel)
            wr = re.compile(r"(?<![\w$])" + re.escape(name) + r"(?![\w$])")
            occ = [n + 1 for n, s in enumerate(src) if wr.search(s)]
            if not occ:
                # the inferred file may be wrong (a file named only in prose): look for the name in every file
                best = None
                for orel in all_files:
                    for n, s in enumerate(code_lines(orel), 1):
                        if wr.search(s):
                            d = 0 if lo <= n <= hi else min(abs(n - lo), abs(n - hi))
                            if best is None or d < best[0]:
                                best = (d, orel, n)
                if best is None:
                    rows.append(("NOT FOUND", section, i + 1, name, rel, lo, hi, "name is in no scanned file (renamed or removed?)", None))
                elif best[0] <= tol:
                    rows.append(("OK", section, i + 1, name, best[1], lo, hi, "found in a different file than inferred", None))
                    moved += 1
                else:
                    rows.append(("DRIFT", section, i + 1, name, best[1], lo, hi,
                                 "not in %s; nearest is %s L%d (%+d)" % (os.path.basename(rel), os.path.basename(best[1]), best[2],
                                                                      best[2] - (lo if best[2] < lo else hi)), best[2]))
            elif any(lo - tol <= n <= hi + tol for n in occ):
                rows.append(("OK", section, i + 1, name, rel, lo, hi, "", None))
            else:
                near = min(occ, key=lambda n: min(abs(n - lo), abs(n - hi)))
                shift = near - lo if near < lo else near - hi
                rows.append(("DRIFT", section, i + 1, name, rel, lo, hi, "code has it at L%d (%+d)" % (near, shift), near))
        mm = FILE_RE.findall(l)
        for t in mm:
            f = resolve_file(t, idx)
            if f:
                cur_file = f

    cnt = {}
    for r in rows:
        cnt[r[0]] = cnt.get(r[0], 0) + 1
    bad = cnt.get("DRIFT", 0) + cnt.get("NOT FOUND", 0)
    print("calc map drift: %d hints | OK %d | DRIFT %d | NOT FOUND %d | UNCHECKED %d (tolerance +-%d lines)" % (
        len(rows), cnt.get("OK", 0), cnt.get("DRIFT", 0), cnt.get("NOT FOUND", 0), cnt.get("UNCHECKED", 0), tol)
          + ("  [%d OK found in a different file than inferred]" % moved if moved else ""))
    shown = [r for r in rows if show_all or r[0] in ("DRIFT", "NOT FOUND")]
    by_sec = {}
    for r in rows:
        if r[0] in ("DRIFT", "NOT FOUND"):
            by_sec[r[1]] = by_sec.get(r[1], 0) + 1
    if by_sec:
        print("problems by map section: " + ", ".join("s%s:%d" % (k, by_sec[k]) for k in sorted(by_sec, key=lambda x: [int(p) for p in x.split(".")] if x[0].isdigit() else [99])))
    for v, sec, ln, name, rel, lo, hi, note, near in shown[:(10 ** 6 if show_all else 60)]:
        print(asc("%-9s map line %-4d s%-5s %s L%d%s in %s  %s" % (v, ln, sec, name, lo, "-%d" % hi if hi != lo else "", rel, note)))
    if len(shown) > 60 and not show_all:
        print("... %d more (use --all)" % (len(shown) - 60))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
