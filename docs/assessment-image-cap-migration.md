# Assessment image capacity migration (0044)

Migration `0044_assessment_image_capacity.sql` raises the stored raster BLOB limit from 524,288 to 1,572,864 bytes. It preserves the 0041 asset columns, MIME set, owner cascade, owner/created-at index, the 0042 association columns/primary key/cascades/index, and every stored asset and association value. It does not modify packages, revisions, sharing, users, or generation receipts. Migrations 0041 and 0042 remain unchanged.

## Execution boundary

This file is a single atomic D1 migration, not a standalone SQL script. Apply it only through Wrangler's D1 migration runner, which executes a migration as one atomic D1 batch. The focused test uses isolated Miniflare D1 `batch()` transactions and injects a failing statement after each destructive operation to prove rollback. This proves Miniflare D1 batch behavior; the Wrangler CLI migration runner itself has not been invoked or independently validated by this work. Do not split the SQL into individual `wrangler d1 execute` calls, execute it statement-by-statement, or bypass the migration runner.

No production execution is authorized by this implementation. A future production change requires separate explicit approval, a verified complete backup and restore rehearsal, and a write-quiescence window.

## Required preflight and backup

The migration itself refuses unexpected explicit indexes, triggers, and views visible in `sqlite_schema`. D1 does not allow the migration SQL to inspect `PRAGMA foreign_key_list`; therefore the read-only preflight harness is a mandatory separate gate to inventory incoming foreign keys as well as all other dependencies. It is never run implicitly by the migration or tests.

In a separately approved production change window:

1. Quiesce writes to assessment packages/assets and verify they have stopped.
2. Export a complete D1 backup to protected storage outside the repository. Example (replace the output with an approved protected path):

   ```powershell
   npx wrangler d1 export kkg-wanayasa-db --remote --output "C:\approved-backup\kkg-wanayasa-before-0044.sql"
   ```

3. Verify the backup is complete and rehearse restoring it to a disposable isolated database before proceeding. Convert/import the SQL export into a disposable SQLite snapshot using the approved SQLite tooling; do not point the preflight harness at a live D1 database.
4. Run the explicit, read-only dependency preflight against that snapshot:

   ```powershell
   node scripts/preflight-assessment-image-cap.mjs --database "C:\approved-backup\kkg-wanayasa-preflight.sqlite"
   ```

   It must report `status: PASS`. It rejects any unexpected incoming foreign key to either rebuilt table—including SQLite case-insensitive and composite FK targets—unexpected target index/trigger/view, noncanonical expected schema/FK/index definitions, missing expected tables/indexes, or any FK violation. If it fails or cannot inventory the full snapshot, stop; do not migrate.
5. Reconfirm backup/restore readiness and write quiescence immediately before applying the migration.

The preflight harness opens its SQLite input read-only and enables `query_only`. It does not connect to D1, alter the snapshot, or execute the migration.

## Migration guarantees and recovery

Within the atomic migration batch, the script snapshots explicit asset and association values, creates the replacement asset table with a 1,572,864-byte CHECK, copies all seven asset fields, and compares both directions—including BLOB bytes and timestamps—before dropping anything. The association table is staged without FKs. Destruction is ordered child-before-parent; the replacement is renamed, then the original owner index and child schema/index are recreated and associations restored. Final two-way comparisons and FK-enforced DML/schema constraints must pass before the staging tables are removed. Any assertion, uniqueness latch, constraint, DDL, or copy failure must abort and roll back the batch.

The 1.5 MiB row CHECK is not a guarantee of D1 account/database storage headroom or application-level remaining owner/package quota. Verify the target database has adequate storage headroom and, after migration, verify the migration ledger marks 0044 applied, the asset cap and exact MIME/owner constraints are present, association counts and owner quota aggregates match the backup, and package rows are unchanged. Keep the backup until these checks pass.

**Downgrade warning:** older application readers and the 0041 512 KiB CHECK are not compatible with assets larger than 524,288 bytes. Do not blindly roll back the application, restore an old schema, or delete large/unattached assets to make downgrade succeed. If rollback is needed after larger assets exist, use a compatible forward repair or a rollback build that continues to read larger assets while disabling only new larger writes. Preserve unattached assets; they may be deliberate standalone uploads.

## Local proof performed

`tests/assessment-image-cap-migration.test.ts` applies the migration using isolated Miniflare D1 under the approved temporary directory. It verifies private/public packages, a shared asset, unattached assets, multiple owners, exact binary bytes, metadata/timestamps, package preservation, association and owner counts, the new exact 1.5 MiB boundary, MIME/unique/FK/cascade behavior, preflight rejection for unexpected index/trigger/view/FK dependencies, and atomic rollback after each destructive step. These tests are disposable local fixtures only; they do not validate production contents or authorize migration execution.
