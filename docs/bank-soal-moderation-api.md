# Bank soal moderation API (frontend contract)

All endpoints below require an authenticated session. Existing list/detail/save/delete fields remain available; moderation fields are additive.

## Owner sharing controls

New records are private and have `is_public: false`, `moderation_status: "private"`. Saving ignores any `is_public` submitted in the create payload; it is never treated as opt-in.

`POST /api/banksoal/:id/share` with `{ "share": true }` explicitly submits the owner's item. Response: `{ is_public: true, moderation_status: "pending" }`. The item remains unavailable to other users until approved. `{ "share": false }` withdraws it and returns it to private status. Only the owner can change this setting.

The owner's list/detail response includes `is_public`, `moderation_status`, and `is_hidden`; use these to show Private, Pending moderation, or Approved status. `is_public` is sharing intent, not a guarantee of visibility.

## Admin moderation

`GET /api/banksoal/moderation/queue?page=1&limit=20` is admin-only and returns only explicitly opted-in, non-legacy pending submissions, including question content for review. An admin role is required; operator access is not added.

`POST /api/banksoal/moderation/:id/approve` approves only an explicitly opted-in item. Approval does not set `is_public`; approving private data is rejected. `POST /api/banksoal/moderation/:id/hide` hides an opted-in item from community access. Both actions record server-derived actor ID/time and an audit event. Owners retain access to their own items. A hidden item can be resubmitted by its owner, which returns it to pending.

Community list/detail/stats/use/review share the same visibility rule: `is_public = true`, not hidden, and either approved or legacy-compatible. A legacy marker never exposes a row whose `is_public` value is false. Foreign private/hidden IDs are returned as not found for detail/use/review. Owners can access their own private items; admins do not receive broad private-read access. Self-review remains prohibited.

## Generator auto-save writer contract

Import `bankSoalCreationVisibility()` from `src/lib/bank-soal-policy.ts` and persist its returned `is_public`, `moderation_status`, `legacy_compat`, and `is_hidden` values with every new row. It returns `0`, `private`, `0`, `0`; do not default new rows public or set legacy compatibility. This helper is the intended contract for the separate generator writer.
