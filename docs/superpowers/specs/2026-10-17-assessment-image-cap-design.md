# Bounded assessment image capacity correction

## Approval and evidence

The user approved preparing this implementation and migration tests locally only. No live database (including the existing local development database), deployment, provider invocation, secret, dependency, or commit changes are authorized by this approval.

Production test package 203 reached the provider image download after the safe redirect fix, but rejected its bytes as `too_large`. This proves that the download exceeded 512 KiB, not its full size or image validity. Supporting 1.5 MiB is bounded support, not a promise that every provider output fits.

## Contract

- Raise raw raster input/stored-image capacity to 1,572,864 bytes consistently across validation, reads, upload, remote ingestion, browser sync, preflight, and DOCX input/conversion checks.
- Preserve the 8-million-pixel bound, 8 raster references and 4 MiB unique asset bytes per package, and 100 assets/32 MiB per owner. Keep package JSON bounded at 1 MiB; never embed large raster base64 in package content instead of asset references.
- Preserve safe HTTPS hosts, bounded validated redirects, timeouts, private/package authorization, checksums, UUID identities, revision CAS, generation fencing, and explicit replay-only recovery.
- Keep existing SVG behavior, design, RPP colors, and form-progress removal unchanged. No guessed provider output-format parameters, new codec, service, or public storage origin.

## Data-preserving migration

Add a new migration; do not rewrite 0041/0042. Before any execution inventory incoming foreign keys, indexes, triggers, and views, and reject unexpected dependencies. Tests use disposable fixtures only.

In one demonstrably atomic transaction with foreign keys enabled: stage exact association rows without foreign keys; create the larger-cap replacement asset table; copy all explicit asset columns and assert exact preservation; drop the child association table before its parent; rename the replacement; recreate original owner index, child schema, association rows, and asset index. Assert row-set equality, BLOB equality, timestamps, constraints, and foreign-key consistency before removing staging. Assertions must abort and roll back on failure. Do not touch question content, revisions, sharing, users, or generation receipts.

Prove preservation for public/private packages, shared and unattached assets, multiple owners and timestamps. Inject failures after destructive steps and prove restoration of original schema, bytes, and associations. Prove the original cascade behavior and new cap boundaries. Production execution requires separate backup/restore and write-quiescence approval. After larger assets exist, old readers and a blindly restored 512 KiB CHECK are unsafe; use compatible forward repair or a rollback build retaining larger reads while disabling larger new writes.

## Budgeting and settlement

Fetch and validate into bounded request memory before persistent generation/recovery writes. Enforce actual remaining unique-byte/reference budgets before persistence; avoid worst-case reservations that reject small valid images. Keep aggregate staging at 4 MiB, with bounded transient copies. New generated/recovered assets, question-package changes, associations, and generation completion must settle atomically under authoritative owner quotas and existing fence/receipt checks. A conditional no-op is not a rollback signal: required settlement needs a failing assertion/latch. Preserve deliberately standalone uploads and never blanket-delete unattached assets. Review copy-path package budgets as well.

The detailed helper/SQL interface is to be reviewed before implementing this dependent backend lane; migration tests and mechanical browser limit alignment can proceed independently.

### Reviewed settlement contract

Prepared assets carry server-derived UUID, owner, MIME, byte length, SHA-256, and exact bytes in a request-local map passed separately from content. Normalization counts all raster references (including duplicates), budgets unique actual lengths, caches repeated sources, and never serializes staged bytes. Shared create/save/copy settlement inserts staged assets under authoritative owner quota predicates, then guards the package mutation and associations in the same batch. Every staged ID must be referenced by final content and match its authoritative metadata.

The package mutation token is the generation admission/linearization point: check the live owner/document/run/job fence there once. Cancellation cannot interleave within the atomic batch. Later package completion must require that successful token and owner/document/run, but must not recheck the wall-clock lease (expiry after the latch is an established supported case). Independent completion APIs without the package latch retain their own live checks.

Use an unconditional write receipt whose required package ID resolves to NULL on no successful operation, forcing rollback rather than silently retaining earlier asset inserts. Verify the exact final association set and matching completed generation record when applicable. Reconcile durable success before classifying a batch failure; preserve typed CAS/fence/quota/identity failures. Unknown outcomes must not trigger another generation, new asset IDs, or a second failed-save ledger completion. On confirmed rollback, remove uncommitted staged IDs from recoverable output. Standalone uploads and replacement-only generation must remain explicitly identified paths rather than silently acquiring package-atomic guarantees.

## Verification

Focused cap, migration, quota, cancellation/CAS rollback, recovery, copy, decoding and WebP-conversion tests; actual isolated D1 BLOB boundaries using existing tooling; full test suite, unchanged strict typecheck, secrets check, diff check, and isolated build preserving workspace-generated assets. No paid generation or production validation is claimed. Report the online issue as pending until separately authorized deployment and verification succeed.

### Incremental migration evidence

Migration 0044 and its explicitly invoked offline snapshot preflight passed four focused tests, including actual isolated Miniflare D1 batch preservation and injected rollback after destructive steps. Review identified and corrected case-sensitive incoming-FK detection; populated uppercase/mixed-case cascade dependencies are now rejected. Strict typecheck passed for that snapshot. This is not execution through the Wrangler migration runner, a production headroom guarantee, or approval to migrate an existing database. Final combined package-settlement verification remains a separate gate.

### Combined local verification

After the settlement and stable-retry corrections, the full suite passed 1,058 tests across 90 files; one opt-in D1 integration file/test remained skipped in the default run. Strict `tsc --noEmit --pretty false`, the secrets check, and `git diff --check` passed (line-ending warnings only). Focused tests cover atomic staged-asset settlement, quota and identity rejection, copy-source changes, pre-read copy budgets, cancellation/lease ordering, sanitized failed-save recovery, and identical staged retries returning the original package without additional assets or receipts. Expected negative-case logs are not production failure evidence.

The refreshed final isolated build passed with 667 transformed modules and a 5,752,623-byte worker. The six relevant backend source-file hashes matched the workspace before and after the build, including the final retry fix. Workspace CSS and PPTX vendor bytes were unchanged. The only reported build warning was outdated Browserslist data. Port 5173 was not listening before or after; the build did not start a development server.

These results do not establish that package 203's original provider image fits the new limit, that every provider output is valid, or that the online incident is resolved. The current database has not been migrated to 0044, and this local preparation approval does not authorize deployment, live database changes, or another paid generation.
