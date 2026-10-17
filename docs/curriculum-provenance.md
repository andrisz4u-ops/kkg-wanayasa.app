# Curriculum provenance response contract

CP analysis, RPP, and assessment generation attach server-generated metadata to the returned document at `_provenance.curriculum`:

```json
{
  "schema": "curriculum-provenance/v1",
  "subject": "IPAS",
  "phase": "Fase C",
  "source": "mixed",
  "status": "recorded",
  "reviewed": false,
  "digest": "<64 lowercase hexadecimal characters>",
  "components": {
    "cp": { "origin": "d1", "digest": "<sha256>" },
    "elements": { "origin": "static", "digest": "<sha256>" }
  }
}
```

`source` is `d1`, `static`, `user-input`, or `mixed`; component origins are recorded separately so mixed prompts are not misrepresented. `digest` is a deterministic SHA-256 identity of canonical subject, phase, component text and origins, aggregate source, regulation label, and locator. It identifies the full persisted provenance record; it does not attest to official status or correctness. A repeated digest is reported as `recorded` only when the immutable stored facts match the requested metadata. No reviewer or citation is inferred. `status: not-recorded` means the snapshot database was unavailable or the stored record did not match; the digest is an identity candidate, not proof of persisted version metadata. Snapshots are insert-only and conflict-safe by digest.

Assessment generation snapshots the exact CP string and pretty-serialized element JSON supplied to the provider prompt, with separate origins for each. CP analysis snapshots exact CP/pretty-serialized elements plus its static IPAS prompt guidance when used. Teacher-supplied CP is labeled as such; D1 labels are reported only as stored labels and remain unreviewed; static catalogue/guidance is marked unreviewed. No inferred regulation or verification claim is made. Streaming generation places the same metadata on its final `done` event's `data` object. Assessment auto-save stores provenance with the generated result JSON in the private bank row. New generator auto-saves explicitly persist `is_public: 0`, `moderation_status: "private"`, `legacy_compat: 0`, and `is_hidden: 0`; sharing is a separate action. Existing records are not enriched from current curriculum data, and no implicit cross-document source relationship is recorded.
