#!/usr/bin/env python3
"""
extract_calc_map.py v2 - READ-ONLY. Raw calculation map for the whole tool.

Run from repo root (D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\extract_calc_map.py

Writes to docs\\Audit\\v6_0\\calc_map\\ (clears its own old output first):
    00_INDEX.txt       counts per module
    00_COVERAGE.txt    what the parser could NOT attribute - check this first
    01_FIELD_INDEX.txt every field name -> every place it is calculated
    <module>.txt       per module, chain order: every calculation statement
    calc_map_raw.json  everything, machine-readable

v2 fixes (v1 missed these): parameters containing brackets or defaults,
multi-line statements, `return` expressions, one-line arrow functions,
object-literal methods, inline JSX maths, maths outside any function.
Formatting helpers (format*/Format*) are counted but not listed.
Kinds in the dumps: = assignment, : object key, R return, ~ inline/other.
* marks a statement touching a key field (revenue, cost, rate, profit...).
"""
import os, re, sys, json, glob, collections

ROOT = os.getcwd()
SCAN = ["app", "components", "hooks", "lib"]
SKIP_DIRS = {"node_modules", ".next", ".git", "__pycache__"}
EXT = (".js", ".jsx", ".mjs", ".ts", ".tsx")
OUT = os.path.join(ROOT, "docs", "Audit", "v6_0", "calc_map")

# Chain order. First match wins. Matched against the path, lowercased,
# with - _ \ / . removed.
MODULES = [
    ("00_quick_start", ["quickstart"]),
    ("09_business_modelling", ["businessmodelling"]),
    ("08_business_outcome", ["businessoutcome", "recoveryoutcome"]),
    ("07_rate_builder", ["ratebuilder"]),
    ("05_cost_allocation", ["costallocation"]),
    ("06_summaries", ["costsummary", "businesssummary", "recoverysummary",
                      "openinghours", "modelreadiness", "recoveryanalysis",
                      "recoveryrisk", "revenuesummary", "revenuereality"]),
    ("04_assets", ["asset"]),
    ("03_labour", ["labour", "employeeoverhead", "breakrules"]),
    ("03b_general_overheads", ["generaloverhead"]),
    ("01_pnl", ["pandl", "profitandloss", "pnl", "revenuecogs", "balancesheet",
                "crossimport", "xero"]),
    ("06b_reconciliation", ["reconciliation"]),
    ("06c_quote_engine", ["quote"]),
]
KEY_FIELDS = ["revenue", "cost", "rate", "profit", "overhead", "hours",
              "margin", "markup", "share", "burden", "recovery"]
KEYWORDS = {"if", "for", "while", "switch", "catch", "function", "return",
            "typeof", "new", "await", "else", "do", "try", "with"}

ARITH = re.compile(
    r"[\w)\]]\s*[*/%]\s*[\w(.-]"          # a * b, a / b
    r"|[\w)\]]\s*(?<![+-])[+-](?![+-=])\s*[\w(.]"  # a + b, a - b (not ++ / --)
    r"|[+\-*/]=(?!=)"                      # +=, -=, *=, /=
    r"|\bMath\.\w+\(|\.reduce\(")
TRIVIAL = re.compile(r"^[\w.\[\]]+\s*[+-]\s*1$")  # i + 1, index - 1


