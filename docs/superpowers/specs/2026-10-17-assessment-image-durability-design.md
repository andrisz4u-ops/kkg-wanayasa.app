# Assessment images, saved edits, and export integrity

## Approval and boundaries

The user approved all four priorities after the image-lifecycle analysis: durable images, persisted edits, export checks, and cross-device/expiry regression coverage. Implement these as one bounded change. Preserve existing work, the green RPP dimension palette, form layouts, and role policies. Do not deploy, mutate production data/secrets, purchase services, or generate replacement images automatically. A failed signed URL does not contain recoverable original bytes. Local additive schema preparation requires backup and verification; production migration remains a separate operation.

## Evidence and architectural choice

Assessment JSON currently retains provider URLs, including observed local Vultr URLs expiring after one hour. The specific online English assessment has not been inspected. Browser edits are not persisted back to the package; print and DOCX can silently omit failed images.

Use separate bounded D1 BLOB assets on existing infrastructure, not base64 inside assessment JSON and not the existing potentially public object bucket. This consumes existing D1 allowances; it does not provision services or certify zero usage cost. R2 can be evaluated separately once origin privacy is established.

## Priority 1: durable assets and package authorization

Migration 0041 adds random-ID assets with owner, server-computed hash, validated MIME, exact byte length, bytes, and timestamp. Accept PNG/JPEG/WebP only: maximum 512 KiB per asset, eight raster references and 4 MiB per package, 100 retained assets and 32 MiB per owner. Enforce per-owner asset quotas atomically, preserving existing assets on rejection. JSON bodies remain streaming-bounded to 1 MiB. Return controlled warnings rather than silently dropping a required stimulus.

Authenticated raw upload: `POST /api/assessment-assets`, optional stable client asset ID for idempotent retry. Owner preview: `GET /api/assessment-assets/:id`. Package reads: `GET /api/banksoal/:id/assets/:assetId`, authorized using current package visibility and current association. Admin is not a general private-package reader. The moderation queue may provide narrowly scoped access to explicitly submitted pending packages. Responses use correct MIME, `nosniff`, and `private, no-store`; never redirect to a public origin.

Generated rasters are ingested before persistence/completion is reported. Fetch only exact approved provider hosts (the observed `sewr2.vultrobjects.com` and established Wikimedia image host `upload.wikimedia.org`), HTTPS, no credentials or custom ports, no redirects, bounded streamed bytes, timeout, MIME/signature/pixel limits, no forwarded credentials. Do not add arbitrary URL proxying. Other hosts fail closed with a controlled durability warning until explicitly reviewed. In-band image bytes are acceptable if already returned by the single provider request; do not probe or retry image generation. Retain trusted application SVG rendering/structured parameters and self-contained safe diagrams; reject arbitrary active SVG/external references rather than introducing a remote rasterization service.

Image JSON uses authoritative `assetId` and a server-derived same-origin URL. Preserve useful alt text and attribution, but do not retain signed provider URLs in durable records. Missing legacy images remain marked unavailable. An explicit recovery attempt may ingest an authorized, still-valid legacy URL using the same restrictions; no bulk historical rewrite or background generation.

## Priority 2: authoritative package revisions and saved edits

Migration 0042 adds `revision`, server content hash, owner-scoped stable client document ID, and current package/asset associations. Do not rewrite historical content or visibility. Runtime schema initialization must match the migration without replaying legacy backfills.

Creation is idempotent for an owner/client document ID. Owner-only `PUT /api/banksoal/:id` requires `baseRevision`; a conditional write, association changes, and audit are one D1 batch, guarded by a unique write token or equivalent. A stale writer gets 409 and keeps local work. Validate all asset references and owner/quotas before a successful commit. Changed content increments revision and invalidates inherited public approval/legacy compatibility. Explicit sharing intent may remain pending, never silently approved. Moderator actions bind the revision shown in the queue.

