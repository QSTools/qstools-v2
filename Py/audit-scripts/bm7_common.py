"""
bm7_common.py

Shared helper for the BM-7 engine purity audit scripts (bm7_a .. bm7_e). It is
imported by them and is not run on its own. READ-ONLY: it only reads source
files under app, hooks, lib and components. It writes nothing.

What it gives the scripts: a file walker, a comment/string masker, import
resolution (with the @/ alias), storage-access extraction (localStorage /
sessionStorage reads, writes, removes, with key names resolved through
constants and through one-argument wrapper functions), a function table with a
call graph, effect blocks, and a hook-mount graph.

Limits (heuristic, regex-based, NOT a JS parser - review, do not trust blindly):
  - Regex literals containing quote characters, and JSX text with apostrophes,
    can confuse the masker for the rest of that line.
  - Calls are matched by name through import bindings; dynamic dispatch,
    callbacks passed as arguments and computed property access are not followed.
  - Keys held in objects are resolved by property name only when the value
    starts with qs_.
  - Import reach (bm7_b) is an over-approximation: a file that imports a
    storage module may not call it.

How to run the whole set: see the PowerShell block given with the scripts. Each
script prints plain ASCII to stdout; the PowerShell block copies it to the
clipboard. Set BM7_ALL=1 to lift the per-section line caps.
Set BM7_ROOT to point at a different repo root (testing only).
"""

import os
import re
import sys

ROOT = os.environ.get("BM7_ROOT") or os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SCAN_DIRS = ["app", "hooks", "lib", "components"]
EXCLUDE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", ".venv", "__pycache__"}
EXTS = (".js", ".jsx", ".ts", ".tsx", ".mjs")
ALL = bool(os.environ.get("BM7_ALL"))


# ---------------------------------------------------------------- output ----
def emit(s=""):
    sys.stdout.write(str(s).encode("ascii", "replace").decode("ascii") + "\n")


def head(title):
    emit("")
    emit("=" * 78)
    emit(title)
    emit("=" * 78)


def cap(lines, n=60):
    lines = list(lines)
    if ALL or len(lines) <= n:
        return lines
    return lines[:n] + ["... %d more line(s) not shown (set BM7_ALL=1 to see all)" % (len(lines) - n)]


# ----------------------------------------------------------------- files ----
_FILES = None
_FILESET = None


def code_files():
    global _FILES
    if _FILES is None:
        res = []
        for d in SCAN_DIRS:
            base = os.path.join(ROOT, d)
            for dp, dn, fn in os.walk(base):
                dn[:] = [x for x in dn if x not in EXCLUDE_DIRS]
                for f in fn:
                    if f.endswith(EXTS):
                        res.append(os.path.relpath(os.path.join(dp, f), ROOT).replace("\\", "/"))
        _FILES = sorted(res)
    return _FILES


def file_set():
    global _FILESET
    if _FILESET is None:
        _FILESET = set(code_files())
    return _FILESET


def read(rel):
    try:
        with open(os.path.join(ROOT, rel), "r", encoding="utf-8-sig", errors="ignore") as f:
            return f.read()
    except OSError:
        return ""


def role_of(rel):
    b = os.path.basename(rel)
    if re.search(r"[Ss]torage", b) or "/storage/" in rel:
        return "storage"
    if rel.startswith("app/"):
        if re.match(r"page\.(js|jsx|ts|tsx|mjs)$", b):
            return "page"
        if "/api/" in rel:
            return "api"
        return "layout"
    if rel.startswith("hooks/"):
        return "hook"
    if rel.startswith("components/"):
        return "component"
    if rel.startswith("lib/"):
        if "/selectors/" in rel or re.search(r"[Ss]elector", b):
            return "selector"
        if "/calculations/" in rel or "/calculation-trace/" in rel:
            return "calc"
        return "lib"
    return "other"


