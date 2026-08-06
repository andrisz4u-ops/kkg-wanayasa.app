import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';

export type AIProvider = 'gemini' | 'vertex' | 'bedrock' | 'anthropic' | 'mistral' | 'z_ai';

interface AIResponse {
    content: string;
    provider: AIProvider;
    model: string;
}

/**
 * Attempts to repair a truncated or slightly malformed JSON string
 * by tracking open delimiters and closing them at the end.
 */
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

    // If we were mid-string, close it
    let result = str;
    if (inString) result += '"';

    // Remove trailing comma before closing
    result = result.replace(/,\s*$/, '');

    // Close all open structures
    while (stack.length > 0) {
        result += stack.pop();
    }

    return result;
}

export class AIService {
    private geminiKeys: string[];
    private vertexKeys: string[];
    private vertexProjectId: string;
    private bedrockKeys: string[];
    private bedrockRegion: string;
    private anthropicKeys: string[];
    private mistralKeys: string[];
    private zAiKeys: string[];
    // Menambahkan variabel untuk URL dan Key rahasia VM GCP
    private vmProxyUrl: string = 'http://34.101.33.242:8000/generate/proxy';
    private vmProxyKey: string;

    constructor(env: any) {
        this.geminiKeys = this.extractKeys(env, 'GEMINI_API_KEY');
        this.vertexKeys = this.extractKeys(env, 'VERTEX_API_KEY'); // Masih bisa dipakai tapi kita utamakan VM
        this.vertexProjectId = env['VERTEX_PROJECT_ID'] || '';
        this.bedrockKeys = this.extractKeys(env, 'BEDROCK_API_KEY');
        this.bedrockRegion = env['BEDROCK_REGION'] || 'us-east-1';
        this.anthropicKeys = this.extractKeys(env, 'ANTHROPIC_API_KEY');
        this.mistralKeys = this.extractKeys(env, 'MISTRAL_API_KEY');
        this.zAiKeys = this.extractKeys(env, 'Z_AI_API_KEY');

        // Ambil AI_BACKEND_KEY dari .dev.vars / env
        this.vmProxyKey = env['AI_BACKEND_KEY'] || 'kkg-2026-rahasia';
    }

    private extractKeys(env: any, prefix: string): string[] {
        const keys: string[] = [];

        // 1. Direct match
        if (env[prefix] && typeof env[prefix] === 'string') {
            if (env[prefix].includes(',')) {
                env[prefix].split(',').forEach((k: string) => keys.push(k.trim()));
            } else {
                keys.push(env[prefix].trim());
            }
        }

        // 2. Numbered suffixes (e.g. GEMINI_API_KEY_1)
        Object.keys(env).forEach(key => {
            if (key.startsWith(prefix) && key !== prefix && typeof env[key] === 'string') {
                keys.push(env[key].trim());
            }
        });

        return [...new Set(keys)].filter(k => k && k.length > 0);
    }

    private getRandomKey(keys: string[]): string {
        if (keys.length === 0) return '';
        return keys[Math.floor(Math.random() * keys.length)];
    }

    // Allow injecting keys from database settings at runtime
    addKey(provider: AIProvider, key: string) {
        if (!key || key.length === 0) return;
        if (provider === 'gemini' && !this.geminiKeys.includes(key)) this.geminiKeys.push(key);
        if (provider === 'vertex' && !this.vertexKeys.includes(key)) this.vertexKeys.push(key);
        if (provider === 'bedrock' && !this.bedrockKeys.includes(key)) this.bedrockKeys.push(key);
        if (provider === 'anthropic' && !this.anthropicKeys.includes(key)) this.anthropicKeys.push(key);
        if (provider === 'mistral' && !this.mistralKeys.includes(key)) this.mistralKeys.push(key);
        if (provider === 'z_ai' && !this.zAiKeys.includes(key)) this.zAiKeys.push(key);
    }

