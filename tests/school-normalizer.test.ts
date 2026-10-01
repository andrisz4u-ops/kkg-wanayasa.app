import { describe, it, expect } from 'vitest';
import { canonicalSchoolKey, formatStandardSchoolName, findMatchingSchool } from '../src/lib/school-normalizer';

describe('School Normalizer & Canonical Resolver', () => {
  const existingSchools = [
    { id: 1, nama: 'SDN 2 Nangerang' },
    { id: 2, nama: 'SDN 1 Nangerang' },
    { id: 3, nama: 'SDN Nagrog' },
    { id: 4, nama: 'SDN Raharja' },
    { id: 5, nama: 'SDN 1 Cibuntu' },
    { id: 6, nama: 'SDN 2 Cibuntu' },
    { id: 7, nama: 'SDN Sumurugul' },
    { id: 8, nama: 'SDN Sakambang' },
    { id: 9, nama: 'SDIT Al-Qalam' }
  ];

  it('correctly maps variations of SDN 2 Nangerang to the canonical school', () => {
    const variations = [
      'SD Negeri 2 Nangerang',
      'sd negeri 2 nangerang',
      'SD Negri 2 Nangerang',
      'SDN 02 Nangerang',
      'SDN 2 Nangerang',
      'sdn 2 nangerang',
      'SD. Negeri 2 Nangerang',
      'SD N 2 Nangerang'
    ];

    for (const v of variations) {
      const match = findMatchingSchool(v, existingSchools);
      expect(match, `Failed to match variation: "${v}"`).not.toBeNull();
      expect(match?.id).toBe(1);
      expect(match?.nama).toBe('SDN 2 Nangerang');
    }
  });

  it('correctly matches other schools in the list', () => {
    expect(findMatchingSchool('SD Negeri 1 Nangerang', existingSchools)?.nama).toBe('SDN 1 Nangerang');
    expect(findMatchingSchool('SD Negri 1 Cibuntu', existingSchools)?.nama).toBe('SDN 1 Cibuntu');
    expect(findMatchingSchool('sdit al-qalam', existingSchools)?.nama).toBe('SDIT Al-Qalam');
  });

  it('returns null for truly new schools', () => {
    expect(findMatchingSchool('SDN 5 Sukatani', existingSchools)).toBeNull();
    expect(findMatchingSchool('SMPN 1 Bandung', existingSchools)).toBeNull();
  });

  it('properly formats standard new school names', () => {
    expect(formatStandardSchoolName('sd negeri 5 sukatani')).toBe('SDN 5 Sukatani');
    expect(formatStandardSchoolName('sdn 03 menteng')).toBe('SDN 3 Menteng');
    expect(formatStandardSchoolName('smp negeri 1 bandung')).toBe('SMPN 1 Bandung');
  });

  it('ensures distinct school numbers and names never falsely collide', () => {
    const match1 = findMatchingSchool('SD Negeri 1 Nangerang', existingSchools);
    const match2 = findMatchingSchool('SD Negeri 2 Nangerang', existingSchools);
    expect(match1?.id).toBe(2);
    expect(match2?.id).toBe(1);
    expect(match1?.id).not.toBe(match2?.id);

    const cibuntu1 = findMatchingSchool('SD Negeri 1 Cibuntu', existingSchools);
    const cibuntu2 = findMatchingSchool('SD Negeri 2 Cibuntu', existingSchools);
    expect(cibuntu1?.id).toBe(5);
    expect(cibuntu2?.id).toBe(6);
    expect(cibuntu1?.id).not.toBe(cibuntu2?.id);
  });

  it('correctly matches all 9 schools when written with SD Negeri prefix', () => {
    const pairs = [
      { input: 'SD Negeri 2 Nangerang', expected: 'SDN 2 Nangerang' },
      { input: 'SD Negeri 1 Nangerang', expected: 'SDN 1 Nangerang' },
      { input: 'SD Negeri Nagrog', expected: 'SDN Nagrog' },
      { input: 'SD Negeri Raharja', expected: 'SDN Raharja' },
      { input: 'SD Negeri 1 Cibuntu', expected: 'SDN 1 Cibuntu' },
      { input: 'SD Negeri 2 Cibuntu', expected: 'SDN 2 Cibuntu' },
      { input: 'SD Negeri Sumurugul', expected: 'SDN Sumurugul' },
      { input: 'SD Negeri Sakambang', expected: 'SDN Sakambang' },
      { input: 'SD IT Al Qalam', expected: 'SDIT Al-Qalam' }
    ];

    for (const p of pairs) {
      const match = findMatchingSchool(p.input, existingSchools);
      expect(match?.nama, `Input: ${p.input}`).toBe(p.expected);
    }
  });
});
