import { describe, it, expect } from 'vitest';
import { buildAssessmentPrompt } from '../src/routes/kisi';
import { buildRppPrompt, calculateTimeDistribution } from '../src/routes/rpp';
import { AIService, STREAM_INITIAL_TIMEOUT_MS, STREAM_IDLE_TIMEOUT_MS, STREAM_MAX_TOTAL_TIMEOUT_MS } from '../src/services/ai';

describe('AI Streaming Prompt & Pipeline Tests', () => {
    describe('buildAssessmentPrompt', () => {
        it('should build structured prompt for PG questions including BSKAP 046/2025 CP', () => {
            const prompt = buildAssessmentPrompt({
                type: 'pg',
                startNo: 1,
                count: 10,
                mataPelajaran: 'Pendidikan Pancasila',
                topik: 'Gotong Royong di Lingkungan Sekitar',
                jenjangKelas: 'Kelas 5',
                resolvedCP: 'Peserta didik memahami pentingnya gotong royong dalam keberagaman.',
                hotsRatio: '20:30:50',
                isGambarEnabled: true
            });

            expect(prompt).toContain('Pendidikan Pancasila');
            expect(prompt).toContain('Gotong Royong di Lingkungan Sekitar');
            expect(prompt).toContain('Peserta didik memahami pentingnya gotong royong dalam keberagaman.');
            expect(prompt).toContain('"pg": [');
            expect(prompt).toContain('"indikator":');
            expect(prompt).toContain('"level":');
        });

        it('should build structured prompt for Isian & Uraian with cognitive complexity', () => {
            const prompt = buildAssessmentPrompt({
                type: 'isian',
                startNo: 11,
                count: 5,
                totalPrevPG: 10,
                totalIsian: 5,
                totalUraian: 2,
                mataPelajaran: 'Matematika',
                topik: 'Pecahan Senilai',
                jenjangKelas: 'Kelas 4',
                resolvedCP: 'Peserta didik dapat membandingkan pecahan senilai.',
                isianType: 'Standard'
            });

            expect(prompt).toContain('"isian":');
            expect(prompt).toContain('"uraian":');
            expect(prompt).toContain('Pecahan Senilai');
        });
    });

    describe('calculateTimeDistribution & buildRppPrompt', () => {
        it('should calculate accurate time distributions for 2 x 35 minutes', () => {
            const result = calculateTimeDistribution('2 x 35 Menit');
            expect(result.totalMinutes).toBe(70);
            expect(result.breakdown.pendahuluan).toBe(5);
            expect(result.breakdown.mindful).toBe(15);
            expect(result.breakdown.meaningful).toBe(30);
            expect(result.timeDist.pen).toBe('5 Menit');
        });

        it('should build complete RPP Merdeka Deep Learning prompt referencing BSKAP 046/2025', () => {
            const { totalMinutes, timeDist } = calculateTimeDistribution('2 x 35 Menit');
            const prompt = buildRppPrompt(
                {
                    mataPelajaran: 'IPAS',
                    topik: 'Ekosistem Hutan Hujan Tropis',
                    jenjangKelas: 'Kelas 5',
                    semester: 'Ganjil',
                    strategi: 'Problem Based Learning (PBL)',
                    alokasiWaktu: '2 x 35 Menit',
                    namaGuru: 'Budi Santoso',
                    namaSekolah: 'SDN 1 Wanayasa'
                },
                'Menganalisis hubungan antarkomponen biotik dan abiotik dalam ekosistem.',
                timeDist,
                totalMinutes
            );

            expect(prompt).toContain('Ekosistem Hutan Hujan Tropis');
            expect(prompt).toContain('BSKAP No. 046 Tahun 2025');
            expect(prompt).toContain('Mindful');
            expect(prompt).toContain('Meaningful');
            expect(prompt).toContain('Joyful');
            expect(prompt).toContain('"tujuan_pertemuan"');
            expect(prompt).toContain('"pertemuan"');
        });
    });

    describe('AIService Stream and JSON extraction', () => {
        it('should extract valid JSON using parseAIJson helper', () => {
            const ai = new AIService({} as any);
            const rawOutput = '```json\n{"success": true, "message": "Test streaming successful"}\n```';
            const parsed = ai.parseAIJson(rawOutput);

            expect(parsed).toBeDefined();
            expect(parsed.success).toBe(true);
            expect(parsed.message).toBe('Test streaming successful');
        });

        it('should repair JSON trailing commas and unclosed brackets', () => {
            const ai = new AIService({} as any);
            const malformed = '{"title": "Asesmen Soal", "items": [{"id": 1, "text": "Soal 1"},';
            const parsed = ai.parseAIJson(malformed);

            expect(parsed).toBeDefined();
            expect(parsed.title).toBe('Asesmen Soal');
            expect(parsed.items.length).toBe(1);
        });
        it('should strip <think> blocks from reasoning models before parsing JSON', () => {
            const ai = new AIService({} as any);
            const reasoningOutput = '<think>\nAnalisis materi IPAS Kelas 5:\n1. Kita buat soal PG dengan format JSON { "pg": [...] }\n2. Pastikan HOTS.\n</think>\n```json\n{"pg": [{"no": 1, "soal": "Apa itu ekosistem?"}]}\n```';
            const parsed = ai.parseAIJson(reasoningOutput);

            expect(parsed).toBeDefined();
            expect(parsed.pg).toHaveLength(1);
            expect(parsed.pg[0].soal).toBe('Apa itu ekosistem?');
        });

        it('should configure resilient Sliding Idle Timeout parameters', () => {
            expect(STREAM_INITIAL_TIMEOUT_MS).toBe(60000); // 60s initial response fail-fast (resilient for heavy reasoning models)
            expect(STREAM_IDLE_TIMEOUT_MS).toBe(60000);    // 60s idle sliding per token
            expect(STREAM_MAX_TOTAL_TIMEOUT_MS).toBe(600000); // 10 minutes max ceiling
            expect(STREAM_MAX_TOTAL_TIMEOUT_MS).toBeGreaterThan(STREAM_IDLE_TIMEOUT_MS);
        });

        it('should stream tokens in real-time from OpenAI compatible providers without url error', async () => {
            const ai = new AIService({} as any);
            (ai as any).providers = [
                {
                    id: 11,
                    name: 'awz',
                    slug: 'awz',
                    api_type: 'openai_compat',
                    model: 'deepseek.v3.2',
                    base_url: 'https://bedrock-mantle.us-east-1.api.aws/v1',
                    api_key: 'test-key',
                    is_active: 1,
                    priority: 1,
                    max_tokens: 4096,
                    temperature: 0.7,
                }
            ];

            const tokensReceived: string[] = [];
            const encoder = new TextEncoder();
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"{\\"status\\": "}}]}\n\n'));
                    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"\\"success\\"}"}}]}\n\n'));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            });

            const originalFetch = globalThis.fetch;
            let requestedUrl = '';
            globalThis.fetch = async (input: any, init: any) => {
                requestedUrl = String(input);
                return new Response(mockStream, {
                    status: 200,
                    headers: { 'Content-Type': 'text/event-stream' }
                });
            };

            try {
                const res = await ai.generateTextStream('buat soal', 'awz', true, (token) => {
                    tokensReceived.push(token);
                });

                expect(requestedUrl).toBe('https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions');
                expect(tokensReceived).toEqual(['{"status": ', '"success"}']);
                expect(res.content).toBe('{"status": "success"}');
            } finally {
                globalThis.fetch = originalFetch;
            }
        });

        it('should stream thinking/reasoning_content in real-time during deep reasoning phase', async () => {
            const ai = new AIService({} as any);
            (ai as any).providers = [
                {
                    id: 11,
                    name: 'awz',
                    slug: 'awz',
                    api_type: 'openai_compat',
                    model: 'deepseek.v3.2',
                    base_url: 'https://bedrock-mantle.us-east-1.api.aws/v1',
                    api_key: 'test-key',
                    is_active: 1,
                    priority: 1,
                    max_tokens: 4096,
                    temperature: 0.7,
                    extra_body: { reasoning_effort: 'high' }
                }
            ];

            const tokensReceived: string[] = [];
            const encoder = new TextEncoder();
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"reasoning_content":"Memikirkan langkah 1... "}}]}\n\n'));
                    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"reasoning_content":"Selesai berpikir. "}}]}\n\n'));
                    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"{\\"hasil\\": \\"OK\\"}"}}]}\n\n'));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            });

            const originalFetch = globalThis.fetch;
            globalThis.fetch = async () => {
                return new Response(mockStream, {
                    status: 200,
                    headers: { 'Content-Type': 'text/event-stream' }
                });
            };

            try {
                const res = await ai.generateTextStream('buat soal', 'awz', true, (token) => {
                    tokensReceived.push(token);
                });

                expect(tokensReceived).toEqual(['Memikirkan langkah 1... ', 'Selesai berpikir. ', '{"hasil": "OK"}']);
                expect(res.content).toBe('{"hasil": "OK"}');
            } finally {
                globalThis.fetch = originalFetch;
            }
        });

        it('should stream tokens in real-time from Anthropic Claude providers', async () => {
            const ai = new AIService({} as any);
            (ai as any).providers = [
                {
                    id: 4,
                    name: 'Claude API',
                    slug: 'claude-direct',
                    api_type: 'anthropic',
                    model: 'claude-3-5-sonnet-20241022',
                    base_url: 'https://api.anthropic.com',
                    api_key: 'sk-ant-test',
                    is_active: 1,
                    priority: 1,
                    max_tokens: 4096,
                    temperature: 0.7,
                }
            ];

            const tokensReceived: string[] = [];
            const encoder = new TextEncoder();
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Modul "}}\n\n'));
                    controller.enqueue(encoder.encode('event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Ajar Deep Learning"}}\n\n'));
                    controller.enqueue(encoder.encode('event: message_stop\ndata: {"type":"message_stop"}\n\n'));
                    controller.close();
                }
            });

            const originalFetch = globalThis.fetch;
            globalThis.fetch = async () => {
                return new Response(mockStream, {
                    status: 200,
                    headers: { 'Content-Type': 'text/event-stream' }
                });
            };

            try {
                const res = await ai.generateTextStream('buat modul', 'claude-direct', true, (token) => {
                    tokensReceived.push(token);
                });

                expect(tokensReceived).toEqual(['Modul ', 'Ajar Deep Learning']);
                expect(res.content).toBe('Modul Ajar Deep Learning');
            } finally {
                globalThis.fetch = originalFetch;
            }
        });

        it('should stream tokens in real-time from AWS Bedrock EventStream frames', async () => {
            const ai = new AIService({} as any);
            (ai as any).providers = [
                {
                    id: 3,
                    name: 'Claude Bedrock',
                    slug: 'claude-anthropic',
                    api_type: 'bedrock',
                    model: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
                    base_url: 'https://bedrock-runtime.us-east-1.amazonaws.com',
                    api_key: 'test-bedrock-token',
                    is_active: 1,
                    priority: 1,
                    max_tokens: 4096,
                    temperature: 0.7,
                }
            ];

            const tokensReceived: string[] = [];
            const encoder = new TextEncoder();

            // Simulate 2 Bedrock EventStream binary chunks containing {"bytes": "<base64>"}
            const b64Part1 = btoa(JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Materi ' } }));
            const b64Part2 = btoa(JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'KPK Kelas 5' } }));

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`\x00\x00\x00d\x00\x00\x00:{"bytes":"${b64Part1}"}\x00\x00\x00\x00`));
                    controller.enqueue(encoder.encode(`\x00\x00\x00d\x00\x00\x00:{"bytes":"${b64Part2}"}\x00\x00\x00\x00`));
                    controller.close();
                }
            });

            const originalFetch = globalThis.fetch;
            globalThis.fetch = async () => {
                return new Response(mockStream, {
                    status: 200,
                    headers: { 'Content-Type': 'application/vnd.amazon.eventstream' }
                });
            };

            try {
                const res = await ai.generateTextStream('buat RPP', 'claude-anthropic', true, (token) => {
                    tokensReceived.push(token);
                });

                expect(tokensReceived).toEqual(['Materi ', 'KPK Kelas 5']);
                expect(res.content).toBe('Materi KPK Kelas 5');
            } finally {
                globalThis.fetch = originalFetch;
            }
        });
    });
});