    // Allow injecting Vertex project ID from DB settings
    setVertexProjectId(projectId: string) {
        if (projectId && projectId.length > 0) {
            this.vertexProjectId = projectId;
        }
    }

    async generateJSON(prompt: string, preferredProvider: AIProvider = 'vertex'): Promise<any> {
        // Wrap the user prompt with strict JSON instructions
        const jsonPrompt = `${prompt}

CRITICAL JSON RULES:
1. Output MUST be pure valid JSON - no markdown, no code blocks, no explanation text
2. All string values must properly escape: quotes with \\", newlines with \\n, tabs with \\t
3. Do NOT truncate the output - complete the ENTIRE JSON structure
4. Every opened { must have a closing }, every [ must have a ]
5. No trailing commas before } or ]`;

        let result = await this.generateText(jsonPrompt, preferredProvider, true);
        let content = result.content.trim();

        // Simpan metadata AI yang digunakan
        const aiMeta: any = { provider: result.provider, model: result.model };
        if ((result as any).failover_from) {
            aiMeta.failover_from = (result as any).failover_from;
            aiMeta.failover_errors = (result as any).failover_errors;
        }
        console.log(`[AI] Request processed by: ${aiMeta.provider} (${aiMeta.model})${aiMeta.failover_from ? ` [FAILOVER from ${aiMeta.failover_from}]` : ''}`);

        // ── Layer 1: Strip markdown code fences (```json ... ``` or ``` ... ```)
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
            // Truncated - take from first brace to end and try to repair
            content = content.substring(firstBrace);
        }

        // Helper to attach AI metadata to parsed result
        const attachMeta = (parsed: any) => {
            if (typeof parsed === 'object' && parsed !== null) {
                parsed._ai_meta = aiMeta;
            }
            return parsed;
        };

        let parseErrors: string[] = [];

        // ── Layer 3: Direct parse (fast path)
        try {
            return attachMeta(JSON.parse(content));
        } catch (e: any) { parseErrors.push(`L3: ${e.message}`); }

