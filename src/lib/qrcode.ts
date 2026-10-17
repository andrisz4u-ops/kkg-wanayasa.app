/** QR token generation and verification for attendance check-in. */
import QRCode from 'qrcode';

const CONFIG_ERROR = 'QR signing configuration unavailable';

function requireSecret(secret?: string): string {
    if (!secret || !secret.trim()) throw new Error(CONFIG_ERROR);
    return secret;
}

async function sign(data: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(requireSecret(secret)),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
    return Array.from(signature).map(byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/** Format remains kkg-absensi:kegiatan_id:expiry_epoch_ms:signature. */
export async function generateQRData(kegiatanId: number, secret: string, expiresInMinutes: number = 60): Promise<string> {
    return generateSecureToken(kegiatanId, secret, expiresInMinutes);
}

/** Parse and validate QR data using the currently configured signing secret. */
export async function parseQRData(qrData: string, secret?: string): Promise<{
    valid: boolean;
    kegiatanId?: number;
    expired?: boolean;
    error?: string;
}> {
    return verifySecureToken(qrData, secret);
}

export async function generateQRCodePNG(data: string, size: number = 256): Promise<string> {
    try {
        return await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M', type: 'image/png', width: size, margin: 2,
            color: { dark: '#1e40af', light: '#ffffff' }
        });
    } catch {
        throw new Error('Gagal generate QR code');
    }
}

export async function generateQRCodeSVG(data: string): Promise<string> {
    try {
        return await QRCode.toString(data, {
            type: 'svg', errorCorrectionLevel: 'M', margin: 2,
            color: { dark: '#1e40af', light: '#ffffff' }
        });
    } catch {
        throw new Error('Gagal generate QR code');
    }
}

export async function generateSecureToken(kegiatanId: number, secret: string, expiresInMinutes: number = 60): Promise<string> {
    requireSecret(secret);
    if (!Number.isSafeInteger(kegiatanId) || kegiatanId <= 0 || !Number.isFinite(expiresInMinutes) || expiresInMinutes <= 0) {
        throw new Error('Data QR code tidak valid');
    }
    const expiry = Date.now() + expiresInMinutes * 60 * 1000;
    const signature = await sign(`${kegiatanId}:${expiry}`, secret);
    return `kkg-absensi:${kegiatanId}:${expiry}:${signature}`;
}

export async function verifySecureToken(qrData: string, secret?: string): Promise<{
    valid: boolean;
    kegiatanId?: number;
    expired?: boolean;
    error?: string;
}> {
    try {
        if (!secret?.trim()) return { valid: false, error: CONFIG_ERROR };
        if (typeof qrData !== 'string' || !qrData.startsWith('kkg-absensi:')) {
            return { valid: false, error: 'Format QR code tidak valid' };
        }
        const parts = qrData.split(':');
        if (parts.length !== 4) return { valid: false, error: 'Format QR code tidak valid' };
        const [, idPart, expiryPart, signature] = parts;
        const kegiatanId = Number(idPart);
        const expiry = Number(expiryPart);
        if (!Number.isSafeInteger(kegiatanId) || kegiatanId <= 0 || !Number.isSafeInteger(expiry) || !/^[0-9a-f]{16}$/i.test(signature)) {
            return { valid: false, error: 'Data QR code tidak valid' };
        }
        const expected = await sign(`${kegiatanId}:${expiry}`, secret);
        if (signature !== expected) return { valid: false, error: 'QR code tidak valid' };
        if (Date.now() > expiry) return { valid: false, kegiatanId, expired: true, error: 'QR code sudah kadaluarsa' };
        return { valid: true, kegiatanId };
    } catch {
        return { valid: false, error: 'Gagal memproses QR code' };
    }
}
