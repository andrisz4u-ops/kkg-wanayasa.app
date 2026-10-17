export interface DocArchiveInput {
  module: string;
  title: string;
  subtitle?: string;
  inputData?: unknown;
  content?: unknown;
  extra?: Record<string, unknown>;
}

export interface DocArchive extends DocArchiveInput {
  id: string;
  createdAt: string;
  module: string;
  title: string;
  subtitle: string;
}

export function saveDocArchive(input: DocArchiveInput): DocArchive | null;
export function getDocArchives(module: string): DocArchive[];
export function getDocArchiveById(module: string, id: string): DocArchive | null;
export function deleteDocArchive(module: string, id: string): boolean;
export function clearDocArchives(module: string): void;
export function openArchiveDrawer(options: { module: string; moduleName?: string; onSelect?: (archive: DocArchive) => void; onDownloadDocx?: (archive: DocArchive) => void }): void;
