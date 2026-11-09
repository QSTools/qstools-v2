"""
build_repo_graph.py   (V6.1bj, DEV_TOOLING_BRIEF T1 + T2)

READ-ONLY on the app. One scan of app, hooks, lib and components that writes TWO files from the SAME pass:
  .tmp\\repo_graph\\repo_graph.json   master (for scripts and the future AI layer)
  .tmp\\repo_graph\\repo_graph.txt    flat text, one line per fact, for Claude to SEARCH BY NAME (never read whole)
.tmp\\ is git-ignored, so nothing here can reach a commit.

T1 IMPORT GRAPH: per file, which files it imports (import, export ... from, require, dynamic import()), with the
   import kinds, and whether the target is a barrel (index file). The @/ alias is the only path alias (tsconfig
   paths "@/*" -> "./*", checked 2026-11-09). Anything that cannot be resolved goes in UNRESOLVED, never dropped.
T2 STORAGE KEY MAP: per localStorage / sessionStorage key, which files read, write and remove it, including
   accesses through one-argument storage helper functions (via=...). Keys built by concatenation or computed are
   listed as STORAGE-DYNAMIC with the file and line, never guessed. A key found only by constant NAME across the
   whole repo (const-global) is marked weak.

Text line shapes (search a file name or a key and you get only its lines):
  hooks/useX.js imports lib/storage/y.js (named,default)            [; target is barrel]
  STORAGE qs_key READ hooks/useX.js:42 via loadY() [weak]
  STORAGE-DYNAMIC WRITE hooks/useX.js:57 kind=tpl arg=`qs_{}`
  REGISTRY m01 qs_tools_asset_state modelled          (code <-> key, from lib/storage/modelStorageRegistry.js)
  The model_storage.getItem/setItem/removeItem door (every storage module uses it) is scanned like localStorage;
  NEW_KEYS.mode style member keys are resolved from flat object literals; a read that loops over the registry
  (entry.key) is marked [loop] and is NOT proof that one named key is read there.
  STORAGE-ENUM hooks/useX.js:10 clear
  UNRESOLVED hooks/useX.js:3 spec=@/lib/missing
Freshness: the JSON carries a fingerprint (hash of every scanned file plus tsconfig). check_graph_fresh.py compares.

Run (from D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\build_repo_graph.py
    python Py\\audit-scripts\\build_repo_graph.py --out <folder>        (default .tmp\\repo_graph)
Clipboard capture:
    & { python Py\\audit-scripts\\build_repo_graph.py } *>&1 | Out-String -Width 250 | Set-Clipboard
Output on stdout is a short ASCII summary. Exit code 0.
Limits: heuristic scan (reuses bm7_common.py, regex based, NOT a JS parser). scripts\\ and tools\\ are not scanned.
  Calls through registry codes (m01, m23 ...) show up as STORAGE-DYNAMIC or unresolved until the registry is read.
Set BM7_ROOT to point at another repo root (testing only).
"""

import datetime
import hashlib
import json
import os
import re
import sys

import bm7_common as C

TOOL_VERSION = 2
JSON_NAME = "repo_graph.json"
TXT_NAME = "repo_graph.txt"
ASSET_EXT = (".css", ".scss", ".json", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".txt")
NONLITERAL_IMPORT = re.compile(r"\bimport\s*\(\s*(?!['\"])[^)\s]")
DYNAMIC_KINDS = ("tpl", "expr", "unresolved")
# v2 (found on the real repo, 2026-11-09): every storage module goes through the model_storage door
# (lib/storage/modelStorage.js), not localStorage; the mirra_ keys live in the NEW_KEYS object; the registry
# lib/storage/modelStorageRegistry.js maps codes m01.. to keys.
MODEL_CALL = re.compile(r"\bmodel_storage\s*(?:\?\.|\.)\s*(getItem|setItem|removeItem)\b")
OBJ_DEF = re.compile(r"(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{([^{}]*)\}")
OBJ_PROP = re.compile(r"([A-Za-z_$][\w$]*)\s*:\s*(['\"])([^'\"\n]{3,90})\2")
MEMBER = re.compile(r"([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)")
REGISTRY_FILE = "lib/storage/modelStorageRegistry.js"
_OBJ = None


