export interface LocalSchemaStatement {
  bind(...values: unknown[]): LocalSchemaStatement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results: Array<Record<string, unknown>> }>;
}

export interface LocalSchemaDatabase {
  prepare(query: string): LocalSchemaStatement;
}

export interface LocalPlatformProxy {
  env?: { DB?: LocalSchemaDatabase };
  dispose(): Promise<void>;
}

export interface LocalProxyOptions {
  configPath: string;
  remoteBindings: false;
  envFiles: [];
}

export declare const REQUIRED_LOCAL_SCHEMA: Readonly<Record<string, readonly string[]>>;
export class MissingLocalSchemaError extends Error {
  missing: string[];
}

export function inspectLocalSchema(db: LocalSchemaDatabase): Promise<string[]>;
export function assertLocalSchemaReady(options: {
  getPlatformProxy(options: LocalProxyOptions): Promise<LocalPlatformProxy>;
  configPath: string;
}): Promise<void>;
export function runIfLocalSchemaReady(
  options: {
    getPlatformProxy(options: LocalProxyOptions): Promise<LocalPlatformProxy>;
    configPath: string;
    logger?: Pick<Console, 'error'>;
  },
  startDev: () => void | Promise<void>,
): Promise<boolean>;
