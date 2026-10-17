export interface StreamPostOptions {
  signal?: AbortSignal;
  idleTimeout?: number;
  jobId?: string;
}

export type StreamEventHandler = (event: string, payload: unknown) => unknown | Promise<unknown>;

export class SseParser {
  constructor(onEvent: StreamEventHandler);
  feed(text: string, final?: boolean): void;
  dispatch(frame: string): void;
}

export function streamPost(endpoint: string, data: unknown, onEvent: StreamEventHandler, options?: StreamPostOptions): Promise<void>;
