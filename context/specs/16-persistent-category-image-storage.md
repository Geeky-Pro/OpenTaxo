# Unit 16 — Persistent Category Image Storage

> Status: Implemented and merged as part of the Supabase application foundation. Storage policy and live behavior must be rechecked before changing the bucket or its access rules.

## Goal

Store taxonomy-node images persistently in Supabase Storage instead of relying on the deployment filesystem.

## Implemented contract

- Use the existing categories Storage bucket.
- Support PNG, JPEG, and WebP with a 5 MiB upload limit.
- Public reads are allowed for image rendering; writes, updates, and deletes are restricted to the authorized owner through the application authorization boundary and Storage policies.
- Store a stable storage path on the taxonomy node; do not rely on ephemeral files under the deployed application's filesystem.
- Keep image removal separate from taxonomy-node deletion. Removing an image reference must not silently delete unrelated or shared storage objects.
- Preserve the legacy static files under public/categories/ until all live references are migrated or the owner approves clearing the legacy taxonomy.

## Out of scope

- CDN transformations or image-processing pipelines.
- Merchant-owned image assets or tenant-specific storage.
- Destructive cleanup of existing static images without an inventory of references.

## Verification state

- [x] Storage bucket and owner policies were verified in the recorded 2026-10-15 audit.
- [x] MIME restrictions and 5 MiB limit were recorded.
- [ ] Recheck current live bucket/policies before any storage migration or cleanup.
- [ ] Verify image upload, replacement, explicit removal, and reload on the current main deployment.