def mask(src):
    """Blank comments and string contents, keep newlines and positions.
    Template-literal ${...} expressions are kept (they can hold maths)."""
    out, i, n = [], 0, len(src)
    while i < n:
        c, d = src[i], src[i + 1] if i + 1 < n else ""
        if c == "/" and d == "/":
            while i < n and src[i] != "\n":
                out.append(" "); i += 1
        elif c == "/" and d == "*":
            while i < n and not (src[i] == "*" and i + 1 < n and src[i + 1] == "/"):
                out.append("\n" if src[i] == "\n" else " "); i += 1
            out.append("  "); i += 2
        elif c in "\"'":
            q = c; out.append(q); i += 1
            while i < n and src[i] != q and src[i] != "\n":
                if src[i] == "\\":
                    out.append("  "); i += 2; continue
                out.append(" "); i += 1
            out.append(q if i < n else ""); i += 1
        elif c == "`":
            out.append("`"); i += 1
            while i < n and src[i] != "`":
                if src[i] == "\\":
                    out.append("  "); i += 2; continue
                if src[i] == "$" and i + 1 < n and src[i + 1] == "{":
                    depth = 0
                    while i < n:
                        ch = src[i]
                        out.append(ch)
                        if ch == "{": depth += 1
                        elif ch == "}":
                            depth -= 1
                            if depth == 0:
                                i += 1; break
                        i += 1
                    continue
                out.append("\n" if src[i] == "\n" else " "); i += 1
            out.append("`"); i += 1
        else:
            out.append(c); i += 1
    return "".join(out)


def match_close(s, i, open_c, close_c):
    depth = 0
    while i < len(s):
        if s[i] == open_c: depth += 1
        elif s[i] == close_c:
            depth -= 1
            if depth == 0: return i
        i += 1
    return -1


def expr_end(s, i):
    """End of a brace-less arrow body: first depth-0 ; , ) ] } or a
    newline not followed by a continuation."""
    depth = 0
    while i < len(s):
        c = s[i]
        if c in "([{": depth += 1
        elif c in ")]}":
            if depth == 0: return i
            depth -= 1
        elif depth == 0 and c in ";,":
            return i
        elif depth == 0 and c == "\n":
            rest = s[i + 1:i + 200].lstrip()
            if not rest[:1] or rest[0] not in ".?:+-*/&|":
                return i
        i += 1
    return i


STARTS = [
    re.compile(r"\bfunction\s*\*?\s*(\w+)\s*(?=\()"),
    re.compile(r"\b(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:function\s*\w*\s*)?(?=\()"),
    re.compile(r"\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?=\w+\s*=>)"),
    re.compile(r"^[ \t]*(?:async\s+)?(\w+)\s*(?=\()", re.M),   # obj method
    re.compile(r"^[ \t]*(\w+)\s*:\s*(?:async\s*)?(?:function\s*)?(?=\()", re.M),
]


def find_funcs(m):
    funcs, seen = [], set()
    for pat in STARTS:
        for mt in pat.finditer(m):
            name = mt.group(1)
            if name in KEYWORDS: continue
            p = mt.end()
            if m[p] == "(":
                close = match_close(m, p, "(", ")")
                if close < 0: continue
                params = m[p + 1:close]
                q = close + 1
            else:  # single bare param: x => ...
                pm = re.match(r"(\w+)\s*", m[p:])
                params = pm.group(1); q = p + pm.end()
            tail = re.match(r"\s*(?::\s*[^={;]+?(?=\s*(?:=>|\{)))?\s*(=>)?\s*", m[q:])
            q2 = q + tail.end()
            if q2 >= len(m): continue
            if m[q2] == "{":
                body_end = match_close(m, q2, "{", "}")
            elif tail.group(1):
                body_end = expr_end(m, q2)
            else:
                continue
            if body_end < 0: continue
            start = m.count("\n", 0, mt.start()) + 1
            if (name, start) in seen: continue
            seen.add((name, start))
            funcs.append({"name": name,
                          "params": " ".join(params.split())[:120],
                          "start": start,
                          "end": m.count("\n", 0, body_end) + 1})
    return funcs


