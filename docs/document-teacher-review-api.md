# Private document teacher-review API

Teacher review is an explicit owner action on a persisted private draft revision. It records that the owner says they reviewed that version; it does not certify accuracy, curriculum alignment, or learning outcomes. Review actions are append-only. Administrators do not receive access to private draft documents.

All draft review routes require an authenticated session. The session user is the only owner/actor identity; request-supplied user IDs and hashes are neither accepted nor trusted. A missing or foreign-owned draft returns 404.

## Review a persisted version

`POST /api/document-drafts/:module/:documentId/review`

The client must first flush and receive the persisted draft revision from autosave. Submit:

```json
{
  "expectedRevision": 7,
  "status": "reviewed",
  "mutationId": "review-action-uuid"
}
```

- `expectedRevision`: positive integer matching the current persisted draft revision.
- `status`: `reviewed` or `rejected`. A later action is a new history row; it does not overwrite prior actions.
- `mutationId`: stable client-generated ID, 1–128 characters matching `[A-Za-z0-9._:-]+`. Reuse it unchanged when retrying the same action.
- Do not send owner/actor identity or a content hash. The server calculates the hash from the persisted title and payload.

The first successful action returns 201. An identical retry with the same owner, mutation ID, module/document, revision, and status returns 200 with the original action, even if the draft has since advanced. Reusing a mutation ID for a different action returns 409 (`REVIEW_MUTATION_ID_REUSED`). A revision that is no longer current returns 409 (`REVISION_CONFLICT`) and includes `details.currentRevision`. The insert is conditional on the exact persisted revision and content snapshot, so a concurrent autosave cannot receive an action for its newer version.

Successful response:

```json
{
  "success": true,
  "data": {
    "module": "presentation",
    "document_id": "lesson-2026-10-16",
    "revision": 7,
    "content_hash": "<64 lowercase hexadecimal SHA-256 characters>",
    "status": "reviewed",
    "mutation_id": "review-action-uuid",
    "created_at": "2026-10-16 10:05:00"
  }
}
```

Hash input is deterministic UTF-8 JSON: recursively sort keys in the parsed persisted payload, preserve array order, then compute SHA-256 over `JSON.stringify({payload: sortedPayload, title: persistedTitle})`. The hash identifies the content snapshot; it is not evidence that the content is correct or authoritative.

## Read current status and history

`GET /api/document-drafts/:module/:documentId/review` returns the current draft revision and its active status. With no action matching the current revision and server-calculated hash, status is `needs-review` and `action` is `null`:

```json
{
  "success": true,
  "data": {
    "module": "presentation",
    "document_id": "lesson-2026-10-16",
    "revision": 8,
    "content_hash": "<64 lowercase hexadecimal SHA-256 characters>",
    "status": "needs-review",
    "action": null
  }
}
```

When there is a matching action, `action` has the same shape as a successful POST `data` object. Draft detail (`GET /api/document-drafts/:module/:documentId`) likewise includes `review: {status, action}`; it continues to include the owner's payload. Draft list (`GET /api/document-drafts`) remains metadata-only and does not read or return payloads.

`GET /api/document-drafts/:module/:documentId/review/history` returns all owner-visible actions newest first as an array of action objects, including prior revisions and status changes. Editing a draft advances its revision and automatically makes the current status `needs-review`; it does not delete the old action history.

## Aggregate teacher-review quality counts

`GET /api/pedagogy-quality/teacher-reviews` is available only to a session whose role is exactly `admin` (not operator or super-admin). It returns counts over current private server drafts, with one active status per document: the latest action for the current revision, or `needs_review` if there is no action. A later autosave makes the new revision count as `needs_review`; old actions do not count as current.

Example:

```json
{
  "success": true,
  "data": {
    "scope": "current private server drafts",
    "denominator": 42,
    "needs_review": 20,
    "reviewed": 17,
    "rejected": 5,
    "modules": [
      { "module": "presentation", "denominator": 12, "needs_review": 6, "reviewed": 4, "rejected": 2 }
    ],
    "suppressed_module_cohorts": 2
  }
}
```

Only module breakdowns with at least five documents are returned. Smaller module cohorts are omitted and represented only in the `suppressed_module_cohorts` count. Global totals and denominator remain visible and are explicitly scoped to current private server drafts. This aggregate does not return payloads, document IDs, teacher names, or hashes, and makes no claims about content accuracy, generation quality, or learning outcomes. Unauthenticated callers receive 401; non-admin authenticated callers receive 403.
