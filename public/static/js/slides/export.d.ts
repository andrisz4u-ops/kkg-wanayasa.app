import type { LessonDeck } from './lesson-model.js';
import type { Scene } from './scene.js';
export interface PresentationConfig { aspectRatio: '16:9' | '4:3' }
export interface PptxLike { defineLayout(options: { name: string; width: number; height: number }): void; addSlide(): { addText(text: string, options: Record<string, unknown>): void; addImage(options: Record<string, unknown>): void; addShape(shape: unknown, options: Record<string, unknown>): void; addNotes(notes: string): void } }
export declare function loadPptx(): Promise<new () => PptxLike>;
export declare function exportScenes(deck: LessonDeck, template: string, config?: PresentationConfig): Scene[];
export declare function populatePptx<T extends PptxLike>(pptx: T, scenes: Scene[], title: string, template: string, aspectRatio: '16:9' | '4:3'): T;
export declare function exportPptx(deck: LessonDeck, template: string, config: PresentationConfig): Promise<void>;
export declare function htmlPresentation(deck: LessonDeck, template: string, config: PresentationConfig): Promise<string>;
export declare function safeName(title: string): string;
export declare function download(content: BlobPart, fileName: string, type: string): void;
