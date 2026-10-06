
import { state } from './state.js';

let _render;
const adminPanels = new Set(['dashboard', 'users', 'sekolah', 'cp', 'ai-providers', 'logs', 'templates', 'profil']);

export function readAdminPanelLocation() {
    const panel = new URLSearchParams(window.location.search).get('panel');
    return adminPanels.has(panel) ? panel : 'dashboard';
}

export function updateAdminPanelLocation(panel) {
    if (state.currentPage !== 'admin' || !adminPanels.has(panel)) return;
    const url = `/admin?panel=${encodeURIComponent(panel)}`;
    if (`${window.location.pathname}${window.location.search}` !== url) {
        const params = { ...state.pageParams, panel };
        state.pageParams = params;
        window.history.pushState({ page: 'admin', params }, '', url);
    }
}

export function initRouter(renderFunc) {
    _render = renderFunc;

    window.addEventListener('popstate', (e) => {
        if (e.state) {
            state.currentPage = e.state.page || 'home';
            state.pageParams = e.state.params || {};
        } else {
            const path = window.location.pathname.slice(1) || 'home';
            state.currentPage = path;
            state.pageParams = {};
        }
        if (state.currentPage === 'admin') state.currentAdminTab = readAdminPanelLocation();
        if (_render) _render();
    });
}

export function navigate(page, params = {}) {
    if (page === 'admin') {
        params = { ...params, panel: adminPanels.has(params.panel || state.currentAdminTab) ? (params.panel || state.currentAdminTab) : 'dashboard' };
        state.currentAdminTab = params.panel;
    }
    state.currentPage = page;
    state.pageParams = params;
    const url = `/${page === 'home' ? '' : page}${page === 'admin' ? `?panel=${encodeURIComponent(params.panel)}` : ''}`;
    window.history.pushState({ page, params }, '', url);
    const rendered = _render?.();
    window.scrollTo(0, 0);
    return rendered;
}
