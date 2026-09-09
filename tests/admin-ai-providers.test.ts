import { describe, it, expect } from 'vitest';
import { createAiProviderSchema, updateAiProviderSchema } from '../src/lib/validation';
import { unwrapNestedJson } from '../public/static/js/pages/admin-modules/ai-providers';

describe('AI Providers Admin & Validation Tests', () => {
    describe('unwrapNestedJson', () => {
        it('should handle null, undefined, or empty string cleanly', () => {
            expect(unwrapNestedJson(null)).toEqual({});
            expect(unwrapNestedJson(undefined)).toEqual({});
            expect(unwrapNestedJson('')).toEqual({});
            expect(unwrapNestedJson('   ')).toEqual({});
            expect(unwrapNestedJson('{}')).toEqual({});
        });

        it('should return already parsed object as is', () => {
            const obj = { foo: 'bar', thinking: { type: 'enabled', budget_tokens: 4096 } };
            expect(unwrapNestedJson(obj)).toEqual(obj);
        });

        it('should parse standard single-level JSON string', () => {
            const str = '{"header":"test","value":123}';
            expect(unwrapNestedJson(str)).toEqual({ header: 'test', value: 123 });
        });

        it('should unwrap multi-level double stringified JSON (the escaped quote bug)', () => {
            // e.g. JSON.stringify(JSON.stringify(JSON.stringify({})))
            const multiEscaped = JSON.stringify(JSON.stringify(JSON.stringify({})));
            expect(unwrapNestedJson(multiEscaped)).toEqual({});

            const deeplyEscapedWithBody = JSON.stringify(JSON.stringify({ reasoning_effort: 'medium' }));
            expect(unwrapNestedJson(deeplyEscapedWithBody)).toEqual({ reasoning_effort: 'medium' });
        });

        it('should safely return empty object on broken non-JSON strings', () => {
            expect(unwrapNestedJson('not-a-json-string')).toEqual({});
            expect(unwrapNestedJson('{ invalid json: [ }')).toEqual({});
        });
    });

    describe('updateAiProviderSchema & createAiProviderSchema', () => {
        it('should accept temperature as a float number', () => {
            const payload = {
                name: 'Test Bedrock Claude',
                slug: 'test-bedrock-claude',
                api_type: 'bedrock',
                base_url: 'https://bedrock-runtime.us-east-1.amazonaws.com',
                model: 'global.anthropic.claude-sonnet-4-6',
                temperature: 0.7
            };
            const res = createAiProviderSchema.safeParse(payload);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.temperature).toBe(0.7);
            }
        });

        it('should accept temperature as a string with Indonesian comma (e.g. "0,7")', () => {
            const payload = {
                name: 'Test Bedrock Claude',
                slug: 'test-bedrock-claude-comma',
                api_type: 'bedrock',
                base_url: 'https://bedrock-runtime.us-east-1.amazonaws.com',
                model: 'global.anthropic.claude-sonnet-4-6',
                temperature: '0,7'
            };
            const res = createAiProviderSchema.safeParse(payload);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.temperature).toBe(0.7);
            }
        });

        it('should unwrap and sanitize nested escaped extra_headers and extra_body', () => {
            const nestedEscaped = JSON.stringify(JSON.stringify(JSON.stringify({})));
            const payload = {
                name: 'Test Provider Nested',
                slug: 'test-nested',
                api_type: 'openai_compat',
                base_url: 'https://api.openai.com/v1',
                model: 'gpt-4o',
                extra_headers: nestedEscaped,
                extra_body: nestedEscaped
            };
            const res = createAiProviderSchema.safeParse(payload);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.extra_headers).toBe('{}');
                expect(res.data.extra_body).toBe('{}');
            }
        });

        it('should support partial update with updateAiProviderSchema', () => {
            const updatePayload = {
                temperature: '0,8',
                model: 'claude-3-7-sonnet'
            };
            const res = updateAiProviderSchema.safeParse(updatePayload);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.temperature).toBe(0.8);
                expect(res.data.model).toBe('claude-3-7-sonnet');
            }
        });

        it('should sanitize extra_body when passed as a valid object in update', () => {
            const updatePayload = {
                extra_body: {
                    thinking: { type: 'enabled', budget_tokens: 8192 }
                }
            };
            const res = updateAiProviderSchema.safeParse(updatePayload);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(JSON.parse(res.data.extra_body!)).toEqual({
                    thinking: { type: 'enabled', budget_tokens: 8192 }
                });
            }
        });
    });

    describe('Smart Key Mask Reconciliation Logic', () => {
        it('should correctly reconcile masked keys against stored unmasked keys', () => {
            const existingRawKey = 'sk-prod-secret-key-abcdef123456';
            const existingKeyList = [existingRawKey];

            // Client sends masked key
            const clientSentKey = 'sk-p****3456';
            const lines = [clientSentKey];

            const reconciledKeys: string[] = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('****')) {
                    const prefix = line.substring(0, line.indexOf('****'));
                    const suffix = line.substring(line.indexOf('****') + 4);
                    const matchedKey = existingKeyList.find(k =>
                        (prefix ? k.startsWith(prefix) : true) && (suffix ? k.endsWith(suffix) : true)
                    ) || existingKeyList[i];

                    if (matchedKey) reconciledKeys.push(matchedKey);
                } else {
                    reconciledKeys.push(line);
                }
            }

            expect(reconciledKeys).toEqual(['sk-prod-secret-key-abcdef123456']);
        });

        it('should accept newly entered key when user replaces the masked key', () => {
            const existingRawKey = 'sk-old-key-1234';
            const existingKeyList = [existingRawKey];

            const clientSentKey = 'sk-new-key-987654321';
            const lines = [clientSentKey];

            const reconciledKeys: string[] = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('****')) {
                    const prefix = line.substring(0, line.indexOf('****'));
                    const suffix = line.substring(line.indexOf('****') + 4);
                    const matchedKey = existingKeyList.find(k =>
                        (prefix ? k.startsWith(prefix) : true) && (suffix ? k.endsWith(suffix) : true)
                    ) || existingKeyList[i];

                    if (matchedKey) reconciledKeys.push(matchedKey);
                } else {
                    reconciledKeys.push(line);
                }
            }

            expect(reconciledKeys).toEqual(['sk-new-key-987654321']);
        });
    });

    describe('Smart Proxy Headers Fallback', () => {
        it('should inject HTTP-Referer and X-Title for OpenRouter or xKiro URLs when missing', () => {
            const provider = {
                base_url: 'https://api.xkiro.com/v1',
                slug: 'xkiro',
                api_key: 'xk-test',
                extra_headers: {}
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.api_key}`,
                ...(provider.extra_headers || {})
            };

            const isProxy = (provider.base_url && (provider.base_url.includes('openrouter.ai') || provider.base_url.includes('xkiro.com'))) ||
                            (provider.slug && (provider.slug.includes('xkiro') || provider.slug.includes('openrouter')));
            if (isProxy) {
                if (!headers['HTTP-Referer']) headers['HTTP-Referer'] = 'https://kkg-wanayasa.app';
                if (!headers['X-Title']) headers['X-Title'] = 'KKG Wanayasa App';
            }

            expect(headers['HTTP-Referer']).toBe('https://kkg-wanayasa.app');
            expect(headers['X-Title']).toBe('KKG Wanayasa App');
        });

        it('should preserve custom HTTP-Referer and X-Title if explicitly provided by user', () => {
            const provider = {
                base_url: 'https://openrouter.ai/api/v1',
                slug: 'openrouter',
                api_key: 'or-test',
                extra_headers: {
                    'HTTP-Referer': 'https://custom-domain.com',
                    'X-Title': 'Custom Title'
                }
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.api_key}`,
                ...(provider.extra_headers || {})
            };

            const isProxy = (provider.base_url && (provider.base_url.includes('openrouter.ai') || provider.base_url.includes('xkiro.com'))) ||
                            (provider.slug && (provider.slug.includes('xkiro') || provider.slug.includes('openrouter')));
            if (isProxy) {
                if (!headers['HTTP-Referer']) headers['HTTP-Referer'] = 'https://kkg-wanayasa.app';
                if (!headers['X-Title']) headers['X-Title'] = 'KKG Wanayasa App';
            }

            expect(headers['HTTP-Referer']).toBe('https://custom-domain.com');
            expect(headers['X-Title']).toBe('Custom Title');
        });
    });
});

