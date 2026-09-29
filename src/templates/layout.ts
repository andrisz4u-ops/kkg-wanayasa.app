export const THEME_PRESETS: Record<string, {
  id: string;
  name: string;
  primary: string;
  dark: string;
  light: string;
  cardLight: string;
  accent: string;
  glow: string;
}> = {
  teal: {
    id: 'teal',
    name: 'Teal Emerald Organik',
    primary: '#269494',
    dark: '#1a7474',
    light: '#f0fdfa',
    cardLight: '#e0f2f1',
    accent: '#155e5e',
    glow: 'rgba(38, 148, 148, 0.25)',
  },
  blue: {
    id: 'blue',
    name: 'Biru Pendidikan (Kemendikbud)',
    primary: '#2563eb',
    dark: '#1d4ed8',
    light: '#eff6ff',
    cardLight: '#dbeafe',
    accent: '#1e40af',
    glow: 'rgba(37, 99, 235, 0.25)',
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo EduTech',
    primary: '#4f46e5',
    dark: '#4338ca',
    light: '#eef2ff',
    cardLight: '#e0e7ff',
    accent: '#3730a3',
    glow: 'rgba(79, 70, 229, 0.25)',
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Zamrud (Madrasah)',
    primary: '#059669',
    dark: '#047857',
    light: '#ecfdf5',
    cardLight: '#d1fae5',
    accent: '#065f46',
    glow: 'rgba(5, 150, 105, 0.25)',
  },
  amber: {
    id: 'amber',
    name: 'Emas Nusantara (Terracotta)',
    primary: '#d97706',
    dark: '#b45309',
    light: '#fffbeb',
    cardLight: '#fef3c7',
    accent: '#92400e',
    glow: 'rgba(217, 119, 6, 0.25)',
  },
  rose: {
    id: 'rose',
    name: 'Merah Marun (Crimson Royal)',
    primary: '#e11d48',
    dark: '#be123c',
    light: '#fff1f2',
    cardLight: '#ffe4e6',
    accent: '#9f1239',
    glow: 'rgba(225, 29, 72, 0.25)',
  }
};

export function getThemeCss(themeKey: string = 'teal'): string {
  const t = THEME_PRESETS[themeKey] || THEME_PRESETS.teal;
  if (t.id === 'teal') return '';
  return `
    :root {
      --color-primary: ${t.primary} !important;
      --color-primary-dark: ${t.dark} !important;
      --color-primary-light: ${t.light} !important;
      --color-accent: ${t.accent} !important;
      --color-brand-primary: ${t.primary} !important;
      --color-brand-secondary: ${t.dark} !important;
      --color-brand-accent: ${t.primary} !important;
    }
    body {
      background-image:
        radial-gradient(ellipse 600px 400px at 85% 10%, ${t.glow}, transparent),
        radial-gradient(ellipse 500px 500px at 10% 80%, ${t.glow}, transparent) !important;
    }
    /* Buttons */
    .btn-primary, button.bg-teal-500, a.bg-teal-500, .bg-teal-500, .bg-primary-500 {
      background-color: ${t.primary} !important;
    }
    .btn-primary:hover, button.bg-teal-500:hover, a.bg-teal-500:hover, .hover\\:bg-teal-600:hover, .bg-teal-600, .bg-primary-600 {
      background-color: ${t.dark} !important;
    }
    .hover\\:bg-teal-700:hover, .bg-teal-700 {
      background-color: ${t.accent} !important;
    }
    /* Text colors */
    .text-teal-500, .text-teal-600, .text-teal-700, .text-primary-500, .text-primary-600 {
      color: ${t.primary} !important;
    }
    .text-teal-950, .text-teal-900 {
      color: ${t.accent} !important;
    }
    .hover\\:text-teal-600:hover, .hover\\:text-teal-500:hover {
      color: ${t.dark} !important;
    }
    /* Borders */
    .border-teal-500, .border-teal-600, .border-b-teal-500, .focus\\:ring-teal-500:focus, .focus\\:border-teal-500:focus {
      border-color: ${t.primary} !important;
    }
    .hover\\:border-teal-500:hover {
      border-color: ${t.primary} !important;
    }
    /* Light tints & badges */
    .bg-teal-50, .bg-teal-50\\/50, .bg-teal-500\\/5, .bg-teal-500\\/10 {
      background-color: ${t.light} !important;
    }
    .bg-teal-100 {
      background-color: ${t.cardLight} !important;
    }
    .border-teal-500\\/10, .border-teal-500\\/20, .border-teal-100 {
      border-color: ${t.cardLight} !important;
    }
    /* Gradients */
    .from-teal-500, .from-primary-500, .from-teal-600 {
      --tw-gradient-from: ${t.primary} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(0 0 0 / 0) var(--tw-gradient-from-position) !important;
      --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
    }
    .to-teal-600, .to-primary-600, .to-teal-700 {
      --tw-gradient-to: ${t.dark} var(--tw-gradient-to-position) !important;
    }
    .via-teal-500 {
      --tw-gradient-to: rgb(0 0 0 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), ${t.primary} var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
    }
    /* Shadows */
    .shadow-teal-500\\/5, .shadow-teal-500\\/10, .shadow-teal-500\\/20, .shadow-teal-500\\/25, .shadow-teal-500\\/30 {
      --tw-shadow-color: ${t.glow} !important;
    }
  `;
}

