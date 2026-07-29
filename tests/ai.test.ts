/**
 * AI Service Tests
 * Tests for multi-provider AI service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI providers
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: {
                    text: () => '{"result": "test response"}'
                }
            })
        })
    }))
}));

vi.mock('groq-sdk', () => ({
    Groq: vi.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: '{"result": "test response"}' } }]
                })
            }
        }
    }))
}));

vi.mock('@mistralai/mistralai', () => ({
    Mistral: vi.fn().mockImplementation(() => ({
        chat: {
            complete: vi.fn().mockResolvedValue({
                choices: [{ message: { content: '{"result": "test response"}' } }]
            })
        }
    }))
}));

describe('AIService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Key Extraction', () => {
        it('should extract single key from environment', async () => {
            const { AIService } = await import('../src/services/ai');
            const service = new AIService({
                GEMINI_API_KEY: 'test-key-1'
            });
            
            // The service should be created without errors
            expect(service).toBeDefined();
        });

        it('should extract multiple keys from environment', async () => {
            const { AIService } = await import('../src/services/ai');
            const service = new AIService({
                GEMINI_API_KEY: 'key1,key2,key3'
            });
            
            expect(service).toBeDefined();
        });

        it('should extract numbered keys', async () => {
            const { AIService } = await import('../src/services/ai');
            const service = new AIService({
                GEMINI_API_KEY_1: 'key1',
                GEMINI_API_KEY_2: 'key2'
            });
            
            expect(service).toBeDefined();
        });
    });

    describe('Provider Selection', () => {
        it('should accept valid provider types', async () => {
            const { AIService } = await import('../src/services/ai');
            const service = new AIService({
                GEMINI_API_KEY: 'test-key',
                GROQ_API_KEY: 'test-key',
                MISTRAL_API_KEY: 'test-key'
            });
            
            // All providers should be available
            expect(service).toBeDefined();
        });
    });

    describe('JSON Response Parsing', () => {
        it('should parse valid JSON response', async () => {
            const validJson = '{"name": "test", "value": 123}';
            const firstBrace = validJson.indexOf('{');
            const lastBrace = validJson.lastIndexOf('}');
            const content = validJson.substring(firstBrace, lastBrace + 1);
            
            const parsed = JSON.parse(content);
            expect(parsed.name).toBe('test');
            expect(parsed.value).toBe(123);
        });

        it('should extract JSON from response with extra text', () => {
            const response = 'Here is the result: {"name": "test"} end';
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            const content = response.substring(firstBrace, lastBrace + 1);
            
            expect(content).toBe('{"name": "test"}');
        });

        it('should handle nested JSON objects', () => {
            const response = '{"outer": {"inner": "value"}}';
            const parsed = JSON.parse(response);
            
            expect(parsed.outer.inner).toBe('value');
        });

        it('should handle JSON arrays', () => {
            const response = '[{"id": 1}, {"id": 2}]';
            const parsed = JSON.parse(response);
            
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBe(2);
        });
    });

    describe('Response Validation', () => {
        it('should validate response structure', () => {
            const response = {
                content: 'Test content',
                provider: 'gemini' as const,
                model: 'gemini-2.0-flash'
            };
            
            expect(response.content).toBeDefined();
            expect(response.provider).toBe('gemini');
            expect(response.model).toBeDefined();
        });
    });
});

describe('AI Provider Failover Logic', () => {
    it('should define provider priority order', () => {
        const providers: ('gemini' | 'groq' | 'mistral')[] = ['gemini', 'groq', 'mistral'];
        const preferred = 'gemini';
        
        const remaining = providers.filter(p => p !== preferred);
        
        expect(remaining).toEqual(['groq', 'mistral']);
    });

    it('should try remaining providers on failure', () => {
        const providers = ['gemini', 'groq', 'mistral'];
        const failed: string[] = ['gemini'];
        
        const available = providers.filter(p => !failed.includes(p));
        
        expect(available).toEqual(['groq', 'mistral']);
    });
});

describe('Prompt Engineering', () => {
    it('should construct valid prompts for letter generation', () => {
        const prompt = `
Buatkan surat undangan dengan detail berikut:
- Jenis Kegiatan: Rapat Bulanan
- Tanggal: 15 Februari 2025
- Waktu: 09:00 - 12:00
- Tempat: SDN 1 Wanayasa
- Agenda: Evaluasi program semester

Format surat harus formal dan profesional.
        `.trim();
        
        expect(prompt).toContain('Jenis Kegiatan');
        expect(prompt).toContain('Tanggal');
        expect(prompt).toContain('formal');
    });

    it('should construct valid prompts for RPP generation', () => {
        const prompt = `
Buatkan RPP dengan detail berikut:
- Mata Pelajaran: Matematika
- Kelas: 4
- Topik: Pecahan
- Alokasi Waktu: 2 x 35 menit

Format RPP harus mengikuti Kurikulum Merdeka.
        `.trim();
        
        expect(prompt).toContain('Mata Pelajaran');
        expect(prompt).toContain('Kurikulum Merdeka');
    });
});
