import { describe, it, expect, vi } from 'vitest';
import {
  getFaseFromKelas,
  matchSubjectKey,
  getOfficialCP,
  getOfficialCPElements,
  getDynamicCP,
  getDynamicCPElements,
  seedDefaultCPToDatabase,
  cpData,
  cpElementsData
} from '../src/lib/cp-data';

describe('Kelola CP (Capaian Pembelajaran) Admin & Resolver Tests', () => {
  describe('getFaseFromKelas', () => {
    it('should correctly identify Fase A for grade 1 and 2', () => {
      expect(getFaseFromKelas('Kelas 1')).toBe('Fase A');
      expect(getFaseFromKelas('1')).toBe('Fase A');
      expect(getFaseFromKelas('Kelas 2 SD')).toBe('Fase A');
      expect(getFaseFromKelas('Fase A')).toBe('Fase A');
    });

    it('should correctly identify Fase B for grade 3 and 4', () => {
      expect(getFaseFromKelas('Kelas 3')).toBe('Fase B');
      expect(getFaseFromKelas('4')).toBe('Fase B');
      expect(getFaseFromKelas('Kelas 4 SD')).toBe('Fase B');
      expect(getFaseFromKelas('Fase B')).toBe('Fase B');
    });

    it('should correctly identify Fase C for grade 5 and 6', () => {
      expect(getFaseFromKelas('Kelas 5')).toBe('Fase C');
      expect(getFaseFromKelas('6')).toBe('Fase C');
      expect(getFaseFromKelas('Kelas 6 SD')).toBe('Fase C');
      expect(getFaseFromKelas('Fase C')).toBe('Fase C');
    });

    it('should return null for invalid grade values', () => {
      expect(getFaseFromKelas('')).toBeNull();
      expect(getFaseFromKelas('SMP Kelas 7')).toBeNull();
    });
  });

  describe('matchSubjectKey', () => {
    const keys = Object.keys(cpData);

    it('should match exact and tolerant subject names', () => {
      expect(matchSubjectKey('Bahasa Indonesia', keys)).toBe('Bahasa Indonesia');
      expect(matchSubjectKey('matematika', keys)).toBe('Matematika');
      expect(matchSubjectKey('IPAS', keys)).toBe('Ilmu Pengetahuan Alam dan Sosial (IPAS)');
      expect(matchSubjectKey('Pendidikan Pancasila', keys)).toBe('Pendidikan Pancasila');
      expect(matchSubjectKey('PJOK', keys)).toBe('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
      expect(matchSubjectKey('B.Sunda', keys)).toBe('B.Sunda');
      expect(matchSubjectKey('Bahasa Sunda', keys)).toBe('B.Sunda');
      expect(matchSubjectKey('Tatanen di Bale Atikan', keys)).toBe('Tatanen di Bale Atikan');
      expect(matchSubjectKey('TdBA', keys)).toBe('Tatanen di Bale Atikan');
      expect(matchSubjectKey('AKPK', keys)).toBe('AKPK');
    });

    it('should return null if no matching key found', () => {
      expect(matchSubjectKey('Astronomi', keys)).toBeNull();
      expect(matchSubjectKey('', keys)).toBeNull();
    });
  });

  describe('Static CP Fallback Resolvers', () => {
    it('should retrieve official CP for all phases of standard subjects', () => {
      const cpA = getOfficialCP('Bahasa Indonesia', 'Kelas 1');
      const cpB = getOfficialCP('Bahasa Indonesia', 'Kelas 4');
      const cpC = getOfficialCP('Bahasa Indonesia', 'Kelas 5');

      expect(cpA).toBeDefined();
      expect(cpA).toContain('Menyimak');
      expect(cpB).toBeDefined();
      expect(cpB).toContain('Membaca');
      expect(cpC).toBeDefined();
      expect(cpC).toContain('Mempresentasikan');
    });

    it('should retrieve official CP elements for Mulok (B. Sunda, TdBA, AKPK)', () => {
      const sundaElements = getOfficialCPElements('B.Sunda', 'Kelas 5');
      expect(sundaElements).toBeDefined();
      expect(sundaElements).toHaveProperty('Ngaregepkeun');
      expect(sundaElements).toHaveProperty('Maca jeung Miarsa');

      const tdbaElements = getOfficialCPElements('Tatanen di Bale Atikan', 'Kelas 5');
      expect(tdbaElements).toBeDefined();
      expect(tdbaElements).toHaveProperty('Niti Surti');

      const akpkElements = getOfficialCPElements('AKPK', 'Kelas 5');
      expect(akpkElements).toBeDefined();
      expect(akpkElements).toHaveProperty('Ajeg Nusantara');
    });
  });

  describe('Dynamic CP Resolvers (Database-First with Fallback)', () => {
    it('should prioritize customized CP from database when row exists', async () => {
      const mockCustomCP = 'Narasi CP Kustom Hasil Edit Admin 2026';
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({
              results: [
                {
                  mata_pelajaran: 'Bahasa Indonesia',
                  fase: 'Fase C',
                  teks_cp: mockCustomCP
                }
              ]
            })
          })
        })
      };

      const result = await getDynamicCP(mockDb, 'Bahasa Indonesia', 'Kelas 5');
      expect(result).toBe(mockCustomCP);
    });

    it('should prioritize customized elements from database when row exists', async () => {
      const mockCustomElements = {
        'Elemen Baru 1': 'Deskripsi elemen baru buatan admin'
      };
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({
              results: [
                {
                  mata_pelajaran: 'Matematika',
                  fase: 'Fase B',
                  elemen_json: JSON.stringify(mockCustomElements)
                }
              ]
            })
          })
        })
      };

      const result = await getDynamicCPElements(mockDb, 'Matematika', 'Kelas 3');
      expect(result).toEqual(mockCustomElements);
    });

    it('should gracefully fallback to static CP if database returns no results', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({
              results: []
            })
          })
        })
      };

      const result = await getDynamicCP(mockDb, 'Matematika', 'Kelas 5');
      const staticExpected = getOfficialCP('Matematika', 'Kelas 5');
      expect(result).toBe(staticExpected);
    });

    it('should gracefully fallback to static CP if database throws an exception', async () => {
      const mockDb = {
        prepare: vi.fn().mockImplementation(() => {
          throw new Error('D1 Network Timeout');
        })
      };

      const result = await getDynamicCP(mockDb, 'Pendidikan Pancasila', 'Kelas 2');
      const staticExpected = getOfficialCP('Pendidikan Pancasila', 'Kelas 2');
      expect(result).toBe(staticExpected);
    });
  });

  describe('seedDefaultCPToDatabase', () => {
    it('should skip seeding if table already has rows', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ count: 36 })
        })
      };

      const seededCount = await seedDefaultCPToDatabase(mockDb);
      expect(seededCount).toBe(36);
    });

    it('should insert records if table is empty', async () => {
      let insertCalls = 0;
      const mockDb = {
        prepare: vi.fn().mockImplementation((sql: string) => {
          if (sql.includes('SELECT COUNT(*)')) {
            return {
              first: vi.fn().mockResolvedValue({ count: 0 })
            };
          }
          return {
            bind: vi.fn().mockReturnValue({
              run: vi.fn().mockImplementation(() => {
                insertCalls++;
                return Promise.resolve({ success: true });
              })
            })
          };
        })
      };

      const seededCount = await seedDefaultCPToDatabase(mockDb);
      expect(seededCount).toBeGreaterThan(0);
      expect(insertCalls).toBe(seededCount);
    });
  });
});
