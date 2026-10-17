export type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown, label: string): ApiRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as ApiRecord;
}

export async function readApiRecord(response: Response): Promise<ApiRecord> {
  return asRecord(await response.json(), 'API response');
}

export function recordField(record: ApiRecord, key: string): ApiRecord {
  return asRecord(record[key], `API response field ${key}`);
}

export function arrayField(record: ApiRecord, key: string): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) throw new TypeError(`API response field ${key} must be an array`);
  return value;
}

export function booleanField(record: ApiRecord, key: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') throw new TypeError(`API response field ${key} must be a boolean`);
  return value;
}

export function numberField(record: ApiRecord, key: string): number {
  const value = record[key];
  if (typeof value !== 'number') throw new TypeError(`API response field ${key} must be a number`);
  return value;
}

export function stringField(record: ApiRecord, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new TypeError(`API response field ${key} must be a string`);
  return value;
}
