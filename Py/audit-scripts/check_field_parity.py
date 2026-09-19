"""
check_field_parity.py

Catches the #1 recurring bug in this codebase: a field added to a hook's
return object that never gets added to the selector reshaping it (or vice
versa) - so it silently never reaches the component.

This is a static, regex-based heuristic, NOT a real JS parser. It finds
the outermost `return { ... }` block in each file and extracts the
top-level keys. Review its output; it can be fooled by unusual formatting
(e.g. spread-only returns, computed keys, deeply nested destructuring).

Usage (from repo root):
    python check_field_parity.py <hook_file> <selector_file>

Example:
    python check_field_parity.py hooks/useBusinessOutcomePerSourceRevenue.js lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors.js

Output:
    - Keys present in the hook but missing from the selector (likely bug)
    - Keys present in the selector but not traceable to the hook (informational -
      the selector may legitimately add derived fields)
    - Keys in both (confirmed parity)
"""

import re
import sys


def find_return_object_blocks(text):
    """
    Finds every `return {` in the text and extracts the balanced-brace
    block that follows, returning the raw object body as a string.
    """
    blocks = []
    for match in re.finditer(r'return\s*\{', text):
        start = match.end() - 1  # position of the opening {
        depth = 0
        i = start
        while i < len(text):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    blocks.append(text[start + 1:i])
                    break
            i += 1
    return blocks


def extract_top_level_keys(obj_body):
    """
    Extracts top-level key names from an object body string, ignoring
    nested braces/brackets so nested objects don't pollute the result.
    Handles: key: value, key, (shorthand), and "key": value.
    """
    keys = []
    depth = 0
    i = 0
    n = len(obj_body)
    current_key_start = 0
    buf = ""

    while i < n:
        ch = obj_body[i]
        if ch in "{[(":
            depth += 1
            buf += ch
        elif ch in "}])":
            depth -= 1
            buf += ch
        elif ch == "," and depth == 0:
            keys.append(buf)
            buf = ""
        else:
            buf += ch
        i += 1
    if buf.strip():
        keys.append(buf)

    key_names = []
    for k in keys:
        k = k.strip()
        if not k or k.startswith("..."):
            continue  # skip spreads - can't statically know what they add
        # "key: value" or just "key" (shorthand) or "'key'"/'"key"': value
        m = re.match(r'^["\']?([A-Za-z_$][A-Za-z0-9_$]*)["\']?\s*(:|$)', k)
        if m:
            key_names.append(m.group(1))
    return key_names


def get_keys_from_file(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    except OSError as e:
        print(f"Could not read {path}: {e}")
        sys.exit(1)

    blocks = find_return_object_blocks(text)
    if not blocks:
        print(f"WARNING: no `return {{ ... }}` block found in {path}")
        return set(), []

    # Use the LARGEST return block found - usually the main export's
    # return statement, not a small helper's.
    largest = max(blocks, key=len)
    keys = extract_top_level_keys(largest)
    return set(keys), keys


def main():
    if len(sys.argv) != 3:
        print("Usage: python check_field_parity.py <hook_file> <selector_file>")
        sys.exit(1)

    hook_path, selector_path = sys.argv[1], sys.argv[2]

    hook_keys, hook_order = get_keys_from_file(hook_path)
    selector_keys, selector_order = get_keys_from_file(selector_path)

    missing_from_selector = [k for k in hook_order if k not in selector_keys]
    only_in_selector = [k for k in selector_order if k not in hook_keys]
    in_both = [k for k in hook_order if k in selector_keys]

    print(f"Hook file:     {hook_path}  ({len(hook_keys)} top-level keys)")
    print(f"Selector file: {selector_path}  ({len(selector_keys)} top-level keys)")
    print()

    print(f"IN BOTH ({len(in_both)}):")
    for k in in_both:
        print(f"    {k}")
    print()

    print(f"IN HOOK BUT MISSING FROM SELECTOR ({len(missing_from_selector)}) - "
          f"likely won't reach the component:")
    for k in missing_from_selector:
        print(f"    ** {k}")
    print()

    print(f"IN SELECTOR BUT NOT FOUND IN HOOK ({len(only_in_selector)}) - "
          f"informational, may be a legitimate derived field or a spread "
          f"the script couldn't see through:")
    for k in only_in_selector:
        print(f"    {k}")
    print()

    if missing_from_selector:
        print("ACTION: review each '**' field above - confirm whether it's "
              "intentionally excluded or a genuine gap to patch.")
    else:
        print("No obvious gaps found (subject to this script's regex limits - "
              "spreads and heavily nested returns aren't fully tracked).")


if __name__ == "__main__":
    main()
