import { ALL_ALLOWED_MIME_TYPES, UPLOAD_CONFIG, getFileExtension } from './upload';

export type FileVisibility = 'public' | 'private';

export interface ManagedFileMetadata {
  key: string;
  ownerId: number;
  tenantId: string;
  visibility: FileVisibility;
  contentType: string;
  size: number;
  filename: string;
}

const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  'application/pdf': b => starts(b, [0x25, 0x50, 0x44, 0x46, 0x2d]),
  'application/msword': b => starts(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  'application/vnd.ms-excel': b => starts(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  'application/vnd.ms-powerpoint': b => starts(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  'application/zip': isZip,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': isZip,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': isZip,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': isZip,
  'application/x-rar-compressed': b => starts(b, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]),
  'image/jpeg': b => starts(b, [0xff, 0xd8, 0xff]),
  'image/png': b => starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/gif': b => starts(b, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || starts(b, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  'image/webp': b => starts(b, [0x52, 0x49, 0x46, 0x46]) && ascii(b, 8, 12) === 'WEBP',
};

function starts(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}

function isZip(bytes: Uint8Array): boolean {
  return starts(bytes, [0x50, 0x4b, 0x03, 0x04]) || starts(bytes, [0x50, 0x4b, 0x05, 0x06]) || starts(bytes, [0x50, 0x4b, 0x07, 0x08]);
}

export function validateUpload(file: File, bytes: Uint8Array): string | null {
  if (!file.name || file.name.length > 255) return 'Nama file tidak valid';
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > UPLOAD_CONFIG.maxFileSize) {
    return `Ukuran file harus 1 byte hingga ${UPLOAD_CONFIG.maxFileSizeFormatted}`;
  }
  if (bytes.byteLength !== file.size) return 'Ukuran file aktual tidak sesuai';
  const mime = file.type.toLowerCase().split(';')[0].trim();
  const extension = getFileExtension(file.name);
  if (!ALL_ALLOWED_MIME_TYPES.includes(mime) || !signatures[mime]) return 'Tipe file tidak didukung';
  const extensionMatches: Record<string, string[]> = {
    'application/pdf': ['.pdf'], 'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/zip': ['.zip'], 'application/x-rar-compressed': ['.rar'],
    'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/gif': ['.gif'], 'image/webp': ['.webp'],
  };
  if (!extensionMatches[mime]?.includes(extension)) return 'Ekstensi file tidak sesuai dengan tipe konten';
  if (!signatures[mime](bytes)) return 'Isi file tidak sesuai dengan tipe konten';
  return null;
}

export function createObjectKey(): string {
  return `managed/files/${crypto.randomUUID()}`;
}

/** Managed keys must fail closed when their ownership row has been removed. */
export function isManagedObjectKey(key: string): boolean {
  return key.startsWith('managed/files/');
}

export async function saveFileMetadata(db: D1Database, metadata: ManagedFileMetadata): Promise<void> {
  await db.prepare(`INSERT INTO file_ownership
    (key, owner_id, tenant_id, visibility, content_type, size, filename)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(metadata.key, metadata.ownerId, metadata.tenantId, metadata.visibility, metadata.contentType, metadata.size, metadata.filename)
    .run();
}

export async function getFileMetadata(db: D1Database, key: string): Promise<ManagedFileMetadata | null> {
  const row = await db.prepare(`SELECT key, owner_id as ownerId, tenant_id as tenantId, visibility,
    content_type as contentType, size, filename FROM file_ownership WHERE key = ?`).bind(key).first();
  return row as ManagedFileMetadata | null;
}

export async function removeFileMetadata(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM file_ownership WHERE key = ?').bind(key).run();
}
