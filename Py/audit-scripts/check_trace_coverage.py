"""
check_trace_coverage.py   (V6.1 step 5, read-only)

Answers: which calculation trace nodes exist per module, and how much of
the calculation map do they cover?  It also lists trace wiring problems.
It changes nothing.

Heuristic, regex based, NOT a JS parser. Treat the output as a map to
review, not a verdict. Known limits:
  - node ids built from template strings are shown as patterns, e.g.
    assets.*.total_asset_cost_annual, and counted once per pattern.
  - an "input not found" line can be a false alarm when the input is
    produced by a helper call; check those by hand.
  - coverage is by FILE: a calc map file counts as covered when at least
    one trace node names it as source_file. It does not prove every
    figure in that file has a node.

Usage (from D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\check_trace_coverage.py
    python Py\\audit-scripts\\check_trace_coverage.py --list      (adds every node id)
    python Py\\audit-scripts\\check_trace_coverage.py <repo_root>

Clipboard capture (conventions 2026-10-10):
    & { python Py\\audit-scripts\\check_trace_coverage.py } *>&1 | Out-String -Width 250 | Set-Clipboard

Output is plain ASCII. Exit code is always 0 (report only).
"""

import fnmatch
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

TRACE_DIR = Path("lib") / "calculation-trace"
# Files in the trace folder that hold helpers, not nodes.
NON_NODE_FILES = {"calculationTraceSelectors.js", "calculationTraceLiveValues.js", "pilotMeta.js"}
CALC_MAP = Path("docs") / "fin_mirra_v6.1" / "Calculations" / "CALCULATION_MAP_v6_0.txt"
# Extra places that import trace code (checked for broken relative imports).
EXTRA_IMPORT_FILES = [Path("scripts") / "check-calculation-trace-integrity.mjs"]
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", "Archive"}

STR = r"""(`[^`]*`|"[^"]*"|'[^']*')"""


def read(path):
    return path.read_text(encoding="utf-8-sig", errors="replace")


def unquote(token):
    return token[1:-1]


def normalise(text):
    """Template holes become * so dynamic ids can be compared as patterns."""
    return re.sub(r"\$\{[^}]*\}", "*", text)


def string_decls(text):
    """(position, name, value) for each const name = "literal" or `template`."""
    return [(m.start(), m.group(1), unquote(m.group(2)))
            for m in re.finditer(r"(?:const|let|var)\s+(\w+)\s*=\s*" + STR, text)]


def vars_at(decls, pos):
    """Variables as they stand at pos: the nearest earlier declaration wins,
    so a name reused in two functions resolves to the right one."""
    found = {}
    for p, name, value in decls:
        if p < pos:
            found[name] = value
    return found


def id_functions(text):
    """function name(args) { return `template`; }  ->  {name: template}"""
    return {m.group(1): unquote(m.group(2)) for m in re.finditer(
        r"function\s+(\w+)\s*\([^)]*\)\s*\{\s*return\s+" + STR, text)}


def spread_block(text, name):
    """Body of const NAME = { ... }; used for ...NAME spreads in a node."""
    m = re.search(r"const\s+" + re.escape(name) + r"\s*=\s*\{(.*?)\n\s*\};", text, re.S)
    return m.group(1) if m else ""


def substitute(expr, variables):
    """Replace ${name} with the variable's own text when it is a known string."""
    for _ in range(3):
        expr = re.sub(r"\$\{(\w+)\}", lambda m: variables.get(m.group(1), m.group(0)), expr)
    return expr


