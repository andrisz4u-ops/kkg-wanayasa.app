type UnsplashEnv = {
    UNSPLASH_ACCESS_KEY?: string;
    UNSPLASH_API_KEY?: string;
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
    source: 'unsplash';
    url: string;
    alt: string;
    query: string;
    creditName: string;
    creditUrl: string;
    unsplashId: string;
}

export class UnsplashService {
    private accessKey?: string;

    constructor(env: UnsplashEnv) {
        this.accessKey = env.UNSPLASH_ACCESS_KEY || env.UNSPLASH_API_KEY;
    }

    isConfigured(): boolean {
        return Boolean(this.accessKey);
    }

    async searchImage(query: string, fallbackAlt: string): Promise<UnsplashImagePayload | null> {
        if (!this.accessKey) {
            return null;
        }

        const searchUrl = new URL('https://api.unsplash.com/search/photos');
        searchUrl.searchParams.set('query', query);
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

        if (!response.ok) {
            return null;
        }

        const payload = await response.json() as UnsplashSearchResponse;
        const first = payload.results?.find((item) => item.urls?.regular && item.user?.name && item.user?.links?.html);

        if (!first?.urls?.regular || !first.user?.name || !first.user?.links?.html) {
            return null;
        }

        const creditUrl = new URL(first.user.links.html);
        creditUrl.searchParams.set('utm_source', 'kkg_slide_generator');
        creditUrl.searchParams.set('utm_medium', 'referral');

        const alt = (first.alt_description || first.description || fallbackAlt || 'Gambar pembelajaran').slice(0, 180);

        return {
            source: 'unsplash',
            url: first.urls.regular,
            alt,
            query,
            creditName: first.user.name,
            creditUrl: creditUrl.toString(),
            unsplashId: first.id,
        };
    }
}
