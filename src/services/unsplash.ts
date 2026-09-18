type UnsplashEnv = {
    UNSPLASH_ACCESS_KEY?: string;
    UNSPLASH_API_KEY?: string;
    AI?: any;
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
    source: 'unsplash' | 'cloudflare-ai';
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

export class UnsplashService {
    private accessKey?: string;
    private cfAi?: any;

    constructor(env: UnsplashEnv) {
        this.accessKey = env.UNSPLASH_ACCESS_KEY || env.UNSPLASH_API_KEY;
        this.cfAi = env.AI;
    }

    isConfigured(): boolean {
        return true;
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

        // 1. Prioritas Utama: Wikimedia Commons & Wikipedia (Foto/Diagram Otentik Resmi untuk semua materi)
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

        // 2. Prioritas Kedua: Generasi AI Diagram Presisi (FLUX / Cloudflare AI) dengan Prompt Bahasa Inggris Terstruktur
        const visualPrompt = (englishVisualPrompt && englishVisualPrompt.trim().length > 10)
            ? `${englishVisualPrompt.replace(/[^\w\s-,.]/g, '').trim()}, educational textbook style, clean white background, 2D scientific vector diagram, high contrast, sharp details, no blur`
            : `clear 2d educational textbook diagram of ${cleanQuery}, labeled science illustration, clean white background, simple vector art, high contrast, sharp details, for school exam, no blur`;

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
