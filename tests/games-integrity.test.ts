import { describe, it, expect } from 'vitest';
import { WORD_SETS_BY_FASE, TIERED_QUESTION_BANK } from '../public/static/js/pages/games/questions-bank.js';
import { PINISI_QUESTION_BANK } from '../public/static/js/pages/games/pinisi-bank.js';
import { LADDERS, SNAKES, CHALLENGE_TILES } from '../public/static/js/pages/games/snake-ladder.js';

describe('Game Hub Data Integrity Tests', () => {
  it('should have valid word search sets with matching solutions, team separation, and both horizontal and vertical patterns', () => {
    let wsErrors = 0;
    const fases = ['fase-a', 'fase-b', 'fase-c'];

    fases.forEach(fase => {
      const pkgs = WORD_SETS_BY_FASE[fase];
      expect(pkgs).toBeDefined();
      expect(pkgs.length).toBe(5);

      pkgs.forEach((pkg, pIdx) => {
        expect(pkg.red).toBeDefined();
        expect(pkg.blue).toBeDefined();

        const expectedSize = fase === 'fase-a' ? 7 : 8;
        expect(pkg.gridSize).toBe(expectedSize);

        // Verify Red and Blue have ZERO overlapping words
        const redWords = new Set(pkg.red.words);
        const blueWords = new Set(pkg.blue.words);
        for (const w of redWords) {
          if (blueWords.has(w)) {
            wsErrors++;
          }
        }

        // Verify each team's words and solutions
        ['red', 'blue'].forEach(team => {
          const teamData = pkg[team];
          expect(teamData.grid.length).toBe(expectedSize);
          teamData.grid.forEach(row => expect(row.length).toBe(expectedSize));

          let hasHorizontal = false;
          let hasVertical = false;

          teamData.words.forEach(w => {
            const sol = teamData.solutions[w];
            if (!sol) {
              wsErrors++;
              return;
            }

            if (sol.r1 === sol.r2) hasHorizontal = true;
            if (sol.c1 === sol.c2) hasVertical = true;

            // Verify characters in grid match word
            let extracted = '';
            if (sol.r1 === sol.r2) {
              const r = sol.r1;
              const startC = Math.min(sol.c1, sol.c2);
              const endC = Math.max(sol.c1, sol.c2);
              for (let c = startC; c <= endC; c++) {
                extracted += teamData.grid[r][c];
              }
            } else if (sol.c1 === sol.c2) {
              const c = sol.c1;
              const startR = Math.min(sol.r1, sol.r2);
              const endR = Math.max(sol.r1, sol.r2);
              for (let r = startR; r <= endR; r++) {
                extracted += teamData.grid[r][c];
              }
            }
            if (extracted !== w) {
              wsErrors++;
            }
          });

          // Must have both horizontal and vertical variations
          expect(hasHorizontal).toBe(true);
          expect(hasVertical).toBe(true);
        });

        // Verify fallback compatibility
        expect(pkg.words).toEqual(pkg.red.words);
        expect(pkg.grid).toEqual(pkg.red.grid);
        expect(pkg.solutions).toEqual(pkg.red.solutions);
      });
    });

    expect(wsErrors).toBe(0);
  });

  it('should have valid answers that exist within options in TIERED_QUESTION_BANK', () => {
    let qCount = 0;
    let qErrors = 0;
    for (const [fase, levels] of Object.entries(TIERED_QUESTION_BANK)) {
      for (const [level, pkgs] of Object.entries(levels)) {
        pkgs.forEach((pkg, pIdx) => {
          pkg.forEach((q, qIdx) => {
            qCount++;
            if (!q.opts.includes(q.a)) {
              qErrors++;
            }
          });
        });
      }
    }
    expect(qCount).toBe(270);
    expect(qErrors).toBe(0);
  });

  it('should have valid answers that match options in PINISI_QUESTION_BANK', () => {
    let pCount = 0;
    let pErrors = 0;
    for (const [fase, levels] of Object.entries(PINISI_QUESTION_BANK)) {
      for (const [level, pkgs] of Object.entries(levels)) {
        pkgs.forEach((pkg, pIdx) => {
          pkg.forEach((q, qIdx) => {
            pCount++;
            const match = q.opts.some(opt => opt.trim().toLowerCase() === q.a.trim().toLowerCase());
            if (!match) pErrors++;
            if (!q.q.includes('_____')) pErrors++;
          });
        });
      }
    }
    expect(pCount).toBe(270);
    expect(pErrors).toBe(0);
  });

  it('should have valid Snake and Ladder board configurations without tile conflicts', () => {
    // 1. Ladders must always ascend (from < to) and stay within 1-100
    for (const [fromStr, to] of Object.entries(LADDERS)) {
      const from = parseInt(fromStr, 10);
      expect(from).toBeGreaterThanOrEqual(1);
      expect(to).toBeLessThanOrEqual(100);
      expect(to).toBeGreaterThan(from);
    }

    // 2. Snakes must always descend (head > tail) and stay within 1-100
    for (const [fromStr, to] of Object.entries(SNAKES)) {
      const from = parseInt(fromStr, 10);
      expect(from).toBeLessThanOrEqual(100);
      expect(to).toBeGreaterThanOrEqual(1);
      expect(from).toBeGreaterThan(to);
    }

    // 3. Challenge tiles must have 16 tiles, well-spaced, not adjacent, and not conflict with snakes/ladders
    const ladderStarts = Object.keys(LADDERS).map(Number);
    const snakeHeads = Object.keys(SNAKES).map(Number);

    expect(CHALLENGE_TILES.length).toBe(16);

    // Verify sorted and non-adjacent (diff >= 3)
    for (let i = 0; i < CHALLENGE_TILES.length - 1; i++) {
      const current = CHALLENGE_TILES[i];
      const next = CHALLENGE_TILES[i + 1];
      expect(next - current).toBeGreaterThanOrEqual(3);
    }

    CHALLENGE_TILES.forEach(tile => {
      expect(tile).toBeGreaterThan(1);
      expect(tile).toBeLessThan(100);
      expect(ladderStarts).not.toContain(tile);
      expect(snakeHeads).not.toContain(tile);

      // +1 bonus step should not land directly on a snake head
      expect(snakeHeads).not.toContain(tile + 1);
    });
  });
});
