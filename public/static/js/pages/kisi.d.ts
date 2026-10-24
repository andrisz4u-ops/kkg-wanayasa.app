export function renderKisi(): Promise<string>;
export function initKisi(): void;
export function resolveRenderableImageSrc(image: string | { svg?: string; url?: string } | null | undefined): string;
export function describeImageFailure(image: { imageUnavailableReason?: string; imageWarningReason?: string } | null | undefined): string;
export function openVisualCatalogModal(): Promise<void>;
export function openVisualPreviewModal(item: unknown): Promise<void>;
