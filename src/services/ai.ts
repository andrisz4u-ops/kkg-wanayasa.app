import { GoogleGenerativeAI } from '@google/generative-ai';
import { decrypt, isEncrypted } from '../lib/crypto';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface DBProvider {
    id: number;
    name: string;
    slug: string;
    api_type: 'openai_compat' | 'anthropic' | 'gemini_sdk' | 'bedrock' | 'custom_proxy';
    base_url: string;
    model: string;
    api_key: string;
    priority: number;
    is_active: boolean;
    max_tokens: number;
    temperature: number;
    extra_headers: Record<string, string>;
    extra_body: Record<string, any>;
    last_check_ok?: number;
    last_check_at?: string;
    last_check_ms?: number;
    total_tokens_used?: number;
    total_calls?: number;
}

export interface AIUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface AIResponse {
    content: string;
    provider: string;   // slug
    model: string;
    usage?: AIUsage;
}

export interface CheckResult {
    ok: boolean;
    latency_ms: number;
    error?: string;
}

// Default subrequest timeout in milliseconds (25 seconds)
const DEFAULT_SUBREQUEST_TIMEOUT_MS = 25000;

// ═══════════════════════════════════════════════════════════════════
// JSON repair helper
// ═══════════════════════════════════════════════════════════════════

function repairTruncatedJSON(str: string): string {
    const stack: string[] = [];
    let inString = false;
    let i = 0;

    while (i < str.length) {
        const ch = str[i];
        const prev = i > 0 ? str[i - 1] : '';

        if (inString) {
            if (ch === '"' && prev !== '\\') inString = false;
            i++;
            continue;
        }

        if (ch === '"') { inString = true; i++; continue; }
        if (ch === '{') { stack.push('}'); i++; continue; }
        if (ch === '[') { stack.push(']'); i++; continue; }
        if (ch === '}' || ch === ']') { stack.pop(); i++; continue; }

        i++;
    }

    let result = str;
    if (inString) result += '"';
    result = result.replace(/,\s*$/, '');
    while (stack.length > 0) {
        result += stack.pop();
    }
    return result;
}

// ═══════════════════════════════════════════════════════════════════
// System prompt shared across text generation
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Anda adalah asisten ahli administrasi pendidikan Indonesia yang sangat berpengalaman dalam menyusun dokumen resmi untuk Kelompok Kerja Guru (KKG). Anda memahami format surat dinas pendidikan Indonesia, tata bahasa Indonesia yang baik dan benar, serta pedoman-pedoman dari Kementerian Pendidikan dan Kebudayaan. Selalu gunakan bahasa Indonesia yang formal, sopan, dan profesional. PENTING: Selalu selesaikan dokumen sampai bagian terakhir, jangan berhenti di tengah.`;

// ═══════════════════════════════════════════════════════════════════
// AIService — Enterprise DB-driven multi-provider with auto-failover,
// circuit breaker, token tracking, and subrequest timeouts
// ═══════════════════════════════════════════════════════════════════

export class AIService {
    private providers: DBProvider[] = [];
    private env: any;
    private db?: D1Database;

    constructor(env?: any) {
        this.env = env || {};
    }

    /**
     * Load active providers from D1 database, sorted by priority ASC.
     * Transparently decrypts at-rest encrypted API keys.
     */
    async loadProviders(db: D1Database): Promise<void> {
        this.db = db;
        const result = await db.prepare(
            `SELECT * FROM ai_providers WHERE is_active = 1 ORDER BY priority ASC`
        ).all();

        const loaded: DBProvider[] = [];

        for (const row of (result.results || []) as any[]) {
            let key = row.api_key || '';

            // Decrypt key if stored with AES-GCM encryption
            if (key && isEncrypted(key)) {
                try {
                    key = await decrypt(key, this.env);
                } catch (decErr) {
                    console.warn(`[AI-KEY] Decryption failed for provider ${row.slug}:`, decErr);
                }
            }

            loaded.push({
                id: row.id,
                name: row.name,
                slug: row.slug,
                api_type: row.api_type,
                base_url: row.base_url,
                model: row.model,
                api_key: key,
                priority: row.priority,
                is_active: !!row.is_active,
                max_tokens: row.max_tokens || 8192,
                temperature: row.temperature ?? 0.7,
                extra_headers: safeParse(row.extra_headers),
                extra_body: safeParse(row.extra_body),
                last_check_ok: row.last_check_ok,
                last_check_at: row.last_check_at,
                last_check_ms: row.last_check_ms,
                total_tokens_used: row.total_tokens_used || 0,
                total_calls: row.total_calls || 0,
            });
        }

        this.providers = loaded;

        // Fallback to server env variables if DB provider key is empty
        for (const p of this.providers) {
            if (!p.api_key || p.api_key.length === 0) {
                p.api_key = this.resolveEnvKey(p) || '';
            }
        }
    }

    /**
     * Try to resolve an API key from environment variables based on the provider.
     */
    private resolveEnvKey(p: DBProvider): string {
        if (!this.env) return '';
        const slug = p.slug.toLowerCase();
        if (slug.includes('gemini') || slug.includes('vertex')) return this.env.GEMINI_API_KEY || this.env.VERTEX_API_KEY || '';
        if (slug.includes('mistral')) return this.env.MISTRAL_API_KEY || '';
        if (slug.includes('claude') || slug.includes('anthropic')) return this.env.ANTHROPIC_API_KEY || '';
        if (slug.includes('bedrock')) return this.env.BEDROCK_API_KEY || '';
        if (slug.includes('glm') || slug.includes('z_ai') || slug.includes('zhipu')) return this.env.Z_AI_API_KEY || '';
        if (p.api_type === 'custom_proxy') return this.env.AI_BACKEND_KEY || 'kkg-2026-rahasia';
        return '';
    }

    /**
     * Get the list of loaded providers.
     */
    getProviders(): DBProvider[] {
        return this.providers;
    }

    /**
     * Find a provider by slug.
     */
    getProviderBySlug(slug: string): DBProvider | undefined {
        return this.providers.find(p => p.slug === slug);
    }

    // ─── generateJSON ─────────────────────────────────────────────

    async generateJSON(prompt: string, preferredSlug?: string): Promise<any> {
        const jsonPrompt = `${prompt}

