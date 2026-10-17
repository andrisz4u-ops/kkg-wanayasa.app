export type CurriculumOrigin = 'd1' | 'static' | 'user-input' | 'mixed';
export type CurriculumComponent = {
  text: string;
  origin: Exclude<CurriculumOrigin, 'mixed'>;
};

export type CurriculumProvenance = {
  schema: 'curriculum-provenance/v1';
  subject: string;
  phase: string;
  source: CurriculumOrigin;
  status: 'recorded' | 'not-recorded';
  reviewed: false;
  digest: string;
  components: Record<string, { origin: Exclude<CurriculumOrigin, 'mixed'>; digest: string }>;
  regulationLabel?: string;
  locator?: string;
  recordedAt?: string;
};

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export async function sha256Canonical(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Creates a conflict-safe immutable snapshot and reports accurately if persistence was unavailable. */
export async function recordCurriculumSnapshot(input: {
  db?: any;
  subject: string;
  phase: string;
  components: Record<string, CurriculumComponent>;
  regulationLabel?: string | null;
  locator?: string | null;
}): Promise<CurriculumProvenance> {
  const origins = [...new Set(Object.values(input.components).map(component => component.origin))];
  const source: CurriculumOrigin = origins.length > 1 ? 'mixed' : origins[0] || 'user-input';
  const componentDigests: CurriculumProvenance['components'] = {};
  for (const [name, component] of Object.entries(input.components)) {
    componentDigests[name] = { origin: component.origin, digest: await sha256Canonical(component.text) };
  }
  const snapshotFacts = {
    subject: input.subject.trim(),
    phase: input.phase.trim(),
    source,
    regulationLabel: input.regulationLabel || null,
    locator: input.locator || null,
    components: Object.fromEntries(
      Object.entries(input.components).sort(([a], [b]) => a.localeCompare(b)).map(([name, component]) => [name, { text: component.text, origin: component.origin }])
    ),
  };
  // Digest identity includes every immutable fact persisted in the snapshot, not only its text.
  const canonicalContentJson = canonicalize(snapshotFacts);
  const digest = await sha256Canonical(snapshotFacts);
  let recordedAt: string | undefined;
  let status: CurriculumProvenance['status'] = 'not-recorded';
  try {
    if (!input.db) throw new Error('database unavailable');
    await input.db.prepare(`INSERT OR IGNORE INTO curriculum_source_snapshots
      (digest, mata_pelajaran, fase, source_origin, regulation_label, locator, canonical_content_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(digest, input.subject.trim(), input.phase.trim(), source, input.regulationLabel || null, input.locator || null, canonicalContentJson)
      .run();
    const row = await input.db.prepare(`SELECT mata_pelajaran, fase, source_origin, regulation_label, locator, canonical_content_json, recorded_at
      FROM curriculum_source_snapshots WHERE digest = ?`).bind(digest).first();
    const storedFactsMatch = row && row.mata_pelajaran === input.subject.trim() && row.fase === input.phase.trim()
      && row.source_origin === source && (row.regulation_label || null) === (input.regulationLabel || null)
      && (row.locator || null) === (input.locator || null) && row.canonical_content_json === canonicalContentJson;
    if (storedFactsMatch) { status = 'recorded'; recordedAt = row.recorded_at; }
  } catch (_) {
    // Missing migration/database is surfaced in metadata; never claim a snapshot was stored.
  }
  return {
    schema: 'curriculum-provenance/v1', subject: input.subject, phase: input.phase,
    source, status, reviewed: false, digest, components: componentDigests,
    ...(input.regulationLabel ? { regulationLabel: input.regulationLabel } : {}),
    ...(input.locator ? { locator: input.locator } : {}), ...(recordedAt ? { recordedAt } : {}),
  };
}

export function attachCurriculumProvenance<T extends Record<string, any>>(result: T, provenance: CurriculumProvenance): T {
  return { ...result, _provenance: { ...(result._provenance || {}), curriculum: provenance } };
}