# ---------------------------------------------------------------- masking ---
def mask(text, keep_strings=False):
    """Same-length copy with comments blanked, and (unless keep_strings) string
    contents blanked. Newlines are kept so line numbers still line up."""
    out = list(text)
    n = len(text)
    i = 0
    while i < n:
        c = text[i]
        d = text[i + 1] if i + 1 < n else ""
        if c == "/" and d == "/":
            j = text.find("\n", i)
            j = n if j < 0 else j
            for k in range(i, j):
                out[k] = " "
            i = j
        elif c == "/" and d == "*":
            j = text.find("*/", i + 2)
            j = n if j < 0 else j + 2
            for k in range(i, min(j, n)):
                if text[k] != "\n":
                    out[k] = " "
            i = j
        elif c in "'\"":
            j = i + 1
            while j < n and text[j] != c and text[j] != "\n":
                if text[j] == "\\":
                    j += 1
                j += 1
            if not keep_strings:
                for k in range(i + 1, min(j, n)):
                    out[k] = " "
            i = j + 1
        elif c == "`":
            j = i + 1
            while j < n and text[j] != "`":
                if text[j] == "\\":
                    j += 1
                j += 1
            if not keep_strings:
                for k in range(i + 1, min(j, n)):
                    if text[k] != "\n":
                        out[k] = " "
            i = j + 1
        else:
            i += 1
    return "".join(out)


def balanced(s, i, o, c):
    depth = 0
    n = len(s)
    while i < n:
        ch = s[i]
        if ch == o:
            depth += 1
        elif ch == c:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def line_of(text, idx):
    return text.count("\n", 0, idx) + 1


def call_args(clean, mk, p):
    """Top-level argument strings of the call whose '(' is at index p."""
    q = balanced(mk, p, "(", ")")
    if q < 0:
        return []
    args = []
    depth = 0
    start = p + 1
    for i in range(p + 1, q):
        ch = mk[i]
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        elif ch == "," and depth == 0:
            args.append(clean[start:i].strip())
            start = i + 1
    last = clean[start:q].strip()
    if last or args:
        args.append(last)
    return args


# ---------------------------------------------------------------- imports ---
def resolve(spec, rel):
    if spec.startswith("@/"):
        base = spec[2:]
    elif spec.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(rel), spec)).replace("\\", "/")
    else:
        return None
    fs = file_set()
    for cand in [base] + [base + e for e in EXTS] + [base + "/index" + e for e in EXTS]:
        if cand in fs:
            return cand
    return None


def parse_imports(rel, clean):
    """List of (local, imported, target_rel_or_None, spec)."""
    out = []

    def add(spec, local, imported):
        out.append((local, imported, resolve(spec, rel), spec))

    for m in re.finditer(r"\bimport\s+([^'\";]*?)\s*from\s*(['\"])([^'\"]+)\2", clean):
        clause, spec = m.group(1).strip(), m.group(3)
        mm = re.match(r"([A-Za-z_$][\w$]*)\s*(?:,|$)", clause)
        if mm and mm.group(1) != "type":
            add(spec, mm.group(1), "default")
        nm = re.search(r"\{([^}]*)\}", clause)
        if nm:
            for part in nm.group(1).split(","):
                part = part.strip()
                if not part:
                    continue
                pm = re.match(r"(?:type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$", part)
                if pm:
                    add(spec, pm.group(2) or pm.group(1), pm.group(1))
        ns = re.search(r"\*\s+as\s+([A-Za-z_$][\w$]*)", clause)
        if ns:
            add(spec, ns.group(1), "*")
    for m in re.finditer(r"\bexport\s+(?:\*|\{[^}]*\})\s*(?:as\s+\w+\s*)?from\s*(['\"])([^'\"]+)\1", clean):
        add(m.group(2), None, "reexport")
    for m in re.finditer(r"\bimport\s*(['\"])([^'\"]+)\1", clean):
        add(m.group(2), None, "side-effect")
    for m in re.finditer(r"\b(?:require|import)\s*\(\s*(['\"])([^'\"]+)\1\s*\)", clean):
        add(m.group(2), None, "dynamic")
    return out


