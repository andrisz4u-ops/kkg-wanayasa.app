export interface AiLiveMonitorOptions {
  title?: string;
  subtitle?: string;
  modelName?: string;
  steps?: Array<string | { label: string }>;
  autoReview?: boolean;
  onCancel?: () => void;
}

export function isAiJobRunning(): boolean;
export function hasActiveAiJob(): boolean;
export function getActiveAiJobSignal(): AbortSignal | undefined;
export function closeAiLiveMonitor(): void;
export interface AiLiveMonitor {
  signal: AbortSignal;
  complete(callback?: () => void, options?: { partial?: boolean; warnings?: string[]; autoReview?: boolean }): void;
  close(): void;
}

export function openAiLiveMonitor(options?: AiLiveMonitorOptions): AiLiveMonitor;