def obj_props():
    """name -> prop -> {string values}, for flat object literals such as NEW_KEYS = { mode: "mirra_mode_v1" }."""
    global _OBJ
    if _OBJ is None:
        _OBJ = {}
        for rel in C.code_files():
            for m in OBJ_DEF.finditer(C.analyze(rel)["clean"]):
                for p in OBJ_PROP.finditer(m.group(2)):
                    _OBJ.setdefault(m.group(1), {}).setdefault(p.group(1), set()).add(p.group(3))
    return _OBJ


def refine(a):
    """-> (kind, keys, loop). Fixes member access (NEW_KEYS.mode), baseline_entry_key(code) and registry loops."""
    kind, keys, arg = a["kind"], a["keys"], a["arg"].strip()
    if kind in ("unresolved", "expr"):
        m = MEMBER.fullmatch(arg)
        if m:
            vals = obj_props().get(m.group(1), {}).get(m.group(2))
            if vals and len(vals) == 1:
                return "member", sorted(vals), False
        if arg.startswith("baseline_entry_key("):
            return "pattern", ["mirra_baseline_v1_{code}"], False
    if kind == "const" and MEMBER.fullmatch(arg) and len(keys) > 1:
        return "loop", keys, True
    return kind, keys, False


def door_accesses(rel):
    """Direct model_storage.getItem / setItem / removeItem calls in one file."""
    d = C.analyze(rel)
    mk, clean = d["mk"], d["clean"]
    out = []
    for m in MODEL_CALL.finditer(mk):
        j = m.end()
        while j < len(mk) and mk[j].isspace():
            j += 1
        if j >= len(mk) or mk[j] != "(":
            continue
        args = C.call_args(clean, mk, j)
        arg = args[0] if args else ""
        kind, vals = C.resolve_key(arg, d) if arg else ("none", [])
        f = C.innermost(d, m.start())
        out.append({"op": C.OPMAP[m.group(1)], "store": "model_storage", "kind": kind, "keys": vals, "arg": arg,
                    "idx": m.start(), "line": C.line_of(d["text"], m.start()), "via": None,
                    "fn": f[0] if f else None, "in_effect": C.in_effect(d, m.start())})
    return out


def registry():
    """code -> {key, status} from the registry file, plus the unmodelled and excluded key lists."""
    if REGISTRY_FILE not in C.file_set():
        return {"codes": {}, "unmodelled": [], "excluded": []}
    clean = C.analyze(REGISTRY_FILE)["clean"]
    codes = {}
    for m in re.finditer(r"code\s*:\s*['\"](m\d+)['\"]\s*,\s*key\s*:\s*['\"]([^'\"]+)['\"]", clean):
        codes[m.group(1)] = {"key": m.group(2), "status": "modelled"}

    def lst(name):
        m = re.search(r"export const %s\s*=\s*\[(.*?)\]" % name, clean, re.S)
        return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1)) if m else []
    retired = set(lst("RETIRED_KEYS"))
    for v in codes.values():
        if v["key"] in retired:
            v["status"] = "retired"
    return {"codes": codes, "unmodelled": lst("UNMODELLED_KEYS"), "excluded": lst("EXCLUDED_KEYS")}


def sha(b):
    return hashlib.sha256(b).hexdigest()


def source_fingerprint():
    """Hash of every scanned source file plus the path-alias config. Used here and by check_graph_fresh.py."""
    per = {}
    for rel in C.code_files():
        with open(os.path.join(C.ROOT, rel), "rb") as f:
            per[rel] = sha(f.read())[:16]
    cfg = {}
    for name in ("tsconfig.json", "jsconfig.json"):
        p = os.path.join(C.ROOT, name)
        if os.path.isfile(p):
            with open(p, "rb") as f:
                cfg[name] = sha(f.read())[:16]
    blob = "\n".join("%s %s" % (k, per[k]) for k in sorted(per)) + "\n" + \
           "\n".join("%s %s" % (k, cfg[k]) for k in sorted(cfg)) + "\nv%d" % TOOL_VERSION
    return {"digest": sha(blob.encode("ascii", "replace")), "files": per, "config": cfg}


def kind_of(imported):
    if imported in ("reexport", "side-effect", "dynamic"):
        return imported
    if imported == "*":
        return "namespace"
    if imported == "default":
        return "default"
    return "named"


def pkg_of(spec):
    parts = spec.split("/")
    return "/".join(parts[:2]) if spec.startswith("@") and len(parts) > 1 else parts[0]


def line_of_spec(text, spec):
    i = text.find(spec)
    return C.line_of(text, i) if i >= 0 else 0


