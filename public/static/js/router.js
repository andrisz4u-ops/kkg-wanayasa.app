import { state } from './state.js';

let _render;

export function parseRoute(pathname) {
    const raw = (pathname || window.location.pathname).replace(/^\/+/, '');
    if (!raw || raw === 'home') {
        return { page: 'home', params: {} };
    }
    if (raw.startsWith('verify')) {
        const parts = raw.split('/').filter(Boolean);
        const id = parts[parts.length - 1] !== 'verify' && parts[parts.length - 1] !== 'surat' ? parts[parts.length - 1] : null;
        return { page: 'verify', params: { id } };
    }
    return { page: raw, params: {} };
}

export function initRouter(renderFunc) {
    _render = renderFunc;

    window.addEventListener('popstate', (e) => {
        if (e.state) {
            state.currentPage = e.state.page || 'home';
            state.pageParams = e.state.params || {};
        } else {
            const parsed = parseRoute(window.location.pathname);
            state.currentPage = parsed.page;
            state.pageParams = parsed.params;
        }
        if (_render) _render();
    });
}

export function navigate(page, params = {}) {
    state.currentPage = page;
    state.pageParams = params;
    let url = `/${page === 'home' ? '' : page}`;
    if (page === 'verify' && params.id) {
        url = `/verify/surat/${params.id}`;
    }
    window.history.pushState({ page, params }, '', url);
    if (_render) _render();
    window.scrollTo(0, 0);
}