def parse_nodes(path, rel):
    """Return a list of node dicts found in one trace file."""
    text = read(path)
    decls = string_decls(text)
    funcs = id_functions(text)
    hits = list(re.finditer(r"node_id:\s*(" + STR[1:-1] + r"|[A-Za-z_]\w*(?:\([^)]*\))?)", text))
    nodes = []
    for i, m in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(text)
        block = text[m.start():end]
        variables = vars_at(decls, m.start())
        token = m.group(1)
        if token[0] in "`\"'":
            raw = unquote(token)
        else:
            name = token.split("(")[0]
            raw = variables.get(name) or funcs.get(name) or "<unresolved:" + name + ">"
        node_id = normalise(substitute(raw, variables))

        # fields may come from a ...common spread defined earlier in the file
        spread = "".join(spread_block(text, sm.group(1)) for sm in re.finditer(r"\.\.\.(\w+)\s*,", text[max(0, m.start() - 80):m.start()] + block))
        search_in = block + "\n" + spread

        def field(name):
            f = re.search(name + r":\s*" + STR, search_in)
            return unquote(f.group(1)) if f else ""

        inputs, input_calls = [], 0
        im = re.search(r"inputs:\s*\[(.*?)\]", block, re.S)
        if im:
            body = im.group(1)
            for sm in re.finditer(STR, body):
                inputs.append(normalise(substitute(unquote(sm.group(1)), variables)))
            for ident in re.findall(r"(?<![\w.$])([A-Za-z_]\w*)(?=\s*[,\]]|\s*$)", body):
                if ident in variables:
                    inputs.append(normalise(substitute(variables[ident], variables)))
            input_calls = body.count("(")
        nodes.append({
            "id": node_id,
            "dynamic": "*" in node_id,
            "file": rel.as_posix(),
            "module": field("module_name") or "(none)",
            "status": field("implementation_status") or "(none)",
            "source_file": re.split(r"\s*\(", field("source_file"))[0],
            "root": bool(re.search(r"is_root_input:\s*true", block)),
            "inputs": inputs,
            "input_calls": input_calls,
            "text": block,
        })
    return nodes


def input_defined(inp, defined):
    return any(inp == d or fnmatch.fnmatch(inp, d) or fnmatch.fnmatch(d, inp) for d in defined)


def resolve_import(base, spec):
    target = (base.parent / spec).resolve()
    for cand in (target, Path(str(target) + ".js"), Path(str(target) + ".mjs"),
                 Path(str(target) + ".jsx"), target / "index.js"):
        if cand.is_file():
            return True
    return False


def broken_imports(root, files):
    problems = []
    for f in files:
        if not f.is_file():
            continue
        text = read(f)
        for m in re.finditer(r"""(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](\.{1,2}/[^"']+)["']""", text):
            if not resolve_import(f, m.group(1)):
                problems.append((f.relative_to(root).as_posix(), m.group(1)))
    return problems


def imported_elsewhere(root, node_files):
    """Which node files are imported by any file outside the trace pilot-map folder?"""
    names = {f.stem: f for f in node_files}
    used = defaultdict(list)
    for path in root.rglob("*"):
        if path.suffix not in {".js", ".jsx", ".mjs", ".ts", ".tsx"}:
            continue
        if any(p in SKIP_DIRS for p in path.relative_to(root).parts):
            continue
        text = read(path)
        for stem in names:
            if stem in text and path != names[stem]:
                used[stem].append(path.relative_to(root).as_posix())
    return used


