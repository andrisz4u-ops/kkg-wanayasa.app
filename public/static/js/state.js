
export const state = {
    user: null,
    tenant: null,
    currentPage: 'home',
    loading: false,
    mobileMenuOpen: false,
    pageParams: {},
    settings: {
        alamat_sekretariat: 'Purwakarta, Jawa Barat',
        nama_kkg: 'RuangKKG Digital',
        email: 'admin@ruangkkg.my.id',
        email_kkg: 'admin@ruangkkg.my.id',
        website_kkg: 'https://ruangkkg.my.id',
        theme_color: (typeof localStorage !== 'undefined' ? localStorage.getItem('kkg_theme_color') : null) || 'teal'
    },
    unreadNotifications: 0
};
