import type { LessonSlide } from './lesson-model.js';
export type SceneNode =
 | { kind: 'rect' | 'ellipse'; x: number; y: number; w: number; h: number; fill: string; radius?: number; stroke?: string }
 | { kind: 'triangle'; x: number; y: number; w: number; h: number; fill: string; rotation: number }
 | { kind: 'line'; x: number; y: number; x2: number; y2: number; color: string; thickness: number }
 | { kind: 'image'; x: number; y: number; w: number; h: number; url: string; alt: string; imageWidth?: number; imageHeight?: number }
 | { kind: 'text'; text: string; lines: string[]; x: number; y: number; w: number; h: number; size: number; font: string; color: string; bold: boolean; align: 'left' | 'center' | 'right'; prop?: string };
export interface Scene { width: number; height: number; nodes: SceneNode[]; warnings: string[]; notes: string }
export declare function escapeXml(value: unknown): string;
export declare function wrapText(value: unknown, width: number, size: number): string[];
export declare function buildScene(input: unknown, templateId: string, options?: { aspectRatio?: '16:9' | '4:3'; index?: number; total?: number; reveal?: boolean }): Scene;
export declare function sceneSvg(scene: Scene, label?: string): string;
