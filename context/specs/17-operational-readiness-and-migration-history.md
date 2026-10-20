# Unit 17 — Operational Readiness and Migration-History Reconciliation

> Status: Partially verified. Owner sign-in and taxonomy creation were confirmed; security dashboard settings and complete denied-user/browser checks remain open.

## Goal

Record the operational gates required to safely use the Supabase-backed taxonomy planner and prevent local migration files from drifting away from the applied Supabase migration history.

## Scope

- Verify owner email/password sign-in and session behavior.
- Verify signed-out and authenticated-but-not-allowlisted users are denied access.
- Confirm the owner allowlist and RLS are enabled on every exposed public table.
- Verify the Vercel environment has the public Supabase URL and publishable key in the intended environments; never place service-role keys in client bundles or source control.
- Reconcile local migration filenames with the migration versions recorded by Supabase.
- Investigate the historically duplicated Storage migration version. A no-op local migration represents the already-applied second version; do not delete or rename migration files without comparing local and remote history.
- Record the deployed commit separately from a READY status for an older deployment.

## Security checks that remain required

- Confirm public sign-up is disabled in Supabase Auth settings.
- Enable leaked-password protection; the last documented security-advisor result reported it disabled.
- Test authorization denial paths through the deployed application.
- Verify the current main commit is deployed before claiming recent UI work is live.

## Acceptance / status

- [x] Owner sign-in and creation of a taxonomy node were confirmed by the owner.
- [x] The duplicate Storage migration history was documented and represented locally without replaying the already-applied DDL.
- [ ] Confirm public sign-up is disabled.
- [ ] Enable leaked-password protection.
- [ ] Verify signed-out and non-allowlisted denial paths.
- [ ] Recheck current deployment commit and browser behavior.

## Safety

This unit is operational verification, not permission to reset data, rotate credentials without a plan, or alter live migration history destructively.
