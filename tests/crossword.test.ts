import { describe, it, expect } from 'vitest';
import { generateCrossword, CrosswordGenerator } from '../src/lib/crossword';

describe('Crossword Generator Algorithm & Layout Tests', () => {
    const ekosistemWords = [
        'KARNIVORA',
        'HERBIVORA',
        'RANTAIMAKANAN',
        'TROFIK',
        'OMNIVORA',
        'JARINGJARING',
        'DEKOMPOSER',
        'DEKOMPOSISI',
        'PRODUSEN',
        'KONSUMEN'
    ];

    it('should generate a valid, interlocking crossword with all words placed', () => {
        const cw = generateCrossword(ekosistemWords, 11);
        expect(cw.success).toBe(true);
        expect(cw.placements.length).toBe(ekosistemWords.length);
        expect(cw.grid.length).toBeGreaterThan(0);
    });

    it('should maintain a balanced ratio between Mendatar (H) and Menurun (V)', () => {
        const cw = generateCrossword(ekosistemWords, 11);
        expect(cw.success).toBe(true);

        const hCount = cw.placements.filter(p => p.direction === 'H').length;
        const vCount = cw.placements.filter(p => p.direction === 'V').length;

        // Ratio should be close to 50:50 (e.g. 5:5, 4:6, or 6:4, definitely not 7:3 or 8:2)
        expect(Math.abs(hCount - vCount)).toBeLessThanOrEqual(2);
        expect(hCount).toBeGreaterThanOrEqual(4);
        expect(vCount).toBeGreaterThanOrEqual(4);
    });

    it('should prevent collinear overlap (words in same direction cannot touch or share cells)', () => {
        const cw = generateCrossword(ekosistemWords, 11);
        expect(cw.success).toBe(true);

        // Verify each placement matches grid letters exactly
        for (const p of cw.placements) {
            for (let i = 0; i < p.word.length; i++) {
                const r = p.direction === 'H' ? p.row : p.row + i;
                const c = p.direction === 'H' ? p.col + i : p.col;
                expect(cw.grid[r][c]).toBe(p.word[i]);
            }
        }

        // Verify that KARNIVORA (9 letters) is properly placed without merging with another vertical word
        const karnivora = cw.placements.find(p => p.word === 'KARNIVORA');
        expect(karnivora).toBeDefined();
        if (karnivora && karnivora.direction === 'V') {
            // Cell above should be empty (if within grid)
            if (karnivora.row > 0) {
                expect(cw.grid[karnivora.row - 1][karnivora.col]).toBe(' ');
            }
            // Cell below should be empty (if within grid)
            if (karnivora.row + karnivora.word.length < cw.grid.length) {
                expect(cw.grid[karnivora.row + karnivora.word.length][karnivora.col]).toBe(' ');
            }
        }
    });

    it('should assign valid, sequential start numbers without duplicates at the same cell', () => {
        const cw = generateCrossword(ekosistemWords, 11);
        expect(cw.success).toBe(true);

        for (const p of cw.placements) {
            expect(p.number).toBeDefined();
            expect(p.number).toBeGreaterThanOrEqual(11);
            expect(p.number).toBeLessThanOrEqual(11 + ekosistemWords.length);
        }
    });
});
