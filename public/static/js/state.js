
export const state = {
    user: null,
    tenant: null,
    currentPage: 'home',
    loading: false,
    mobileMenuOpen: false,
    pageParams: {},
    settings: {
        alamat_sekretariat: 'Sekretariat KKG',
        nama_kkg: 'Portal Digital KKG',
        email: 'admin@portal-kkg.id',
        theme_color: (typeof localStorage !== 'undefined' ? localStorage.getItem('kkg_theme_color') : null) || 'teal'
    },
    unreadNotifications: 0
};
