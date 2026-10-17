# Private document drafts API

The server draft API is mounted at `/api/document-drafts`. It is additive and does not replace CP collaboration history. Every route requires an authenticated session; the owner is taken exclusively from that session. A `userId` supplied in a request body is ignored. Lists, reads, writes, and checkpoints are scoped to the current owner.

## Document identity and limits

- `module`: lowercase module key matching `[a-z][a-z0-9-]{0,31}` (for example, `presentation` or `rpp`).
- `documentId`: stable client-generated key, 1–128 characters matching `[A-Za-z0-9._:-]+`. Reuse it on create retries.
- `title`: trimmed string of 1–200 characters.
- `payload`: JSON object. Request JSON nesting is bounded to 32 levels.
- The complete request body is limited to 1 MiB. The server checks declared length and counts streamed bytes before parsing, so chunked requests are bounded too.
- At most 50 drafts per user and 20 explicit checkpoints per document. Reaching a limit returns 409; the server never deletes drafts or checkpoints to make room.

## Routes

### List drafts

`GET /api/document-drafts` lists the caller's drafts; optionally pass `?module=presentation` to filter by module.

```json
{
  "success": true,
  "data": [
    {
      "module": "presentation",
      "document_id": "lesson-2026-10-16",
      "title": "Fractions lesson",
      "revision": 3,
      "created_at": "2026-10-16 10:00:00",
      "server_updated_at": "2026-10-16 10:05:00"
    }
  ]
}
```

The list returns metadata only and does not include or load draft payloads. Use the detail route to retrieve a document's payload.

### Create or update a draft

`PUT /api/document-drafts/:module/:documentId`

Create with `baseRevision: 0`. The server assigns revision 1. Repeating the same create for the same owner/module/document ID and same title/payload returns the existing draft rather than creating another one. Reusing that identity with different initial content returns 409.

```json
{
  "title": "Fractions lesson",
  "payload": { "topic": "Fractions", "slides": [] },
  "baseRevision": 0
}
```

For autosave, send the revision last received from the server. A successful update increments it by one:

```json
{
  "title": "Fractions lesson",
  "payload": { "topic": "Fractions", "slides": [{ "title": "Parts of a whole" }] },
  "baseRevision": 1
}
```

Successful responses contain `data.module`, `data.document_id`, `data.title`, `data.payload`, `data.revision`, `data.created_at`, and `data.server_updated_at`. A stale base revision returns 409 without overwriting the current draft:

```json
{
  "success": false,
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Revisi draf sudah berubah; muat ulang sebelum menyimpan",
    "details": { "currentRevision": 2 }
  }
}
```

Concurrent creation of the same identity is idempotent; concurrent updates using the same base revision allow only one write to advance the revision.

### Read a draft

`GET /api/document-drafts/:module/:documentId` returns the caller-owned document in the same `data` shape as a successful save. A missing document or a document belonging to another user returns 404.

### Explicit checkpoints

Checkpoints are not created by autosave. To save a snapshot of the current server revision:

`POST /api/document-drafts/:module/:documentId/checkpoints`

```json
{ "baseRevision": 3 }
```

A successful first checkpoint returns 201 and contains the checkpoint's `module`, `document_id`, `revision`, `title`, `payload`, and `created_at`. Repeating the checkpoint for that same revision returns the existing checkpoint, including after a later autosave has advanced the document. A stale revision with no existing checkpoint returns 409; the 21st checkpoint also returns 409 with code `CHECKPOINT_LIMIT_REACHED`.

`GET /api/document-drafts/:module/:documentId/checkpoints` lists the caller-owned snapshots newest revision first. A missing or foreign-owned parent document returns 404.

### Other errors

- 401: no valid session.
- 400: invalid module/document ID, title, revision, JSON, payload shape, or payload depth.
- 404: unknown or not-owned document.
- 409: stale revision, draft quota (`DRAFT_LIMIT_REACHED`), or checkpoint quota.
- 413: complete request body exceeds 1 MiB (`PAYLOAD_TOO_LARGE`).

This API only provides backend persistence. Client-side offline retention, sync state, conflict presentation, and recovery UI are not part of this backend integration.
