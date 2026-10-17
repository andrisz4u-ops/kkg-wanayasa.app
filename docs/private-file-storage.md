# Private file storage deployment requirements

The generic upload route supports public uploads by default. Private uploads are
rejected unless the deployment sets `PRIVATE_STORAGE_NON_PUBLIC=true`. This is an
operator assertion required to opt in, **not runtime verification** that the
storage backend is actually private.

Before enabling that assertion, ensure private objects cannot be read through a
public R2 custom domain, public bucket access, Supabase public bucket URL, or any
other direct origin. Disable direct public-origin access for the backing bucket,
or store private uploads in a separate bucket whose origin is not public. The
route's authentication and `private, no-store` response headers protect only
requests that pass through the application; they cannot protect a direct public
object URL.

New generic uploads use the `managed/files/` key namespace. The application
requires a matching ownership row for every key in that namespace. If owner
deletion cascades away metadata but object cleanup fails, requests through the
application return not found rather than falling back to legacy public storage.
Legacy object keys outside that namespace retain their existing public-read
fallback behavior for compatibility.

Multipart uploads are streamed with a total request cap of 10 MiB plus 64 KiB
for framing and bounded form fields. The endpoint accepts exactly one `file`
part and an optional `visibility` field; other parts are rejected.