Foreign accessible packages are copied explicitly to a new private package before editing. Copy referenced asset bytes into the recipient's ownership under quotas, rechecking source visibility inside the write transaction. Withdrawal of the original must not break a legitimately saved copy. Known foreign asset IDs alone never authorize attachment or download.

Generation returns persisted identity, revision, save status, and image warnings. Remove fallback owner ID 1. Persistence is not conditional on telemetry success. The frontend retains the active package identity/context token, serializes debounced CAS saves, shows unsaved/saving/saved/error/conflict states, and ignores stale load/save/regeneration responses after switching packages. Every committed edit path shares the save mechanism, preserving image metadata unless deliberately changed. Local archives remain offline recovery, not the cross-device source of truth.

Migration 0043 records assessment generation identities separately from transport-specific AI jobs. Authenticated owner plus stable client document UUID identifies one generation intent across normal and SSE requests. Canonical semantic-input hashes exclude transport fields. An atomic reservation admits only one provider execution; identical completed retries replay the current owner-qualified package, conflicting inputs or in-progress/ended requests return controlled conflicts without provider calls. Missing identities remain compatible through a server-generated UUID, but deduplication requires retaining that identity. Replays do not consume another AI admission slot.

The explicit frontend result-recovery action sends `X-Assessment-Replay-Only: 1` with the retained identity and frozen payload. This is lookup-only: a missing reservation returns a controlled conflict, never creates a reservation or starts AI. Otherwise an interrupted request that never reached the server could turn a supposedly free recovery action into a new generation. The owner-scoped pending record is restored without automatic requests; starting a separate generation while its outcome is unresolved requires confirmation. Recovering a result must preserve local unsaved work and reject stale owner/document/page/version responses.

The generation reservation's run token, and the live SSE job authorization when applicable, fence package creation and association writes. Successful package creation and reservation settlement share a transaction. A normalized usable result whose package save failed is retained as explicit recovery output, not regenerated automatically. Deleted/foreign-owned saved results are not recreated by retry. Failed, cancelled, or abandoned executions are not automatically taken over: a new generation requires an explicit new identity. A crashed running reservation can therefore remain in progress until inspected; this is a deliberate duplicate-cost safety limit, not a background-job liveness guarantee.

Image normalization uses an allowlisted durable-asset / validated self-contained SVG / missing-state union. Every repeated image occurrence is normalized, even when unique asset IDs count only once toward budgets. Validated structured renderer specifications survive normalization so retries rebuild the same diagram safely. Legacy recovery checks predictable image limits before fetching, and deduplicates source fetches within an attempt.

## Priority 3: no silent image omission

A shared image preflight enumerates explicit image-bearing/required stimuli across PG, isian, and uraian, not ordinary text-only questions. Export flushes pending saves, freezes the active content/revision, resolves and decodes images with limits, and verifies that the active document did not change during the check. Failed/missing required images block the app print/PDF and DOCX actions with question-specific recovery information. Native browser print must retain visible failure warnings rather than hiding them.

DOCX embeds bytes obtained by preflight and does not fetch a second time then silently omit failed images. Loader input and its full descriptor fingerprint must come from the same immutable snapshot, including images waiting in the bounded load queue. Recheck the active source before accepting or reusing bytes; old-source bytes must never be cached under a newer source identity. Preserve existing document layout and question content.

## Priority 4: validation and recovery

Focused tests cover asset ownership/current package authorization, privacy withdrawal, explicit private copy independence, quotas/idempotence, malformed/oversized images, trusted host/no-redirect/no-credential ingestion, expired/unavailable URLs, CAS conflicts, moderation invalidation, all edit paths, stale responses, fresh-session reload, mixed SVG/raster, and blocked print/DOCX on missing stimuli. Use mocked network/providers and migration-backed SQLite; do not consume AI credits during verification.

