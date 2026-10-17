export interface PinisiQuestion { q: string; a: string; opts: string[]; exp: string }
export type PinisiQuestionBank = Record<'fase-a' | 'fase-b' | 'fase-c', Record<'mudah' | 'sedang' | 'hebat', PinisiQuestion[][]>>;
export declare const PINISI_QUESTION_BANK: PinisiQuestionBank;
