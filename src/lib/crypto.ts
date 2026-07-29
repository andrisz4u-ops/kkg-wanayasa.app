/**
 * Encryption Utilities for Sensitive Data
 * Uses Web Crypto API with AES-GCM for encryption
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

/**
 * Get or derive encryption key from environment
 * In production, use a secure key from environment variables
 */
async function getEncryptionKey(env: Record<string, any>): Promise<CryptoKey> {
    const secret = env.ENCRYPTION_KEY || env.SECRET_KEY || 'default-encryption-key-change-in-production';
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const salt = encoder.encode('kkg-portal-encryption-salt');
    
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt sensitive data (like API keys)
 * Returns: iv:ciphertext (both hex encoded)
 */
export async function encrypt(plaintext: string, env: Record<string, any>): Promise<string> {
    if (!plaintext) return '';
    
    const key = await getEncryptionKey(env);
    const encoder = new TextEncoder();
    const iv = new Uint8Array(IV_LENGTH);
    crypto.getRandomValues(iv);
    
    const encrypted = await crypto.subtle.encrypt(
        { name: ENCRYPTION_ALGORITHM, iv },
        key,
        encoder.encode(plaintext)
    );
    
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedHex = Array.from(new Uint8Array(encrypted))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${ivHex}:${encryptedHex}`;
}

/**
 * Decrypt sensitive data
 * Accepts: iv:ciphertext (both hex encoded)
 */
export async function decrypt(ciphertext: string, env: Record<string, any>): Promise<string> {
    if (!ciphertext) return '';
    
    if (!ciphertext.includes(':')) {
        return ciphertext;
    }
    
    try {
        const key = await getEncryptionKey(env);
        const [ivHex, encryptedHex] = ciphertext.split(':');
        
        const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
        const encrypted = new Uint8Array(encryptedHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
        
        const decrypted = await crypto.subtle.decrypt(
            { name: ENCRYPTION_ALGORITHM, iv },
            key,
            encrypted
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption failed:', e);
        return '';
    }
}

/**
 * Check if a value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(':');
    if (parts.length !== 2) return false;
    return /^[0-9a-f]{24}$/i.test(parts[0]) && /^[0-9a-f]+$/i.test(parts[1]);
}

/**
 * Securely compare two strings (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);
    
    let result = 0;
    for (let i = 0; i < aBytes.length; i++) {
        result |= aBytes[i] ^ bBytes[i];
    }
    
    return result === 0;
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a value using SHA-256
 */
export async function sha256(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
