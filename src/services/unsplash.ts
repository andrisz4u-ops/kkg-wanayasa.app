import { decrypt, isEncrypted } from '../lib/crypto';
import { parseKeyPool } from './ai';

type UnsplashEnv = {
    UNSPLASH_ACCESS_KEY?: string;
    UNSPLASH_API_KEY?: string;
    VULTR_API_KEY?: string;
    VULTR_BASE_URL?: string;
    VULTR_IMAGE_MODEL?: string;
    AI?: any;
    DB?: any;
    [key: string]: any;
};

type UnsplashSearchResponse = {
    results?: Array<{
        id: string;
        alt_description?: string | null;
        description?: string | null;
        urls?: {
            regular?: string;
        };
        user?: {
            name?: string;
            links?: {
                html?: string;
            };
        };
    }>;
};

export interface UnsplashImagePayload {
    source: 'unsplash' | 'cloudflare-ai' | 'vultr-ai';
    url: string;
    alt: string;
    query: string;
    creditName: string;
    creditUrl: string;
    unsplashId: string;
}

function extractCoreKeyword(text: string): string {
    const stopwords = new Set([
        'yang', 'di', 'ke', 'dari', 'dan', 'untuk', 'pada', 'adalah', 'sedang',
        'dengan', 'ini', 'itu', 'sebuah', 'suatu', 'oleh', 'karena', 'gambar',
        'berikut', 'menunjukkan', 'tersebut', 'amatilah', 'perhatikan', 'soal',
        'nomor', 'manakah', 'apakah', 'bagaimanakah', 'tuliskan', 'sebutkan',
        'pilihan', 'pertanyaan', 'diagram', 'ilustrasi', 'foto', 'bagan'
    ]);
    const words = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w));
    
    return words.slice(0, 3).join(' ');
}

/**
 * Helper: Search Wikipedia & Wikimedia Commons for authentic historical photos,
 * Indonesian national heroes, cultural heritage sites, real maps, and biology/nature specimens.
 */