Reconcile writer lanes before full tests, strict typecheck, secrets check, diff check, and an isolated build preserving running dev watcher assets. Browser checks must distinguish client fixtures from authenticated server persistence. No claim of online/production recovery without deployment and verified source bytes. Document migration prerequisites and manual recovery from original images or embedded DOCX/PDF when old URLs are already dead.

### Incremental browser evidence (not the final integration gate)

An isolated browser session on local Vite used real canvas-generated PNG/JPEG/WebP images and a self-contained SVG across PG, isian, and uraian. Actual browser decoding accepted all four; a three-byte invalid PNG and active SVG were rejected. Using the same prepared snapshot, the real browser DOCX library produced an 18,785-byte ZIP document containing `word/document.xml` and four embedded media entries. No AI requests, authenticated package writes, or production recovery were performed. This establishes browser decoder/packaging behavior for these fixtures, not authenticated cross-device persistence or arbitrary image conformance. The validation browser session was closed afterward.

## Final code verification (2026-10-17)

After all implementation lanes finished, the combined default suite passed 1,015 tests across 88 files. One opt-in D1 integration file/test was skipped in that default run; it was separately enabled and passed against a fresh, isolated Miniflare D1 database. That integration used real session authorization and Hono routes hosted in Node, verifying fresh-session image reads, foreign-user rejection, publication/withdrawal, independent private copies, saved edits, and concurrent revision conflicts. It is not a deployed Worker or production-site test.

Strict `tsc --noEmit --pretty false`, `check:secrets`, and `git diff --check` passed (Git emitted line-ending warnings only). An isolated production build passed with 667 modules and a 5,736,979-byte worker bundle; original generated CSS/vendor hashes and the running local dev server were preserved. No AI provider requests, production migrations, secret changes, commits, or deployments were performed. Preparation of local migrations 0041–0043 remains a separate backup-and-dry-run step; these code verification results do not assert that the existing local or online database has been upgraded.

## Local activation evidence (2026-10-17)

Following a successful backup-copy dry run, local-only activation completed in one `BEGIN IMMEDIATE` transaction. Exact 0041 and 0043 DDL were applied; all seven 0042 columns, its tables, indexes, and foreign-key relationships were verified equivalent before reconciling its ledger entry without replaying duplicate DDL. Fresh pre-change backup: `C:\Users\ANDRIS~1\AppData\Local\Temp\opencode\kkg-local-d1-pre-0041-43-20261017-080734.sqlite`.

Post-commit read-only checks by both the specialist and orchestrator reported integrity `ok`, zero foreign-key violations, and all three migration entries (44 total). Existing table counts were preserved, including six users, twelve sessions, and eight bank packages. New asset/request tables are empty: no historical expired image was silently regenerated or recovered. Local root and public settings returned HTTP 200; unauthenticated asset access returned 401. The existing Vite watcher was preserved. `getPlatformProxy` startup-guard verification had timed out earlier and was not repeated; schema and HTTP checks are the available activation evidence. Production was not migrated or deployed.

## Ownership

- Asset specialist: 0041, asset helper/route, index registration only, asset security tests.
- Package specialist: 0042, bank package revision/copy/access/moderation routes, shared atomic creation helper, schema startup guard, and package backend tests. Sole writer of the bank route and package helper.
- Generation specialist: backend kisi route, question-scoped image normalization helper, and generation/regeneration tests. Reuses the package specialist's atomic creation helper rather than duplicating its SQL. Does not edit the bank route, asset helper, or package helper.
- Generation-ledger specialist: 0043 and its bounded reservation/fencing helper and isolated tests. Route integration remains with the generation specialist; atomic package integration remains with the package specialist.
- Export specialist: DOCX helper, shared pure/injectable image preflight, adjacent declarations and focused tests. No kisi page changes.
- Designer: kisi page save/copy/conflict/recovery/export controls and client adapter/tests after API contract. No backend or DOCX writer overlap.
- Orchestrator: contracts, reconciliation, final validation; independent security review where it materially reduces risk.