def parse_calc_map(path):
    """Return {section_number: {"title", "files": set, "functions": set}}."""
    sections, current = {}, None
    lines = read(path).splitlines()
    for i, line in enumerate(lines):
        if re.match(r"^={20,}\s*$", line) and i + 2 < len(lines) and re.match(r"^={20,}\s*$", lines[i + 2]):
            h = re.match(r"^(\d+)\.\s+(.*)", lines[i + 1])
            if h:
                current = int(h.group(1))
                sections[current] = {"title": h.group(2).strip(), "files": set(), "figures": 0}
            continue
        if current is None:
            continue
        for f in re.findall(r"([A-Za-z0-9_\-./\\]+\.(?:jsx?|mjs))", line):
            sections[current]["files"].add(re.split(r"[\\/]", f)[-1])
        if re.match(r"^\s*- ", line):
            sections[current]["figures"] += 1
    return sections


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    show_list = "--list" in sys.argv
    root = Path(args[0]).resolve() if args else Path.cwd()
    trace = root / TRACE_DIR
    if not trace.is_dir():
        print("NOT FOUND: " + str(trace) + "  (run from the repo root or pass it)")
        return 0

    node_files = sorted(p for p in trace.rglob("*.js") if p.name not in NON_NODE_FILES)
    nodes = []
    for p in node_files:
        nodes.extend(parse_nodes(p, p.relative_to(root)))

    print("TRACE COVERAGE REPORT   root: " + str(root))
    print("Node files: %d   node entries: %d (%d static ids, %d dynamic patterns)" % (
        len(node_files), len(nodes), sum(not n["dynamic"] for n in nodes), sum(n["dynamic"] for n in nodes)))

    # A. nodes per module
    print("\nA. NODES PER MODULE")
    by_module = defaultdict(list)
    for n in nodes:
        by_module[n["module"]].append(n)
    print("%-26s %6s %8s %6s  %s" % ("module", "nodes", "dynamic", "roots", "status"))
    for mod in sorted(by_module):
        ns = by_module[mod]
        st = Counter(n["status"] for n in ns)
        print("%-26s %6d %8d %6d  %s" % (
            mod, len(ns), sum(n["dynamic"] for n in ns), sum(n["root"] for n in ns),
            ", ".join("%s=%d" % kv for kv in sorted(st.items()))))
    print("\nPer node file:")
    for p in node_files:
        rel = p.relative_to(root).as_posix()
        print("  %3d  %s" % (sum(n["file"] == rel for n in nodes), rel))

    # B. integrity
    print("\nB. WIRING PROBLEMS")
    problems = 0
    ids = Counter(n["id"] for n in nodes)
    for node_id, c in ids.items():
        if c > 1:
            problems += 1
            print("  DUPLICATE id (%d times): %s" % (c, node_id))
    defined = set(ids)
    for n in nodes:
        if "<unresolved" in n["id"]:
            problems += 1
            print("  UNRESOLVED id in %s: %s" % (n["file"], n["id"]))
        for inp in n["inputs"]:
            if not input_defined(inp, defined):
                problems += 1
                print("  INPUT NOT FOUND: %s  <- %s" % (inp, n["id"]))
        if n["source_file"] and not (root / n["source_file"]).is_file():
            problems += 1
            print("  SOURCE FILE MISSING: %s  (node %s)" % (n["source_file"], n["id"]))
        if n["status"] == "(none)":
            problems += 1
            print("  NO implementation_status: %s" % n["id"])
        if n["input_calls"]:
            print("  note: inputs of %s include a helper call; checked only the literal ids" % n["id"])
    imports = broken_imports(root, node_files + [p for p in trace.glob("*.js")] + [root / p for p in EXTRA_IMPORT_FILES])
    for where, spec in imports:
        problems += 1
        print("  BROKEN IMPORT in %s: %s does not exist" % (where, spec))
    used = imported_elsewhere(root, node_files)
    for p in node_files:
        if p.stem == "traceNodes" or p.stem == "pilotMeta":
            continue
        if not used.get(p.stem):
            problems += 1
            print("  NODE FILE NOT IMPORTED by anything outside itself: " + p.relative_to(root).as_posix())
    if problems == 0:
        print("  none found")

    # C. calc map coverage
    print("\nC. CALC MAP COVERAGE (by file)")
    map_path = root / CALC_MAP
    if not map_path.is_file():
        print("  NOT FOUND: " + str(map_path))
        return 0
    sections = parse_calc_map(map_path)
    node_basenames = Counter(n["source_file"].split("/")[-1] for n in nodes if n["source_file"])
    print("%-3s %-34s %6s %8s %8s" % ("s", "section", "files", "w/ node", "figures"))
    uncovered = {}
    for num in sorted(sections):
        s = sections[num]
        if num in (0, 12):
            continue
        files = sorted(s["files"])
        covered = [f for f in files if node_basenames.get(f)]
        flag = "  <- NO TRACE NODES" if files and not covered else ""
        print("%-3d %-34s %6d %8d %8d%s" % (num, s["title"][:34], len(files), len(covered),
                                            s["figures"], flag))
        uncovered[num] = [f for f in files if f not in covered]
    print("\nCalc map files with no trace node naming them as source_file:")
    for num, files in uncovered.items():
        if files:
            print("  s%d: %s" % (num, ", ".join(files)))
    print("\n(figures = bullet lines in the section, roughly one per money-moving figure; files = source files it cites.)")

    if show_list:
        print("\nD. ALL NODE IDS")
        for n in sorted(nodes, key=lambda x: (x["module"], x["id"])):
            print("  [%s] %s  (%s)" % (n["module"], n["id"], n["status"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
