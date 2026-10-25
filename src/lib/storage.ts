export interface StorageBindings {
    STORAGE?: R2Bucket;
    R2_PUBLIC_URL?: string;
}

export const resolveStorageConfig = async (db: D1Database, env: any): Promise<StorageBindings> => {
    try {
        const keys = ['r2_public_url'];
        const results = await db.prepare(
            `SELECT key, value FROM settings WHERE key IN ('${keys.join("','")}')`
        ).all();

        const settings: Record<string, string> = {};
        results.results?.forEach((row: any) => {
            settings[row.key] = row.value;
        });

        return {
            STORAGE: env.STORAGE,
            R2_PUBLIC_URL: settings.r2_public_url || env.R2_PUBLIC_URL || '',
        };
    } catch (e) {
        console.error('Failed to resolve storage config from DB:', e);
        return {
            STORAGE: env.STORAGE,
            R2_PUBLIC_URL: env.R2_PUBLIC_URL || '',
        };
    }
};

export const uploadFile = async (
    env: StorageBindings,
    file: File,
    folder: string = ''
): Promise<{ path: string; url: string; error?: string }> => {
    try {
        // Cloudflare R2
        if (env.STORAGE) {
            // Sanitize filename and add timestamp to avoid collisions
            const timestamp = Date.now();
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = folder ? `${folder}/${timestamp}_${cleanName}` : `${timestamp}_${cleanName}`;

            // Convert File to ArrayBuffer to avoid "stream must have known length" error
            // in Cloudflare Workers R2 put()
            const arrayBuffer = await file.arrayBuffer();

            await (env.STORAGE as any).put(filePath, arrayBuffer, {
                httpMetadata: { contentType: file.type || 'application/octet-stream' },
            });

            const publicUrlBase = env.R2_PUBLIC_URL?.replace(/\/$/, '') || '/api/files';
            const url = `${publicUrlBase}/${filePath}`;

            return {
                path: filePath,
                url: url
            };
        }

        return { path: '', url: '', error: 'Storage not configured (R2 missing)' };
    } catch (e: any) {
        console.error('Storage upload exception:', e);
        return { path: '', url: '', error: e.message || 'Unknown error' };
    }
};

export const deleteFile = async (
    env: StorageBindings,
    path: string
): Promise<{ error?: string }> => {
    try {
        // Try Cloudflare R2
        if (env.STORAGE) {
            try {
                await env.STORAGE.delete(path);
                return {};
            } catch (r2Error: any) {
                console.warn('R2 delete failed (might not exist):', r2Error.message);
                return { error: r2Error.message };
            }
        }

        return { error: 'Storage not configured' };
    } catch (e: any) {
        return { error: e.message };
    }
};
