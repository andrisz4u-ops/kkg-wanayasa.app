export type TeacherReviewStatus = 'reviewed' | 'rejected';
export interface ReviewDraftClient { readonly documentId: string; readonly revision: number; readonly blocked: boolean; sync(payload: unknown, title: string): Promise<boolean> }
export interface TeacherReviewInput { client: ReviewDraftClient; currentOwner: () => string | number | null | undefined; ownerId: string | number; module: string; documentId: string; payload: unknown; title: string; status: TeacherReviewStatus; mutationId: string; isCurrent?: () => boolean }
export interface TeacherReviewRecord { revision: number; status: string; mutation_id?: string; action?: unknown; [key: string]: unknown }
export type ReviewApi = (path: string, options?: { method?: string; body?: Record<string, unknown> }) => Promise<{ data: TeacherReviewRecord | TeacherReviewRecord[] }>;
export declare function fetchTeacherReview(api: ReviewApi, module: string, documentId: string): Promise<TeacherReviewRecord>;
export declare function fetchTeacherReviewHistory(api: ReviewApi, module: string, documentId: string): Promise<TeacherReviewRecord[]>;
export declare function submitTeacherReview(api: ReviewApi, input: TeacherReviewInput): Promise<TeacherReviewRecord>;