def statements(orig, msk):
    """Join lines while ( or [ is open, or a line ends/starts with an operator.
    Braces are NOT joined, so object literals stay one key per line."""
    out, buf, obuf, start, depth = [], [], [], None, 0
    for i, (o, m) in enumerate(zip(orig, msk), start=1):
        if start is None: start = i
        buf.append(m.strip()); obuf.append(o.strip())
        depth += m.count("(") + m.count("[") - m.count(")") - m.count("]")
        nxt = msk[i].lstrip() if i < len(msk) else ""
        cont = depth > 0 or re.search(r"[=+\-*/?:&|]$", m.rstrip()) \
            or (nxt[:1] in list(".?:+*/") or nxt.startswith("- ")) and not nxt.startswith("...")
        if m.rstrip().endswith("{"):   # block opens: never swallow its body
            cont = False
        if cont and len(buf) < 25:
            continue
        out.append((start, " ".join(buf), " ".join(obuf)))
        buf, obuf, start, depth = [], [], None, 0
    return out


def classify(stmt):
    s = stmt.strip().rstrip(";,")
    if not s or s.startswith(("import ", "export {", "}")) or not ARITH.search(s):
        return None, None
    if TRIVIAL.match(s): return None, None
    m = re.match(r"^(?:const|let|var)?\s*([\w.\[\]]+)\s*([+\-*/]?=)(?![=>])", s)
    if m: return "=", m.group(1).split(".")[-1].strip("[]")
    m = re.match(r"^(\w+)\s*:\s*\S", s)
    if m: return ":", m.group(1)
    if s.startswith("return"): return "R", None
    return "~", None


def module_of(path):
    key = re.sub(r"[-_\\/.]", "", path.lower())
    for name, words in MODULES:
        if any(w in key for w in words): return name
    return "99_other"


