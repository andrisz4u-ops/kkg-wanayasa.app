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

/**
 * Helper: Search Wikipedia & Wikimedia Commons for authentic historical photos,
 * Indonesian national heroes, cultural heritage sites, real maps, and biology/nature specimens.
 */
async function searchWikimediaImage(query: string): Promise<{ url: string; creditName: string } | null> {
    try {
        const cleanQuery = query.replace(/[\[\]]/g, '').trim();

        // 1. Query Wikipedia Bahasa Indonesia (Prioritas untuk sejarah, tokoh, & tempat Indonesia)
        const idWikiUrl = `https://id.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;
        const res = await fetch(idWikiUrl, { headers: { 'User-Agent': 'KKGWanayasa/2.0 (edtech; contact@kkgwanayasa.id)' } });
        if (res.ok) {
            const data = await res.json() as any;
            const pages = data?.query?.pages;
            if (pages) {
                for (const pId of Object.keys(pages)) {
                    const page = pages[pId];
                    if (page.thumbnail?.source) {
                        return {
                            url: page.thumbnail.source,
                            creditName: `Wikimedia Commons (${page.title})`
                        };
                    }
                }
            }
        }

        // 2. Query Wikimedia Commons langsung
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`;
        const commRes = await fetch(commonsUrl, { headers: { 'User-Agent': 'KKGWanayasa/2.0 (edtech; contact@kkgwanayasa.id)' } });
        if (commRes.ok) {
            const commData = await commRes.json() as any;
            const commPages = commData?.query?.pages;
            if (commPages) {
                for (const pId of Object.keys(commPages)) {
                    const imgInfo = commPages[pId]?.imageinfo?.[0];
                    if (imgInfo?.thumburl || imgInfo?.url) {
                        return {
                            url: imgInfo.thumburl || imgInfo.url,
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

    async searchImage(query: string, fallbackAlt: string, subjectContext?: string, englishVisualPrompt?: string): Promise<UnsplashImagePayload | null> {
        const cleanQuery = query.replace(/[^\w\s-]/g, '').trim() || 'educational diagram';

        // 1. Prioritas Utama: Wikimedia Commons & Wikipedia (Foto/Diagram Otentik Resmi untuk semua materi)
        if (cleanQuery.length >= 3) {
            const wikiImg = await searchWikimediaImage(cleanQuery);
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

                    if (bytes && bytes.length > 0) {
                        let binary = '';
                        const len = bytes.byteLength;
                        for (let i = 0; i < len; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const base64 = btoa(binary);
                        return {
                            source: 'cloudflare-ai',
                            url: `data:image/jpeg;base64,${base64}`,
                            alt: fallbackAlt || cleanQuery,
                            query: cleanQuery,
                            creditName: 'Cloudflare Workers AI (FLUX)',
                            creditUrl: 'https://developers.cloudflare.com/workers-ai/',
                            unsplashId: `cf_${Date.now()}`
                        };
                    }
                }
            } catch (cfErr) {
                console.warn('Cloudflare Workers AI image run note (proceeding to visual engine):', cfErr);
            }
        }

        // 3. Prioritas Ketiga: Educational Visual Engine (FLUX.1 via Pollinations dengan prompt bahasa Inggris tajam)
        try {
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=400&height=400&nologo=true`;

            return {
                source: 'unsplash',
                url: fallbackUrl,
                alt: (fallbackAlt || cleanQuery).slice(0, 180),
                query: cleanQuery,
                creditName: 'Educational Visual Engine',
                creditUrl: 'https://pollinations.ai',
                unsplashId: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
            };
        } catch (err) {
            console.warn('Visual engine fallback note (proceeding to unsplash):', err);
        }

        // 4. Prioritas Keempat: Unsplash API sebagai cadangan darurat
        if (this.accessKey) {
            try {
                const searchUrl = new URL('https://api.unsplash.com/search/photos');
                searchUrl.searchParams.set('query', cleanQuery);
                searchUrl.searchParams.set('page', '1');
                searchUrl.searchParams.set('per_page', '10');
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
                    const first = payload.results?.find((item) => item.urls?.regular && item.user?.name && item.user?.links?.html);

                    if (first?.urls?.regular && first.user?.name && first.user?.links?.html) {
                        const creditUrl = new URL(first.user.links.html);
                        creditUrl.searchParams.set('utm_source', 'kkg_slide_generator');
                        creditUrl.searchParams.set('utm_medium', 'referral');

                        const alt = (first.alt_description || first.description || fallbackAlt || 'Gambar pembelajaran').slice(0, 180);

                        return {
                            source: 'unsplash',
                            url: first.urls.regular,
                            alt,
                            query: cleanQuery,
                            creditName: first.user.name,
                            creditUrl: creditUrl.toString(),
                            unsplashId: first.id,
                        };
                    }
                }
            } catch (err) {
                console.warn('Unsplash API search error:', err);
            }
        }

        return null;
    }
}