# --------------------------------------------------------------- functions --
def find_functions(mk):
    """(name, start, body_open, body_close, param_names)"""
    res = []

    def pnames(txt):
        names = []
        depth = 0
        cur = ""
        for ch in txt + ",":
            if ch in "([{":
                depth += 1
            elif ch in ")]}":
                depth -= 1
            if ch == "," and depth == 0:
                t = cur.strip()
                mm = re.match(r"([A-Za-z_$][\w$]*)", t)
                names.append(mm.group(1) if mm else "")
                cur = ""
            else:
                cur += ch
        return [x for x in names]

    for m in re.finditer(r"\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(", mk):
        name = m.group(1) or "<anon>"
        p = m.end() - 1
        q = balanced(mk, p, "(", ")")
        if q < 0:
            continue
        b = mk.find("{", q)
        if b < 0 or mk[q + 1:b].strip() != "":
            continue
        e = balanced(mk, b, "{", "}")
        if e < 0:
            continue
        res.append((name, m.start(), b, e, pnames(mk[p + 1:q])))
    pat = (r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:use(?:Callback|Memo)\s*\(\s*)?"
           r"(?:async\s*)?(\(|[A-Za-z_$][\w$]*\s*=>)")
    for m in re.finditer(pat, mk):
        name = m.group(1)
        if m.group(2) == "(":
            p = m.end() - 1
            q = balanced(mk, p, "(", ")")
            if q < 0:
                continue
            mm = re.match(r"\s*=>\s*", mk[q + 1:])
            if not mm:
                continue
            b = q + 1 + mm.end()
            params = pnames(mk[p + 1:q])
        else:
            b = m.end()
            params = [re.match(r"[A-Za-z_$][\w$]*", m.group(2)).group(0)]
        if b < len(mk) and mk[b] == "{":
            e = balanced(mk, b, "{", "}")
            if e > 0:
                res.append((name, m.start(), b, e, params))
    return res


def find_effects(mk):
    res = []
    for m in re.finditer(r"\buse(?:Layout)?Effect\s*\(", mk):
        p = m.end() - 1
        q = balanced(mk, p, "(", ")")
        if q > 0:
            res.append((m.start(), p, q))
    return res


# ---------------------------------------------------------- key constants ---
KEY_CONSTS = {}
PROP_KEYS = {}
_CONSTS_BUILT = False


def build_consts():
    global _CONSTS_BUILT
    if _CONSTS_BUILT:
        return
    _CONSTS_BUILT = True
    for rel in code_files():
        clean = mask(read(rel), keep_strings=True)
        for m in re.finditer(r"(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['\"`])([^'\"`\n$]{3,90})\2", clean):
            name, val = m.group(1), m.group(3)
            if " " in val:
                continue
            if re.search(r"key|storage|store", name, re.I) or val.startswith("qs_"):
                KEY_CONSTS.setdefault(name, []).append((val, rel))
        for m in re.finditer(r"([A-Za-z_$][\w$]*)\s*:\s*(['\"])(qs_[\w\-:.]+)\2", clean):
            PROP_KEYS.setdefault(m.group(1), set()).add(m.group(3))


def own_consts(clean):
    """name -> string value for const NAME = '...' definitions in ONE file."""
    out = {}
    for m in re.finditer(r"(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['\"`])([^'\"`\n$]{3,90})\2", clean):
        if " " not in m.group(3):
            out[m.group(1)] = m.group(3)
    return out


def lookup_const(rel, name, depth=0):
    """Value of exported/top-level const `name` in file rel, following re-exports."""
    d = analyze(rel)
    if name in d["consts"]:
        return d["consts"][name]
    if depth < 2:
        for local, imp, target, _ in d["imports"]:
            if imp == "reexport" and target:
                v = lookup_const(target, name, depth + 1)
                if v:
                    return v
    return None


