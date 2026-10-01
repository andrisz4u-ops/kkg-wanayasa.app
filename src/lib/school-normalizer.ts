/**
 * School Normalizer & Canonical Matching Engine
 * Menghindari duplikasi nama sekolah (e.g. "SD Negeri 2 Nangerang" vs "SDN 2 Nangerang")
 */

export function canonicalSchoolKey(name: string): string {
  if (!name) return '';
  let s = name.toLowerCase().trim();

  // Normalize punctuation and extra spaces
  s = s.replace(/[\.\,\-\_\/\\]/g, ' ').replace(/\s+/g, ' ');

  // Standardize common prefixes to comparison tokens
  s = s.replace(/\bsd\s+negeri\b/g, 'sdn');
  s = s.replace(/\bsd\s+negri\b/g, 'sdn');
  s = s.replace(/\bsd\s+n\b/g, 'sdn');
  s = s.replace(/\bsdn\b/g, 'sdn');

  s = s.replace(/\bsmp\s+negeri\b/g, 'smpn');
  s = s.replace(/\bsmp\s+negri\b/g, 'smpn');
  s = s.replace(/\bsmp\s+n\b/g, 'smpn');
  s = s.replace(/\bsmpn\b/g, 'smpn');

  s = s.replace(/\bsma\s+negeri\b/g, 'sman');
  s = s.replace(/\bsma\s+negri\b/g, 'sman');
  s = s.replace(/\bsma\s+n\b/g, 'sman');
  s = s.replace(/\bsman\b/g, 'sman');

  s = s.replace(/\bsmk\s+negeri\b/g, 'smkn');
  s = s.replace(/\bsmk\s+negri\b/g, 'smkn');
  s = s.replace(/\bsmk\s+n\b/g, 'smkn');
  s = s.replace(/\bsmkn\b/g, 'smkn');

  s = s.replace(/\bsd\s+it\b/g, 'sdit');
  s = s.replace(/\bsmp\s+it\b/g, 'smpit');
  s = s.replace(/\bsma\s+it\b/g, 'smait');

  // Normalize leading zeros in school number: "sdn 02 nangerang" -> "sdn 2 nangerang"
  s = s.replace(/\b0+(\d+)\b/g, '$1');

  return s.trim();
}

/**
 * Clean and standardize school title formatting:
 * e.g. "sd negeri 2 nangerang" -> "SDN 2 Nangerang"
 * e.g. "SDN 02 nangerang" -> "SDN 2 Nangerang"
 */
export function formatStandardSchoolName(name: string): string {
  if (!name) return '';
  let s = name.trim();

  // Replace SD Negeri / SD Negri with SDN
  s = s.replace(/^sd\s+negeri\s+/i, 'SDN ');
  s = s.replace(/^sd\s+negri\s+/i, 'SDN ');
  s = s.replace(/^sd\s+n\s+/i, 'SDN ');
  s = s.replace(/^sdn\s+/i, 'SDN ');

  s = s.replace(/^smp\s+negeri\s+/i, 'SMPN ');
  s = s.replace(/^smp\s+negri\s+/i, 'SMPN ');
  s = s.replace(/^smp\s+n\s+/i, 'SMPN ');
  s = s.replace(/^smpn\s+/i, 'SMPN ');

  s = s.replace(/^sma\s+negeri\s+/i, 'SMAN ');
  s = s.replace(/^sma\s+negri\s+/i, 'SMAN ');
  s = s.replace(/^sma\s+n\s+/i, 'SMAN ');
  s = s.replace(/^sman\s+/i, 'SMAN ');

  s = s.replace(/^smk\s+negeri\s+/i, 'SMKN ');
  s = s.replace(/^smk\s+negri\s+/i, 'SMKN ');
  s = s.replace(/^smk\s+n\s+/i, 'SMKN ');
  s = s.replace(/^smkn\s+/i, 'SMKN ');

  s = s.replace(/^sdit\s+/i, 'SDIT ');
  s = s.replace(/^sd\s+it\s+/i, 'SDIT ');
  s = s.replace(/^smpit\s+/i, 'SMPIT ');
  s = s.replace(/^smp\s+it\s+/i, 'SMPIT ');
  s = s.replace(/^smait\s+/i, 'SMAIT ');
  s = s.replace(/^sma\s+it\s+/i, 'SMAIT ');

  // Normalize leading zeros in numbers after prefix, e.g., SDN 02 -> SDN 2
  s = s.replace(/^([A-Z]+)\s+0+(\d+)\b/i, '$1 $2');

  // Title-case words after the prefix
  const parts = s.split(/\s+/);
  if (parts.length > 1) {
    const prefix = parts[0].toUpperCase();
    const rest = parts.slice(1).map(w => {
      if (/^\d+$/.test(w)) return w; // number
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
    return `${prefix} ${rest}`;
  }

  return s;
}

/**
 * Finds matching canonical school from a list of existing schools
 */
export function findMatchingSchool<T extends { id: number; nama: string }>(
  inputName: string,
  existingSchools: T[]
): T | null {
  if (!inputName || !existingSchools || existingSchools.length === 0) return null;

  const trimmed = inputName.trim();
  // 1. Exact match (case insensitive)
  const exact = existingSchools.find(s => s.nama.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  // 2. Canonical key match
  const inputKey = canonicalSchoolKey(trimmed);
  const matched = existingSchools.find(s => canonicalSchoolKey(s.nama) === inputKey);
  return matched || null;
}
