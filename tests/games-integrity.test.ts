import { describe, it, expect } from 'vitest';
import { WORD_SETS_BY_FASE, TIERED_QUESTION_BANK } from '../public/static/js/pages/games/questions-bank.js';
import { PINISI_QUESTION_BANK } from '../public/static/js/pages/games/pinisi-bank.js';
import { LADDERS, SNAKES, CHALLENGE_TILES } from '../public/static/js/pages/games/snake-ladder.js';

describe('Game Hub Data Integrity Tests', () => {
  it('should have valid word search sets with matching solutions', () => {
    let wsErrors = 0;
    for (const [fase, pkgs] of Object.entries(WORD_SETS_BY_FASE)) {
      pkgs.forEach((pkg, idx) => {
        pkg.words.forEach(w => {
          if (!pkg.solutions[w]) {
            wsErrors++;
          }
        });
        for (const solKey of Object.keys(pkg.solutions)) {
          if (!pkg.words.includes(solKey)) {
            wsErrors++;
          }
        }
      });
    }
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

    // 3. Challenge tiles must not conflict with ladder starts or snake heads
    const ladderStarts = Object.keys(LADDERS).map(Number);
    const snakeHeads = Object.keys(SNAKES).map(Number);

    CHALLENGE_TILES.forEach(tile => {
      expect(tile).toBeGreaterThan(1);
      expect(tile).toBeLessThan(100);
      expect(ladderStarts).not.toContain(tile);
      expect(snakeHeads).not.toContain(tile);
    });
  });
});
