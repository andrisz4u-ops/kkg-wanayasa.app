# QR attendance operations

## Required runtime secret

Configure `QR_SIGNING_SECRET` as a secret binding in every Worker environment that serves attendance QR endpoints. Use an independently generated, high-entropy value (at least 32 random bytes); do not put it in source control or expose it to clients. Local development must configure the same binding in an untracked `.dev.vars` file before using QR generation or verification. Keep that file out of version control and use a separate value from production. A missing/blank value disables generation and makes verification fail closed; there is deliberately no built-in fallback.

## Rotation and reissue

Changing `QR_SIGNING_SECRET` invalidates every QR token signed with the previous value. Before rotating, coordinate the change with operators; after rotation, generate and distribute replacement QR codes for any active activities. No compatibility window or legacy-key fallback is supported. Rotation does not alter database records, certificates, sign-off data, or production secrets automatically.

## Attendance lock

Attendance writes are guarded in the mutation SQL against `kegiatan.is_locked`, in addition to an early user-facing check. Keep the existing certificate sign-off flow; signing locks the attendance list, and later hadir/izin/sakit changes or QR check-ins are rejected.
