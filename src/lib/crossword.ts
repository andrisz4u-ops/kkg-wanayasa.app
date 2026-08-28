export interface Placement {
    word: string;
    row: number;
    col: number;
    direction: 'H' | 'V';
    number?: number;
    originalIndex?: number;
}

export interface CrosswordResult {
    success: boolean;
    grid: string[][];
    placements: Placement[];
    unplaced?: string[];
    ratio?: number;
    hCount?: number;
    vCount?: number;
}

export class CrosswordGenerator {
    size: number;
    grid: string[][];
    hGrid: boolean[][]; // Tracks cells occupied by Horizontal words
    vGrid: boolean[][]; // Tracks cells occupied by Vertical words
    placements: Placement[];

    constructor(size: number = 40) {
        this.size = size;
        this.grid = Array(size).fill(null).map(() => Array(size).fill(' '));
        this.hGrid = Array(size).fill(null).map(() => Array(size).fill(false));
        this.vGrid = Array(size).fill(null).map(() => Array(size).fill(false));
        this.placements = [];
    }

    private clearGrid() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                this.grid[r][c] = ' ';
                this.hGrid[r][c] = false;
                this.vGrid[r][c] = false;
            }
        }
        this.placements = [];
    }

    /**
     * Checks if a word can legally be placed at (row, col) in given direction.
     * Enforces strict crossword rules:
     * 1. No collinear overlap or touching (two words in the same direction cannot touch or overlap).
     * 2. Only perpendicular crossings on matching letters.
     * 3. End-to-end isolation (1 blank cell before start and after end).
     * 4. Perpendicular isolation (blank cells alongside non-intersecting letters).
     */
    canPlaceWord(word: string, row: number, col: number, direction: 'H' | 'V'): boolean {
        const len = word.length;
        if (direction === 'H') {
            if (col < 1 || col + len >= this.size - 1 || row < 1 || row >= this.size - 1) return false;

            // Boundary isolation: cell before start and cell after end MUST be empty
            if (this.grid[row][col - 1] !== ' ' || this.grid[row][col + len] !== ' ') return false;

            let intersections = 0;

            for (let i = 0; i < len; i++) {
                const r = row;
                const c = col + i;
                const char = word[i];
                const existing = this.grid[r][c];

                // Rule: Cannot overlap with an existing Horizontal word cell
                if (this.hGrid[r][c]) return false;

                if (this.vGrid[r][c]) {
                    // Valid perpendicular intersection: letter must match exactly
                    if (existing !== char) return false;
                    intersections++;
                } else {
                    // Blank cell: must be empty and perpendicular neighbors must be empty
                    if (existing !== ' ') return false;
                    if (this.grid[r - 1][c] !== ' ' || this.grid[r + 1][c] !== ' ') return false;
                }
            }

            // Must have at least 1 intersection with an existing word (unless it's the very first word)
            if (this.placements.length > 0 && intersections === 0) return false;

            return true;
        } else {
            if (row < 1 || row + len >= this.size - 1 || col < 1 || col >= this.size - 1) return false;

            // Boundary isolation: cell before start and cell after end MUST be empty
            if (this.grid[row - 1][col] !== ' ' || this.grid[row + len][col] !== ' ') return false;

            let intersections = 0;

            for (let i = 0; i < len; i++) {
                const r = row + i;
                const c = col;
                const char = word[i];
                const existing = this.grid[r][c];

                // Rule: Cannot overlap with an existing Vertical word cell
                if (this.vGrid[r][c]) return false;

                if (this.hGrid[r][c]) {
                    // Valid perpendicular intersection: letter must match exactly
                    if (existing !== char) return false;
                    intersections++;
                } else {
                    // Blank cell: must be empty and perpendicular neighbors must be empty
                    if (existing !== ' ') return false;
                    if (this.grid[r][c - 1] !== ' ' || this.grid[r][c + 1] !== ' ') return false;
                }
            }

            // Must have at least 1 intersection with an existing word (unless it's the very first word)
            if (this.placements.length > 0 && intersections === 0) return false;

            return true;
        }
    }

    countIntersections(word: string, row: number, col: number, direction: 'H' | 'V'): number {
        let count = 0;
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'H' ? row : row + i;
            const c = direction === 'H' ? col + i : col;
            if (direction === 'H' && this.vGrid[r][c]) count++;
            if (direction === 'V' && this.hGrid[r][c]) count++;
        }
        return count;
    }

    placeWord(word: string, row: number, col: number, direction: 'H' | 'V', originalIndex: number) {
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'H' ? row : row + i;
            const c = direction === 'H' ? col + i : col;
            this.grid[r][c] = word[i];
            if (direction === 'H') {
                this.hGrid[r][c] = true;
            } else {
                this.vGrid[r][c] = true;
            }
        }

        this.placements.push({
            word,
            row,
            col,
            direction,
            originalIndex
        });
    }

    calculateRatio(): number {
        const hCount = this.placements.filter(p => p.direction === 'H').length;
        const total = Math.max(1, this.placements.length);
        return hCount / total;
    }

    trimGrid(): string[][] {
        if (this.placements.length === 0) return [];

        let minR = this.size, maxR = 0;
        let minC = this.size, maxC = 0;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== ' ') {
                    if (r < minR) minR = r;
                    if (r > maxR) maxR = r;
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }
        }

        const trimmed: string[][] = [];
        for (let r = minR; r <= maxR; r++) {
            trimmed.push(this.grid[r].slice(minC, maxC + 1));
        }

        for (const p of this.placements) {
            p.row -= minR;
            p.col -= minC;
        }

        return trimmed;
    }

    assignNumbers(startFrom: number = 1) {
        // Standard crossword numbering:
        // Sort placements by row (top-to-bottom), then col (left-to-right)
        const sorted = [...this.placements].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });

        let counter = startFrom;
        const cellNumberMap = new Map<string, number>();

        for (const p of sorted) {
            const key = `${p.row},${p.col}`;
            if (!cellNumberMap.has(key)) {
                cellNumberMap.set(key, counter++);
            }
            p.number = cellNumberMap.get(key);
        }
    }

    attemptGenerate(wordsPayload: { word: string, originalIndex: number }[], initialDirection?: 'H' | 'V'): number {
        const cleanWords = [];
        for (const wp of wordsPayload) {
            if (typeof wp.word !== 'string') continue;
            const cleaned = wp.word.toUpperCase().replace(/[^A-Z]/g, '');
            if (cleaned.length > 1) {
                cleanWords.push({ word: cleaned, originalIndex: wp.originalIndex });
            }
        }

        if (cleanWords.length === 0) return 0;

        this.clearGrid();

        // Sort by length descending, with minor random jitter for variety
        const words = [...cleanWords].sort((a, b) => (b.word.length - a.word.length) + (Math.random() * 0.4 - 0.2));

        // Place the first word in center
        const first = words[0];
        const dir: 'H' | 'V' = initialDirection || (Math.random() > 0.5 ? 'H' : 'V');
        const startR = Math.floor(this.size / 2) - (dir === 'V' ? Math.floor(first.word.length / 2) : 0);
        const startC = Math.floor(this.size / 2) - (dir === 'H' ? Math.floor(first.word.length / 2) : 0);

        this.placeWord(first.word, startR, startC, dir, first.originalIndex);

        const remaining = words.slice(1);

        while (remaining.length > 0) {
            type Candidate = {
                wordIdx: number;
                word: string;
                originalIndex: number;
                row: number;
                col: number;
                dir: 'H' | 'V';
                intersections: number;
                score: number;
            };

            const candidates: Candidate[] = [];
            const currentH = this.placements.filter(p => p.direction === 'H').length;
            const currentV = this.placements.filter(p => p.direction === 'V').length;

            for (let wIdx = 0; wIdx < remaining.length; wIdx++) {
                const wp = remaining[wIdx];
                const word = wp.word;

                for (const p of this.placements) {
                    const pWord = p.word;
                    const pR = p.row;
                    const pC = p.col;
                    const pD = p.direction;

                    for (let i = 0; i < word.length; i++) {
                        const char = word[i];
                        for (let j = 0; j < pWord.length; j++) {
                            if (char === pWord[j]) {
                                let newDir: 'H' | 'V', newR: number, newC: number;
                                if (pD === 'H') {
                                    newDir = 'V'; newR = pR - i; newC = pC + j;
                                } else {
                                    newDir = 'H'; newR = pR + j; newC = pC - i;
                                }

                                if (this.canPlaceWord(word, newR, newC, newDir)) {
                                    const intersections = this.countIntersections(word, newR, newC, newDir);

                                    // Balance bonus: heavily reward placing in the direction with fewer words
                                    let balanceBonus = 0;
                                    if (newDir === 'H' && currentH < currentV) balanceBonus = 25;
                                    else if (newDir === 'V' && currentV < currentH) balanceBonus = 25;
                                    else if (newDir === 'H' && currentH > currentV) balanceBonus = -15;
                                    else if (newDir === 'V' && currentV > currentH) balanceBonus = -15;

                                    // Compactness penalty
                                    const distFromCenter = Math.abs(newR - 20) + Math.abs(newC - 20);

                                    const score = (intersections * 30) + balanceBonus - (distFromCenter * 0.5) + (Math.random() * 5);

                                    candidates.push({
                                        wordIdx: wIdx,
                                        word,
                                        originalIndex: wp.originalIndex,
                                        row: newR,
                                        col: newC,
                                        dir: newDir,
                                        intersections,
                                        score
                                    });
                                }
                            }
                        }
                    }
                }
            }

            if (candidates.length === 0) {
                // Cannot place any more remaining words
                break;
            }

            // Pick the candidate with the highest score
            candidates.sort((a, b) => b.score - a.score);
            const best = candidates[0];

            this.placeWord(best.word, best.row, best.col, best.dir, best.originalIndex);
            remaining.splice(best.wordIdx, 1);
        }

        return this.placements.length;
    }
}