def build():
    files = C.code_files()
    C.build_defs()
    nodes = {}
    unresolved = []
    external = {}
    assets = 0
    for rel in files:
        d = C.analyze(rel)
        edges = {}
        for local, imported, target, spec in d["imports"]:
            k = kind_of(imported)
            if target:
                e = edges.setdefault(target, {"kinds": set(), "names": set()})
                e["kinds"].add(k)
                if k == "named" and imported:
                    e["names"].add(imported)
            elif spec.startswith("@/") or spec.startswith("."):
                if spec.lower().endswith(ASSET_EXT):
                    assets += 1
                else:
                    unresolved.append({"file": rel, "line": line_of_spec(d["clean"], spec), "spec": spec,
                                       "why": "not found as a file or index under the scanned folders"})
            else:
                p = pkg_of(spec)
                external[p] = external.get(p, 0) + 1
        for m in NONLITERAL_IMPORT.finditer(d["clean"]):
            unresolved.append({"file": rel, "line": C.line_of(d["clean"], m.start()),
                               "spec": d["clean"][m.start():m.start() + 40].split("\n")[0],
                               "why": "dynamic import() with a non-literal argument"})
        nodes[rel] = {"role": d["role"], "barrel": False, "imports": [
            {"to": t, "kinds": sorted(v["kinds"]), "names": sorted(v["names"])[:40]}
            for t, v in sorted(edges.items())], "imported_by": []}
    for rel, n in nodes.items():
        has_re = any("reexport" in e["kinds"] for e in n["imports"])
        all_re = bool(n["imports"]) and all(e["kinds"] == ["reexport"] for e in n["imports"])
        n["barrel"] = has_re and (os.path.basename(rel).startswith("index.") or all_re)
        for e in n["imports"]:
            e["to_is_barrel"] = False
    for rel, n in nodes.items():
        for e in n["imports"]:
            e["to_is_barrel"] = nodes[e["to"]]["barrel"]
            nodes[e["to"]]["imported_by"].append(rel)
    for n in nodes.values():
        n["imported_by"] = sorted(set(n["imported_by"]))

    storage = {}
    dynamic = []
    enum = []
    for rel in files:
        for a in list(C.accesses(rel)) + door_accesses(rel):
            op = a["op"]
            line = a["line"]
            a = dict(a)
            a["kind"], a["keys"], loop = refine(a)
            if op in "CK":
                enum.append({"file": rel, "line": line, "op": "clear" if op == "C" else "key/length"})
                continue
            if op not in "RWX":
                continue
            rec = {"file": rel, "line": line, "via": a.get("via"), "store": a["store"],
                   "fn": a.get("fn"), "in_effect": bool(a.get("in_effect"))}
            if a["kind"] in DYNAMIC_KINDS or not a["keys"]:
                r = dict(rec)
                r.update({"op": {"R": "READ", "W": "WRITE", "X": "REMOVE"}[op], "kind": a["kind"], "arg": a["arg"][:60]})
                dynamic.append(r)
                continue
            for key in a["keys"]:
                s = storage.setdefault(key, {"READ": [], "WRITE": [], "REMOVE": []})
                r = dict(rec)
                r["weak"] = a["kind"] == "const-global"
                r["loop"] = loop
                r["door"] = a["store"] == "model_storage"
                s[{"R": "READ", "W": "WRITE", "X": "REMOVE"}[op]].append(r)
    return nodes, unresolved, external, assets, storage, dynamic, enum


