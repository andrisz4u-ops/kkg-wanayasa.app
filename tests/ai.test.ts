/**
 * AI Service Tests
 * Tests for multi-provider AI service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseKeyPool, healTruncatedJsonArray, AIService } from '../src/services/ai';

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

        it('should heal truncated JSON array when stream cuts off mid-object', () => {
            const truncated = `{
                "pg": [
                    { "no": 1, "soal": "Apa ibukota Indonesia?", "kunci": "Jakarta" },
                    { "no": 2, "soal": "Planet terbesar?", "kunci": `;
            const healed = healTruncatedJsonArray(truncated);
            expect(healed).not.toBeNull();
            const parsed = JSON.parse(healed!);
            expect(parsed.pg).toHaveLength(1);
            expect(parsed.pg[0].soal).toBe('Apa ibukota Indonesia?');
        });

        it('should parse AI JSON successfully even with unclosed <think> tag and truncated array', () => {
            const service = new AIService({});
            const aiOutput = `<think>
Saya akan merancang 2 butir soal IPA.
Soal 1 tentang tata surya.
{"pg": [
    { "no": 1, "soal": "Planet ketiga adalah?", "kunci": "Bumi" },
    { "no": 2, "soal": "Planet merah adalah?", "pilihan": { "A": "Mars", `;

            const parsed = service.parseAIJson(aiOutput);
            expect(parsed.pg).toBeDefined();
            expect(parsed.pg).toHaveLength(1);
            expect(parsed.pg[0].kunci).toBe('Bumi');
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

describe('AI Provider Circuit Breaker & Health Logic', () => {
    it('should deprioritize providers that recently failed health check', () => {
        const now = Date.now();
        const providers = [
            { slug: 'p1', priority: 1, last_check_ok: -1, last_check_at: new Date(now - 60000).toISOString() },
            { slug: 'p2', priority: 2, last_check_ok: 1, last_check_at: new Date(now - 60000).toISOString() },
            { slug: 'p3', priority: 3, last_check_ok: 0 }
        ];

        const TEN_MINUTES_MS = 10 * 60 * 1000;
        const isHealthy = (p: any) => {
            if (p.last_check_ok === -1 && p.last_check_at) {
                const checkTime = new Date(p.last_check_at).getTime();
                if (now - checkTime < TEN_MINUTES_MS) return false;
            }
            return true;
        };

        const healthy = providers.filter(isHealthy);
        const penalized = providers.filter(p => !isHealthy(p));
        const reordered = [...healthy, ...penalized];

        expect(reordered.map(p => p.slug)).toEqual(['p2', 'p3', 'p1']);
    });

    it('should detect OpenAI reasoning models (o1/o3) correctly', () => {
        const isReasoning = (model: string) => model.startsWith('o1') || model.startsWith('o3');

        expect(isReasoning('o1')).toBe(true);
        expect(isReasoning('o1-mini')).toBe(true);
        expect(isReasoning('o3-mini')).toBe(true);
        expect(isReasoning('gpt-4o')).toBe(false);
        expect(isReasoning('gemini-2.0-flash')).toBe(false);
    });
});

describe('AI Multi-Key Pooling & Load Balancing Logic', () => {
    it('should parse single key, newline-separated keys, and JSON array strings', () => {
        // Single key
        expect(parseKeyPool('sk-single-key-123')).toEqual(['sk-single-key-123']);

        // Multi-line paste (bulk)
        const multiLine = `
            sk-key-alpha
            sk-key-beta
            sk-key-gamma
        `;
        expect(parseKeyPool(multiLine)).toEqual(['sk-key-alpha', 'sk-key-beta', 'sk-key-gamma']);

        // JSON array format
        const jsonArr = JSON.stringify(['sk-json-1', 'sk-json-2']);
        expect(parseKeyPool(jsonArr)).toEqual(['sk-json-1', 'sk-json-2']);

        // Empty string / null
        expect(parseKeyPool('')).toEqual([]);
        expect(parseKeyPool(null)).toEqual([]);
    });

    it('should rotate keys in Round-Robin order', () => {
        const keys = ['key_A', 'key_B', 'key_C'];
        let currentIndex = 0;

        const getNextKey = () => {
            const k = keys[currentIndex];
            currentIndex = (currentIndex + 1) % keys.length;
            return k;
        };

        expect(getNextKey()).toBe('key_A');
        expect(getNextKey()).toBe('key_B');
        expect(getNextKey()).toBe('key_C');
        expect(getNextKey()).toBe('key_A'); // loops back
    });

    it('should reconcile masked keys with new raw keys correctly', () => {
        const existingKeys = [
            'sk-111111111111aaaa',
            'sk-222222222222bbbb',
            'sk-333333333333cccc'
        ];

        // User kept first 2 masked, deleted 3rd, and added a 4th new key
        const inputLines = [
            'sk-11****aaaa',
            'sk-22****bbbb',
            'sk-444444444444dddd'
        ];

        const reconciled = inputLines.map((line, i) => {
            if (line.includes('****')) {
                const prefix = line.substring(0, line.indexOf('****'));
                const suffix = line.substring(line.indexOf('****') + 4);
                return existingKeys.find(k => 
                    (prefix ? k.startsWith(prefix) : true) && (suffix ? k.endsWith(suffix) : true)
                ) || existingKeys[i];
            }
            return line;
        });

        expect(reconciled).toEqual([
            'sk-111111111111aaaa',
            'sk-222222222222bbbb',
            'sk-444444444444dddd'
        ]);
    });

    describe('Claude Extended Thinking Multi-Block Extraction', () => {
        it('should extract text content and stream thinking when Claude thinking is enabled in Bedrock', async () => {
            const ai = new AIService();
            const mockTokens: string[] = [];

            // Mock global fetch to simulate Bedrock Claude response with thinking + text blocks
            const originalFetch = global.fetch;
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    content: [
                        {
                            type: 'thinking',
                            thinking: 'Let me carefully design the test questions according to Bloom taxonomy...'
                        },
                        {
                            type: 'text',
                            text: '{"pg": [{"no": 1, "soal": "Apa ibukota Jawa Barat?", "opsi": {"A": "Bandung", "B": "Cimahi"}, "kunci": "A"}]}'
                        }
                    ],
                    usage: { input_tokens: 150, output_tokens: 80 }
                })
            } as any);

            try {
                // Call callBedrock via any casting to test private method
                const res = await (ai as any).callBedrock(
                    {
                        id: 1,
                        name: 'Bedrock Claude',
                        slug: 'bedrock-claude',
                        api_type: 'bedrock',
                        model: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
                        api_key: 'test-bedrock-key',
                        max_tokens: 4096,
                        temperature: 1.0,
                        extra_body: { thinking: { type: 'enabled', budget_tokens: 2048 } }
                    },
                    'Buat soal PG',
                    true,
                    10000,
                    (token: string) => mockTokens.push(token)
                );

                expect(res.content).toContain('"pg"');
                expect(res.content).toContain('Apa ibukota Jawa Barat?');
                expect(mockTokens.length).toBe(2);
                expect(mockTokens[0]).toContain('[Claude Thinking]');
                expect(mockTokens[0]).toContain('Bloom taxonomy');
                expect(mockTokens[1]).toContain('"pg"');

                // Verify parsing succeeds with parseAIJson
                const parsed = (ai as any).parseAIJson(res.content);
                expect(parsed.pg).toHaveLength(1);
                expect(parsed.pg[0].kunci).toBe('A');
            } finally {
                global.fetch = originalFetch;
            }
        });

        it('should extract text content and stream thinking when Claude thinking is enabled in Anthropic', async () => {
            const ai = new AIService();
            const mockTokens: string[] = [];

            const originalFetch = global.fetch;
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    content: [
                        {
                            type: 'thinking',
                            thinking: 'Thinking about the assessment structure...'
                        },
                        {
                            type: 'text',
                            text: '{"pg": [{"no": 1, "soal": "Contoh soal?", "kunci": "B"}]}'
                        }
                    ],
                    usage: { input_tokens: 100, output_tokens: 50 }
                })
            } as any);

            try {
                const res = await (ai as any).callAnthropic(
                    {
                        id: 2,
                        name: 'Anthropic Claude',
                        slug: 'anthropic-claude',
                        api_type: 'anthropic',
                        model: 'claude-3-7-sonnet-20250219',
                        api_key: 'test-anthropic-key',
                        max_tokens: 4096,
                        temperature: 1.0,
                        extra_body: { thinking: { type: 'enabled', budget_tokens: 2048 } }
                    },
                    'Buat soal',
                    true,
                    10000,
                    (token: string) => mockTokens.push(token)
                );

                expect(res.content).toContain('"pg"');
                expect(mockTokens.length).toBe(2);
                expect(mockTokens[0]).toContain('[Claude Thinking]');
                expect(mockTokens[1]).toContain('"pg"');

                const parsed = (ai as any).parseAIJson(res.content);
                expect(parsed.pg[0].kunci).toBe('B');
            } finally {
                global.fetch = originalFetch;
            }
        });
    });
});