def resolve_key(arg, d=None):
    """-> (kind, [values]) kind in lit, tpl, const, const-global, unresolved, expr.
    Constants are looked up in the SAME file first, then through the file's imports,
    and only then by name across the whole repo (flagged const-global, may be wrong)."""
    build_consts()
    a = arg.strip()
    m = re.fullmatch(r"(['\"])(.*)\1", a, re.S)
    if m:
        return ("lit", [m.group(2)])
    m = re.fullmatch(r"`(.*)`", a, re.S)
    if m:
        return ("tpl", [re.sub(r"\$\{[^}]*\}", "{}", m.group(1))])
    if re.fullmatch(r"[A-Za-z_$][\w$]*", a):
        if d is not None:
            if a in d["consts"]:
                return ("const", [d["consts"][a]])
            for local, imp, target, _ in d["imports"]:
                if local == a and target:
                    v = lookup_const(target, a if imp == "default" else imp)
                    if v:
                        return ("const", [v])
        vals = sorted(set(v for v, _ in KEY_CONSTS.get(a, [])))
        if vals:
            return ("const-global", vals)
        return ("unresolved", [a])
    if re.fullmatch(r"[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)+", a):
        last = re.split(r"\s*\.\s*", a)[-1]
        vals = sorted(PROP_KEYS.get(last, []))
        if vals:
            return ("const", vals)
        return ("unresolved", [a])
    return ("expr", [re.sub(r"\s+", " ", a)[:50]])


# ---------------------------------------------------------------- analysis --
_CACHE = {}
STORE_CALL = re.compile(r"\b(localStorage|sessionStorage)\s*(?:\?\.|\.)\s*(getItem|setItem|removeItem|clear|key|length)\b")
BARE = re.compile(r"\b(localStorage|sessionStorage)\b")
OPMAP = {"getItem": "R", "setItem": "W", "removeItem": "X", "clear": "C", "key": "K", "length": "K"}


def analyze(rel):
    if rel in _CACHE:
        return _CACHE[rel]
    text = read(rel)
    clean = mask(text, keep_strings=True)
    mk = mask(text, keep_strings=False)
    d = {"rel": rel, "text": text, "clean": clean, "mk": mk, "role": role_of(rel)}
    d["consts"] = own_consts(clean)
    d["funcs"] = find_functions(mk)
    d["effects"] = find_effects(mk)
    d["imports"] = parse_imports(rel, clean)
    d["acc"] = direct_accesses(d)
    d["mentions"] = sorted(set(re.findall(r"['\"`](qs_[\w\-:.${}]*)['\"`]", clean)))
    d["idb"] = "indexedDB" in mk
    d["storage_event"] = bool(re.search(r"addEventListener\(\s*['\"]storage['\"]", clean))
    spans = [(m.start(), m.end()) for m in STORE_CALL.finditer(mk)]
    bare = 0
    for m in BARE.finditer(mk):
        if not any(s <= m.start() < e for s, e in spans):
            bare += 1
    d["bare"] = bare
    _CACHE[rel] = d
    return d


def innermost(d, idx):
    best = None
    for f in d["funcs"]:
        if f[2] <= idx <= f[3]:
            if best is None or (f[3] - f[2]) < (best[3] - best[2]):
                best = f
    return best


def in_effect(d, idx):
    return any(s <= idx <= e for s, _, e in d["effects"])


def direct_accesses(d):
    clean, mk = d["clean"], d["mk"]
    acc = []
    for m in STORE_CALL.finditer(mk):
        store, meth = m.group(1), m.group(2)
        op = OPMAP[meth]
        args = []
        if meth in ("getItem", "setItem", "removeItem"):
            j = m.end()
            while j < len(mk) and mk[j].isspace():
                j += 1
            if j < len(mk) and mk[j] == "(":
                args = call_args(clean, mk, j)
        arg = args[0] if args else ""
        kind, vals = resolve_key(arg, d) if arg else ("none", [])
        acc.append({"op": op, "store": store, "kind": kind, "keys": vals, "arg": arg, "idx": m.start(),
                    "line": line_of(d["text"], m.start()), "via": None})
    return acc


# ------------------------------------------------------------- call graph ---
DEFS = {}
_BUILT = False


