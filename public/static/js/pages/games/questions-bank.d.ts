export interface GameQuestion { q: string; a: string; opts: string[]; mapel: string }
export type GamePhase = 'fase-a' | 'fase-b' | 'fase-c';
export type GameTier = 'mudah' | 'sedang' | 'hebat';
export type TieredQuestionBank = Record<GamePhase, Record<GameTier, GameQuestion[][]>>;
export declare const TIERED_QUESTION_BANK: TieredQuestionBank;
export declare const QUESTION_BANK: Record<GamePhase, GameQuestion[]>;
export declare function getQuestionsByFilter(fase?: GamePhase | string, tingkat?: GameTier | 'all' | string, paket?: number | string, count?: number): GameQuestion[];
export declare function getRandomQuestions(fase?: GamePhase | string, count?: number): GameQuestion[];
export interface WordSearchTeam { words: string[]; grid: string[][]; solutions: Record<string, { r1: number; c1: number; r2: number; c2: number }> }
export interface WordSearchPackage { topic: string; gridSize: number; red: WordSearchTeam; blue: WordSearchTeam; words: string[]; grid: string[][]; solutions: WordSearchTeam['solutions'] }
export declare const WORD_SETS_BY_FASE: Record<GamePhase, WordSearchPackage[]>;