        // ── Layer 4: Sanitize control characters (but preserve \n \r \t)
        const sanitized = content.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '');
        try {
            return attachMeta(JSON.parse(sanitized));
        } catch (e: any) { parseErrors.push(`L4: ${e.message}`); }

        // ── Layer 5: Fix improperly escaped characters in string values
        const fixedEscapes = sanitized
            // Fix unescaped newlines strictly INSIDE string values
            .replace(/("(?:[^"\\]|\\.)*")/g, (match) => match.replace(/\n/g, '\\n'))
            // Remove trailing commas before ] or }
            .replace(/,\s*([}\]])/g, '$1');
        try {
            return attachMeta(JSON.parse(fixedEscapes));
        } catch (e: any) { parseErrors.push(`L5: ${e.message}`); }

        // ── Layer 6: Attempt to repair truncated JSON by closing open structures
        try {
            const repaired = repairTruncatedJSON(fixedEscapes);
            return attachMeta(JSON.parse(repaired));
        } catch (e: any) { parseErrors.push(`L6: ${e.message}`); }

        // ── Layer 7: Last resort - try partial extraction of key fields
        console.error(`[JSON PARSE FAILED] Errors: ${parseErrors.join(' | ')}`);
        console.error('Raw content length:', content.length);
        console.error('Raw content (last 1000 chars):', content.substring(Math.max(0, content.length - 1000)));
        throw new Error('Respons AI tidak dapat diproses sebagai JSON. Coba generate ulang atau ganti provider AI.');
    }

    async generateText(prompt: string, preferredProvider: AIProvider = 'vertex', jsonMode: boolean = false): Promise<AIResponse> {
        const failoverLog: string[] = [];

        // Try preferred provider first
        try {
            if (preferredProvider === 'vertex') return await this.callVertex(prompt, jsonMode);
            if (preferredProvider === 'gemini') return await this.callGemini(prompt, jsonMode);
            if (preferredProvider === 'bedrock') return await this.callBedrock(prompt, jsonMode);
            if (preferredProvider === 'anthropic') return await this.callAnthropic(prompt, jsonMode);
            if (preferredProvider === 'mistral') return await this.callMistral(prompt, jsonMode);
            if (preferredProvider === 'z_ai') return await this.callGLM(prompt, jsonMode);
        } catch (e: any) {
            const errMsg = e?.message || String(e);
            console.error(`[AI-FAILOVER] ${preferredProvider} FAILED:`, errMsg);
            failoverLog.push(`${preferredProvider}: ${errMsg.substring(0, 200)}`);
            // Khusus untuk pengguna yang memilih Claude (bedrock), prioritas fallback adalah direct Anthropic
            if (preferredProvider === 'bedrock' && this.anthropicKeys.length > 0) {
                try {
                    return await this.callAnthropic(prompt, jsonMode);
                } catch (e2: any) {
                    const errMsg2 = e2?.message || String(e2);
                    console.error(`[AI-FAILOVER] Anthropic fallback also FAILED:`, errMsg2);
                    failoverLog.push(`anthropic: ${errMsg2.substring(0, 200)}`);
                }
            }
        }

        // Failover order: vertex → anthropic → bedrock → gemini → mistral → z_ai
        const providers: AIProvider[] = ['vertex', 'anthropic', 'bedrock', 'gemini', 'mistral', 'z_ai'];
        const remaining = providers.filter(p => p !== preferredProvider && p !== 'anthropic' /* already tried above if bedrock */);

        // Jika preferred bukan bedrock, atau sudah coba anthropic tapi gagal, coba sisa provider lain
        if (preferredProvider !== 'bedrock') {
            remaining.push('anthropic'); // pastikan masih ada dalam list
        }

        for (const provider of remaining) {
            try {
                let result: AIResponse | null = null;
                if (provider === 'vertex') result = await this.callVertex(prompt, jsonMode);
                else if (provider === 'gemini') result = await this.callGemini(prompt, jsonMode);
                else if (provider === 'bedrock') result = await this.callBedrock(prompt, jsonMode);
                else if (provider === 'anthropic') result = await this.callAnthropic(prompt, jsonMode);
                else if (provider === 'mistral') result = await this.callMistral(prompt, jsonMode);
                else if (provider === 'z_ai') result = await this.callGLM(prompt, jsonMode);

                if (result) {
                    // Tag the response with failover info
                    (result as any).failover_from = preferredProvider;
                    (result as any).failover_errors = failoverLog;
                    console.warn(`[AI-FAILOVER] Successfully fell over from ${preferredProvider} → ${provider}`);
                    return result;
                }
            } catch (e: any) {
                const errMsg = e?.message || String(e);
                console.warn(`${provider} failed:`, errMsg);
                failoverLog.push(`${provider}: ${errMsg.substring(0, 200)}`);
            }
        }

        throw new Error(`All AI providers failed. Errors: ${failoverLog.join(' | ')}`);
    }

    // ── Vertex AI (Gemini 2.5 Flash) — DITERUSKAN KE VM GCP (PROXY) ──────────
    private async callVertex(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        if (!this.vmProxyKey) {
            throw new Error('AI_BACKEND_KEY tidak ditemukan. Harap atur di environment/admin.');
        }

        const body: any = {
            prompt: prompt,
            json_mode: jsonMode
        };

        const response = await fetch(this.vmProxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.vmProxyKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`VM GCP Proxy Error ${response.status}: ${errorText}`);
        }

        const data: any = await response.json();
        const text = data?.result || '';

        return { content: text, provider: 'vertex', model: 'gemini-2.5-flash (via GCP VM)' };
    }

    // ── Google AI Studio (Gemini 2.0 Flash) — SDK ────────────────────────────
    private async callGemini(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.geminiKeys);
        if (!key) throw new Error('No Gemini keys available');

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: jsonMode ? 'application/json' : 'text/plain'
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return {
            content: response.text(),
            provider: 'gemini',
            model: 'gemini-2.0-flash'
        };
    }

    // ── Direct Anthropic (Claude 4.6 Sonnet) ─────────────────────────────────
    private async callAnthropic(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.anthropicKeys);
        if (!key) throw new Error('No Anthropic API key available.');

        const requestBody: any = {
            model: 'claude-sonnet-4-6-20250514',
            max_tokens: 8192,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: jsonMode
                        ? `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation.`
                        : prompt
                }
            ]
        };

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AI-ANTHROPIC] Error ${response.status}:`, errorText);
            throw new Error(`Anthropic Error ${response.status}: ${errorText}`);
        }

        const data: any = await response.json();
        const content = data?.content?.[0]?.text || '';

        return {
            content,
            provider: 'anthropic',
            model: 'claude-sonnet-4.6 (Anthropic API)'
        };
    }

    // ── AWS Bedrock (Claude Sonnet 4.6) — via ABSK Bearer Token ────────────────
    private async callBedrock(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.bedrockKeys);
        if (!key) throw new Error('No AWS Bedrock API key available. Harap atur BEDROCK_API_KEY di admin settings.');

        // Model ID dari Inference Profile AWS Bedrock
        const modelId = 'global.anthropic.claude-sonnet-4-6';
        const region = this.bedrockRegion;

        // Endpoint Bedrock untuk Inference Profile (bedrock-runtime)
        const endpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke`;
        console.log(`[AI-BEDROCK] Calling endpoint: ${endpoint}`);

        const requestBody: any = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 8192,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: jsonMode
                        ? `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation.`
                        : prompt
                }
            ]
        };

        const bodyStr = JSON.stringify(requestBody);
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                },
                body: bodyStr,
            });

            if (response.ok) {
                const data: any = await response.json();
                const content = data?.content?.[0]?.text || '';
                console.log(`[AI-BEDROCK] Success on attempt ${attempt}`);
                return {
                    content,
                    provider: 'bedrock',
                    model: 'claude-sonnet-4.6 (AWS Bedrock)'
                };
            }

            // Retry on 429 (rate limit) or 529 (overloaded)
            if ((response.status === 429 || response.status === 529) && attempt < maxRetries) {
                const delay = attempt * 3000; // 3s, 6s, 9s
                console.warn(`[AI-BEDROCK] Got ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            const errorText = await response.text();
            console.error(`[AI-BEDROCK] Error ${response.status} on attempt ${attempt}:`, errorText);
            throw new Error(`AWS Bedrock Error ${response.status}: ${errorText}`);
        }

        throw new Error('AWS Bedrock: Max retries exceeded');
    }

    private async callMistral(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.mistralKeys);
        if (!key) throw new Error('No Mistral keys available');

        const client = new Mistral({ apiKey: key });
        const completion = await client.chat.complete({
            model: 'mistral-medium-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: jsonMode ? { type: 'json_object' } : undefined
        });

        // Handle string | ContentChunk[]
        let content = '';
        const messageContent = completion.choices?.[0]?.message.content;

        if (typeof messageContent === 'string') {
            content = messageContent;
        } else if (Array.isArray(messageContent)) {
            content = messageContent.map((c: any) => c.text || '').join('');
        }

        return {
            content: content || '',
            provider: 'mistral',
            model: 'mistral-medium-latest'
        };
    }

    private async callGLM(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.zAiKeys);
        if (!key) throw new Error('No Zhipu AI (GLM) keys available');

        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                response_format: jsonMode ? { type: 'json_object' } : undefined
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gagal memanggil API GLM: ${response.status} - ${error}`);
        }

        const data: any = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            provider: 'z_ai',
            model: 'glm-4-flash'
        };
    }
}
