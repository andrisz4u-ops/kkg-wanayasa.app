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
}

export class CrosswordGenerator {
    size: number;
    grid: string[][];
    placements: Placement[];
    placedWordsSet: Set<string>;

    constructor(size: number = 40) {
        this.size = size;
        this.grid = Array(size).fill(null).map(() => Array(size).fill(' '));
        this.placements = [];
        this.placedWordsSet = new Set();
    }

    private clearGrid() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(' '));
        this.placements = [];
        this.placedWordsSet = new Set();
    }

    fitWord(word: string, row: number, col: number, direction: 'H' | 'V'): boolean {
        if (direction === 'H') {
            if (col + word.length > this.size) return false;
        } else {
            if (row + word.length > this.size) return false;
        }

        for (let i = 0; i < word.length; i++) {
            const r = direction === 'H' ? row : row + i;
            const c = direction === 'H' ? col + i : col;
            const charInGrid = this.grid[r][c];

            if (charInGrid !== ' ' && charInGrid !== word[i]) {
                return false;
            }

            // Neighbor Check (Strict visual isolation)
            if (charInGrid === ' ') {
                // Check preceding cell
                if (i === 0) {
                    const prevR = direction === 'H' ? row : row - 1;
                    const prevC = direction === 'H' ? col - 1 : col;
                    if (prevR >= 0 && prevR < this.size && prevC >= 0 && prevC < this.size && this.grid[prevR][prevC] !== ' ') {
                        return false;
                    }
                }
                // Check following cell
                if (i === word.length - 1) {
                    const nextR = direction === 'H' ? row : row + word.length;
                    const nextC = direction === 'H' ? col + word.length : col;
                    if (nextR >= 0 && nextR < this.size && nextC >= 0 && nextC < this.size && this.grid[nextR][nextC] !== ' ') {
                        return false;
                    }
                }

                // Check perpendicular neighbors
                if (direction === 'H') {
                    if (r - 1 >= 0 && r - 1 < this.size && this.grid[r - 1][c] !== ' ') return false;
                    if (r + 1 >= 0 && r + 1 < this.size && this.grid[r + 1][c] !== ' ') return false;
                } else {
                    if (c - 1 >= 0 && c - 1 < this.size && this.grid[r][c - 1] !== ' ') return false;
                    if (c + 1 >= 0 && c + 1 < this.size && this.grid[r][c + 1] !== ' ') return false;
                }
            }
        }

        return true;
    }

    placeWord(word: string, row: number, col: number, direction: 'H' | 'V', originalIndex: number) {
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'H' ? row : row + i;
            const c = direction === 'H' ? col + i : col;
            this.grid[r][c] = word[i];
        }

        this.placements.push({
            word,
            row,
            col,
            direction,
            originalIndex
        });
        this.placedWordsSet.add(word);
    }

    calculateRatio(): number {
        const hCount = this.placements.filter(p => p.direction === 'H').length;
        const total = Math.max(1, this.placements.length);
        return hCount / total;
    }

    trimGrid(): string[][] {
        if (this.placements.length === 0) return this.grid;

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

        minR = Math.max(0, minR - 1);
        maxR = Math.min(this.size, maxR + 2);
        minC = Math.max(0, minC - 1);
        maxC = Math.min(this.size, maxC + 2);

        const trimmed: string[][] = [];
        for (let r = minR; r < maxR; r++) {
            trimmed.push(this.grid[r].slice(minC, maxC));
        }

        for (const p of this.placements) {
            p.row -= minR;
            p.col -= minC;
        }

        return trimmed;
    }

    assignNumbers(startFrom: number = 1) {
        const sortedP = [...this.placements].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });

        let counter = startFrom;
        const coordToNum: Record<string, number> = {};

        for (const p of sortedP) {
            const coord = `${p.row},${p.col}`;
            if (!(coord in coordToNum)) {
                coordToNum[coord] = counter;
                counter++;
            }
            p.number = coordToNum[coord];
        }
    }

    attemptGenerate(wordsPayload: { word: string, originalIndex: number }[]): number {
        const cleanWords = [];
        for (const wp of wordsPayload) {
            if (typeof wp.word !== 'string') continue;
            const cleaned = wp.word.toUpperCase().replace(/[^A-Z]/g, '');
            if (cleaned.length > 1) {
                cleanWords.push({ word: cleaned, originalIndex: wp.originalIndex });
            }
        }

        const words = [...cleanWords].sort((a, b) => b.word.length - a.word.length);
        if (words.length === 0) return 0;

        this.clearGrid();

        const first = words[0];
        const dir: 'H' | 'V' = Math.random() > 0.5 ? 'H' : 'V';
        this.placeWord(first.word, Math.floor(this.size / 2), Math.floor((this.size - first.word.length) / 2), dir, first.originalIndex);

        const remaining = words.slice(1);
        let maxHangTries = 0;

        while (maxHangTries < 50 && remaining.length > 0) {
            let placed = false;
            // Shuffle
            for (let i = remaining.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
            }

            for (let wIdx = remaining.length - 1; wIdx >= 0; wIdx--) {
                const wp = remaining[wIdx];
                const word = wp.word;
                let bestFit: [number, number, 'H' | 'V'] | null = null;

                for (const p of this.placements) {
                    const pWord = p.word;
                    const pR = p.row;
                    const pC = p.col;
                    const pD = p.direction;

                    for (let i = 0; i < word.length; i++) {
                        const char = word[i];
                        for (let j = 0; j < pWord.length; j++) {
                            const existingChar = pWord[j];
                            if (char === existingChar) {
                                let newDir: 'H' | 'V', newR: number, newC: number;
                                if (pD === 'H') {
                                    newDir = 'V'; newR = pR - i; newC = pC + j;
                                } else {
                                    newDir = 'H'; newR = pR + j; newC = pC - i;
                                }

                                if (newR >= 0 && newR < this.size && newC >= 0 && newC < this.size) {
                                    if (this.fitWord(word, newR, newC, newDir)) {
                                        bestFit = [newR, newC, newDir];
                                        break;
                                    }
                                }
                            }
                        }
                        if (bestFit) break;
                    }
                    if (bestFit) break;
                }

                if (bestFit) {
                    this.placeWord(word, bestFit[0], bestFit[1], bestFit[2], wp.originalIndex);
                    remaining.splice(wIdx, 1);
                    placed = true;
                }
            }

            if (!placed) break;
            maxHangTries++;
        }

        return this.placements.length;
    }
}

export function generateCrossword(wordList: string[], startNumber: number = 1): CrosswordResult {
    const payload = wordList.map((w, idx) => ({ word: w, originalIndex: idx }));
    let bestResult: CrosswordResult | null = null;
    let bestScore = -1;

    for (let i = 0; i < 50; i++) { // Run 50 attempts
        const gen = new CrosswordGenerator(40);
        const count = gen.attemptGenerate(payload);
        if (count === 0) continue;

        const ratio = gen.calculateRatio();
        const score = (count * 100) - Math.abs(0.5 - ratio) * 20;

        if (score > bestScore) {
            bestScore = score;
            const grid = gen.trimGrid();
            gen.assignNumbers(startNumber);
            bestResult = {
                success: true,
                grid,
                placements: gen.placements,
                ratio
            };
        }
        if (count === payload.length && Math.abs(0.5 - ratio) <= 0.2) {
            break; // Perfect enough early stop
        }
    }

    if (bestResult) {
        return bestResult;
    }
    return { success: false, grid: [], placements: [] };
}
