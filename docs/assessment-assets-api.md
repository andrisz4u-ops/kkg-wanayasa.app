# Assessment image asset API

The asset lane stores validated raster bytes in D1. Apply `migrations/0041_assessment_image_assets.sql` before deploying code that uses it. It adds only the private asset table and owner index; it does not import or recover legacy provider images. Existing signed URLs that have expired cannot be reconstructed without the original image bytes (for example, from an original upload or embedded document).

## Authenticated upload

`POST /api/assessment-assets` accepts a raw request body (`image/png`, `image/jpeg`, or `image/webp`), not multipart or JSON. It requires the existing session and streams a hard 512 KiB limit before assembling bytes. `X-Asset-Id` may contain a UUIDv4 to make retries idempotent. Reusing that ID is successful only for the same owner, MIME, byte length, and SHA-256; other owners cannot read or claim it. Response data includes `id`, `assetId`, validated `mime`, `byteLength`, server-computed `sha256`, and same-origin `url`.

Each image must match its declared raster signature and pass bounded container-structure inspection: PNG chunks and CRCs, JPEG frame/scan plus terminal EOI, or WebP RIFF/chunk/frame data. The parsed image must contain at most 8 million pixels. This structural inspection is not a substitute for full decoder verification; clients must decode images during the export preflight before use. Quotas are 100 assets and 32 MiB per owner; conditional insertion enforces both atomically. A rejected upload preserves existing assets. Quota failures have controlled count/byte-specific reasons, and a stable asset ID reused for different bytes returns 409.

## Private preview

`GET /api/assessment-assets/:id` requires a valid session and exact ownership. Unknown and foreign IDs both return 404. Successful responses contain raw validated image bytes, the validated MIME, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-store`.

## Server helper contract

`persistAssessmentAsset(db, ownerId, bytes, mime, { assetId? })` validates and persists bytes and returns metadata. `readOwnedAssessmentAsset(db, ownerId, id)` returns metadata plus bytes or `null`. `ingestTrustedAssessmentImage(db, ownerId, sourceUrl)` accepts bounded inline raster data URIs or fetches only HTTPS URLs on the exact hosts `sewr2.vultrobjects.com` and `upload.wikimedia.org`; credentials, non-default ports, redirects, unsupported MIME/signatures, invalid dimensions, and oversized streams fail closed. Fetches time out after ten seconds and never forward caller/provider credentials. Failures are `TrustedImageIngestError` with a controlled `reason` union; do not surface raw source URLs or fetch errors. Call this only from trusted server-side generation or an authorized legacy recovery flow, never as a URL-proxy endpoint.

SVG is intentionally not accepted or rasterized by this storage helper. Keep trusted structured SVG rendering outside the BLOB lane; arbitrary active SVG and external references must not be silently stored as images.