export function renderHTML(initialTheme: string = 'teal'): string {
  const APP_VERSION = Date.now().toString(36);
  const theme = THEME_PRESETS[initialTheme] || THEME_PRESETS.teal;
  const themeCss = getThemeCss(initialTheme);

  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth" data-color-theme="${theme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuangKKG Digital &mdash; Platform AI EdTech SaaS Pendidik Indonesia</title>
  <meta name="description" content="RuangKKG Digital adalah platform AI EdTech SaaS untuk otomatisasi Kurikulum Merdeka, Modul Ajar berdiferensiasi, Asesmen HOTS, dan manajemen kurikulum sekolah terpadu.">
  <meta name="author" content="RuangKKG Digital">
  <meta property="og:title" content="RuangKKG Digital &mdash; Platform AI EdTech SaaS">
  <meta property="og:description" content="Platform AI EdTech SaaS terdepan untuk otomatisasi Kurikulum Merdeka, Modul Ajar, dan Asesmen HOTS sekolah di Indonesia.">
  <meta property="og:url" content="https://ruangkkg.my.id">
  <meta property="og:site_name" content="RuangKKG Digital">
  <meta name="theme-color" content="${theme.primary}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="RuangKKG Digital">

  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/favicon.png">
  <link rel="manifest" href="/manifest.json">
  
  <link rel="stylesheet" href="/static/style.css?v=${APP_VERSION}">
  
  <style id="dynamic-theme-style">${themeCss}</style>

  <script>
    (function() {
      try {
        var localTheme = localStorage.getItem('kkg_theme_color');
        if (localTheme && localTheme !== '${theme.id}') {
          document.documentElement.setAttribute('data-color-theme', localTheme);
        } else if (!localTheme) {
          localStorage.setItem('kkg_theme_color', '${theme.id}');
        }
      } catch (e) {}
    })();
  </script>

  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <script defer src="https://cdn.jsdelivr.net/npm/docx@7.1.0/build/index.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body class="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] antialiased selection:bg-primary-500 selection:text-white">
  <div id="app">
    <!-- Pre-rendered Semantic Landing Page for Crawlers, SEO & First Contentful Paint -->
    <div class="min-h-screen flex flex-col bg-[#f8fdfd] text-slate-800">
      <!-- Top Navigation -->
      <header class="bg-white/95 border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div>
              <span class="text-xl font-display font-black tracking-tight text-slate-900 block leading-tight">RuangKKG Digital</span>
              <span class="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">AI-Powered EdTech SaaS Platform</span>
            </div>
          </div>
          <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#fitur" class="hover:text-teal-600 transition-colors">Fitur Platform</a>
            <a href="#solusi" class="hover:text-teal-600 transition-colors">Kurikulum Merdeka</a>
            <a href="#tentang" class="hover:text-teal-600 transition-colors">Tentang Perusahaan</a>
            <a href="#kontak" class="hover:text-teal-600 transition-colors">Kontak</a>
          </nav>
          <div class="flex items-center gap-3">
            <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all">
              Masuk Akun
            </a>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1">
        <!-- Hero Section -->
        <section class="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-teal-500/10 text-teal-800 border border-teal-500/30 mb-6">
              <i class="fas fa-sparkles text-teal-600"></i>
              <span>RUANGKKG DIGITAL &bull; AI EDTECH SAAS PLATFORM</span>
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              RuangKKG Digital
            </h1>
            <p class="text-lg text-slate-600 leading-relaxed mb-8">
              Platform AI EdTech SaaS terdepan untuk sekolah dan pendidik di Indonesia. Mengotomatisasi penyusunan administrasi Kurikulum Merdeka (Modul Ajar berdiferensiasi, Capaian Pembelajaran CP/TP/ATP, Program Tahunan &amp; Semester, dan Kisi-kisi Asesmen HOTS) dengan integrasi model kecerdasan buatan canggih.
            </p>
            <div class="flex flex-wrap items-center gap-4 mb-10">
              <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="px-7 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-lg shadow-teal-600/30 transition-all">
                Buka Aplikasi Web
              </a>
              <a href="#tentang" class="px-6 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-base hover:bg-slate-50 transition-all">
                Profil Perusahaan
              </a>
            </div>
            <div class="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
              <div>
                <p class="text-2xl font-black text-teal-700">100%</p>
                <p class="text-xs text-slate-500 font-semibold">Kurikulum Merdeka</p>
              </div>
              <div>
                <p class="text-2xl font-black text-teal-700">&lt; 5 Menit</p>
                <p class="text-xs text-slate-500 font-semibold">Generate Dokumen AI</p>
              </div>
              <div>
                <p class="text-2xl font-black text-teal-700">Multi-Sekolah</p>
                <p class="text-xs text-slate-500 font-semibold">Arsitektur Cloud SaaS</p>
              </div>
            </div>
          </div>

          <!-- Hero Illustration Card -->
          <div class="bg-gradient-to-br from-teal-50 to-emerald-100/60 border border-teal-200/80 rounded-3xl p-8 shadow-xl">
            <div class="bg-white rounded-2xl p-6 shadow-md border border-slate-100 mb-6">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-3 h-3 rounded-full bg-red-400"></span>
                <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span class="text-xs font-mono text-slate-400 ml-2">ruangkkg.my.id/ai-engine</span>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <span class="text-xs font-bold text-teal-900"><i class="fas fa-wand-magic-sparkles text-teal-600 mr-2"></i>AI Modul Ajar Generator</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-200 text-teal-800">Ready</span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span class="text-xs font-bold text-slate-800"><i class="fas fa-chart-pie text-indigo-600 mr-2"></i>Analisis CP, TP &amp; ATP BSKAP 046</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Automated</span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span class="text-xs font-bold text-slate-800"><i class="fas fa-list-check text-emerald-600 mr-2"></i>Kisi-Kisi &amp; Rubrik HOTS</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Compliant</span>
                </div>
              </div>
            </div>
            <p class="text-xs text-center text-teal-900 font-semibold">
              Infrastruktur Cloud berstandar global dengan komputasi edge dan model AI termutakhir.
            </p>
          </div>
        </section>

        <!-- Features Section -->
        <section id="fitur" class="bg-white border-y border-slate-200/80 py-20">
          <div class="max-w-7xl mx-auto px-6">
            <div class="text-center max-w-3xl mx-auto mb-16">
              <span class="text-xs font-extrabold text-teal-600 uppercase tracking-widest block mb-2">Solusi Unggulan</span>
              <h2 class="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight mb-4">Fitur Inti RuangKKG Digital</h2>
              <p class="text-slate-600 text-base">Dirancang khusus untuk memenuhi standar Kurikulum Merdeka Kemendikbudristek secara menyeluruh.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
              <div class="p-8 rounded-3xl bg-[#f8fdfd] border border-teal-100 shadow-sm">
                <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-teal-600/20">
                  <i class="fas fa-wand-magic-sparkles"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Generator Modul Ajar AI</h3>
                <p class="text-slate-600 text-sm leading-relaxed">Menghasilkan RPP Berdiferensiasi dan Modul Ajar lengkap sesuai karakteristik peserta didik dan standar BSKAP 046/H/KR/2025.</p>
              </div>
              <div class="p-8 rounded-3xl bg-[#f8fdfd] border border-teal-100 shadow-sm">
                <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-indigo-600/20">
                  <i class="fas fa-chart-pie"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Analisis CP, TP &amp; ATP</h3>
                <p class="text-slate-600 text-sm leading-relaxed">Mendekomposisi Capaian Pembelajaran semua fase dan mata pelajaran menjadi alur tujuan pembelajaran beserta alokasi waktu JP akurat.</p>
              </div>
              <div class="p-8 rounded-3xl bg-[#f8fdfd] border border-teal-100 shadow-sm">
                <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-600/20">
                  <i class="fas fa-list-check"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Engine Asesmen &amp; Kisi-Kisi HOTS</h3>
                <p class="text-slate-600 text-sm leading-relaxed">Menyusun instrumen penilaian autentik, rubrik KKTP, kartu soal berbobot Taksonomi Bloom (C4-C6), dan bank soal kolaboratif.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- About Company Section (CRITICAL FOR AWS ACTIVATION AUDIT) -->
        <section id="tentang" class="py-20 max-w-7xl mx-auto px-6">
          <div class="p-10 md:p-14 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
            <div class="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span class="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">Profil Startup / Entitas Bisnis</span>
                <h2 class="text-3xl font-display font-bold text-white mb-6">Tentang RuangKKG Digital</h2>
                <p class="text-slate-300 text-base leading-relaxed mb-6">
                  <strong>RuangKKG Digital</strong> adalah inisiatif pengembang teknologi pendidikan (EdTech Startup) yang berdedikasi membangun ekosistem perangkat lunak cerdas untuk mendigitalisasi perencanaan dan administrasi kurikulum guru di Indonesia.
                </p>
                <p class="text-slate-400 text-sm leading-relaxed">
                  Platform ini mengintegrasikan cloud serverless edge computing, database relasional terdistribusi, serta model AI generative mutakhir guna menghadirkan akses perangkat ajar berkualitas tinggi bagi seluruh sekolah secara merata.
                </p>
              </div>
              <div class="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 space-y-4 text-sm">
                <div class="flex justify-between py-2 border-b border-slate-700">
                  <span class="text-slate-400">Nama Perusahaan:</span>
                  <span class="font-bold text-white">RuangKKG Digital</span>
                </div>
                <div class="flex justify-between py-2 border-b border-slate-700">
                  <span class="text-slate-400">Website Resmi:</span>
                  <a href="https://ruangkkg.my.id" class="font-bold text-teal-400 hover:underline">https://ruangkkg.my.id</a>
                </div>
                <div class="flex justify-between py-2 border-b border-slate-700">
                  <span class="text-slate-400">Email Bisnis:</span>
                  <a href="mailto:admin@ruangkkg.my.id" class="font-bold text-teal-400 hover:underline">admin@ruangkkg.my.id</a>
                </div>
                <div class="flex justify-between py-2 border-b border-slate-700">
                  <span class="text-slate-400">Fokus Industri:</span>
                  <span class="font-bold text-white">EdTech &amp; Artificial Intelligence (AI)</span>
                </div>
                <div class="flex justify-between py-2 border-b border-slate-700">
                  <span class="text-slate-400">Kantor Operasional:</span>
                  <span class="font-bold text-white">Purwakarta, Jawa Barat, Indonesia</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="text-slate-400">Status Produk:</span>
                  <span class="font-bold text-emerald-400">Active Live Production (SaaS MVP)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Contact Section -->
        <section id="kontak" class="py-12 bg-white border-t border-slate-200">
          <div class="max-w-7xl mx-auto px-6 text-center">
            <h3 class="text-2xl font-bold text-slate-900 mb-2">Hubungi Tim RuangKKG Digital</h3>
            <p class="text-slate-500 text-sm mb-6">Pertanyaan kemitraan, implementasi sekolah, dan informasi teknologi.</p>
            <a href="mailto:admin@ruangkkg.my.id" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all">
              <i class="fas fa-envelope"></i>
              <span>admin@ruangkkg.my.id</span>
            </a>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span class="font-bold text-white text-sm">RuangKKG Digital</span> &mdash; Platform AI EdTech SaaS Pendidik Indonesia.
          </div>
          <div>
            &copy; 2026 RuangKKG Digital. Hak Cipta Dilindungi.
          </div>
        </div>
      </footer>
    </div>
  </div>

  <script>window.__APP_VERSION__ = '${APP_VERSION}';</script>
  <script src="/static/js/profil-lulusan-data.js?v=${APP_VERSION}"></script>
  <script type="module" src="/static/js/main.js?v=${APP_VERSION}"></script>

  <!-- SVG Clip Path for Organic Shapes -->
  <svg width="0" height="0" class="absolute">
    <defs>
      <clipPath id="organic-clip" clipPathUnits="objectBoundingBox">
        <path d="M0.1,0.2 C0.3,0.1 0.5,0.05 0.7,0.1 C0.9,0.15 1,0.3 1,0.5 C1,0.7 0.9,0.9 0.7,0.95 C0.5,1 0.3,0.9 0.1,0.8 C-0.1,0.7 0,0.3 0.1,0.2 Z" />
      </clipPath>
    </defs>
  </svg>
</body>
</html>`;
}