def resolve_call(d, name):
    rel = d["rel"]
    if (rel, name) in DEFS:
        return (rel, name)
    for local, imp, target, _ in d["imports"]:
        if local == name and target:
            r = find_def(target, name if imp == "default" else imp, 0)
            if r:
                return r
    return None


def find_def(rel, fname, depth):
    if (rel, fname) in DEFS:
        return (rel, fname)
    if depth >= 3:
        return None
    for local, imp, target, _ in analyze(rel)["imports"]:
        if imp == "reexport" and target:
            r = find_def(target, fname, depth + 1)
            if r:
                return r
    return None


def build_defs():
    global _BUILT
    if _BUILT:
        return
    _BUILT = True
    files = code_files()
    for rel in files:
        d = analyze(rel)
        for name, start, b, e, params in d["funcs"]:
            DEFS[(rel, name)] = {"rel": rel, "name": name, "start": start, "b": b, "e": e, "params": params,
                                 "out": [], "wrap": set(), "direct": [], "keys": {"R": set(), "W": set(), "X": set()}}
    # assign direct accesses to their function; detect wrappers
    for rel in files:
        d = analyze(rel)
        for a in d["acc"]:
            f = innermost(d, a["idx"])
            a["fn"] = f[0] if f else None
            a["in_effect"] = in_effect(d, a["idx"])
            a["param_wrapper"] = False
            if f and (rel, f[0]) in DEFS:
                df = DEFS[(rel, f[0])]
                df["direct"].append(a)
                if a["kind"] == "unresolved" and a["keys"][0] in df["params"] and a["op"] in "RWX":
                    df["wrap"].add((a["op"], df["params"].index(a["keys"][0])))
                    a["param_wrapper"] = True
    # call edges
    for (rel, name), df in DEFS.items():
        d = analyze(rel)
        mk = d["mk"]
        for m in re.finditer(r"(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(", mk[df["b"]:df["e"]]):
            cname = m.group(1)
            tgt = resolve_call(d, cname)
            if tgt and tgt != (rel, name):
                p = df["b"] + m.end() - 1
                df["out"].append((tgt, p, call_args(d["clean"], mk, p)))
    # wrapper propagation (wrappers calling wrappers)
    for _ in range(3):
        for df in DEFS.values():
            for tgt, p, args in df["out"]:
                for op, k in list(DEFS[tgt]["wrap"]):
                    if k < len(args) and args[k] in df["params"]:
                        df["wrap"].add((op, df["params"].index(args[k])))
    # wrapper-mediated accesses (per file, deduped by call index)
    for rel in files:
        d = analyze(rel)
        seen = set()
        eff = []
        for a in d["acc"]:
            if not a["param_wrapper"]:
                eff.append(a)
        for (r2, n2), df in DEFS.items():
            if r2 != rel:
                continue
            for tgt, p, args in df["out"]:
                for op, k in DEFS[tgt]["wrap"]:
                    if k < len(args) and args[k] not in df["params"] and (p, op) not in seen:
                        seen.add((p, op))
                        kind, vals = resolve_key(args[k], d)
                        eff.append({"op": op, "store": "local", "kind": kind, "keys": vals, "arg": args[k],
                                    "idx": p, "line": line_of(d["text"], p), "via": tgt[1] + "()",
                                    "fn": n2, "in_effect": in_effect(d, p), "param_wrapper": False})
        d["eff"] = eff
        for a in eff:
            f = innermost(d, a["idx"])
            if f and (rel, f[0]) in DEFS and a["op"] in "RWX":
                DEFS[(rel, f[0])]["keys"][a["op"]].update(a["keys"])
    # transitive key propagation
    for _ in range(8):
        changed = False
        for df in DEFS.values():
            for tgt, p, args in df["out"]:
                for op in "RWX":
                    before = len(df["keys"][op])
                    df["keys"][op].update(DEFS[tgt]["keys"][op])
                    if len(df["keys"][op]) != before:
                        changed = True
        if not changed:
            break


