# AI Workflow Rules — Taxonomy & Catalog Planner

> Current architecture (2026-10-15): Supabase PostgreSQL + Next.js Auth/RLS is deployed and is the source of truth. Legacy JSON rules apply only to historical units; the JSON files are no longer in the working tree. Continue one spec-defined unit at a time and verify matching migrations, CI, deployment, and tracker updates.

## Core Principle

> **One unit at a time. No exceptions.**

Every development session focuses on exactly one unit from the build plan. The unit's spec in `context/specs/` is the **sole source of truth** for what to implement.

## Development Boundaries

### Rule 1: Single Unit Per Prompt

- Implement **only** the features described in the current unit's spec.
- If you notice something that "would be nice" but isn't in the spec, **do not implement it**.
- If a future unit's feature is needed as a dependency, implement only the minimal interface/stub required by the current spec.

### Rule 2: Zero Speculative Features

- **Never** add "placeholder" components for future units.
- **Never** install dependencies not listed in the current unit's spec.
- **Never** create files or routes that aren't required by the current unit.
- If a type or utility will be needed later, add it **only when that unit is active**.

### Rule 3: Context Before Code

Before writing any code in a session:

1. Read `AGENTS.md`.
2. Read all six context files in order.
3. Read the specific spec for the unit being implemented.
4. Read `context/progress-tracker.md` for current state.
5. **Only then** begin implementation.

### Rule 4: Spec Compliance Check

Before submitting work for a unit, verify every line of the spec:

- Every file listed in the spec exists.
- Every function/type listed in the spec is implemented.
- Every behavior described in the spec works correctly.
- Nothing exists that the spec doesn't mention (no extras).

### Rule 5: No Silent Failures

- Every error path must produce a visible, actionable message.
- Every Server Action must return a typed `ActionResult`.
- Every destructive operation must require explicit confirmation.
- **Never** use `catch (e) {}` with an empty body.

## Verification Checklist Protocol

Every active unit spec includes a **Verification Checklist**. A merged unit can still have pending runtime/browser checks; track those separately from code/CI completion. Before marking a unit as complete:

### Step 1: Static Checks

- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`).
- [ ] No unused imports or variables.
- [ ] All Zod schemas validate correctly.

### Step 2: Runtime Checks

- [ ] Dev server starts without errors (`npm run dev`).
- [ ] Every endpoint/action described in the spec is reachable and functional.
- [ ] Data persistence matches the current architecture: Supabase for all current runtime work. Legacy JSON applies only to historical Units 01–08 and must not be reintroduced.

### Step 3: Behavioral Checks

- [ ] Each specific behavior from the spec's checklist is verified.
- [ ] Edge cases are tested (empty data, missing files, invalid input).

### Step 4: Documentation Updates

- [ ] `context/progress-tracker.md` is updated.
- [ ] Any architecture decisions made during implementation are noted.
- [ ] If the spec was insufficient, amendments are noted in the tracker.

## File Modification Rules

### Context Files

- `context/progress-tracker.md`: Updated after every unit completion.
- All context files are maintained project artifacts. Update them when verified implementation or an approved architecture decision changes; keep changes evidence-based and in scope. The progress tracker must reflect actual merge/verification state, not intended state.
- New specs: Created only for the immediate next unit when the current one completes.

### Source Files

- **Create** only files listed in the current unit's spec.
- **Modify** existing files only when the current spec explicitly requires it.
- **Never delete** files created by a previous unit unless the current spec explicitly calls for it.

## Handling Ambiguity

If the spec is unclear or incomplete:

1. **Stop coding.** Do not guess.
2. Document the ambiguity in `context/progress-tracker.md` under "Open Questions".
3. Ask for clarification before proceeding.
4. If a reasonable default exists (e.g., a Tailwind class choice), document the decision and proceed.

## Commit Discipline

After completing a unit:

1. Stage all changes.
2. Commit with message format: `unit-XX: Brief description of what was implemented`.
3. Example: `unit-01: Project setup, Zod schemas, atomic JSON data layer`.

## Quality Gates

A unit is **NOT verified complete** until:

| Gate | Check |
| ------ | ------- |
| Compiles | `npx tsc --noEmit` passes |
| Runs | `npm run dev` starts without errors |
| Spec Match | Every required item is checked or explicitly listed as pending; do not claim full verification while required checks remain pending |
| No Extras | No files, routes, or features exist beyond the spec |
| Tracker Updated | `context/progress-tracker.md` reflects completion |