async function searchWikimediaImage(query: string, excludeUrls?: Set<string>): Promise<{ url: string; creditName: string } | null> {
    try {
        const rawClean = query.replace(/[\[\]]/g, '').trim();
        const extracted = extractCoreKeyword(rawClean);
        const cleanQuery = extracted || rawClean.replace(/[^\w\s-]/g, '').trim();

        // Validasi ketat: Cegah pencarian frasa instruksi/debris soal ke Wikipedia (mencegah bug Jane Austen)
        const genericBlocklist = new Set([
            'perhatikan gambar', 'gambar berikut', 'perhatikan gambar berikut',
            'perhatikan', 'gambar', 'berikut', 'amatilah', 'diagram', 'ilustrasi',
            'soal', 'nomor', 'pertanyaan', 'manakah', 'apakah', 'pilihan',
            'educational diagram', 'diagram alur', 'flowchart', 'skema', 'pola'
        ]);
        if (!cleanQuery || cleanQuery.length < 3 || genericBlocklist.has(cleanQuery.toLowerCase())) {
            return null;
        }

        // 1. Query Wikipedia Bahasa Indonesia (Prioritas untuk sejarah, tokoh, & tempat Indonesia)
        const idWikiUrl = `https://id.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;
        const res = await fetch(idWikiUrl, { headers: { 'User-Agent': 'KKGWanayasa/2.0 (edtech; contact@kkgwanayasa.id)' } });
        if (res.ok) {
            const data = await res.json() as any;
            const pages = data?.query?.pages;
            if (pages) {
                const pageList = Object.values(pages) as any[];
                pageList.sort((a, b) => (a.index || 99) - (b.index || 99));
                for (const page of pageList) {
                    const src = page.thumbnail?.source;
                    if (src) {
                        const cleanSrc = src.split('?')[0];
                        if (excludeUrls && (excludeUrls.has(src) || excludeUrls.has(cleanSrc))) continue;
                        return {
                            url: src,
                            creditName: `Wikimedia Commons (${page.title})`
                        };
                    }
                }
            }
        }

        // 2. Query Wikimedia Commons langsung
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`;
        const commRes = await fetch(commonsUrl, { headers: { 'User-Agent': 'KKGWanayasa/2.0 (edtech; contact@kkgwanayasa.id)' } });
        if (commRes.ok) {
            const commData = await commRes.json() as any;
            const commPages = commData?.query?.pages;
            if (commPages) {
                const pageList = Object.values(commPages) as any[];
                pageList.sort((a, b) => (a.index || 99) - (b.index || 99));
                for (const page of pageList) {
                    const imgInfo = page?.imageinfo?.[0];
                    const candidateUrl = imgInfo?.thumburl || imgInfo?.url;
                    if (candidateUrl) {
                        const cleanCand = candidateUrl.split('?')[0];
                        if (excludeUrls && (excludeUrls.has(candidateUrl) || excludeUrls.has(cleanCand))) continue;
                        return {
                            url: candidateUrl,
                            creditName: 'Wikimedia Commons'
                        };
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Wikimedia image search note:', e);
    }
    return null;
}

/**
 * Helper: Identifikasi apakah kata kunci merujuk pada pahlawan nasional, tokoh sejarah, atau situs bersejarah
 */
function isHistoricalFigureOrPlace(query: string, subjectContext?: string): boolean {
    const text = `${query} ${subjectContext || ''}`.toLowerCase();
    const heroTerms = [
        'pahlawan', 'tokoh', 'bpupki', 'ppki', 'presiden', 'wakil presiden',
        'soekarno', 'sukarno', 'hatta', 'yamin', 'soepomo', 'supomo',
        'dewantara', 'kartini', 'sudirman', 'soedirman', 'diponegoro',
        'hasyim', 'wahid hasyim', 'agus salim', 'syahrir', 'sjahrir',
        'fatmawati', 'sayuti melik', 'latief hendraningrat', 'tan malaka',
        'cut nyak', 'pattimura', 'imam bonjol', 'hasanuddin',
        'raden ajeng', 'wr supratman', 'sam ratulangi', 'candi', 'borobudur',
        'prambanan', 'monas', 'rengasdengklok'
    ];
    return heroTerms.some(term => text.includes(term));
}

export class UnsplashService {
    private accessKey?: string;
    private cfAi?: any;
    private env: any;
    private db?: any;

    constructor(env: UnsplashEnv, db?: any) {
        this.env = env || {};
        this.accessKey = env?.UNSPLASH_ACCESS_KEY || env?.UNSPLASH_API_KEY;
        this.cfAi = env?.AI;
        this.db = db || env?.DB;
    }

    isConfigured(): boolean {
        return true;
    }

    /**
     * Resolves Vultr Serverless Inference API config from environment, active ai_providers, or settings.
     */
    private async getVultrConfig(): Promise<{ apiKey: string; baseUrl: string; model: string } | null> {
        // 1. Direct environment variable
        if (this.env?.VULTR_API_KEY) {
            return {
                apiKey: this.env.VULTR_API_KEY.trim(),
                baseUrl: this.env.VULTR_BASE_URL || 'https://api.vultrinference.com/v1',
                model: this.env.VULTR_IMAGE_MODEL || 'z-image-turbo'
            };
        }

        if (this.db) {
            // 2. Check active provider in ai_providers table (from Admin Provider UI)
            try {
                const row: any = await this.db.prepare(
                    `SELECT * FROM ai_providers WHERE (slug LIKE '%vultr%' OR model LIKE '%z-image%' OR name LIKE '%vultr%') AND is_active = 1 ORDER BY priority ASC LIMIT 1`
                ).first();

                if (row?.api_key) {
                    let key = row.api_key;
                    if (isEncrypted(key)) {
                        try {
                            key = await decrypt(key, this.env);
                        } catch (e) {
                            console.warn('[VULTR-IMAGE] Decrypt failed:', e);
                        }
                    }
                    const keys = parseKeyPool(key);
                    if (keys.length > 0 && keys[0]) {
                        return {
                            apiKey: keys[0],
                            baseUrl: row.base_url || 'https://api.vultrinference.com/v1',
                            model: row.model || 'z-image-turbo'
                        };
                    }
                }
            } catch (dbErr) {
                console.warn('[VULTR-IMAGE] ai_providers lookup note:', dbErr);
            }

            // 3. Check settings table
            try {
                const settingRow: any = await this.db.prepare(
                    `SELECT value FROM settings WHERE key = 'vultr_api_key' LIMIT 1`
                ).first();
                if (settingRow?.value) {
                    let key = settingRow.value;
                    if (isEncrypted(key)) {
                        try {
                            key = await decrypt(key, this.env);
                        } catch {}
                    }
                    const keys = parseKeyPool(key);
                    if (keys.length > 0 && keys[0]) {
                        return {
                            apiKey: keys[0],
                            baseUrl: 'https://api.vultrinference.com/v1',
                            model: 'z-image-turbo'
                        };
                    }
                }
            } catch (setErr) {
                console.warn('[VULTR-IMAGE] settings lookup note:', setErr);
            }
        }

        return null;
    }

    /**
     * Generates an educational stimulus image via Vultr Serverless Inference (Z-Image Turbo)
     */
    private async generateVultrImage(
        cleanQuery: string,
        visualPrompt: string,
        fallbackAlt: string,
        excludeUrls?: Set<string>
    ): Promise<UnsplashImagePayload | null> {
        const config = await this.getVultrConfig();
        if (!config || !config.apiKey) return null;

        try {
            const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
            const endpoint = cleanBaseUrl.endsWith('/images/generations')
                ? cleanBaseUrl
                : `${cleanBaseUrl}/images/generations`;

            const promptText = (visualPrompt && visualPrompt.length > 10)
                ? `${visualPrompt}, educational textbook illustration, clean white background, 2D vector style, high contrast, sharp details, for school exam, no blur`
                : `clear 2d educational textbook illustration of ${cleanQuery}, labeled science illustration, clean white background, simple vector art, high contrast, sharp details, for school exam, no blur`;

            const startTime = Date.now();
            console.log(`[VULTR-AI] Mengirim permintaan generate gambar ke Vultr Serverless (${config.model || 'z-image-turbo'}) untuk: "${cleanQuery}"...`);

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    prompt: promptText.slice(0, 1500),
                    model: config.model || 'z-image-turbo',
                    size: '512x512',
                    response_format: 'b64_json'
                }),
                signal: AbortSignal.timeout(25000)
            });

            if (!res.ok) {
                const errText = await res.text();
                console.warn(`[VULTR-IMAGE] Error ${res.status}: ${errText.substring(0, 200)}`);
                return null;
            }

            const data: any = await res.json();
            const imgItem = data?.data?.[0];
            let finalUrl: string | null = null;

            if (imgItem?.b64_json) {
                finalUrl = `data:image/jpeg;base64,${imgItem.b64_json}`;
            } else if (imgItem?.url) {
                finalUrl = imgItem.url;
            }

            const durationMs = Date.now() - startTime;
            if (finalUrl && (!excludeUrls || !excludeUrls.has(finalUrl))) {
                console.log(`[VULTR-AI] ✓ Berhasil generate stimulus gambar (${config.model}) dalam ${durationMs}ms`);
                return {
                    source: 'vultr-ai',
                    url: finalUrl,
                    alt: fallbackAlt || cleanQuery,
                    query: cleanQuery,
                    creditName: `Vultr Serverless (${config.model || 'Z-Image Turbo'})`,
                    creditUrl: 'https://www.vultr.com/products/serverless-inference/',
                    unsplashId: `vultr_${Date.now()}`
                };
            }
        } catch (e) {
            console.warn('[VULTR-IMAGE] Exception:', e);
        }
        return null;
    }

    async searchImage(
        query: string,
        fallbackAlt: string,
        subjectContext?: string,
        englishVisualPrompt?: string,
        excludeUrls?: Set<string>,
        excludeIds?: Set<string>
    ): Promise<UnsplashImagePayload | null> {
        const cleanQuery = query.replace(/[^\w\s-]/g, '').trim();

        // Generic blocklist: JANGAN PERNAH fallback ke 'educational diagram' atau kata generik!
        // Kata generik di Unsplash selalu menghasilkan foto buku Rusia bergambar sirkuit (Andrey Sizov)
        const genericBlocklist = new Set([
            'educational diagram', 'diagram', 'diagram alur', 'foto', 'gambar',
            'soal', 'materi', 'asesmen', 'ujian', 'pelajaran', 'ilustrasi',
            'flowchart', 'skema', 'pola', 'pola warna', 'pola gambar', 'chart'
        ]);

        if (!cleanQuery || cleanQuery.length < 3 || genericBlocklist.has(cleanQuery.toLowerCase())) {
            return null;
        }

        const visualPrompt = (englishVisualPrompt && englishVisualPrompt.trim().length > 10)
            ? `${englishVisualPrompt.replace(/[^\w\s-,.]/g, '').trim()}, educational textbook style, clean white background, 2D scientific vector diagram, high contrast, sharp details, no blur`
            : `clear 2d educational textbook diagram of ${cleanQuery}, labeled science illustration, clean white background, simple vector art, high contrast, sharp details, for school exam, no blur`;

        const isHistoryOrHero = isHistoricalFigureOrPlace(cleanQuery, subjectContext);

        // Jika pahlawan/tokoh sejarah/candi: utamakan foto arsip otentik Wikimedia agar wajah tokoh 100% akurat & tidak terdistorsi AI generatif
        if (isHistoryOrHero) {
            const wikiImg = await searchWikimediaImage(cleanQuery, excludeUrls);
            if (wikiImg) {
                return {
                    source: 'unsplash',
                    url: wikiImg.url,
                    alt: fallbackAlt || cleanQuery,
                    query: cleanQuery,
                    creditName: wikiImg.creditName,
                    creditUrl: 'https://commons.wikimedia.org',
                    unsplashId: `wiki_${Date.now()}`
                };
            }
        }

        // 1. Prioritas Utama: Generasi AI Vultr Serverless (Z-Image Turbo) jika aktif (sangat cocok untuk sains, situasi sosial, ilustrasi tematik)
        const vultrImg = await this.generateVultrImage(cleanQuery, visualPrompt, fallbackAlt, excludeUrls);
        if (vultrImg) {
            return vultrImg;
        }

        // 2. Prioritas Kedua: Wikimedia Commons & Wikipedia (Foto/Diagram Otentik Resmi jika Vultr tidak aktif)
        const wikiImg = await searchWikimediaImage(cleanQuery, excludeUrls);
        if (wikiImg) {
            return {
                source: 'unsplash',
                url: wikiImg.url,
                alt: fallbackAlt || cleanQuery,
                query: cleanQuery,
                creditName: wikiImg.creditName,
                creditUrl: 'https://commons.wikimedia.org',
                unsplashId: `wiki_${Date.now()}`
            };
        }

        // 3. Prioritas Ketiga: Cloudflare Workers AI (FLUX / SDXL)

        if (this.cfAi && typeof this.cfAi.run === 'function') {
            try {
                const cfResult: any = await this.cfAi.run('@cf/black-forest-labs/flux-1-schnell', {
                    prompt: visualPrompt,
                    steps: 4,
                }).catch(() => {
                    return this.cfAi.run('@cf/bytedance/stable-diffusion-xl-lightning', {
                        prompt: visualPrompt,
                        steps: 4,
                    });
                });

                if (cfResult) {
                    let bytes: Uint8Array | null = null;
                    if (cfResult instanceof Uint8Array) {
                        bytes = cfResult;
                    } else if (cfResult instanceof ArrayBuffer) {
                        bytes = new Uint8Array(cfResult);
                    } else if (typeof cfResult.getReader === 'function') {
                        const reader = cfResult.getReader();
                        const chunks: Uint8Array[] = [];
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            if (value) chunks.push(value);
                        }
                        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
                        bytes = new Uint8Array(totalLen);
                        let offset = 0;
                        for (const c of chunks) {
                            bytes.set(c, offset);
                            offset += c.length;
                        }
                    } else if (typeof cfResult === 'string' && cfResult.startsWith('data:')) {
                        if (!excludeUrls || !excludeUrls.has(cfResult)) {
                            return {
                                source: 'cloudflare-ai',
                                url: cfResult,
                                alt: fallbackAlt || cleanQuery,
                                query: cleanQuery,
                                creditName: 'Cloudflare Workers AI (FLUX)',
                                creditUrl: 'https://developers.cloudflare.com/workers-ai/',
                                unsplashId: `cf_${Date.now()}`
                            };
                        }
                    }

                    if (bytes && bytes.length > 0) {
                        let binary = '';
                        const len = bytes.byteLength;
                        for (let i = 0; i < len; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const base64 = btoa(binary);
                        const dataUrl = `data:image/jpeg;base64,${base64}`;
                        if (!excludeUrls || !excludeUrls.has(dataUrl)) {
                            return {
                                source: 'cloudflare-ai',
                                url: dataUrl,
                                alt: fallbackAlt || cleanQuery,
                                query: cleanQuery,
                                creditName: 'Cloudflare Workers AI (FLUX)',
                                creditUrl: 'https://developers.cloudflare.com/workers-ai/',
                                unsplashId: `cf_${Date.now()}`
                            };
                        }
                    }
                }
            } catch (cfErr) {
                console.warn('Cloudflare Workers AI image run note (proceeding to visual engine):', cfErr);
            }
        }

        // 3. Prioritas Ketiga: Unsplash API resmi jika token terkonfigurasi
        if (this.accessKey) {
            try {
                const searchUrl = new URL('https://api.unsplash.com/search/photos');
                searchUrl.searchParams.set('query', cleanQuery);
                searchUrl.searchParams.set('page', '1');
                searchUrl.searchParams.set('per_page', '15');
                searchUrl.searchParams.set('orientation', 'landscape');
                searchUrl.searchParams.set('content_filter', 'high');

                const response = await fetch(searchUrl.toString(), {
                    headers: {
                        Authorization: `Client-ID ${this.accessKey}`,
                        'Accept-Version': 'v1',
                    },
                });

                if (response.ok) {
                    const payload = await response.json() as UnsplashSearchResponse;

                    // Helper: filter out irrelevant stock polluters
                    const isStockPolluter = (item: any): boolean => {
                        const uName = (item.user?.name || '').toLowerCase();
                        const uUsername = (item.user?.username || '').toLowerCase();
                        const desc = `${item.description || ''} ${item.alt_description || ''}`.toLowerCase();

                        // Blocklist Andrey Sizov Russian technical diagram photo
                        if (uName.includes('андрей') || uName.includes('сизов') || uName.includes('andrey sizov') || uUsername.includes('asizov')) {
                            return true;
                        }
                        // Blocklist Cyrillic/Russian textbook pages
                        if (/[\u0400-\u04FF]/.test(desc) || /[\u0400-\u04FF]/.test(uName)) {
                            return true;
                        }
                        // Blocklist generic circuit boards / schematics unless question explicitly asks for electrical circuit
                        const isCircuit = desc.includes('circuit') || desc.includes('schematic') || desc.includes('blueprint') || desc.includes('diagram');
                        const queryAllowsCircuit = /listrik|rangkaian|elektronika|circuit/i.test(cleanQuery);
                        if (isCircuit && !queryAllowsCircuit) {
                            return true;
                        }
                        return false;
                    };

                    const candidate = payload.results?.find((item) => {
                        if (!item.urls?.regular || !item.user?.name || !item.user?.links?.html) return false;
                        const cleanUrl = item.urls.regular.split('?')[0];
                        if (excludeUrls && (excludeUrls.has(item.urls.regular) || excludeUrls.has(cleanUrl))) return false;
                        if (excludeIds && excludeIds.has(item.id)) return false;
                        if (isStockPolluter(item)) return false;
                        return true;
                    });

                    if (candidate?.urls?.regular && candidate.user?.name && candidate.user?.links?.html) {
                        const creditUrl = new URL(candidate.user.links.html);
                        creditUrl.searchParams.set('utm_source', 'kkg_slide_generator');
                        creditUrl.searchParams.set('utm_medium', 'referral');

                        const alt = (candidate.alt_description || candidate.description || fallbackAlt || 'Gambar pembelajaran').slice(0, 180);

                        return {
                            source: 'unsplash',
                            url: candidate.urls.regular,
                            alt,
                            query: cleanQuery,
                            creditName: candidate.user.name,
                            creditUrl: creditUrl.toString(),
                            unsplashId: candidate.id,
                        };
                    }
                }
            } catch (err) {
                console.warn('Unsplash API search error:', err);
            }
        }

        // Jika tidak ditemukan gambar otentik dari Wikimedia Commons, Cloudflare AI, atau Unsplash, kembalikan null
        // Jangan gunakan URL generator acak yang lambat/gagal CORS demi kebersihan naskah ujian
        return null;
    }
}
