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
    api_key: string;            // Primary/first key
    api_keys?: string[];        // Multi-key pool for load-balancing
    key_count?: number;         // Total active keys in pool
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
    used_key_index?: number;
    total_keys_in_pool?: number;
}

export interface KeyCheckDetail {
    index: number;
    masked: string;
    status: 'live' | 'rate_limited' | 'invalid' | 'error';
    latency_ms?: number;
    http_code?: number;
    error?: string;
}

export interface CheckResult {
    ok: boolean;
    latency_ms: number;
    error?: string;
    valid_keys?: number;
    total_keys?: number;
    keys_detail?: KeyCheckDetail[];
}

// Default subrequest timeout in milliseconds (120 seconds / 2 menit untuk dokumen besar RPP & Asesmen)
const DEFAULT_SUBREQUEST_TIMEOUT_MS = 120000;

// Key Rotation & Cooldown State (In-Memory per Worker Instance)
const keyRotationIndexMap = new Map<string, number>();
const keyCooldownMap = new Map<string, number>();

// ═══════════════════════════════════════════════════════════════════
// Key Pool Parser Helper
// ═══════════════════════════════════════════════════════════════════

export function parseKeyPool(raw: string | null | undefined): string[] {
    if (!raw || typeof raw !== 'string') return [];
    const trimmed = raw.trim();
    if (!trimmed) return [];

    let keys: string[] = [];

    // Check if JSON array: ["key1", "key2"]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            const arr = JSON.parse(trimmed);
            if (Array.isArray(arr)) {
                keys = arr.map(k => String(k).trim()).filter(k => k.length > 0);
            }
        } catch {}
    }

    if (keys.length === 0) {
        // Split by newlines, carriage returns, or commas
        keys = trimmed
            .split(/[\r\n]+/)
            .map(k => k.trim())
            .filter(k => k.length > 0);
    }

    // Automatically deduplicate keys
    return Array.from(new Set(keys));
}

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
// key pooling & round-robin load balancing, circuit breaker,
// token tracking, and subrequest timeouts
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
     * Transparently decrypts at-rest encrypted API keys and parses key pools.
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

            // Parse key pool (supports single string, newline-separated list, or JSON array)
            let keys = parseKeyPool(key);
            if (keys.length === 0) {
                const envKey = this.resolveEnvKey({ slug: row.slug, api_type: row.api_type } as any);
                if (envKey) keys = parseKeyPool(envKey);
            }

            loaded.push({
                id: row.id,
                name: row.name,
                slug: row.slug,
                api_type: row.api_type,
                base_url: row.base_url,
                model: row.model,
                api_key: keys[0] || '',
                api_keys: keys,
                key_count: keys.length,
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
    }

    /**
     * Try to resolve an API key from environment variables based on the provider.
     */
    private resolveEnvKey(p: { slug: string; api_type: string }): string {
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
     * Find a provider by slug or partial match.
     */
    getProviderBySlug(slug: string): DBProvider | undefined {
        if (!slug) return undefined;
        let found = this.providers.find(p => p.slug === slug);
        if (found) return found;

        found = this.providers.find(p => p.slug.startsWith(slug) || slug.startsWith(p.slug));
        if (found) return found;

        const lower = slug.toLowerCase();
        return this.providers.find(p => p.name.toLowerCase().includes(lower) || p.model.toLowerCase().includes(lower));
    }

    // ─── parseAIJson (Battle-tested 7-layer repair) ───────────────

    public parseAIJson(content: string, aiMeta?: any): any {
        let clean = content.trim();

        // ── Layer 1: Strip markdown code fences
        clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

        // ── Layer 2: Extract between first { and last }
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');

        if (firstBrace === -1) {
            console.error('No JSON object found in response:', clean.substring(0, 500));
            throw new Error('Respons AI tidak mengandung JSON. Coba generate ulang.');
        }

        if (lastBrace !== -1 && lastBrace > firstBrace) {
            clean = clean.substring(firstBrace, lastBrace + 1);
        } else {
            clean = clean.substring(firstBrace);
        }

        const attachMeta = (parsed: any) => {
            if (aiMeta && typeof parsed === 'object' && parsed !== null) {
                parsed._ai_meta = aiMeta;
            }
            return parsed;
        };

        let parseErrors: string[] = [];

        // ── Layer 3: Direct parse
        try {
            return attachMeta(JSON.parse(clean));
        } catch (e: any) {
            parseErrors.push(`Layer 3 (Direct): ${e.message}`);
        }

        // ── Layer 4: Fix unescaped newlines/tabs inside string values
        try {
            const cleaned = clean.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
            return attachMeta(JSON.parse(cleaned));
        } catch (e: any) {
            parseErrors.push(`Layer 4 (Newlines): ${e.message}`);
        }

        // ── Layer 5: Fix trailing commas
        try {
            const trailingFixed = clean.replace(/,\s*([}\]])/g, '$1');
            return attachMeta(JSON.parse(trailingFixed));
        } catch (e: any) {
            parseErrors.push(`Layer 5 (Trailing commas): ${e.message}`);
        }

        // ── Layer 6: Truncated JSON repair (balance brackets)
        try {
            const repaired = repairTruncatedJSON(clean);
            const trailingFixed = repaired.replace(/,\s*([}\]])/g, '$1');
            return attachMeta(JSON.parse(trailingFixed));
        } catch (e: any) {
            parseErrors.push(`Layer 6 (Truncated repair): ${e.message}`);
        }

        // ── Layer 7: Aggressive regex JSON repair
        try {
            let fixed = clean
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
        console.error('Raw content preview:', clean.substring(0, 1000));
        throw new Error(`Gagal memproses format JSON dari AI. Silakan coba lagi.`);
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

        const aiMeta: any = {
            provider: result.provider,
            model: result.model,
            usage: result.usage,
            used_key_index: result.used_key_index,
            total_keys_in_pool: result.total_keys_in_pool,
        };
        if ((result as any).failover_from) {
            aiMeta.failover_from = (result as any).failover_from;
            aiMeta.failover_errors = (result as any).failover_errors;
        }
        console.log(`[AI] Request processed by: ${aiMeta.provider} (${aiMeta.model})${aiMeta.total_keys_in_pool > 1 ? ` [Key Pool: #${aiMeta.used_key_index + 1}/${aiMeta.total_keys_in_pool}]` : ''}${aiMeta.failover_from ? ` [FAILOVER from ${aiMeta.failover_from}]` : ''}`);

        return this.parseAIJson(result.content, aiMeta);
    }

    // ─── generateJSONStream (Live Token Output with JSON Validation) ─

    async generateJSONStream(prompt: string, preferredSlug?: string, onToken?: (token: string) => void): Promise<any> {
        const jsonPrompt = `${prompt}

CRITICAL JSON RULES:
1. Output MUST be pure valid JSON - no markdown, no code blocks, no explanation text
2. All string values must properly escape: quotes with \\", newlines with \\n, tabs with \\t
3. Do NOT truncate the output - complete the ENTIRE JSON structure
4. Every opened { must have a closing }, every [ must have a ]
5. No trailing commas before } or ]`;

        let result = await this.generateTextStream(jsonPrompt, preferredSlug, true, onToken);

        const aiMeta: any = {
            provider: result.provider,
            model: result.model,
            usage: result.usage,
            used_key_index: result.used_key_index,
            total_keys_in_pool: result.total_keys_in_pool,
        };
        if ((result as any).failover_from) {
            aiMeta.failover_from = (result as any).failover_from;
            aiMeta.failover_errors = (result as any).failover_errors;
        }
        console.log(`[AI-STREAM] Request completed by: ${aiMeta.provider} (${aiMeta.model})${aiMeta.total_keys_in_pool > 1 ? ` [Key Pool: #${aiMeta.used_key_index + 1}/${aiMeta.total_keys_in_pool}]` : ''}${aiMeta.failover_from ? ` [FAILOVER from ${aiMeta.failover_from}]` : ''}`);

        return this.parseAIJson(result.content, aiMeta);
    }

    // ─── generateText (Auto-Failover with Circuit Breaker) ─────────

    async generateText(prompt: string, preferredSlug?: string, jsonMode = false): Promise<AIResponse> {
        if (this.providers.length === 0) {
            throw new Error('Tidak ada provider AI aktif yang terdaftar di sistem. Hubungi administrator.');
        }

        // If user specifically requested a chosen provider (e.g. Mistral, Gemini, etc.), lock strictly to it (Intra-Provider Key Pool only)
        if (preferredSlug) {
            const specificProvider = this.getProviderBySlug(preferredSlug);
            if (specificProvider) {
                try {
                    const response = await this.callProvider(specificProvider, prompt, jsonMode);

                    // Asynchronously record token usage in background
                    if (response.usage?.total_tokens && this.db) {
                        this.recordUsage(specificProvider.id, response.usage.total_tokens).catch(e => {
                            console.warn('[AI-USAGE] Failed to record usage:', e);
                        });
                    }

                    return response;
                } catch (err: any) {
                    const errMsg = err?.message || String(err);
                    console.error(`[AI-LOCKED] Provider "${specificProvider.name}" (${specificProvider.slug}) failed:`, errMsg);
                    throw new Error(`Provider "${specificProvider.name}" tidak dapat merespons (kuota API Key habis / timeout / server sibuk). Silakan ganti model AI yang lain di menu pilihan AI Engine.`);
                }
            }
        }

        // If no specific provider was requested, use the prioritized failover chain
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

    // ─── generateTextStream (Streaming with Auto-Failover) ─────────

    async generateTextStream(prompt: string, preferredSlug?: string, jsonMode = false, onToken?: (token: string) => void): Promise<AIResponse> {
        if (this.providers.length === 0) {
            throw new Error('Tidak ada provider AI aktif yang terdaftar di sistem. Hubungi administrator.');
        }

        if (preferredSlug) {
            const specificProvider = this.getProviderBySlug(preferredSlug);
            if (specificProvider) {
                try {
                    const response = await this.callProviderStream(specificProvider, prompt, jsonMode, onToken);
                    if (response.usage?.total_tokens && this.db) {
                        this.recordUsage(specificProvider.id, response.usage.total_tokens).catch(e => {
                            console.warn('[AI-USAGE] Failed to record usage:', e);
                        });
                    }
                    return response;
                } catch (err: any) {
                    const errMsg = err?.message || String(err);
                    console.error(`[AI-LOCKED] Provider "${specificProvider.name}" (${specificProvider.slug}) failed in stream:`, errMsg);
                    throw new Error(`Provider "${specificProvider.name}" tidak dapat merespons (kuota API Key habis / timeout / server sibuk). Silakan ganti model AI yang lain di menu pilihan AI Engine.`);
                }
            }
        }

        const ordered = this.buildProviderOrder(preferredSlug);
        const failoverLog: string[] = [];
        let previousFailedSlug: string | undefined;

        for (let i = 0; i < ordered.length; i++) {
            const provider = ordered[i];
            try {
                const response = await this.callProviderStream(provider, prompt, jsonMode, onToken);

                if (i > 0) {
                    (response as any).failover_from = previousFailedSlug;
                    (response as any).failover_errors = failoverLog;
                }

                if (response.usage?.total_tokens && this.db) {
                    this.recordUsage(provider.id, response.usage.total_tokens).catch(e => {
                        console.warn('[AI-USAGE] Failed to record usage:', e);
                    });
                }

                return response;
            } catch (e: any) {
                const errMsg = e?.message || String(e);
                console.error(`[AI-FAILOVER] ${provider.slug} FAILED in stream:`, errMsg);
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

    // ─── Provider Dispatcher (with Key Pooling & Round-Robin Rotation) ─

    private async callProvider(provider: DBProvider, prompt: string, jsonMode: boolean, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
        const keys = (provider.api_keys && provider.api_keys.length > 0)
            ? provider.api_keys
            : (provider.api_key ? [provider.api_key] : []);

        if (keys.length === 0 && provider.api_type !== 'custom_proxy') {
            throw new Error(`API key tidak tersedia untuk provider "${provider.name}".`);
        }

        if (provider.api_type === 'custom_proxy') {
            return this.callCustomProxy(provider, prompt, jsonMode, timeoutMs);
        }

        const keyCount = keys.length;
        let startIndex = keyRotationIndexMap.get(provider.slug);
        if (startIndex === undefined || startIndex >= keyCount) {
            // Randomize starting index on initial request / cold start to distribute traffic across multi-region isolates
            startIndex = Math.floor(Math.random() * keyCount);
        }

        const now = Date.now();
        const keyErrors: string[] = [];

        // Try keys in round-robin sequence with fallback to next key on 429/402/401
        for (let attempt = 0; attempt < keyCount; attempt++) {
            const currentIndex = (startIndex + attempt) % keyCount;
            const currentKey = keys[currentIndex];
            const cooldownKey = `${provider.slug}:${currentIndex}`;
            const cooldownUntil = keyCooldownMap.get(cooldownKey) || 0;

            // If key is on cooldown, skip it unless it is the only key or all are in cooldown
            if (keyCount > 1 && cooldownUntil > now && attempt < keyCount - 1) {
                continue;
            }

            const pWithKey: DBProvider = {
                ...provider,
                api_key: currentKey,
            };

            try {
                let res: AIResponse;
                switch (provider.api_type) {
                    case 'openai_compat':
                        res = await this.callOpenAICompat(pWithKey, prompt, jsonMode, timeoutMs);
                        break;
                    case 'anthropic':
                        res = await this.callAnthropic(pWithKey, prompt, jsonMode, timeoutMs);
                        break;
                    case 'gemini_sdk':
                        res = await this.callGeminiSDK(pWithKey, prompt, jsonMode, timeoutMs);
                        break;
                    case 'bedrock':
                        res = await this.callBedrock(pWithKey, prompt, jsonMode, timeoutMs);
                        break;
                    default:
                        throw new Error(`Tipe API tidak dikenal: ${provider.api_type}`);
                }

                // Success! Update round-robin index to next key for the subsequent request
                keyRotationIndexMap.set(provider.slug, (currentIndex + 1) % keyCount);
                keyCooldownMap.delete(cooldownKey);

                res.used_key_index = currentIndex;
                res.total_keys_in_pool = keyCount;
                return res;
            } catch (err: any) {
                const errMsg = err?.message || String(err);
                keyErrors.push(`Key #${currentIndex + 1}: ${errMsg.substring(0, 150)}`);

                // Check for rate limits (429), quota limits (402/529), or invalid key (401)
                const isRotatableError = /429|402|529|rate[_\s-]?limit|quota|unauthorized|401|invalid_api_key/i.test(errMsg);

                if (isRotatableError && keyCount > 1) {
                    // Place this specific key in 60s cooldown
                    keyCooldownMap.set(cooldownKey, now + 60000);
                    console.warn(`[AI-KEY-POOL] ${provider.slug} key #${currentIndex + 1} hit rate limit / error (${errMsg.substring(0, 100)}). Auto-rotating to next key in pool...`);
                    continue; // Try next key in pool immediately
                }

                // If not a rotatable error or only 1 key, rethrow to failover to next provider
                throw err;
            }
        }

        throw new Error(`${provider.name} (Semua ${keyCount} key di pool gagal): ${keyErrors.join(' | ')}`);
    }

    // ─── Provider Stream Dispatcher (Key Pooling & Round-Robin) ───

    private async callProviderStream(provider: DBProvider, prompt: string, jsonMode: boolean, onToken?: (token: string) => void, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
        const keys = (provider.api_keys && provider.api_keys.length > 0)
            ? provider.api_keys
            : (provider.api_key ? [provider.api_key] : []);

        if (keys.length === 0 && provider.api_type !== 'custom_proxy') {
            throw new Error(`API key tidak tersedia untuk provider "${provider.name}".`);
        }

        if (provider.api_type === 'custom_proxy') {
            const res = await this.callCustomProxy(provider, prompt, jsonMode, timeoutMs);
            if (onToken && res.content) {
                onToken(res.content);
            }
            return res;
        }

        const keyCount = keys.length;
        let startIndex = keyRotationIndexMap.get(provider.slug);
        if (startIndex === undefined || startIndex >= keyCount) {
            startIndex = Math.floor(Math.random() * keyCount);
        }

        const now = Date.now();
        const keyErrors: string[] = [];

        for (let attempt = 0; attempt < keyCount; attempt++) {
            const currentIndex = (startIndex + attempt) % keyCount;
            const currentKey = keys[currentIndex];
            const cooldownKey = `${provider.slug}:${currentIndex}`;
            const cooldownUntil = keyCooldownMap.get(cooldownKey) || 0;

            if (keyCount > 1 && cooldownUntil > now && attempt < keyCount - 1) {
                continue;
            }

            const pWithKey: DBProvider = {
                ...provider,
                api_key: currentKey,
            };

            try {
                let res: AIResponse;
                switch (provider.api_type) {
                    case 'openai_compat':
                        res = await this.callOpenAICompatStream(pWithKey, prompt, jsonMode, onToken, timeoutMs);
                        break;
                    case 'gemini_sdk':
                        res = await this.callGeminiSDKStream(pWithKey, prompt, jsonMode, onToken, timeoutMs);
                        break;
                    case 'anthropic':
                    case 'bedrock':
                    default: {
                        res = await this.callProvider(pWithKey, prompt, jsonMode, timeoutMs);
                        if (onToken && res.content) {
                            onToken(res.content);
                        }
                        break;
                    }
                }

                keyRotationIndexMap.set(provider.slug, (currentIndex + 1) % keyCount);
                keyCooldownMap.delete(cooldownKey);

                res.used_key_index = currentIndex;
                res.total_keys_in_pool = keyCount;
                return res;
            } catch (err: any) {
                const errMsg = err?.message || String(err);
                keyErrors.push(`Key #${currentIndex + 1}: ${errMsg.substring(0, 150)}`);

                const isRotatableError = /429|402|529|rate[_\s-]?limit|quota|unauthorized|401|invalid_api_key/i.test(errMsg);

                if (isRotatableError && keyCount > 1) {
                    keyCooldownMap.set(cooldownKey, now + 60000);
                    console.warn(`[AI-KEY-POOL] ${provider.slug} key #${currentIndex + 1} hit rate limit in stream. Auto-rotating to next key in pool...`);
                    continue;
                }

                throw err;
            }
        }

        throw new Error(`${provider.name} (Semua ${keyCount} key di pool gagal): ${keyErrors.join(' | ')}`);
    }

    // ─── OpenAI Compatible Stream ─────────────────────────────────

    private async callOpenAICompatStream(p: DBProvider, prompt: string, jsonMode: boolean, onToken?: (token: string) => void, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
        const url = `${p.base_url.replace(/\/+$/, '')}/chat/completions`;
        const isReasoningModel = p.model.startsWith('o1') || p.model.startsWith('o3');

        const body: any = {
            model: p.model,
            stream: true,
            messages: isReasoningModel
                ? [{ role: 'user', content: SYSTEM_PROMPT + '\n\n' + prompt }]
                : [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
            ...(p.extra_body && typeof p.extra_body === 'object' && !Array.isArray(p.extra_body) ? p.extra_body : {}),
        };

        if (isReasoningModel) {
            body.max_completion_tokens = p.max_tokens;
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
            ...(p.extra_headers && typeof p.extra_headers === 'object' && !Array.isArray(p.extra_headers) ? p.extra_headers : {}),
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${p.name} Error ${response.status}: ${errorText.substring(0, 500)}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error(`${p.name}: Response body reader is not available`);
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let content = '';
        let promptTokens = 0;
        let completionTokens = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith(':')) continue;
                    if (trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const chunk = JSON.parse(trimmed.substring(6));
                            const delta = chunk.choices?.[0]?.delta?.content || '';
                            if (delta) {
                                content += delta;
                                onToken?.(delta);
                            }
                            if (chunk.usage) {
                                promptTokens = chunk.usage.prompt_tokens || promptTokens;
                                completionTokens = chunk.usage.completion_tokens || completionTokens;
                            }
                        } catch {
                            // Skip invalid partial chunk line
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        const totalTokens = promptTokens + completionTokens || Math.round(content.length / 4);
        const usage: AIUsage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
        };

        return { content, provider: p.slug, model: p.model, usage };
    }

    // ─── Google Gemini SDK Stream ─────────────────────────────────

    private async callGeminiSDKStream(p: DBProvider, prompt: string, jsonMode: boolean, onToken?: (token: string) => void, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
        const genAI = new GoogleGenerativeAI(p.api_key);
        const model = genAI.getGenerativeModel({
            model: p.model,
            generationConfig: {
                responseMimeType: jsonMode ? 'application/json' : 'text/plain',
                maxOutputTokens: p.max_tokens,
                temperature: p.temperature,
            }
        });

        const streamResult = await model.generateContentStream(SYSTEM_PROMPT + '\n\n' + prompt);
        let content = '';

        for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                content += chunkText;
                onToken?.(chunkText);
            }
        }

        const response = await streamResult.response;
        const meta = (response as any).usageMetadata;
        const usage: AIUsage = {
            prompt_tokens: meta?.promptTokenCount || 0,
            completion_tokens: meta?.candidatesTokenCount || 0,
            total_tokens: meta?.totalTokenCount || (Math.round(content.length / 4)),
        };

        return { content, provider: p.slug, model: p.model, usage };
    }

    // ─── OpenAI Compatible ────────────────────────────────────────

    private async callOpenAICompat(p: DBProvider, prompt: string, jsonMode: boolean, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
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
            ...(p.extra_body && typeof p.extra_body === 'object' && !Array.isArray(p.extra_body) ? p.extra_body : {}),
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
            ...(p.extra_headers && typeof p.extra_headers === 'object' && !Array.isArray(p.extra_headers) ? p.extra_headers : {}),
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
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

    // ─── Anthropic Messages API ───────────────────────────────────

    private async callAnthropic(p: DBProvider, prompt: string, jsonMode: boolean, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
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
            ...(p.extra_body && typeof p.extra_body === 'object' && !Array.isArray(p.extra_body) ? p.extra_body : {}),
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-api-key': p.api_key,
            'anthropic-version': '2023-06-01',
            ...(p.extra_headers && typeof p.extra_headers === 'object' && !Array.isArray(p.extra_headers) ? p.extra_headers : {}),
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
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

    // ─── Google Gemini SDK ────────────────────────────────────────

    private async callGeminiSDK(p: DBProvider, prompt: string, jsonMode: boolean, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
        const genAI = new GoogleGenerativeAI(p.api_key);
        const model = genAI.getGenerativeModel({
            model: p.model,
            generationConfig: {
                responseMimeType: jsonMode ? 'application/json' : 'text/plain',
                maxOutputTokens: p.max_tokens,
                temperature: p.temperature,
            }
        });

        const generatePromise = model.generateContent(SYSTEM_PROMPT + '\n\n' + prompt);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout ${timeoutMs}ms exceeded on ${p.name}`)), timeoutMs)
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

    // ─── AWS Bedrock ──────────────────────────────────────────────

    private async callBedrock(p: DBProvider, prompt: string, jsonMode: boolean, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
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
            ...(p.extra_body && typeof p.extra_body === 'object' && !Array.isArray(p.extra_body) ? p.extra_body : {}),
        };
        delete body.region;

        const maxRetries = 2;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${p.api_key}`,
                    ...(p.extra_headers && typeof p.extra_headers === 'object' && !Array.isArray(p.extra_headers) ? p.extra_headers : {}),
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(timeoutMs),
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

    // ─── Custom Proxy ─────────────────────────────────────────────

    private async callCustomProxy(p: DBProvider, prompt: string, jsonMode: boolean, timeoutMs: number = DEFAULT_SUBREQUEST_TIMEOUT_MS): Promise<AIResponse> {
        const apiKey = p.api_key || this.env?.AI_BACKEND_KEY || 'kkg-2026-rahasia';

        const response = await fetch(p.base_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                ...(p.extra_headers && typeof p.extra_headers === 'object' && !Array.isArray(p.extra_headers) ? p.extra_headers : {}),
            },
            body: JSON.stringify({
                prompt,
                json_mode: jsonMode,
                ...(p.extra_body && typeof p.extra_body === 'object' && !Array.isArray(p.extra_body) ? p.extra_body : {}),
            }),
            signal: AbortSignal.timeout(timeoutMs),
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

    // ─── Check Live (Multi-Key Aware) ─────────────────────────────

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

        let keys = parseKeyPool(key);
        if (keys.length === 0) {
            const envKey = this.resolveEnvKey({ slug: row.slug, api_type: row.api_type } as any);
            if (envKey) keys = parseKeyPool(envKey);
        }

        const provider: DBProvider = {
            id: row.id,
            name: row.name,
            slug: row.slug,
            api_type: row.api_type,
            base_url: row.base_url,
            model: row.model,
            api_key: keys[0] || '',
            api_keys: keys,
            key_count: keys.length,
            priority: row.priority,
            is_active: !!row.is_active,
            max_tokens: row.max_tokens || 8192,
            temperature: row.temperature ?? 0.7,
            extra_headers: safeParse(row.extra_headers),
            extra_body: safeParse(row.extra_body),
        };

        if (keys.length === 0 && provider.api_type !== 'custom_proxy') {
            const errMsg = 'API key kosong atau belum diisi.';
            await db.prepare(
                `UPDATE ai_providers SET last_check_at = CURRENT_TIMESTAMP, last_check_ok = -1, last_check_ms = 0, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(errMsg, providerId).run();
            return { ok: false, latency_ms: 0, error: errMsg, valid_keys: 0, total_keys: 0 };
        }

        const start = Date.now();
        let validKeys = 0;
        const totalKeys = Math.max(keys.length, 1);
        const errors: string[] = [];
        const keysDetail: KeyCheckDetail[] = [];

        const maskKeyPreview = (k: string) => {
            if (!k) return '(kosong)';
            if (k.length <= 8) return '****';
            return k.substring(0, 4) + '****' + k.substring(k.length - 4);
        };

        // If multiple keys in pool, test all keys concurrently in parallel
        if (keys.length > 1 && provider.api_type !== 'custom_proxy') {
            const checkPromises = keys.map(async (k, i) => {
                const singleP: DBProvider = { ...provider, api_key: k };
                const keyStart = Date.now();
                try {
                    await this.callProvider(singleP, 'Respond with the single word "OK". Nothing else.', false, 15000);
                    const keyLat = Date.now() - keyStart;
                    return {
                        index: i + 1,
                        masked: maskKeyPreview(k),
                        status: 'live' as const,
                        latency_ms: keyLat,
                        error: 'Respons OK (Kunci Aktif)'
                    };
                } catch (e: any) {
                    const errMsg = e?.message || String(e);
                    let status: 'rate_limited' | 'invalid' | 'error' = 'error';
                    let cleanMsg = errMsg;
                    let httpCode: number | undefined;

                    if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate')) {
                        status = 'rate_limited';
                        httpCode = 429;
                        cleanMsg = '429 Rate Limit (Batas kuota/rate limit per menit terlewati, coba lagi nanti)';
                    } else if (errMsg.includes('401') || errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('auth')) {
                        status = 'invalid';
                        httpCode = 401;
                        cleanMsg = '401 Unauthorized (Kunci API tidak valid atau kedaluwarsa)';
                    } else if (errMsg.includes('403')) {
                        status = 'invalid';
                        httpCode = 403;
                        cleanMsg = '403 Forbidden (Akses ke model atau endpoint ditolak)';
                    } else if (errMsg.toLowerCase().includes('timeout')) {
                        cleanMsg = 'Timeout (>15 detik tanpa respons)';
                    }

                    return {
                        index: i + 1,
                        masked: maskKeyPreview(k),
                        status,
                        http_code: httpCode,
                        error: cleanMsg
                    };
                }
            });

            const settled = await Promise.allSettled(checkPromises);
            for (const item of settled) {
                if (item.status === 'fulfilled') {
                    keysDetail.push(item.value);
                    if (item.value.status === 'live') {
                        validKeys++;
                    } else {
                        errors.push(`Kunci #${item.value.index} (${item.value.masked}): ${item.value.error}`);
                    }
                } else {
                    const failDetail: KeyCheckDetail = {
                        index: keysDetail.length + 1,
                        masked: '(unknown)',
                        status: 'error',
                        error: String(item.reason)
                    };
                    keysDetail.push(failDetail);
                    errors.push(String(item.reason));
                }
            }
        } else {
            const singleKey = keys[0] || '';
            const keyStart = Date.now();
            try {
                await this.callProvider(provider, 'Respond with the single word "OK". Nothing else.', false, 15000);
                validKeys = 1;
                keysDetail.push({
                    index: 1,
                    masked: maskKeyPreview(singleKey),
                    status: 'live',
                    latency_ms: Date.now() - keyStart,
                    error: 'Respons OK (Kunci Aktif)'
                });
            } catch (e: any) {
                const errMsg = e?.message || String(e);
                let status: 'rate_limited' | 'invalid' | 'error' = 'error';
                let cleanMsg = errMsg;
                let httpCode: number | undefined;

                if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate')) {
                    status = 'rate_limited';
                    httpCode = 429;
                    cleanMsg = '429 Rate Limit (Batas kuota/rate limit per menit terlewati, coba lagi nanti)';
                } else if (errMsg.includes('401') || errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('auth')) {
                    status = 'invalid';
                    httpCode = 401;
                    cleanMsg = '401 Unauthorized (Kunci API tidak valid atau kedaluwarsa)';
                } else if (errMsg.includes('403')) {
                    status = 'invalid';
                    httpCode = 403;
                    cleanMsg = '403 Forbidden (Akses ke model atau endpoint ditolak)';
                }

                errors.push(errMsg);
                keysDetail.push({
                    index: 1,
                    masked: maskKeyPreview(singleKey),
                    status,
                    http_code: httpCode,
                    error: cleanMsg
                });
            }
        }

        const latency = Date.now() - start;
        const isAllOk = validKeys === totalKeys;
        const isAnyOk = validKeys > 0;

        if (isAnyOk) {
            const errorSummary = errors.length > 0 ? errors.join(' | ').substring(0, 500) : null;
            await db.prepare(
                `UPDATE ai_providers SET last_check_at = CURRENT_TIMESTAMP, last_check_ok = 1, last_check_ms = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(latency, errorSummary, providerId).run();

            return {
                ok: true,
                latency_ms: latency,
                valid_keys: validKeys,
                total_keys: totalKeys,
                error: errorSummary || undefined,
                keys_detail: keysDetail
            };
        } else {
            const errorSummary = errors.join(' | ').substring(0, 500) || 'Gagal merespons';
            await db.prepare(
                `UPDATE ai_providers SET last_check_at = CURRENT_TIMESTAMP, last_check_ok = -1, last_check_ms = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(latency, errorSummary, providerId).run();

            return {
                ok: false,
                latency_ms: latency,
                valid_keys: 0,
                total_keys: totalKeys,
                error: errorSummary,
                keys_detail: keysDetail
            };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function safeParse(val: any): Record<string, any> {
    if (!val || val === '{}' || val === '""' || val === 'null') return {};
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) return val;
    try {
        let parsed = typeof val === 'string' ? JSON.parse(val) : val;
        // Handle double-stringified JSON like "\"{}\""
        if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch { return {}; }
        }
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed;
        }
        return {};
    } catch {
        return {};
    }
}
