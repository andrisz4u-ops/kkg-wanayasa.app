import type { LessonDeck } from './lesson-model.js';
export interface LocalSlideDraft { version: 2; deck: LessonDeck; template: string; config: Record<string, unknown>; [field: string]: unknown }
export declare function readDraft(id?: string | number): LocalSlideDraft | null;
export declare function writeDraft(value: Omit<LocalSlideDraft, 'version'> | LocalSlideDraft, id?: string | number): boolean;
