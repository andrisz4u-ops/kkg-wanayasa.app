# Announcement notification outbox operations

## Prerequisite

Apply additive migration `0036_announcement_outbox.sql` to the target database
before deploying the route change. This work has not applied the migration to
any environment. The migration does not enqueue or replay older announcements.

## Delivery behavior

Creating an announcement inserts its outbox event in the same D1 batch. If that
batch fails, neither row is committed. After commit, the request attempts one
bounded chunk of up to 40 recipients. A delivery error does not undo the
announcement; the chunk transaction rolls back notifications, dedupe markers,
and cursor movement together. Previously committed chunks remain durable.

Only users present at creation, up to the recorded maximum user ID, are eligible;
the announcement author is excluded. Each invocation advances at most one
chunk. Delivery and event rows are deduplicated by announcement/recipient keys.

## Request-driven retry

An authenticated admin may retry one event with:

```http
POST /api/pengumuman/{announcementId}/notifications/retry
Cookie: session=...
```

This is the same admin-only policy used to create announcements. Anonymous users
and non-admin roles cannot drain the outbox. Repeating a retry is safe. The
response reports the number processed in that invocation and whether the event
is complete. No cron or background service is installed: if an event remains
pending after the best-effort creation attempt, an admin must issue another
retry request. Historical announcements have no outbox record and are not
eligible for replay through this endpoint.