CRITICAL JSON RULES:
1. Output MUST be pure valid JSON - no markdown, no code blocks, no explanation text
2. All string values must properly escape: quotes with \\", newlines with \\n, tabs with \\t
3. Do NOT truncate the output - complete the ENTIRE JSON structure
4. Every opened { must have a closing }, every [ must have a ]
5. No trailing commas before } or ]`;

        let result = await this.generateText(jsonPrompt, preferredSlug, true);
        let content = result.content.trim();

        const aiMeta: any = {
            provider: result.provider,
            model: result.model,
            usage: result.usage
        };
        if ((result as any).failover_from) {
            aiMeta.failover_from = (result as any).failover_from;
            aiMeta.failover_errors = (result as any).failover_errors;
        }
        console.log(`[AI] Request processed by: ${aiMeta.provider} (${aiMeta.model})${aiMeta.failover_from ? ` [FAILOVER from ${aiMeta.failover_from}]` : ''}`);

        // ── Layer 1: Strip markdown code fences
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

        // ── Layer 2: Extract between first { and last }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBrace === -1) {
            console.error('No JSON object found in response:', content.substring(0, 500));
            throw new Error('Respons AI tidak mengandung JSON. Coba generate ulang.');
        }

        if (lastBrace !== -1 && lastBrace > firstBrace) {
            content = content.substring(firstBrace, lastBrace + 1);
        } else {
            content = content.substring(firstBrace);
        }

        const attachMeta = (parsed: any) => {
            if (typeof parsed === 'object' && parsed !== null) {
                parsed._ai_meta = aiMeta;
            }
            return parsed;
        };

        let parseErrors: string[] = [];

        // ── Layer 3: Direct parse
        try {
            return attachMeta(JSON.parse(content));
        } catch (e: any) {
            parseErrors.push(`Layer 3 (Direct): ${e.message}`);
        }

        // ── Layer 4: Fix unescaped newlines/tabs inside string values
        try {
            const cleaned = content.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
            return attachMeta(JSON.parse(cleaned));
        } catch (e: any) {
            parseErrors.push(`Layer 4 (Newlines): ${e.message}`);
        }

        // ── Layer 5: Fix trailing commas
        try {
            const trailingFixed = content.replace(/,\s*([}\]])/g, '$1');
            return attachMeta(JSON.parse(trailingFixed));
        } catch (e: any) {
            parseErrors.push(`Layer 5 (Trailing commas): ${e.message}`);
        }

        // ── Layer 6: Truncated JSON repair (balance brackets)
        try {
            const repaired = repairTruncatedJSON(content);
            const trailingFixed = repaired.replace(/,\s*([}\]])/g, '$1');
            return attachMeta(JSON.parse(trailingFixed));
        } catch (e: any) {
            parseErrors.push(`Layer 6 (Truncated repair): ${e.message}`);
        }

        // ── Layer 7: Aggressive regex JSON repair
        try {
            let fixed = content
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/([^\\])"/g, '$1\\"')
                .replace(/^\\"/, '"')
                .replace(/\\"$/, '"');

            const reFirst = fixed.indexOf('{');
            const reLast = fixed.lastIndexOf('}');
            if (reFirst !== -1 && reLast > reFirst) {
                fixed = fixed.substring(reFirst, reLast + 1);
            }
            return attachMeta(JSON.parse(fixed));
        } catch (e: any) {
            parseErrors.push(`Layer 7 (Aggressive regex): ${e.message}`);
        }

        console.error('All 7 JSON parse layers failed.');
        console.error('Parse errors:', parseErrors);
        console.error('Raw content preview:', content.substring(0, 1000));
        throw new Error(`Gagal memproses format JSON dari AI. Silakan coba lagi.`);
    }

    // ─── generateText (Auto-Failover with Circuit Breaker) ─────────

    async generateText(prompt: string, preferredSlug?: string, jsonMode = false): Promise<AIResponse> {
        if (this.providers.length === 0) {
            throw new Error('Tidak ada provider AI aktif yang terdaftar di sistem. Hubungi administrator.');
        }

        const ordered = this.buildProviderOrder(preferredSlug);
        const failoverLog: string[] = [];
        let previousFailedSlug: string | undefined;

        for (let i = 0; i < ordered.length; i++) {
            const provider = ordered[i];
            try {
                const response = await this.callProvider(provider, prompt, jsonMode);

                if (i > 0) {
                    (response as any).failover_from = previousFailedSlug;
                    (response as any).failover_errors = failoverLog;
                }

                // Asynchronously record token usage in background
                if (response.usage?.total_tokens && this.db) {
                    this.recordUsage(provider.id, response.usage.total_tokens).catch(e => {
                        console.warn('[AI-USAGE] Failed to record usage:', e);
                    });
                }

                return response;
            } catch (e: any) {
                const errMsg = e?.message || String(e);
                console.error(`[AI-FAILOVER] ${provider.slug} FAILED:`, errMsg);
                failoverLog.push(`${provider.slug}: ${errMsg.substring(0, 200)}`);
                previousFailedSlug = provider.slug;
            }
        }

        throw new Error(`Semua provider AI gagal dipanggil. Detail: ${failoverLog.join(' | ')}`);
    }

    /**
     * Build ordered provider list with Circuit Breaker.
     * Healthy providers are prioritized over recently failed ones.
     */
    private buildProviderOrder(preferredSlug?: string): DBProvider[] {
        const now = Date.now();
        const TEN_MINUTES_MS = 10 * 60 * 1000;

        // Partition into healthy vs recently failed (Circuit Breaker)
        const isHealthy = (p: DBProvider) => {
            if (p.last_check_ok === -1 && p.last_check_at) {
                const checkTime = new Date(p.last_check_at).getTime();
                if (now - checkTime < TEN_MINUTES_MS) {
                    return false; // Still within penalty cooldown
                }
            }
            return true;
        };

        const healthy = this.providers.filter(isHealthy);
        const penalized = this.providers.filter(p => !isHealthy(p));

        const baseList = [...healthy, ...penalized];

        if (!preferredSlug) return baseList;

        const preferred = this.providers.find(p => p.slug === preferredSlug);
        const rest = baseList.filter(p => p.slug !== preferredSlug);

        if (preferred) {
            return [preferred, ...rest];
        }
        return baseList;
    }

    /**
     * Asynchronously record usage counters in D1
     */
    private async recordUsage(providerId: number, tokens: number): Promise<void> {
        if (!this.db || !providerId) return;
        try {
            await this.db.prepare(
                `UPDATE ai_providers SET total_tokens_used = total_tokens_used + ?, total_calls = total_calls + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(tokens, providerId).run();
        } catch (e) {
            console.warn('[AI-METRICS] Could not update usage metrics:', e);
        }
    }

    // ─── Provider Dispatcher ──────────────────────────────────────

    private async callProvider(provider: DBProvider, prompt: string, jsonMode: boolean): Promise<AIResponse> {
        if (!provider.api_key && provider.api_type !== 'custom_proxy') {
            throw new Error(`API key tidak tersedia untuk provider "${provider.name}".`);
        }

        switch (provider.api_type) {
            case 'openai_compat':
                return this.callOpenAICompat(provider, prompt, jsonMode);
            case 'anthropic':
                return this.callAnthropic(provider, prompt, jsonMode);
            case 'gemini_sdk':
                return this.callGeminiSDK(provider, prompt, jsonMode);
            case 'bedrock':
                return this.callBedrock(provider, prompt, jsonMode);
            case 'custom_proxy':
                return this.callCustomProxy(provider, prompt, jsonMode);
            default:
                throw new Error(`Tipe API tidak dikenal: ${provider.api_type}`);
        }
    }

    // ─── OpenAI Compatible (with Reasoning Model o1/o3 support & timeout) ─

    private async callOpenAICompat(p: DBProvider, prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const url = `${p.base_url.replace(/\/+$/, '')}/chat/completions`;
        const isReasoningModel = p.model.startsWith('o1') || p.model.startsWith('o3');

        const body: any = {
            model: p.model,
            messages: isReasoningModel
                ? [{ role: 'user', content: SYSTEM_PROMPT + '\n\n' + prompt }]
                : [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
            ...p.extra_body,
        };

        if (isReasoningModel) {
            body.max_completion_tokens = p.max_tokens;
            // Omit temperature for reasoning models
        } else {
            body.temperature = p.temperature;
            body.max_tokens = p.max_tokens;
            if (jsonMode) {
                body.response_format = { type: 'json_object' };
            }
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${p.api_key}`,
            ...p.extra_headers,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(DEFAULT_SUBREQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${p.name} Error ${response.status}: ${errorText.substring(0, 500)}`);
        }

        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        const usage: AIUsage = {
            prompt_tokens: data.usage?.prompt_tokens || 0,
            completion_tokens: data.usage?.completion_tokens || 0,
            total_tokens: data.usage?.total_tokens || (Math.round(content.length / 4)),
        };

        return { content, provider: p.slug, model: p.model, usage };
    }

    // ─── Anthropic Messages API (with timeout & usage) ────────────

    private async callAnthropic(p: DBProvider, prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const url = `${p.base_url.replace(/\/+$/, '')}/v1/messages`;

        const userContent = jsonMode
            ? `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation.`
            : prompt;

        const body: any = {
            model: p.model,
            max_tokens: p.max_tokens,
            temperature: p.temperature,
            messages: [{ role: 'user', content: userContent }],
            system: SYSTEM_PROMPT,
            ...p.extra_body,
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-api-key': p.api_key,
            'anthropic-version': '2023-06-01',
            ...p.extra_headers,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(DEFAULT_SUBREQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${p.name} Error ${response.status}: ${errorText.substring(0, 500)}`);
        }

        const data: any = await response.json();
        const content = data?.content?.[0]?.text || '';

        const promptTokens = data.usage?.input_tokens || 0;
        const completionTokens = data.usage?.output_tokens || 0;
        const usage: AIUsage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens || (Math.round(content.length / 4)),
        };

        return { content, provider: p.slug, model: p.model, usage };
    }

    // ─── Google Gemini SDK (with timeout & usage) ─────────────────

    private async callGeminiSDK(p: DBProvider, prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const genAI = new GoogleGenerativeAI(p.api_key);
        const model = genAI.getGenerativeModel({
            model: p.model,
            generationConfig: {
                responseMimeType: jsonMode ? 'application/json' : 'text/plain',
                maxOutputTokens: p.max_tokens,
                temperature: p.temperature,
            }
        });

        // Enforce timeout on SDK call
        const generatePromise = model.generateContent(SYSTEM_PROMPT + '\n\n' + prompt);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout ${DEFAULT_SUBREQUEST_TIMEOUT_MS}ms exceeded on ${p.name}`)), DEFAULT_SUBREQUEST_TIMEOUT_MS)
        );

        const result = await Promise.race([generatePromise, timeoutPromise]);
        const response = await result.response;
        const content = response.text();

        const meta = (response as any).usageMetadata;
        const usage: AIUsage = {
            prompt_tokens: meta?.promptTokenCount || 0,
            completion_tokens: meta?.candidatesTokenCount || 0,
            total_tokens: meta?.totalTokenCount || (Math.round(content.length / 4)),
        };

        return { content, provider: p.slug, model: p.model, usage };
    }

    // ─── AWS Bedrock (InvokeModel with retries, timeout & usage) ──

    private async callBedrock(p: DBProvider, prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const region = p.extra_body?.region || this.env?.BEDROCK_REGION || 'us-east-1';
        const endpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(p.model)}/invoke`;

        const userContent = jsonMode
            ? `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation.`
            : prompt;

        const body: any = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: p.max_tokens,
            temperature: p.temperature,
            messages: [{ role: 'user', content: SYSTEM_PROMPT + '\n\n' + userContent }],
            ...p.extra_body,
        };
        delete body.region;

        const maxRetries = 2;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${p.api_key}`,
                    ...p.extra_headers,
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(DEFAULT_SUBREQUEST_TIMEOUT_MS),
            });

            if (response.ok) {
                const data: any = await response.json();
                const content = data?.content?.[0]?.text || '';

                const promptTokens = data.usage?.input_tokens || 0;
                const completionTokens = data.usage?.output_tokens || 0;
                const usage: AIUsage = {
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: promptTokens + completionTokens || (Math.round(content.length / 4)),
                };

                return { content, provider: p.slug, model: p.model, usage };
            }

            if ((response.status === 429 || response.status === 529) && attempt < maxRetries) {
                const delay = attempt * 2000;
                console.warn(`[AI-BEDROCK] Got ${response.status}, retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            const errorText = await response.text();
            throw new Error(`${p.name} Error ${response.status}: ${errorText.substring(0, 500)}`);
        }

        throw new Error(`${p.name}: Max retries exceeded`);
    }

    // ─── Custom Proxy (with timeout) ──────────────────────────────

    private async callCustomProxy(p: DBProvider, prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const apiKey = p.api_key || this.env?.AI_BACKEND_KEY || 'kkg-2026-rahasia';

        const response = await fetch(p.base_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                ...p.extra_headers,
            },
            body: JSON.stringify({
                prompt,
                json_mode: jsonMode,
                ...p.extra_body,
            }),
            signal: AbortSignal.timeout(DEFAULT_SUBREQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${p.name} Error ${response.status}: ${errorText.substring(0, 500)}`);
        }

        const data: any = await response.json();
        const content = data?.result || '';
        const usage: AIUsage = {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: Math.round(content.length / 4),
        };

        return { content, provider: p.slug, model: p.model, usage };
    }

    // ─── Check Live ───────────────────────────────────────────────

    async checkLive(db: D1Database, providerId: number): Promise<CheckResult> {
        const row: any = await db.prepare(
            'SELECT * FROM ai_providers WHERE id = ?'
        ).bind(providerId).first();

        if (!row) throw new Error('Provider tidak ditemukan.');

        let key = row.api_key || '';
        if (key && isEncrypted(key)) {
            try {
                key = await decrypt(key, this.env);
            } catch (e) {
                console.warn('[AI-CHECK] Decrypt failed:', e);
            }
        }

        const provider: DBProvider = {
            id: row.id,
            name: row.name,
            slug: row.slug,
            api_type: row.api_type,
            base_url: row.base_url,
            model: row.model,
            api_key: key,
            priority: row.priority,
            is_active: !!row.is_active,
            max_tokens: row.max_tokens || 8192,
            temperature: row.temperature ?? 0.7,
            extra_headers: safeParse(row.extra_headers),
            extra_body: safeParse(row.extra_body),
        };

        if (!provider.api_key) {
            provider.api_key = this.resolveEnvKey(provider) || '';
        }

        const start = Date.now();
        try {
            await this.callProvider(provider, 'Respond with the single word "OK". Nothing else.', false);
            const latency = Date.now() - start;

            await db.prepare(
                `UPDATE ai_providers SET last_check_at = CURRENT_TIMESTAMP, last_check_ok = 1, last_check_ms = ?, last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(latency, providerId).run();

            return { ok: true, latency_ms: latency };
        } catch (e: any) {
            const latency = Date.now() - start;
            const errMsg = e?.message || String(e);

            await db.prepare(
                `UPDATE ai_providers SET last_check_at = CURRENT_TIMESTAMP, last_check_ok = -1, last_check_ms = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(latency, errMsg.substring(0, 500), providerId).run();

            return { ok: false, latency_ms: latency, error: errMsg };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function safeParse(val: any): Record<string, any> {
    if (!val || val === '{}') return {};
    try { return JSON.parse(val); } catch { return {}; }
}
