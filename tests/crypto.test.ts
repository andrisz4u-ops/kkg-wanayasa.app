/**
 * Crypto Utility Tests
 * Tests for encryption and security functions
 */

import { describe, it, expect } from 'vitest';

describe('Crypto Utilities (Basic Tests)', () => {
    describe('Web Crypto API Availability', () => {
        it('should have crypto.subtle available', () => {
            expect(crypto.subtle).toBeDefined();
        });

        it('should have getRandomValues available', () => {
            expect(crypto.getRandomValues).toBeDefined();
        });
    });

    describe('Random Value Generation', () => {
        it('should generate random values', () => {
            const array1 = new Uint8Array(16);
            const array2 = new Uint8Array(16);
            
            crypto.getRandomValues(array1);
            crypto.getRandomValues(array2);
            
            expect(array1).not.toEqual(new Uint8Array(16));
            expect(array2).not.toEqual(new Uint8Array(16));
        });

        it('should generate different values each time', () => {
            const array1 = new Uint8Array(32);
            const array2 = new Uint8Array(32);
            
            crypto.getRandomValues(array1);
            crypto.getRandomValues(array2);
            
            expect(array1).not.toEqual(array2);
        });
    });

    describe('SHA-256 Hashing', () => {
        it('should hash a string', async () => {
            const encoder = new TextEncoder();
            const data = encoder.encode('test');
            const hash = await crypto.subtle.digest('SHA-256', data);
            
            expect(hash).toBeDefined();
            expect(hash.byteLength).toBe(32); // 256 bits = 32 bytes
        });

        it('should produce consistent hashes', async () => {
            const encoder = new TextEncoder();
            const data = encoder.encode('password123');
            
            const hash1 = await crypto.subtle.digest('SHA-256', data);
            const hash2 = await crypto.subtle.digest('SHA-256', data);
            
            const hex1 = Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, '0')).join('');
            const hex2 = Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, '0')).join('');
            
            expect(hex1).toBe(hex2);
        });

        it('should produce different hashes for different inputs', async () => {
            const encoder = new TextEncoder();
            
            const hash1 = await crypto.subtle.digest('SHA-256', encoder.encode('password1'));
            const hash2 = await crypto.subtle.digest('SHA-256', encoder.encode('password2'));
            
            const hex1 = Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, '0')).join('');
            const hex2 = Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, '0')).join('');
            
            expect(hex1).not.toBe(hex2);
        });
    });

    describe('AES-GCM Key Generation', () => {
        it('should generate AES key', async () => {
            const key = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            
            expect(key).toBeDefined();
            expect(key.type).toBe('secret');
        });
    });

    describe('AES-GCM Encryption/Decryption', () => {
        it('should encrypt and decrypt data', async () => {
            const key = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            
            const encoder = new TextEncoder();
            const data = encoder.encode('secret api key');
            
            const iv = new Uint8Array(12);
            crypto.getRandomValues(iv);
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                encrypted
            );
            
            const decryptedText = new TextDecoder().decode(decrypted);
            expect(decryptedText).toBe('secret api key');
        });

        it('should fail decryption with wrong IV', async () => {
            const key = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            
            const encoder = new TextEncoder();
            const data = encoder.encode('secret data');
            
            const iv1 = new Uint8Array(12);
            const iv2 = new Uint8Array(12);
            crypto.getRandomValues(iv1);
            crypto.getRandomValues(iv2);
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv1 },
                key,
                data
            );
            
            await expect(crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv2 },
                key,
                encrypted
            )).rejects.toThrow();
        });
    });

    describe('PBKDF2 Key Derivation', () => {
        it('should derive key from password', async () => {
            const encoder = new TextEncoder();
            const password = encoder.encode('user-password');
            const salt = encoder.encode('random-salt');
            
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                password,
                'PBKDF2',
                false,
                ['deriveBits']
            );
            
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                256
            );
            
            expect(derivedBits.byteLength).toBe(32);
        });

        it('should produce same key with same inputs', async () => {
            const encoder = new TextEncoder();
            const password = encoder.encode('password123');
            const salt = encoder.encode('fixed-salt');
            
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                password,
                'PBKDF2',
                false,
                ['deriveBits']
            );
            
            const derived1 = await crypto.subtle.deriveBits(
                { name: 'PBKDF2', salt, iterations: 1000, hash: 'SHA-256' },
                keyMaterial,
                256
            );
            
            const derived2 = await crypto.subtle.deriveBits(
                { name: 'PBKDF2', salt, iterations: 1000, hash: 'SHA-256' },
                keyMaterial,
                256
            );
            
            const hex1 = Array.from(new Uint8Array(derived1)).map(b => b.toString(16).padStart(2, '0')).join('');
            const hex2 = Array.from(new Uint8Array(derived2)).map(b => b.toString(16).padStart(2, '0')).join('');
            
            expect(hex1).toBe(hex2);
        });
    });
});
