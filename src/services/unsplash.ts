import { decrypt, isEncrypted } from '../lib/crypto';
import { ASSESSMENT_ASSET_MAX_BYTES } from '../lib/assessment-assets';
import { parseKeyPool } from './ai';

type UnsplashEnv = {
    VULTR_API_KEY?: string;
    VULTR_BASE_URL?: string;
    VULTR_IMAGE_MODEL?: string;
    DB?: any;
    [key: string]: any;
};

export interface UnsplashImagePayload {
    source: 'unsplash' | 'vultr-ai';
    url: string;
    alt: string;
    query: string;
    creditName: string;
    creditUrl: string;
    unsplashId: string;
}

function base64ImageDataUrl(value: unknown): string | null {
    const maxEncodedLength = Math.ceil(ASSESSMENT_ASSET_MAX_BYTES / 3) * 4;
    if (typeof value !== 'string' || !value || value.length > maxEncodedLength
        || value.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
        return null;
    }

    const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
    const byteLength = Math.floor(value.length * 3 / 4) - padding;
    if ((padding && value.length % 4 !== 0) || byteLength < 3 || byteLength > ASSESSMENT_ASSET_MAX_BYTES) {
        return null;
    }

    try {
        const tail = value.slice(-(value.length % 4 || 4));
        if (btoa(atob(tail)).replace(/=+$/, '') !== tail.replace(/=+$/, '')) return null;

        const signature = atob(value.slice(0, 16));
        let mime: string;
        if (signature.startsWith('\x89PNG\r\n\x1a\n')) {
            mime = 'image/png';
        } else if (signature.startsWith('\xff\xd8\xff')) {
            mime = 'image/jpeg';
        } else if (signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP') {
            mime = 'image/webp';
        } else {
            return null;
        }
        return `data:${mime};base64,${value}`;
    } catch {
        return null;
    }
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
        const res = await fetch(idWikiUrl, { headers: { 'User-Agent': 'RuangKKG/2.0 (education)' } });
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

        // 1b. Query Wikipedia Bahasa Inggris (Sangat efektif untuk diagram sains, anatomi, astronomi dengan kata kunci Inggris)
        const enWikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;
        const enRes = await fetch(enWikiUrl, { headers: { 'User-Agent': 'RuangKKG/2.0 (education)' } });
        if (enRes.ok) {
            const enData = await enRes.json() as any;
            const enPages = enData?.query?.pages;
            if (enPages) {
                const pageList = Object.values(enPages) as any[];
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
        const commRes = await fetch(commonsUrl, { headers: { 'User-Agent': 'RuangKKG/2.0 (education)' } });
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
    } catch {
        console.warn('Wikimedia image search note: request failed');
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
    private env: any;
    private db?: any;

    constructor(env: UnsplashEnv, db?: any) {
        this.env = env || {};
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
                    `SELECT * FROM ai_providers WHERE (capability = 'image' OR model LIKE '%z-image%' OR model LIKE '%flux%' OR model LIKE '%dall-e%') AND is_active = 1 ORDER BY priority ASC LIMIT 1`
                ).first();

                if (row?.api_key) {
                    let key = row.api_key;
                    if (isEncrypted(key)) {
                        key = await decrypt(key, this.env);
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
            } catch {
                console.warn('[VULTR-IMAGE] ai_providers lookup note: lookup failed');
            }

            // 3. Check settings table
            try {
                const settingRow: any = await this.db.prepare(
                    `SELECT value FROM settings WHERE key = 'vultr_api_key' LIMIT 1`
                ).first();
                if (settingRow?.value) {
                    let key = settingRow.value;
                    if (isEncrypted(key)) {
                        key = await decrypt(key, this.env);
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
            } catch {
                console.warn('[VULTR-IMAGE] settings lookup note: lookup failed');
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
                    response_format: 'url'
                }),
                signal: AbortSignal.timeout(25000)
            });

            if (!res.ok) {
                console.warn(`[VULTR-IMAGE] Error ${res.status}`);
                await res.body?.cancel();
                return null;
            }

            const data: any = await res.json();
            const imgItem = data?.data?.[0];
            let finalUrl: string | null = null;

            if (typeof imgItem?.url === 'string' && imgItem.url) {
                finalUrl = imgItem.url;
            } else {
                finalUrl = base64ImageDataUrl(imgItem?.b64_json);
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
        } catch {
            console.warn('[VULTR-IMAGE] Exception: generation failed');
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

        // 2. Prioritas Kedua: Wikimedia Commons & Wikipedia (Foto/Diagram Otentik Resmi — khusus tokoh sejarah, candi, peta)
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

        // Cloudflare FLUX & Unsplash dihapus — hasilnya sering tidak relevan untuk konteks pendidikan Indonesia.
        // Jika Vultr dan Wikimedia tidak menghasilkan gambar, lebih baik soal tanpa gambar daripada gambar kacau.
        return null;
    }
}