def accesses(rel):
    build_defs()
    return analyze(rel)["eff"]


def file_keys(rel):
    """{'R': set, 'W': set, 'X': set} of keys this file touches directly (incl. wrappers)."""
    out = {"R": set(), "W": set(), "X": set()}
    for a in accesses(rel):
        if a["op"] in "RWX":
            for k in a["keys"]:
                out[a["op"]].add(k)
    return out


# ---------------------------------------------------------------- effects ---
GUARD_RE = re.compile(r"has_?loaded|hydrated|is_?loaded|\bis_?ready\b|\bready\b|\bmounted\b|\bhas_?mounted\b", re.I)


def effect_report(rel):
    """Per useEffect: line, keys read/written (direct + via called functions), guard flags."""
    build_defs()
    d = analyze(rel)
    mk, clean = d["mk"], d["clean"]
    res = []
    for s, p, e in d["effects"]:
        keys = {"R": set(), "W": set(), "X": set()}
        called = []
        for a in d["eff"]:
            if s <= a["idx"] <= e and a["op"] in "RWX":
                for k in a["keys"]:
                    keys[a["op"]].add(k)
        for m in re.finditer(r"(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(", mk[p:e]):
            tgt = resolve_call(d, m.group(1))
            if tgt:
                tk = DEFS[tgt]["keys"]
                if tk["W"] or tk["X"] or tk["R"]:
                    called.append(m.group(1))
                for op in "RWX":
                    keys[op].update(tk[op])
        res.append({"line": line_of(d["text"], s), "keys": keys, "called": sorted(set(called)),
                    "guard_in_effect": bool(GUARD_RE.search(mk[p:e]) or GUARD_RE.search(clean[p:e])),
                    "guard_in_file": bool(GUARD_RE.search(mk))})
    return res


# ------------------------------------------------------------ mount graph ---
BUILTIN_HOOKS = {"useState", "useEffect", "useMemo", "useCallback", "useRef", "useContext", "useReducer",
                 "useLayoutEffect", "useId", "useTransition", "useDeferredValue", "useSyncExternalStore",
                 "useRouter", "usePathname", "useSearchParams", "useParams", "useImperativeHandle",
                 "useDebugValue", "useInsertionEffect", "useOptimistic", "useActionState"}


def mount_edges(rel):
    """[(kind, name, target_rel)] kind 'hook' or 'jsx'. target may be rel itself (internal)."""
    build_defs()
    d = analyze(rel)
    mk = d["mk"]
    bind = {}
    for local, imp, target, _ in d["imports"]:
        if local and target:
            bind[local] = target
    edges = []
    seen = set()
    for m in re.finditer(r"(?<![.\w$])(use[A-Z][\w$]*)\s*\(", mk):
        n = m.group(1)
        if n in BUILTIN_HOOKS:
            continue
        t = bind.get(n) or (rel if (rel, n) in DEFS else None)
        if t and ("hook", n, t) not in seen:
            seen.add(("hook", n, t))
            edges.append(("hook", n, t))
    for m in re.finditer(r"<([A-Z][\w$]*)", mk):
        n = m.group(1)
        t = bind.get(n)
        if t and ("jsx", n, t) not in seen:
            seen.add(("jsx", n, t))
            edges.append(("jsx", n, t))
    return edges


def import_edges(rel):
    return sorted(set(t for _, _, t, _ in analyze(rel)["imports"] if t))


def bfs(start, edge_fn):
    """-> {node: parent}; parent of start is None."""
    parent = {start: None}
    queue = [start]
    while queue:
        cur = queue.pop(0)
        for nxt in edge_fn(cur):
            if nxt not in parent:
                parent[nxt] = cur
                queue.append(nxt)
    return parent


def chain(parent, node):
    path = []
    while node is not None:
        path.append(node)
        node = parent[node]
    return list(reversed(path))


def short(rel, n=2):
    parts = rel.split("/")
    return "/".join(parts[-n:]) if len(parts) > n else rel
