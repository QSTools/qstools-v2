# Mirra v5.0 — Continuous Contract Alignment Workflow

STATUS: ACTIVE OPERATING BRIEF
VERSION: v5.0
PURPOSE: Prevent contract drift after module changes
APPLIES TO: All Mirra / QS Tools module builds, refactors, calculations, selectors, hooks, and output contracts

---

## 1. Core Rule

No module change is complete until its output contract has been checked against the active brief pack.

This workflow must be run whenever a module adds, removes, renames, or changes any output variable that may be consumed by another module, displayed as a major result, or included in a module `output_contract`.

The purpose is to prevent another large catch-up alignment pass.

---

## 2. When This Workflow Must Run

Run this workflow after:

1. Adding a new output variable.
2. Changing a module calculation output.
3. Changing a selector output.
4. Changing a hook return object.
5. Changing a module `output_contract`.
6. Finishing a meaningful module build step.
7. Before moving to the next downstream module.
8. Before committing a module change that affects downstream logic.

---

## 3. Current Contract Discipline

All module changes must preserve the Mirra v5.0 rules:

1. Every variable has one owner.
2. Downstream modules consume `output_contract`.
3. Downstream modules must not read raw upstream state where a contract exists.
4. Business logic belongs in `lib/calculations`.
5. Selectors shape outputs.
6. Hooks orchestrate state and storage.
7. Components render only.
8. Status strips are read-only.
9. Helper fields, display fields, local UI state, and wrappers must not be promoted into business output contracts unless explicitly classified.
10. No output field is accepted without review.

---

## 4. Required Alignment Run

After a module change, run the existing audit scripts from the repo audit tooling area.

Primary audit folder:

```txt
tools/audit/
```

Primary audit evidence folder:

```txt
docs/Audit/
```

Primary v5 brief folder:

```txt
docs/Mirra_v5_Briefs/
```

The exact scripts should be run in the same order used during the v5.0 audit pass.

The required process is:

1. Extract current source-code output contract fields.
2. Extract current brief output contract fields.
3. Normalise field/module ownership.
4. Compare code fields against brief fields.
5. Identify new code-only fields.
6. Identify brief-only fields where relevant.
7. Classify all new fields.
8. Append accepted fields to the correct module brief.
9. Document wrappers separately.
10. Reject helper/display-only fields.
11. Re-run the audit after brief updates.
12. Confirm there are no unreviewed new outputs introduced by the current change.

---

## 5. Field Classification Rules

Every new code-only field must be classified into one of these outcomes:

### 5.1 Add to Current Module Contract

Use when the field is a real module-owned output.

Examples:

```txt
total_cost_burden
business_outcome_status
required_recovery_rate
summary_warnings
model_trust_state
```

Action:

```txt
Add to the owning module brief output contract.
Preserve exact variable name.
Do not rename during the alignment pass.
```

---

### 5.2 Document as Reference Wrapper

Use when the field wraps or passes a module output object but is not itself a business metric.

Examples:

```txt
pnl_output_contract
general_overheads_output
labour_output
cost_summary_output_contract
```

Action:

```txt
Document separately as a reference wrapper.
Do not add as a business metric.
```

---

### 5.3 Reject Helper or Display Only

Use when the field is only for UI rendering, formatting, layout, temporary state, local component behaviour, or helper logic.

Examples:

```txt
isExpanded
displayRows
formattedValue
cardTone
buttonLabel
localSelection
```

Action:

```txt
Do not add to output contract.
Leave out of the brief.
```

---

## 6. Accepted Field Update Rule

If a new field is accepted, update the relevant module brief in:

```txt
docs/Mirra_v5_Briefs/
```

The accepted field must include:

1. Exact variable name.
2. Owning module.
3. Meaning.
4. Source.
5. Downstream consumers if known.
6. Current status.
7. Review notes if required.

Do not rename variables during the alignment pass.

---

## 7. Wrapper Documentation Rule

Reference wrappers must be documented separately from business outputs.

A wrapper can be listed under:

```txt
output_contract_reference_wrappers
```

Wrappers must not be treated as business calculations.

---

## 8. Rejected Field Rule

Rejected helper/display fields must not be added to the module contract.

A rejected field should only be added to audit evidence if required for traceability.

Do not let rejected fields become formal source-of-truth variables.

---

## 9. Mini Alignment Acceptance Criteria

A module step is aligned only when:

1. The current code output fields have been extracted.
2. The current brief output fields have been extracted.
3. New code-only fields from the current change have been reviewed.
4. All new fields are classified.
5. Accepted fields are appended to the correct brief.
6. Wrappers are documented separately.
7. Helpers/display-only fields are rejected.
8. The audit has been re-run.
9. No unreviewed new output fields remain from the current change.
10. Build still passes.

---

## 10. Commit Rule

Every module commit that changes outputs should include the alignment result.

Recommended commit pattern:

```txt
<module>: update outputs and align contract
```

Examples:

```txt
business-outcome: add diagnosis outputs and align contract
rate-builder: update rate rows and align contract
cost-allocation: add share warnings and align contract
```

If the change is only documentation:

```txt
docs: update Mirra contract alignment workflow
```

---

## 11. Build Rule

After alignment, run the normal build check before pushing:

```txt
npm run build
```

If the build fails, fix the build before continuing downstream.

---

## 12. Ongoing Operating Rule

Do not wait until multiple modules are finished before aligning contracts.

The correct rhythm is:

```txt
Build small module step
→ run mini contract alignment
→ update brief if required
→ commit
→ move downstream
```

This prevents:

1. contract drift
2. duplicate variables
3. unknown ownership
4. helper fields entering contracts
5. downstream modules consuming unstable values
6. multi-day audit cleanup passes

---

## 13. Final Principle

Mirra must stay aligned as it is built.

The contract audit is not a one-off clean-up task.

It is now part of the normal module build process.

Every output must answer:

```txt
Who owns this?
Where did it come from?
How was it calculated?
Where does it go next?
Is it documented?
Can it be trusted?
```

If those questions cannot be answered, the field is not ready for downstream use.
