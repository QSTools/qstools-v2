"""
bm7_c_hook_mounts_and_writes.py

BM-7 audit, part C. READ-ONLY (changes no files).

Question: when a page mounts, which hooks and components actually run (calls and
JSX, not just imports), and which of them have save effects? A hook mounted in
modelling mode that saves on its own is a write path into the real keys, whatever
the page does. Example from the Business Modelling brief: mounting
useGeneralOverheads runs its hydrate / save / P&L-sync effects.

Output sections:
  1  every file with an effect that writes or removes a storage key (line, keys,
     functions called, guard evidence)
  2  mount edges where the CHILD has a writing effect (parent -> child)
  3  per scoped page: everything it mounts transitively that writes, split into
     automatic (effect) writes and user-action writes
  4  effects that read AND write the same key (hydrate + save in one file)

Guard evidence: a has_loaded / hydrated / ready / mounted word inside the effect
or elsewhere in the file. It does NOT prove the guard gates that save.

Run (from repo root):  python Py\\audit-scripts\\bm7_c_hook_mounts_and_writes.py
Plain ASCII on stdout. BM7_ALL=1 lifts the line caps.
"""

from bm7_common import (ROOT, code_files, analyze, accesses, build_defs, effect_report, mount_edges,
                        bfs, chain, emit, head, cap, short)

SCOPE = {
    "TIER1": ("general-overheads", "rate-builder"),
    "SCENARIO": ("labour", "assets", "cost-allocation", "revenue-cogs", "p-and-l"),
    "READS": ("business-outcome", "business-modelling"),
}


def page_tag(rel):
    for t, names in SCOPE.items():
        for n in names:
            if rel.startswith("app/" + n + "/") or ("/" + n + "/") in ("/" + rel):
                return t
    return "OTHER"


def main():
    files = code_files()
    build_defs()
    emit("BM-7 C. HOOK MOUNTS AND WRITE PATHS   root: " + ROOT)

    eff_writers = {}   # rel -> list of effect dicts that write
    eff_readers = {}
    for rel in files:
        if not analyze(rel)["effects"]:
            continue
        reps = effect_report(rel)
        w = [e for e in reps if e["keys"]["W"] or e["keys"]["X"]]
        r = [e for e in reps if e["keys"]["R"]]
        if w:
            eff_writers[rel] = w
        if r:
            eff_readers[rel] = r

    head("1. FILES WITH A WRITING EFFECT   (role | file | line | keys written | calls | guard)")
    lines = []
    for rel in sorted(eff_writers):
        role = analyze(rel)["role"]
        for e in eff_writers[rel]:
            keys = sorted(e["keys"]["W"] | e["keys"]["X"])
            g = "guard in effect" if e["guard_in_effect"] else ("guard in file only" if e["guard_in_file"] else "NO GUARD WORD")
            lines.append("%-9s %s:%d | %s | calls: %s | %s" % (
                role, rel, e["line"], ", ".join(keys) or "-", ", ".join(e["called"]) or "-", g))
    for line in cap(lines, 100):
        emit(line)
    if not lines:
        emit("none")

    head("2. MOUNT EDGES WHERE THE CHILD HAS A WRITING EFFECT   (parent -> child)")
    lines = []
    for rel in files:
        for kind, name, tgt in mount_edges(rel):
            if tgt != rel and tgt in eff_writers:
                keys = sorted(set(k for e in eff_writers[tgt] for k in (e["keys"]["W"] | e["keys"]["X"])))
                lines.append("%s -[%s %s]-> %s   writes: %s" % (rel, kind, name, tgt, ", ".join(keys) or "-"))
    for line in cap(sorted(lines), 100):
        emit(line)
    if not lines:
        emit("none")

    head("3. PER PAGE: WHAT IT MOUNTS THAT WRITES   (scoped pages first)")

    fileset = set(files)

    def edges(rel):
        out = [t for _, _, t in mount_edges(rel) if t != rel]
        # Also follow plain imports of storage modules (hooks call storage functions, not hooks).
        for _, _, t, _ in analyze(rel)["imports"]:
            if t and t != rel and t in fileset and t not in out and analyze(t)["role"] == "storage":
                out.append(t)
        return out

    pages = [r for r in files if analyze(r)["role"] == "page"]
    order = {"TIER1": 0, "SCENARIO": 1, "READS": 2, "OTHER": 3}
    pages.sort(key=lambda p: (order[page_tag(p)], p))
    out = []
    for p in pages:
        t = page_tag(p)
        if t == "OTHER" and not __import__("os").environ.get("BM7_ALL"):
            continue
        parent = bfs(p, edges)
        auto = []
        action = []
        for node in parent:
            acc = [a for a in accesses(node) if a["op"] in "WX"]
            if not acc:
                continue
            keys_effect = set()
            keys_other = set()
            if node in eff_writers:
                for e in eff_writers[node]:
                    keys_effect.update(e["keys"]["W"] | e["keys"]["X"])
            for a in acc:
                if a["in_effect"]:
                    keys_effect.update(a["keys"])
                else:
                    keys_other.update(a["keys"])
            keys_other -= keys_effect
            if keys_effect:
                auto.append((node, sorted(keys_effect)))
            if keys_other:
                action.append((node, sorted(keys_other)))
        out.append("%s  %s   (%d files mounted)" % (t, p, len(parent)))
        if not auto and not action:
            out.append("    nothing mounted writes storage")
        for node, ks in auto:
            out.append("    AUTO   %s [%s]  writes %s" % (node, analyze(node)["role"], ", ".join(ks)))
            out.append("           chain: " + " > ".join(short(c) for c in chain(parent, node)))
        for node, ks in action:
            out.append("    ACTION %s [%s]  writes %s" % (node, analyze(node)["role"], ", ".join(ks)))
    for line in cap(out, 260):
        emit(line)

    head("4. EFFECTS THAT READ AND WRITE THE SAME KEY   (hydrate + save pair)")
    lines = []
    for rel in sorted(set(eff_writers) | set(eff_readers)):
        wk = set(k for e in eff_writers.get(rel, []) for k in (e["keys"]["W"] | e["keys"]["X"]))
        rk = set(k for e in eff_readers.get(rel, []) for k in e["keys"]["R"])
        both = sorted(wk & rk)
        if both:
            lines.append("%s : %s" % (rel, ", ".join(both)))
    for line in cap(lines, 60):
        emit(line)
    if not lines:
        emit("none")
    emit("")
    emit("End of C. Mount edges come from hook calls and JSX tags resolved through imports,")
    emit("plus direct imports of storage modules (section 3 only).")
    emit("Writes found only inside callbacks passed as props or through context are not followed.")


if __name__ == "__main__":
    main()
