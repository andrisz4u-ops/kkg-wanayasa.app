# Assessment image lifecycle correction

## Scope and reproduced failure

The water-cycle item about seawater, rivers and lakes being heated by sunlight
produces a valid `siklus_air` SVG when no `visual_stimulus` is supplied by the LLM.
Before this correction, `resolveQuestionVisualStimulus` assigned `gambar` but did
not assign its detected/reconciled renderer specification to the question.

Observed local sequence before the fix:

1. Resolver: `gambar.type=svg`, nonempty SVG, no `visual_stimulus`.
2. Quality gate: SVG remains, still no renderer specification.
3. Durable normalization: SVG without validated specification is rejected with
   `imageUnavailableReason=untrusted_svg`.
4. Package/read normalization: the unavailable marker remains.

The same omission also retained stale AI parameters on questions whose displayed
SVG had been reconciled with the stem. Persistence could redraw a different
figure using the old parameters.

## Invariants

- A generated SVG and its exact renderer specification are assigned together.
- Detection uses the stem first. Distractor option names must not select a
  different highlighted process in the diagram.
- Persistence rebuilds from a bounded, validated specification; rendered bytes or
  a `trusted` flag do not establish provenance.
- The SVG import/sanitizer boundary remains fail-closed for scripts, external
  references, and unsupported active content. No strip-and-retry trust bypass.
- Durable raster references remain owned asset IDs and same-origin routes, not
  transient provider URLs.
- A required image failure must remain explicit. Removing a warning from the UI
  is not a repair, and rewriting away an essential figure reference is not proof
  that a question remains answerable.

## Correction and verification

The resolver writes the final `visualCfg` together with the SVG and clears stale
top-level unavailable state after successful generation. Automatic detection
checks the stem before using the extended option/answer context as fallback.

Regression coverage follows resolver -> audit -> durable normalization -> package
preparation -> reload, rather than testing only independent renderer/sanitizer
helpers. It includes the reported water-cycle question and a geometry item whose
LLM parameters disagree with the stem. All 200 catalog types are exercised with
sample and empty parameters through repeated normalization and reload.

A local Chromium fixture additionally decodes the resulting 400 canonical SVGs
through the browser-side DOCX sanitizer and draws them to canvas PNG. It uses no
authenticated account, production database or paid image-provider request.

The isolated Miniflare integration test saves and reads an auto-detected SVG
through the real D1/package route boundary.

## Boundaries

Previously saved unavailable markers may no longer contain the original renderer
configuration or bytes. These records cannot be silently reconstructed as if the
original image were known. No production records are rewritten by this change.
Provider, network, session and device failures remain possible; evidence applies
to the tested lifecycle paths, not a guarantee of universal image availability.