def main():
    files = []
    for top in SCAN:
        for dp, dn, fn in os.walk(os.path.join(ROOT, top)):
            dn[:] = [d for d in dn if d not in SKIP_DIRS]
            files += [os.path.join(dp, f) for f in fn if f.endswith(EXT)]
    if not files:
        sys.exit("No source files found - run from the repo root.")

    all_funcs, per_file, unparsed, orphans = [], {}, [], []
    decl = re.compile(r"\b(?:function\s*\*?\s*(\w+)\s*[(<]|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|\(|\w+\s*=>))")
    for path in files:
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        with open(path, encoding="utf-8", errors="replace") as fh:
            src = fh.read()
        m = mask(src)
        funcs = find_funcs(m)
        for f in funcs:
            f.update(file=rel, module=module_of(rel), calls=set(), formulas=[])
        got = {f["name"] for f in funcs}
        for d in decl.finditer(m):
            nm = d.group(1) or d.group(2)
            if nm not in got:
                unparsed.append(f"{rel}:{m.count(chr(10), 0, d.start()) + 1}  {nm}")
        per_file[rel] = (src.split("\n"), m.split("\n"), funcs)
        all_funcs += funcs

    names = collections.defaultdict(list)
    for f in all_funcs:
        if len(f["name"]) > 3: names[f["name"]].append(f)

    for rel, (orig, msk, funcs) in per_file.items():
        for ln, mstmt, ostmt in statements(orig, msk):
            inside = [f for f in funcs if f["start"] <= ln <= f["end"]]
            f = min(inside, key=lambda x: x["end"] - x["start"]) if inside else None
            kind, lhs = classify(mstmt)
            if kind:
                if f: f["formulas"].append((ln, kind, lhs, ostmt[:300]))
                else: orphans.append(f"{rel}:{ln}  {ostmt[:160]}")
            if f:
                for c in re.findall(r"\b(\w+)\s*\(", mstmt):
                    if c in names and c != f["name"]: f["calls"].add(c)

    callers = collections.defaultdict(set)
    for f in all_funcs:
        for c in f["calls"]:
            callers[c].add(f"{f['name']} ({f['file'].split('/')[-1]})")

    os.makedirs(OUT, exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "*.txt")) + glob.glob(os.path.join(OUT, "*.json")):
        os.remove(old)

    by_mod = collections.defaultdict(list)
    for f in all_funcs: by_mod[f["module"]].append(f)
    fields = collections.defaultdict(list)
    index = ["CALC MAP EXTRACT v2 - formula functions / all functions / statements", ""]
    raw, skipped_fmt = {}, 0
    for mod in sorted(by_mod):
        fs = sorted(by_mod[mod], key=lambda x: (x["file"], x["start"]))
        fmt = [f for f in fs if f["name"].lower().startswith("format")]
        skipped_fmt += len(fmt)
        withf = [f for f in fs if f["formulas"] and f not in fmt]
        nform = sum(len(f["formulas"]) for f in withf)
        index.append(f"{mod:26s} {len(withf):4d} / {len(fs):4d} functions, {nform:5d} statements")
        lines, cur = [f"MODULE {mod} - raw statements from code, not interpreted", ""], None
        for f in withf:
            if f["file"] != cur:
                cur = f["file"]; lines += ["", "=" * 78, cur, "=" * 78]
            lines.append(f"\n## {f['name']}({f['params']})  L{f['start']}-{f['end']}")
            if f["calls"]: lines.append("   calls:     " + ", ".join(sorted(f["calls"])))
            cb = callers.get(f["name"])
            if cb: lines.append("   called by: " + ", ".join(sorted(cb)[:15]))
            for ln, kind, lhs, code in f["formulas"]:
                star = "*" if any(k in code.lower() for k in KEY_FIELDS) else " "
                lines.append(f"  {star}{kind} L{ln:<5d} {code}")
                if lhs and not re.fullmatch(r"[a-z]|i|j|idx|index|acc|sum|total|value", lhs):
                    fields[lhs].append(f"{f['file']}:{ln}  {f['name']}  [{kind}]")
        with open(os.path.join(OUT, f"{mod}.txt"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write("\n".join(lines) + "\n")
        raw[mod] = [{"file": f["file"], "name": f["name"], "params": f["params"],
                     "lines": [f["start"], f["end"]], "calls": sorted(f["calls"]),
                     "called_by": sorted(callers.get(f["name"], [])),
                     "formulas": f["formulas"]} for f in withf]

    total_stmts = sum(len(f["formulas"]) for f in all_funcs)
    index += ["", f"Files scanned: {len(files)}   Functions parsed: {len(all_funcs)}",
              f"Calculation statements inside functions: {total_stmts}",
              f"Formatting helpers counted but not listed: {skipped_fmt}",
              f"Declarations NOT parsed: {len(unparsed)}   Statements outside any function: {len(orphans)}",
              "(see 00_COVERAGE.txt - both numbers should be small and explainable)",
              f"Output: {OUT}"]
    cov = ["COVERAGE - what the parser could not attribute", "",
           f"A. Declarations seen in the code but NOT parsed as functions ({len(unparsed)}).",
           "   Each is a function the dumps will not show. Expect a few false alarms",
           "   (e.g. `const x = (a + b) * c` looks like a declaration).", ""]
    cov += ["   " + u for u in unparsed] or ["   none"]
    cov += ["", f"B. Calculation statements outside any parsed function ({len(orphans)}).",
            "   Module-level constants are normal here; anything else means a",
            "   function above was missed.", ""]
    cov += ["   " + o for o in orphans] or ["   none"]
    fi = ["FIELD INDEX - every name assigned by a calculation, and where", ""]
    for name in sorted(fields, key=str.lower):
        fi.append(name)
        fi += ["    " + loc for loc in fields[name]]
    for fname, content in (("00_INDEX.txt", index), ("00_COVERAGE.txt", cov),
                           ("01_FIELD_INDEX.txt", fi)):
        with open(os.path.join(OUT, fname), "w", encoding="utf-8", newline="\n") as fh:
            fh.write("\n".join(content) + "\n")
    with open(os.path.join(OUT, "calc_map_raw.json"), "w", encoding="utf-8") as fh:
        json.dump(raw, fh, indent=1)
    print("\n".join(index))


if __name__ == "__main__":
    main()
