export interface DraftSyncApiResponse<T = unknown> { data: T }
export interface DraftSyncError extends Error { status?: number; code?: string }
export interface DraftSyncClient {
 readonly documentId: string; readonly revision: number; readonly blocked: boolean; readonly conflict: { documentId: string; baseRevision: number } | null;
 settled(): Promise<boolean>; restoreIdentity(id: string, baseRevision?: number): void;
 sync(payload: unknown, title: string): Promise<boolean>;
 list(): Promise<unknown[]>; read(id: string): Promise<unknown>;
 adopt(draft: { document_id: string; revision: number }): { documentId: string; revision: number };
 checkpoint(): Promise<unknown>;
}
export declare function createDraftDocumentId(): string;
export declare function createDraftSync(api: (path: string, options?: { method?: string; body?: Record<string, unknown> }) => Promise<DraftSyncApiResponse>, ownerId: string | number, currentOwner?: () => string | number | null | undefined, onStatus?: (message: string, error?: boolean) => void): DraftSyncClient;