export function generateCrossword(wordList: string[], startNumber: number = 1): CrosswordResult {
    const payload = wordList.map((w, idx) => ({ word: w, originalIndex: idx }));
    let bestResult: CrosswordResult | null = null;
    let bestScore = -Infinity;

    // Run 100 random attempts to find the most balanced & interlocked crossword
    for (let i = 0; i < 100; i++) {
        const gen = new CrosswordGenerator(45);
        const initialDir: 'H' | 'V' = i % 2 === 0 ? 'H' : 'V';
        const placedCount = gen.attemptGenerate(payload, initialDir);
        if (placedCount === 0) continue;

        const hCount = gen.placements.filter(p => p.direction === 'H').length;
        const vCount = gen.placements.filter(p => p.direction === 'V').length;
        const ratio = hCount / Math.max(1, placedCount);

        // Quality score:
        // 1. Placed words is highest priority (+10,000 per word)
        // 2. Ratio balance (+2,000 for perfect 50:50, heavily penalized for imbalance)
        // 3. Multi-intersections (+100 per crossing)
        const balancePenalty = Math.abs(hCount - vCount) * 400;
        let totalIntersections = 0;
        for (const p of gen.placements) {
            totalIntersections += gen.countIntersections(p.word, p.row, p.col, p.direction);
        }

        const score = (placedCount * 10000) + (totalIntersections * 50) - balancePenalty;

        if (score > bestScore) {
            bestScore = score;
            const grid = gen.trimGrid();
            gen.assignNumbers(startNumber);
            bestResult = {
                success: true,
                grid,
                placements: gen.placements,
                ratio,
                hCount,
                vCount
            };

            // Early exit if all words are placed and balanced (e.g. 5:5 or 6:4)
            if (placedCount === payload.length && Math.abs(hCount - vCount) <= 1) {
                break;
            }
        }
    }

    if (bestResult) {
        return bestResult;
    }
    return { success: false, grid: [], placements: [] };
}
