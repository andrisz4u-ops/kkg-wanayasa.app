export type SlideLayout = 'title' | 'content' | 'twoColumn' | 'imageText' | 'timeline' | 'stats' | 'comparison' | 'quiz' | 'flipcard' | 'activity' | 'quote' | 'summary' | 'thankyou';
export type VisualType = 'fraction' | 'process' | 'cycle' | 'numberLine' | 'concept';
export interface SlideVisual { type: VisualType; label: string; numerator: number; denominator: number; min: number; max: number; value: number; nodes: { label: string; detail: string }[] }
export interface LessonSlide {
  layout: SlideLayout; title: string; subtitle: string; content: string[]; leftTitle: string; leftContent: string[]; rightTitle: string; rightContent: string[];
  question: string; quizOptions: string[]; quizAnswer: string; quizExplanation: string;
  timeline: { step: string; title: string; desc: string }[]; stats: { value: string; label: string; desc: string }[]; flipcards: { front: string; back: string }[];
  instruction: string; time: string; groupSize: string; materials: string; quote: string; author: string; speakerNotes: string;
  visual?: SlideVisual; image?: { url: string; alt?: string }; message?: string; [field: string]: unknown;
}
export interface LessonDeckMeta { quality?: { readyForExport?: boolean; layoutWarnings?: string[]; partial?: boolean; contentIssues?: string[]; countWarning?: string }; [field: string]: unknown }
export interface LessonDeck { title: string; subtitle: string; slides: LessonSlide[]; meta: LessonDeckMeta }
export declare const LAYOUTS: readonly SlideLayout[];
export declare function text(value: unknown): string;
export declare function isLearningObjectivesSlide(slide: unknown): boolean;
export declare function normalizeSlide(raw?: unknown, index?: number): LessonSlide;
export declare function normalizeVisual(raw: unknown): SlideVisual | undefined;
export declare function normalizeDeck(raw: unknown, topic?: string): LessonDeck;
export declare function normalizeGeneratedDeck(raw: unknown, topic?: string): LessonDeck;
export declare function answerIndex(slide: LessonSlide): number;
export declare function slideIssues(input: unknown): string[];
export declare function deckIssues(deck: LessonDeck, expectedCount?: number, options?: { allowCountMismatch?: boolean }): string[];
export declare function teacherNotes(slide: LessonSlide): string;
