/**
 * Image Lazy Loading Utilities for Frontend
 * Progressive image loading with blur placeholder
 */

const PLACEHOLDER_BLUR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3C/svg%3E';

/**
 * Generate a low-quality placeholder image
 */
export function generatePlaceholder(width: number = 400, height: number = 300, color: string = '#e2e8f0'): string {
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3Crect fill="${encodeURIComponent(color)}" width="${width}" height="${height}"/%3E%3C/svg%3E`;
}

/**
 * Create a blur hash placeholder (simplified version)
 */
export function createBlurPlaceholder(hash: string = ''): string {
    if (!hash) return PLACEHOLDER_BLUR;
    // In production, use blurhash library for better results
    return PLACEHOLDER_BLUR;
}

/**
 * Lazy load image with IntersectionObserver
 */
export function setupLazyLoading(
    selector: string = 'img[data-src]',
    options: IntersectionObserverInit = {}
): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return;
    }

    const defaultOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: '50px 0px',
        threshold: 0.01,
        ...options
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                const src = img.dataset.src;
                const srcset = img.dataset.srcset;

                if (src) {
                    img.src = src;
                }
                if (srcset) {
                    img.srcset = srcset;
                }

                img.classList.remove('lazy');
                img.classList.add('lazy-loaded');
                obs.unobserve(img);
            }
        });
    }, defaultOptions);

    document.querySelectorAll(selector).forEach(img => {
        observer.observe(img);
    });
}

/**
 * Image component HTML generator
 */
export function createLazyImage(
    src: string,
    alt: string,
    options: {
        width?: number;
        height?: number;
        className?: string;
        placeholder?: string;
    } = {}
): string {
    const {
        width = 400,
        height = 300,
        className = '',
        placeholder = PLACEHOLDER_BLUR
    } = options;

    return `
        <img
            src="${placeholder}"
            data-src="${src}"
            alt="${alt}"
            width="${width}"
            height="${height}"
            class="lazy ${className}"
            loading="lazy"
            decoding="async"
        />
    `;
}

/**
 * Progressive image loading with fade-in effect
 */
export function loadImageProgressive(
    container: HTMLElement,
    src: string,
    placeholder?: string
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        // Show placeholder first
        if (placeholder) {
            container.style.backgroundImage = `url(${placeholder})`;
            container.style.backgroundSize = 'cover';
        }

        const img = new Image();
        img.onload = () => {
            container.style.backgroundImage = `url(${src})`;
            container.classList.add('loaded');
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Responsive image srcset generator
 */
export function generateSrcSet(
    baseUrl: string,
    sizes: number[] = [320, 640, 960, 1280]
): string {
    return sizes
        .map(size => {
            const url = baseUrl.includes('?') 
                ? `${baseUrl}&w=${size}` 
                : `${baseUrl}?w=${size}`;
            return `${url} ${size}w`;
        })
        .join(', ');
}

/**
 * Image optimization parameters for CDN
 */
export function optimizeImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'avif' | 'jpg' | 'png';
    } = {}
): string {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    if (!url) return '';
    
    // Cloudflare Images
    if (url.includes('cdn.cloudflare.com') || url.includes('imagedelivery.net')) {
        const params = [];
        if (width) params.push(`width=${width}`);
        if (height) params.push(`height=${height}`);
        params.push(`quality=${quality}`);
        params.push(`format=${format}`);
        return `${url}/${params.join(',')}`;
    }
    
    // Supabase Storage
    if (url.includes('supabase.co')) {
        const params = [];
        if (width) params.push(`width=${width}`);
        if (height) params.push(`height=${height}`);
        params.push(`quality=${quality}`);
        return `${url}?${params.join('&')}`;
    }
    
    // No transformation available
    return url;
}

/**
 * Preload critical images
 */
export function preloadImages(urls: string[]): void {
    if (typeof document === 'undefined') return;
    
    urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
    });
}

/**
 * Avatar image component
 */
export function createAvatar(
    name: string,
    photoUrl?: string,
    size: 'sm' | 'md' | 'lg' | 'xl' = 'md'
): string {
    const sizeMap = {
        sm: { w: 32, h: 32, text: 'text-xs' },
        md: { w: 40, h: 40, text: 'text-sm' },
        lg: { w: 48, h: 48, text: 'text-base' },
        xl: { w: 64, h: 64, text: 'text-lg' }
    };
    
    const { w, h, text } = sizeMap[size];
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    
    if (photoUrl) {
        return `
            <img
                src="${photoUrl}"
                alt="${name}"
                width="${w}"
                height="${h}"
                class="rounded-full object-cover"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            />
            <div class="hidden w-${w} h-${h} rounded-full bg-primary-100 text-primary-700 ${text} font-medium items-center justify-center">
                ${initials}
            </div>
        `;
    }
    
    return `
        <div class="w-${w} h-${h} rounded-full bg-primary-100 text-primary-700 ${text} font-medium flex items-center justify-center">
            ${initials}
        </div>
    `;
}

// CSS for lazy loading effects (add to stylesheet)
export const lazyLoadCSS = `
.lazy {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
}

.lazy-loaded {
    opacity: 1;
}

.lazy-load-placeholder {
    filter: blur(10px);
    transition: filter 0.3s ease-in-out;
}

.lazy-load-placeholder.loaded {
    filter: blur(0);
}
`;