def text_lines(nodes, unresolved, storage, dynamic, enum, fp, counts):
    out = ["# repo_graph.txt  generated %s  digest %s" % (datetime.date.today().isoformat(), fp["digest"][:12]),
           "# SEARCH this file by a file name or a storage key. Do not read it whole. %s" % counts,
           "# line shapes: 'A imports B (kinds)' | STORAGE key OP file:line | STORAGE-DYNAMIC | STORAGE-ENUM | UNRESOLVED"]
    for rel in sorted(nodes):
        for e in nodes[rel]["imports"]:
            out.append("%s imports %s (%s)%s" % (rel, e["to"], ",".join(e["kinds"]),
                                                  "; target is barrel" if e["to_is_barrel"] else ""))
    for key in sorted(storage):
        for op in ("READ", "WRITE", "REMOVE"):
            for r in sorted(storage[key][op], key=lambda x: (x["file"], x["line"])):
                out.append("STORAGE %s %s %s:%d%s%s" % (key, op, r["file"], r["line"],
                                                         " via %s" % r["via"] if r["via"] else "",
                                                         " [weak: key found by constant name only]" if r["weak"] else "",
                                                         ) + (" [loop: reads every key it iterates, not one named key]" if r["loop"] else ""))
    reg = registry()
    for code in sorted(reg["codes"], key=lambda c: int(c[1:])):
        v = reg["codes"][code]
        out.append("REGISTRY %s %s %s" % (code, v["key"], v["status"]))
    for k in reg["unmodelled"]:
        out.append("REGISTRY - %s unmodelled (read-through, writes blocked in Model mode)" % k)
    for k in reg["excluded"]:
        out.append("REGISTRY - %s excluded (does not use the model_storage door)" % k)
    for r in sorted(dynamic, key=lambda x: (x["file"], x["line"])):
        out.append("STORAGE-DYNAMIC %s %s:%d kind=%s arg=%s%s" % (r["op"], r["file"], r["line"], r["kind"], r["arg"],
                                                                   " via %s" % r["via"] if r["via"] else ""))
    for r in sorted(enum, key=lambda x: (x["file"], x["line"])):
        out.append("STORAGE-ENUM %s:%d %s" % (r["file"], r["line"], r["op"]))
    for r in sorted(unresolved, key=lambda x: (x["file"], x["line"])):
        out.append("UNRESOLVED %s:%d spec=%s (%s)" % (r["file"], r["line"], r["spec"], r["why"]))
    return out


def main():
    argv = sys.argv[1:]
    outdir = os.path.join(C.ROOT, ".tmp", "repo_graph")
    if "--out" in argv:
        outdir = os.path.abspath(argv[argv.index("--out") + 1])
    nodes, unresolved, external, assets, storage, dynamic, enum = build()
    fp = source_fingerprint()
    n_edges = sum(len(n["imports"]) for n in nodes.values())
    counts = "files=%d edges=%d keys=%d dynamic=%d unresolved=%d" % (len(nodes), n_edges, len(storage), len(dynamic), len(unresolved))
    master = {"tool_version": TOOL_VERSION, "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
              "root": C.ROOT.replace("\\", "/"), "alias": {"@/*": "./*"}, "fingerprint": fp,
              "counts": {"files": len(nodes), "edges": n_edges, "storage_keys": len(storage),
                         "storage_dynamic": len(dynamic), "unresolved": len(unresolved), "asset_imports": assets},
              "files": nodes, "storage": storage, "storage_dynamic": dynamic, "storage_enumeration": enum,
              "unresolved": unresolved, "external_packages": external, "registry": registry()}
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, JSON_NAME), "w", encoding="ascii", newline="\n") as f:
        json.dump(master, f, indent=1, sort_keys=True)
    lines = text_lines(nodes, unresolved, storage, dynamic, enum, fp, counts)
    with open(os.path.join(outdir, TXT_NAME), "w", encoding="ascii", errors="replace", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    barrels = sorted(r for r, n in nodes.items() if n["barrel"])
    C.emit("REPO GRAPH BUILT   root: " + C.ROOT)
    C.emit("files %d | import edges %d | barrel files %d | asset imports skipped %d" % (len(nodes), n_edges, len(barrels), assets))
    C.emit("storage keys %d | dynamic or unresolved key accesses %d | clear/key enumerations %d" % (len(storage), len(dynamic), len(enum)))
    reg = master["registry"]
    seen = set(storage)
    noacc = sorted(v["key"] for v in reg["codes"].values() if v["key"] not in seen)
    C.emit("registry codes %d | registry keys never seen in an access %d%s" % (
        len(reg["codes"]), len(noacc), (": " + ", ".join(noacc[:6])) if noacc else ""))
    C.emit("UNRESOLVED imports %d%s" % (len(unresolved), "  (listed in the text file, section UNRESOLVED)" if unresolved else ""))
    for r in unresolved[:8]:
        C.emit("  %s:%d  %s  (%s)" % (r["file"], r["line"], r["spec"], r["why"]))
    if len(unresolved) > 8:
        C.emit("  ... %d more" % (len(unresolved) - 8))
    C.emit("fingerprint %s" % fp["digest"][:12])
    C.emit("wrote %s (%d bytes)" % (os.path.join(outdir, JSON_NAME), os.path.getsize(os.path.join(outdir, JSON_NAME))))
    C.emit("wrote %s (%d lines)" % (os.path.join(outdir, TXT_NAME), len(lines)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
