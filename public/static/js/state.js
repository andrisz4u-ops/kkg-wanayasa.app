
export const state = {
    user: null,
    tenant: null,
    currentPage: 'home',
    loading: false,
    mobileMenuOpen: false,
    pageParams: {},
    settings: {
        alamat_sekretariat: '',
        nama_kkg: 'RuangKKG Digital',
        email: '',
        email_kkg: '',
        website_kkg: '',
        ...(typeof window !== 'undefined' ? window.__KKG_ORGANIZATION__ || {} : {}),
        theme_color: (typeof localStorage !== 'undefined' ? localStorage.getItem('kkg_theme_color') : null) || 'teal'
    },
    unreadNotifications: 0
};
