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
  <title>RuangKKG Digital &mdash; AI-Powered EdTech SaaS Platform for Indonesian Educators</title>
  <meta name="description" content="RuangKKG Digital is an AI-powered EdTech SaaS platform automating lesson plan generation (RPP/Modul Ajar), curriculum decomposition, and HOTS assessments for Indonesian K-12 educators. Selaras BSKAP 046/2025 &amp; UU PDP No. 27/2022.">
  <meta name="author" content="RuangKKG Digital">
  <meta property="og:title" content="RuangKKG Digital &mdash; AI-Powered EdTech SaaS Platform">
  <meta property="og:description" content="Cloud AI EdTech SaaS automating Kurikulum Merdeka lesson plans, curriculum analysis, and HOTS assessments for Indonesian schools. Built for cloud scalability.">
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
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/landing-redesign.css?v=${APP_VERSION}">

  <script defer src="https://cdn.jsdelivr.net/npm/docx@7.1.0/build/index.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body class="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] antialiased selection:bg-primary-500 selection:text-white">
  <div id="app">
    <!-- Pre-rendered Semantic Landing Page from Redesign Web RuangKKG -->
    <div class="rk-landing" id="landing-root">
      <!-- ================= HEADER ================= -->
<header class="site-head" id="top">
  <div class="wrap head-in">
    <a class="brand" href="#beranda" aria-label="RuangKKG — beranda">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9.6L4 20.5Z"/><path d="M9.5 9.5l2 2 3.8-3.8"/></svg>
      </span>
      <span class="word">RuangKKG<small>Untuk guru Indonesia</small></span>
    </a>
    <nav class="nav" aria-label="Navigasi utama">
      <a href="#fitur">Modul AI</a>
      <a href="#dokumentasi">Dokumentasi</a>
      <a href="#tentang">Tentang</a>
      <a href="#harga">Harga</a>
      <a href="#testimoni">Testimoni</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="head-cta">
      <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-ghost btn-sm">Masuk</a>
      <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-primary btn-sm">Coba Gratis</a>
      <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="mobileNav" aria-label="Buka menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      </button>
    </div>
  </div>
</header>
<nav class="mobile-nav" id="mobileNav" aria-label="Navigasi seluler">
  <a href="#fitur">Modul AI</a>
  <a href="#dokumentasi">Dokumentasi</a>
  <a href="#tentang">Tentang</a>
  <a href="#harga">Harga</a>
  <a href="#testimoni">Testimoni</a>
  <a href="#faq">FAQ</a>
  <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-primary" style="width:100%; margin-top:0.8rem;">Coba Gratis 30 Hari</a>
</nav>

<main>
<!-- ================= HERO ================= -->
<section class="hero" id="beranda">
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
        <span class="pill rv">✶ Baru: 5 modul AI untuk perangkat pembelajaran</span>
        <h1 class="rv rv-d1">Satu perintah guru,<br />jadi <span class="hl">RPP lengkap<svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9c40-5 90-6.5 194-4" stroke="#e9a51b" stroke-width="5" stroke-linecap="round"/></svg></span> dalam hitungan menit.</h1>
        <p class="lede rv rv-d2">RuangKKG adalah Asisten AI untuk guru Indonesia — Analisis CP, Buat RPP, Buat Asesmen, Slide Presentasi, sampai Game Edukasi. Satu alur kerja, dari dokumen kurikulum sampai kelas yang hidup.</p>
        <div class="hero-cta rv rv-d3">
          <a class="btn btn-primary" href="#harga">Coba Gratis
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <a class="btn btn-ghost" href="#fitur">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            Jelajahi 5 Modul</a>
        </div>
        <div class="hero-trust rv rv-d3">
          <div class="avatars" aria-hidden="true"><span>BR</span><span>SA</span><span>DP</span><span class="more">50+</span></div>
          <div>
            <span class="tt"><span class="stars" aria-hidden="true">★★★★★</span>Dipercaya <b>500+ pendidik &amp; anggota KKG</b></span>
            <span class="ts">Tanpa kartu kredit · Bayar via QRIS · CS bahasa Indonesia</span>
          </div>
        </div>
      </div>

      <div class="magic rv" id="magicDemo" data-phase="prompt" role="img" aria-label="Demo transformasi AI: satu kartu perintah guru berubah menjadi RPP lengkap dalam hitungan menit.">
        <div class="magic-glow" aria-hidden="true"></div>
        <div class="magic-dots" aria-hidden="true"></div>
        <div class="m-stage" aria-hidden="true">
          <div class="m-card m-prompt">
            <div class="m-head"><span class="m-who"><span class="dot">AN</span>Anda · wali kelas 5</span><span class="m-tag">Modul: Buat RPP</span></div>
            <p class="m-text"><span id="mType"></span><span class="m-caret"></span></p>
            <div class="m-foot"><span class="m-hint">Satu kalimat, bukan templat kosong.</span><span class="m-send">Kirim<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
          </div>
          <div class="m-card m-result">
            <div class="m-head"><span class="m-who ai"><span class="dot">✶</span>RPP — Koding &amp; KA Kelas 5</span><span class="m-tag hot">AI · 42 detik</span></div>
            <ul class="m-sections">
              <li style="--i:0"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Identitas &amp; tujuan pembelajaran</li>
              <li style="--i:1"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Alur kegiatan: pendahuluan–inti–penutup</li>
              <li style="--i:2"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Media &amp; logika koding sehari-hari</li>
              <li style="--i:3"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Penilaian &amp; rubrik skor</li>
            </ul>
            <div class="m-foot"><span class="m-hint">10 halaman · siap cetak / edit</span><span class="m-send ghost">Unduh Word</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item rv"><div class="n"><span class="count" data-to="5">0</span><em> Modul</em></div><div class="l">perangkat ajar terintegrasi</div></div>
      <div class="stat-item rv rv-d1"><div class="n">&lt; 2<em> mnt</em></div><div class="l">susun modul &amp; RPP lengkap</div></div>
      <div class="stat-item rv rv-d2"><div class="n"><span class="count" data-to="100">0</span><em>%</em></div><div class="l">standar Kurikulum Merdeka</div></div>
      <div class="stat-item rv rv-d3"><div class="n">4,9<em>/5</em></div><div class="l">skor kepuasan pendidik</div></div>
    </div>
  </div>
</section>
<!-- ================= FITUR ================= -->
<section class="section" id="fitur">
  <div class="wrap">
    <div class="section-head rv">
      <span class="pill">✶ Asisten AI · 5 modul</span>
      <h2>Dari dokumen kurikulum sampai kelas yang hidup — satu alur AI.</h2>
      <p class="lede">Setiap modul bisa dipakai mandiri. Tapi kekuatan penuhnya keluar saat dipakai berurutan: Analisis CP jadi dasar RPP, RPP jadi asesmen &amp; slide, asesmen jadi game. Tanpa template kosong, tanpa mulai dari nol.</p>
    </div>

    <!-- Tab Buttons -->
    <div class="mod-strip rv" role="tablist" aria-label="Pilihan Modul AI">
      <button type="button" class="mod-chip is-active" data-mod-tab="mod-cp" role="tab" id="tab-mod-cp" aria-selected="true" aria-controls="mod-cp">
        <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9Z"/><path d="M13 3v6h6"/><circle cx="11" cy="13" r="2.6"/><path d="M13 15l2.5 2.5"/></svg></span>
        <span><small>Modul 1</small>Analisis CP</span>
      </button>
      <button type="button" class="mod-chip" data-mod-tab="mod-rpp" role="tab" id="tab-mod-rpp" aria-selected="false" aria-controls="mod-rpp">
        <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>
        <span><small>Modul 2</small>Buat RPP</span>
      </button>
      <button type="button" class="mod-chip" data-mod-tab="mod-asesmen" role="tab" id="tab-mod-asesmen" aria-selected="false" aria-controls="mod-asesmen">
        <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5H21M9.5 12H21M9.5 19H21"/><path d="M4 4.5l1 1 2-2"/><path d="M4 11.5l1 1 2-2"/><path d="M4 18.5l1 1 2-2"/></svg></span>
        <span><small>Modul 3</small>Buat Asesmen</span>
      </button>
      <button type="button" class="mod-chip" data-mod-tab="mod-slide" role="tab" id="tab-mod-slide" aria-selected="false" aria-controls="mod-slide">
        <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v3M8 21l4-2 4 2"/><path d="M7.5 11.5l2.6-2.6 2 2 3.2-3.6"/></svg></span>
        <span><small>Modul 4</small>Slide Presentasi</span>
      </button>
      <button type="button" class="mod-chip" data-mod-tab="mod-game" role="tab" id="tab-mod-game" aria-selected="false" aria-controls="mod-game">
        <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7.5" width="19" height="10.5" rx="5"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="14.5" r="1"/></svg></span>
        <span><small>Modul 5</small>Game Edukasi</span>
      </button>
    </div>

    <!-- Tab Panels Container -->
    <div class="mod-tab-panels rv">
      <!-- Modul 1: Analisis CP -->
      <div class="mod-panel is-active" id="mod-cp" role="tabpanel" aria-labelledby="tab-mod-cp">
        <div class="feature">
          <div class="f-copy">
            <span class="f-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9Z"/><path d="M13 3v6h6"/><circle cx="11" cy="13" r="2.6"/><path d="M13 15l2.5 2.5"/></svg> Analisis CP <span class="ai-chip">✶ AI</span></span>
            <h2>Dokumen CP yang rumit — AI yang membedahnya.</h2>
            <p class="lede" style="margin-bottom:0">Tempelkan teks atau unggah dokumen Capaian Pembelajaran. AI membedahnya menjadi peta elemen, alur capaian, dan daftar tujuan pembelajaran yang siap dipakai semua modul berikutnya.</p>
            <ul class="checks">
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Peta elemen &amp; tujuan pembelajaran secara otomatis</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Alur capaian per fase tersusun runtut</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Hasilnya dipakai ulang di RPP, asesmen, &amp; slide</span></li>
            </ul>
          </div>
          <div class="f-visual">
            <div class="mock" role="img" aria-label="Hasil analisis CP oleh AI: dokumen CP dipetakan menjadi tujuan pembelajaran">
              <div class="mock-head"><span class="mt">✶ Analisis CP</span><span class="ma">IPAS · Fase C</span></div>
              <div class="analyze">
                <div class="an-doc">
                  <div class="an-doct">Dokumen CP — IPAS Fase C</div>
                  <div class="ln" style="width:92%"></div>
                  <div class="ln" style="width:100%"></div>
                  <div class="ln" style="width:85%"></div>
                  <div class="ln" style="width:96%"></div>
                  <div class="ln" style="width:58%"></div>
                  <span class="an-file">terlampir · 6 halaman</span>
                </div>
                <div class="an-arrow" aria-hidden="true"><span class="ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
                <div class="an-out">
                  <div class="an-row"><span class="an-ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><div><b>TP 1</b><span>Mengidentifikasi bagian tumbuhan yang berperan dalam fotosintesis.</span></div></div>
                  <div class="an-row"><span class="an-ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><div><b>TP 2</b><span>Menganalisis hubungan cahaya, air, dan hasil fotosintesis.</span></div></div>
                  <div class="an-row"><span class="an-ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><div><b>TP 3</b><span>Merancang percobaan sederhana faktor yang memengaruhi fotosintesis.</span></div></div>
                  <div class="an-foot"><span class="chip">6 TP terpetakan</span><span class="chip">3 elemen</span><span class="chip hot">✶ 1 menit</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mod-workflow-bar">
          <div class="mod-wf-info">
            <span class="mod-wf-step">Langkah 1 dari 5 · Fondasi Kurikulum</span>
            <span class="mod-wf-title">Alur: Analisis CP → Buat RPP</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-rpp">
            Lanjut ke Modul 2: Buat RPP
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Modul 2: Buat RPP -->
      <div class="mod-panel" id="mod-rpp" role="tabpanel" aria-labelledby="tab-mod-rpp" hidden>
        <div class="feature">
          <div class="f-copy">
            <span class="f-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Buat RPP <span class="ai-chip">✶ AI</span></span>
            <h2>Dari analisis CP jadi RPP lengkap — hitungan menit.</h2>
            <p class="lede" style="margin-bottom:0">Pilih hasil Analisis CP atau isi tujuan sendiri, lalu AI menyusun komponen RPP: identitas, tujuan, alur kegiatan, media, sampai penilaian. Tinjau, sesuaikan dengan gaya mengajar Anda.</p>
            <ul class="checks">
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Struktur rapi: pendahuluan, kegiatan inti, penutup</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Tujuan &amp; kegiatan selaras dengan capaian</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Ekspor Word &amp; PDF — siap cetak &amp; supervisi</span></li>
            </ul>
          </div>
          <div class="f-visual">
            <div class="mock" role="img" aria-label="Draf RPP yang disusun AI lengkap dengan alur kegiatan">
              <div class="mock-head"><span class="mt">✶ Buat RPP</span><span class="ai-badge">Draf AI · 42 detik</span></div>
              <div class="rppdoc">
                <div class="rd-head"><b>RPP — Fotosintesis (IPAS)</b><span>Kelas 4 · 1 pertemuan · 2 × 35 menit</span></div>
                <div class="rd-sec"><b>Pendahuluan · 10 menit</b><div class="ln" style="width:100%"></div><div class="ln" style="width:82%"></div></div>
                <div class="rd-sec"><b>Kegiatan Inti · 60 menit</b><div class="ln" style="width:96%"></div><div class="ln" style="width:100%"></div><div class="ln" style="width:74%"></div></div>
                <div class="rd-sec"><b>Penutup · 15 menit</b><div class="ln" style="width:88%"></div><div class="ln" style="width:64%"></div></div>
                <div class="rd-act"><span class="rd-btn">Unduh Word</span><span class="rd-btn ghost">Ubah draf</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="mod-workflow-bar">
          <div class="mod-wf-info">
            <span class="mod-wf-step">Langkah 2 dari 5 · Rencana Pembelajaran</span>
            <span class="mod-wf-title">Alur: RPP → Buat Asesmen</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-asesmen">
            Lanjut ke Modul 3: Buat Asesmen
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Modul 3: Buat Asesmen -->
      <div class="mod-panel" id="mod-asesmen" role="tabpanel" aria-labelledby="tab-mod-asesmen" hidden>
        <div class="feature">
          <div class="f-copy">
            <span class="f-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5H21M9.5 12H21M9.5 19H21"/><path d="M4 4.5l1 1 2-2"/><path d="M4 11.5l1 1 2-2"/><path d="M4 18.5l1 1 2-2"/></svg> Buat Asesmen <span class="ai-chip">✶ AI</span></span>
            <h2>Soal, kunci jawaban, dan rubrik — dari materi yang sama.</h2>
            <p class="lede" style="margin-bottom:0">Satu langkah dari RPP menjadi paket asesmen: pilihan ganda, isian singkat, uraian, kunci jawaban, dan rubrik penskoran. Semua soal selaras dengan tujuan pembelajaran yang sudah ditetapkan.</p>
            <ul class="checks">
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Pilihan ganda, isian singkat, &amp; uraian</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Kunci jawaban + rubrik skor otomatis</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Siap cetak atau dijadikan kuis digital</span></li>
            </ul>
          </div>
          <div class="f-visual">
            <div class="mock" role="img" aria-label="Paket asesmen pilihan ganda dengan kunci jawaban yang dibuat AI">
              <div class="mock-head"><span class="mt">✶ Buat Asesmen</span><span class="ma">10 soal · 15 menit</span></div>
              <div class="qz">
                <div class="qz-q"><b>1.</b> Bunga matahari tumbuh subur karena mendapatkan &hellip;</div>
                <div class="qz-opts">
                  <span>A · Air berlebih</span>
                  <span class="ok">B · Cahaya matahari<span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span></span>
                  <span>C · Udara dingin</span>
                  <span>D · Tanah kering</span>
                </div>
                <div class="qz-meta"><span class="chip">C2 · Pemahaman</span><span class="chip">TP 2 · Fotosintesis</span><span class="chip hot">Kunci: B</span></div>
                <div class="qz-more">+ 9 soal lagi · pilihan ganda, isian singkat &amp; uraian · rubrik + kunci lengkap</div>
              </div>
            </div>
          </div>
        </div>
        <div class="mod-workflow-bar">
          <div class="mod-wf-info">
            <span class="mod-wf-step">Langkah 3 dari 5 · Evaluasi Pembelajaran</span>
            <span class="mod-wf-title">Alur: Asesmen → Slide Presentasi</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-slide">
            Lanjut ke Modul 4: Slide Presentasi
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Modul 4: Slide Presentasi -->
      <div class="mod-panel" id="mod-slide" role="tabpanel" aria-labelledby="tab-mod-slide" hidden>
        <div class="feature">
          <div class="f-copy">
            <span class="f-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v3M8 21l4-2 4 2"/><path d="M7.5 11.5l2.6-2.6 2 2 3.2-3.6"/></svg> Slide Presentasi <span class="ai-chip">✶ AI</span></span>
            <h2>Alur RPP berubah jadi slide siap tampil.</h2>
            <p class="lede" style="margin-bottom:0">AI merangkum RPP menjadi deretan slide mengajar: pembuka, materi visual, diskusi, sampai kuis penutup. Susun ulang sesuai urutan mengajar Anda, lalu tayangkan di kelas.</p>
            <ul class="checks">
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Struktur mengikuti alur kegiatan RPP</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Tata letak bersih, teks ramah proyektor</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Ekspor PPTX — tinggal diedit di PowerPoint</span></li>
            </ul>
          </div>
          <div class="f-visual">
            <div class="mock" role="img" aria-label="Deretan slide presentasi yang dibuat AI dari RPP">
              <div class="mock-head"><span class="mt">✶ Slide Presentasi</span><span class="ma">8 slide</span></div>
              <div class="sld">
                <div class="sld-main"><b>Fotosintesis</b><span>Bagaimana tumbuhan membuat makanannya</span><span class="sld-no">1 / 8</span></div>
                <div class="sld-thumbs">
                  <span class="sld-t cur"><i></i>Tujuan</span>
                  <span class="sld-t"><i></i>Materi 1</span>
                  <span class="sld-t"><i></i>Materi 2</span>
                  <span class="sld-t"><i></i>Diskusi</span>
                  <span class="sld-t"><i></i>Kuis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mod-workflow-bar">
          <div class="mod-wf-info">
            <span class="mod-wf-step">Langkah 4 dari 5 · Media Mengajar</span>
            <span class="mod-wf-title">Alur: Slide Presentasi → Game Edukasi</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-game">
            Lanjut ke Modul 5: Game Edukasi
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Modul 5: Game Edukasi -->
      <div class="mod-panel" id="mod-game" role="tabpanel" aria-labelledby="tab-mod-game" hidden>
        <div class="feature">
          <div class="f-copy">
            <span class="f-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7.5" width="19" height="10.5" rx="5"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="14.5" r="1"/></svg> Game Edukasi <span class="ai-chip">✶ AI</span></span>
            <h2>Soal yang sama, jadi game yang bikin kelas hidup.</h2>
            <p class="lede" style="margin-bottom:0">Ubah paket asesmen menjadi game kuis interaktif — papan skor, hitungan waktu, dan mode tim. Siswa langsung main dari HP masing-masing, tanpa instal apa pun.</p>
            <ul class="checks">
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Kuis interaktif siap dimainkan, tanpa instal</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Papan skor &amp; mode tim: kompetisi bikin seru</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Dari bank soal yang sama — tidak bikin ulang</span></li>
            </ul>
          </div>
          <div class="f-visual">
            <div class="mock" role="img" aria-label="Contoh game edukasi: kuis fotosintesis dengan papan skor">
              <div class="mock-head"><span class="mt">✶ Game Edukasi</span><span class="ma">24 siswa bermain</span></div>
              <div class="gm">
                <div class="gm-q">Daun memanfaatkan energi &hellip;</div>
                <div class="gm-timer"><i style="width:65%"></i></div>
                <div class="gm-opts">
                  <span class="ok">Cahaya matahari<span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span></span>
                  <span>Angin</span>
                  <span>Bunyi</span>
                  <span>Panas api</span>
                </div>
                <div class="gm-board">
                  <div class="gm-row"><b>1</b><span>Sinta</span><i>2.400</i></div>
                  <div class="gm-row"><b>2</b><span>Bagus</span><i>2.150</i></div>
                  <div class="gm-row"><b>3</b><span>Rafa</span><i>1.980</i></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mod-workflow-bar">
          <div class="mod-wf-info">
            <span class="mod-wf-step">Langkah 5 dari 5 · Kelas Hidup &amp; Interaktif</span>
            <span class="mod-wf-title">Alur Lengkap Selesai: Semua Modul Siap Digunakan</span>
          </div>
          <a href="#harga" class="btn btn-sm btn-accent mod-next-btn">
            Mulai Gunakan Semua Modul (Coba Gratis)
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================= GALERI ================= -->
<section class="band section" id="dokumentasi">
  <div class="wrap">
    <div class="section-head center rv" style="max-width:640px">
      <span class="f-tag" style="color:var(--accent)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M3 17l5-4 4 3 4-4 5 5"/></svg> Galeri</span>
      <h2>Dokumentasi kegiatan komunitas</h2>
      <p class="lede" style="margin-bottom:0">Digunakan bersama dalam workshop KKG Gugus, maupun secara mandiri oleh pendidik untuk persiapan mengajar: bimtek, workshop perangkat ajar, dan rapat pengurus.</p>
    </div>
    <div class="gallery rv rv-d1" role="group" aria-label="Galeri dokumentasi kegiatan komunitas guru">
      <button class="g-item" data-cap="Bimtek Deep Learning &amp; Media Interaktif|KKG Gugus 3 · 28 Juni 2026 · 42 foto" aria-label="Perbesar foto: Bimtek Deep Learning dan Media Interaktif">
        <img src="/static/img/gallery-1.jpg" alt="Sekelompok guru berfoto bersama dengan laptop di meja saat pelatihan" loading="lazy" />
        <div class="g-cap"><b>Bimtek Deep Learning &amp; Media Interaktif</b><span>KKG Gugus 3 · 28 Juni 2026 · 42 foto</span></div>
      </button>
      <button class="g-item" data-cap="Workshop Penyusunan Perangkat KBM 2025/2026|KKG Gugus Cempaka · 23 Juli 2025 · 36 foto" aria-label="Perbesar foto: Workshop Penyusunan Perangkat KBM">
        <img src="/static/img/gallery-2.jpg" alt="Ruangan seminar sekolah dengan penceramah dan peserta guru yang menyimak presentasi" loading="lazy" />
        <div class="g-cap"><b>Workshop Perangkat KBM</b><span>KKG Gugus Cempaka · 23 Jul 2025</span></div>
      </button>
      <button class="g-item" data-cap="Rapat Pengurus — Program Semester Genap|KKG PAI Gugus Flamboyan · 21 Agu 2026 · 18 foto" aria-label="Perbesar foto: Rapat Pengurus Program Semester Genap">
        <img src="/static/img/gallery-3.jpg" alt="Diskusi para guru berpakaian batik di ruang kelas" loading="lazy" />
        <div class="g-cap"><b>Rapat Pengurus Semester Genap</b><span>KKG Flamboyan · 21 Agu 2026</span></div>
      </button>
    </div>
  </div>
</section>

<!-- ================= TENTANG RUANGKKG ================= -->
<section class="section" id="tentang" style="padding-top:0">
  <div class="wrap">
    <div class="section-head rv">
      <span class="pill"><span class="dot"></span> Tentang RuangKKG</span>
      <h2>Platform SaaS Pedagogis Independen untuk Pendidik Indonesia.</h2>
      <p class="lede">RuangKKG adalah platform SaaS (Software as a Service) teknologi pendidikan (EdTech) yang didirikan untuk memangkas beban administrasi dan memberdayakan guru Indonesia melalui kecerdasan artifisial yang terstruktur dan terstandarisasi.</p>
    </div>

    <div class="rv rv-d1" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
      <!-- Card 1: Identitas & Founder -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(38,148,148,0.1); color:#269494; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:800;">
            AH
          </div>
          <div>
            <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">Andris Hadiansyah</h3>
            <span style="font-size:0.8rem; color:#269494; font-weight:600;">Founder &amp; Lead Architect</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
          Memulai inisiatif RuangKKG pada tahun 2025 berawal dari riset lapangan pendampingan administrasi guru di Jawa Barat. Berfokus pada arsitektur Generative AI berbasis kurikulum resmi dan sistem kolaborasi komunitas belajar.
        </p>
      </div>

      <!-- Card 2: Model Bisnis & Hubungan dengan KKG -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(37,99,235,0.1); color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem; height:1.25rem;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">SaaS Komersial Independen</h3>
            <span style="font-size:0.8rem; color:#2563eb; font-weight:600;">Mitra Teknologi Komunitas</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
          RuangKKG beroperasi sebagai entitas pengembang SaaS independen (bootstrapped). Komunitas KKG, MGMP, dan sekolah bertindak sebagai pengguna, mitra perintis, dan pelanggan layanan langganan.
        </p>
      </div>

      <!-- Card 3: Operasional & Kepatuhan Data -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(22,163,74,0.1); color:#16a34a; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem; height:1.25rem;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">Kepatuhan &amp; Kontak</h3>
            <span style="font-size:0.8rem; color:#16a34a; font-weight:600;">UU PDP No. 27/2022</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
          Operasional berbasis di Jawa Barat, Indonesia. Mengedepankan prinsip <em>Zero-Data-Training</em> untuk keamanan dokumen pendidik. Kontak resmi: <strong>admin@ruangkkg.my.id</strong>.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- ================= HARGA ================= -->
<section class="section" id="harga">
  <div class="wrap">
    <div class="section-head center rv">
      <span class="pill"><span class="dot"></span> Harga</span>
      <h2>Harga yang masuk akal untuk urusan guru.</h2>
      <p class="lede">Mulai gratis selamanya untuk KKG kecil. Naik kelas saat butuh automasi penuh — bayar per KKG, bukan per anggota.</p>
      <div style="margin-top:1.4rem">
        <div class="toggle" role="group" aria-label="Pilih periode pembayaran">
          <button type="button" id="btnMonthly" aria-pressed="true">Bulanan</button>
          <button type="button" id="btnYearly" aria-pressed="false">Tahunan <span class="save">Hemat 18%</span></button>
        </div>
      </div>
    </div>

    <div class="price-grid">
      <div class="price rv">
        <div class="pn">Rintisan</div>
        <div class="pd">Untuk guru &amp; KKG yang baru mulai digital.</div>
        <div class="pr">
          <div class="amt">Rp 0<small>/selamanya</small></div>
          <div class="per">tanpa batas waktu</div>
        </div>
        <ul>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Akses gratis 5 Modul AI (CP, RPP, Soal, Slide, Game)</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>1 kegiatan aktif, 50 anggota KKG</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Kalender &amp; undangan kegiatan</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Absensi manual &amp; arsip 2 GB</li>
          <li class="dim"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>Absensi QR &amp; sertifikat otomatis</li>
        </ul>
        <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-ghost" style="width:100%;">Mulai Gratis</a>
      </div>

      <div class="price feat rv rv-d1">
        <div class="ribbon">Paling populer</div>
        <div class="pn">KKG Pro</div>
        <div class="pd">Untuk KKG yang berkegiatan rutin.</div>
        <div class="pr">
          <div class="old" data-old> </div>
          <div class="amt"><span data-price data-m="Rp 49rb" data-y="Rp 39rb">Rp 49rb</span><small data-suffix>/KKG/bln</small></div>
          <div class="per" data-note>tagihan per bulan</div>
        </div>
        <ul>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><b>Akses Penuh 5 Modul AI</b> seluruh guru anggota</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Buat RPP, Asesmen &amp; Soal tanpa batas</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Kegiatan tanpa batas, 500 anggota</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Absensi QR &amp; sertifikat bernomor verifikasi</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Buku kas, SPJ siap cetak, arsip 100 GB</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Prioritas CS &amp; pendampingan pengurus</li>
        </ul>
        <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-primary" style="width:100%;">Coba Gratis 30 Hari</a>
      </div>

      <div class="price rv rv-d2">
        <div class="pn">Kabupaten</div>
        <div class="pd">Untuk dinas, korcam &amp; MKKS.</div>
        <div class="pr">
          <div class="amt">Custom</div>
          <div class="per">penawaran per kebutuhan</div>
        </div>
        <ul>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><b>Lisensi AI Terintegrasi</b> se-Kecamatan / Kabupaten</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Custom format RPP &amp; KOP dinas daerah</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Semua fitur KKG Pro</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Dashboard rekap pengawas &amp; multi-gugus</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Pelatihan pengurus &amp; SLA dukungan khusus</li>
        </ul>
        <a class="btn btn-ghost" href="mailto:support@ruangkkg.my.id?subject=Penawaran%20Paket%20Kabupaten%20RuangKKG">Hubungi Kami</a>
      </div>
    </div>
    <p class="price-foot rv">Pembayaran via transfer bank, virtual account, atau QRIS — atas nama KKG, bukan perorangan. Berhenti kapan saja, data tetap bisa diekspor.</p>
  </div>
</section>


<!-- ================= TESTIMONI ================= -->
<section class="section" id="testimoni" style="padding-top:0">
  <div class="wrap">
    <div class="section-head center rv">
      <span class="pill"><span class="dot"></span> Kata mereka</span>
      <h2>Guru &amp; pengurus yang sudah merasakan bedanya.</h2>
    </div>
    <div class="testi-grid">
      <article class="testi rv">
        <p class="q">Biasanya menyusun RPP dan kisi-kisi asesmen butuh 3 malam suntuk. Lewat modul AI RuangKKG, draf perangkat siap ajar selesai sebelum jam pulang sekolah. Murid-murid pun antusias waktu kuis interaktifnya dicoba di kelas.</p>
        <div class="who"><span class="avatar" style="background:#16a34a">SR</span><div><b>Siti Rahmawati, S.Pd.</b><span>Guru Kelas 5 SD, Kab. Purwakarta</span></div></div>
      </article>
      <article class="testi rv rv-d1">
        <p class="q">Dulu SPJ nginep seminggu di meja saya. Sekarang sore setelah kegiatan selesai, laporannya sudah jadi dan siap tanda tangan.</p>
        <div class="who"><span class="avatar">RD</span><div><b>Hj. Ratna Dewi, S.Pd.</b><span>Ketua KKG Gugus 3, Bandung</span></div></div>
      </article>
      <article class="testi rv rv-d2">
        <p class="q">Absensi QR itu paling kerasa. Delapan puluh peserta, lima menit selesai, sertifikat otomatis terbit dan datanya langsung masuk tanpa rekap manual.</p>
        <div class="who"><span class="avatar a2">BS</span><div><b>Budi Santoso, S.Pd.</b><span>Sekretaris KKG, Surabaya</span></div></div>
      </article>
    </div>
  </div>
</section>

<!-- ================= FAQ ================= -->
<section class="section" id="faq" style="padding-top:0">
  <div class="wrap">
    <div class="section-head center rv">
      <span class="pill"><span class="dot"></span> FAQ</span>
      <h2>Pertanyaan yang Sering Diajukan.</h2>
      <p class="lede">Semua jawaban seputar standar Kurikulum Merdeka, ekspor dokumen, keamanan data, dan kemudahan penggunaan.</p>
    </div>
    <div class="faq-wrap rv">
      <div class="faq">
        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Apakah hasil RPP dan Soal AI ini sah sesuai standar Kurikulum Merdeka?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Diselaraskan dengan regulasi Keputusan BSKAP No. 046/H/KR/2025.</b> Seluruh generator modul ajar kami telah diselaraskan dengan standar Capaian Pembelajaran terbaru untuk menghasilkan draf kerja profesional yang memuat komponen wajib (CP, ATP, Berdiferensiasi, Asesmen Formatif &amp; Sumatif) yang siap ditelaah, disesuaikan, dan disahkan oleh pendidik sesuai konteks kelas masing-masing.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Apakah dokumen yang dihasilkan bisa langsung diunduh ke Microsoft Word (.docx)?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Bisa langsung diunduh tanpa perlu salin-tempel manual.</b> Seluruh dokumen Modul Ajar/RPP, Matriks Kisi-Kisi, Rubrik Penilaian KKTP, LKPD, dan Program Tahunan/Semester dapat langsung diunduh dalam format Microsoft Word (.docx) lengkap dengan kop surat sekolah resmi dan tabel rapi siap cetak. Slide presentasi juga dapat diekspor ke PowerPoint (.pptx).</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Apakah portal ini nyaman diakses melalui smartphone (HP Android / iPhone)?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Sangat nyaman dan ringan di HP.</b> Portal telah dilengkapi antarmuka mobile responsif khusus dengan App Bar Bawah ergonomis, tombol cepat Asisten AI, serta mendukung PWA (Progressive Web App). Anda dapat menambahkan RuangKKG langsung ke layar utama HP tanpa perlu mengunduh aplikasi berat dari Play Store.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bagaimana keamanan data pribadi guru dan sekolah?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Privasi dan keamanan data dijamin sepenuhnya.</b> Sesuai amanat UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), seluruh data login, NIP, dan riwayat dokumen tersimpan secara privat dengan enkripsi SSL/TLS 256-bit dan proteksi CSRF. Kami menerapkan prinsip Zero-Data-Training: materi ajar Anda tidak pernah digunakan sebagai dataset latihan AI publik.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bagaimana cara guru mendapatkan akun dan mulai mencoba?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Daftar langsung dan coba gratis seketika.</b> Pendidik dapat langsung menekan tombol &ldquo;Coba Gratis&rdquo; atau &ldquo;Masuk&rdquo; untuk mendaftar mandiri. Anda langsung mendapatkan akses gratis untuk menguji 5 modul AI (Analisis CP, RPP, Kisi-Kisi, Slide, Game) tanpa perlu memasukkan kartu kredit.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bisakah dipakai untuk MGMP, MGBK, atau komunitas belajar guru jenjang lain?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Bisa dan fleksibel untuk semua jenjang pendidikan.</b> Alur kerja pedagogik RuangKKG dirancang fleksibel untuk semua jenjang pendidikan: SD, SMP, SMA, SMK, maupun madrasah (MI, MTs, MA). Pilihan fase (Fase A hingga F), tingkat kelas, dan mata pelajaran dapat disesuaikan seketika di Asisten AI.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bagaimana sistem pembayarannya jika ingin upgrade ke Paket Pro?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Tersedia pembayaran instan dan resmi atas nama KKG/sekolah.</b> Pembayaran dapat dilakukan melalui transfer bank, virtual account, atau QRIS instan atas nama KKG/sekolah. Paket tahunan memberikan potongan hemat hingga 18%. Anda dapat membatalkan atau mengubah paket kapan saja tanpa penalti tersembunyi.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Apakah ada panduan penggunaan atau pelatihan bagi guru?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Tersedia panduan lengkap dan layanan bantuan ramah.</b> Kami menyediakan panduan video langkah demi langkah dalam bahasa Indonesia, contoh template terverifikasi, serta layanan bantuan pelanggan responsif melalui email support@ruangkkg.my.id.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================= CTA ================= -->
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="cta-panel rv">
      <h2>Siap memangkas waktu menyusun perangkat ajar — minggu ini juga?</h2>
      <p>Ratusan pendidik dan perintis komunitas belajar telah merasakan kemudahan 5 modul AI RuangKKG, dari Analisis CP sampai Game Edukasi — kembali punya waktu luang untuk hal terpenting: mengajar di depan kelas.</p>
      <div class="row">
        <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-accent">Mulai Gratis 30 Hari
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
        <a class="btn btn-ghost" href="#fitur">Lihat 5 Modul AI</a>
      </div>
      <p class="cta-note">Tanpa kartu kredit · Batalkan kapan saja · Data tetap milik Anda</p>
    </div>
  </div>
</section>
</main>

<!-- ================= FOOTER ================= -->
<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="brand" href="#beranda" aria-label="RuangKKG — beranda">
          <span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9.6L4 20.5Z"/><path d="M9.5 9.5l2 2 3.8-3.8"/></svg></span>
          <span class="word">RuangKKG</span>
        </a>
        <p>Platform SaaS EdTech independen untuk Kelompok Kerja Guru Indonesia — didirikan oleh Andris Hadiansyah (2025) guna merapikan administrasi agar guru fokus mengajar.</p>
      </div>
      <div class="foot-col">
        <h4>Produk</h4>
        <ul><li><a href="#fitur">Fitur AI</a></li><li><a href="#dokumentasi">Dokumentasi</a></li><li><a href="#tentang">Tentang Kami</a></li><li><a href="#harga">Harga</a></li><li><a href="#faq">FAQ</a></li></ul>
      </div>
      <div class="foot-col">
        <h4>Modul AI</h4>
        <ul><li><a href="#fitur">Analisis CP &amp; ATP</a></li><li><a href="#fitur">Modul Ajar / RPP</a></li><li><a href="#fitur">Asesmen &amp; Kisi-Kisi</a></li><li><a href="#fitur">Slide Presentasi &amp; Game</a></li></ul>
      </div>
      <div class="foot-col">
        <h4>Bantuan</h4>
        <ul><li><a href="#faq">Pusat Bantuan (FAQ)</a></li><li><a href="mailto:admin@ruangkkg.my.id?subject=Bantuan%20RuangKKG">Hubungi CS</a></li><li><a href="#testimoni">Testimoni</a></li><li><a href="#faq"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;margin-right:6px;"></span>Sistem Aktif (99.9%)</a></li></ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 RuangKKG · ruangkkg.my.id — Dibuat di Indonesia untuk guru Indonesia.</span>
      <div class="links"><a href="/terms" onclick="window.navigate && window.navigate('terms'); return false;">Syarat &amp; Ketentuan</a><a href="/privacy-policy" onclick="window.navigate && window.navigate('privacy-policy'); return false;">Kebijakan Privasi</a><a href="mailto:support@ruangkkg.my.id">Bantuan CS</a></div>
    </div>
  </div>
</footer>

<!-- ================= LIGHTBOX ================= -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Pratinjau foto dokumentasi">
  <button class="lb-close" id="lbClose" aria-label="Tutup pratinjau"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <figure><img id="lbImg" alt="" /><figcaption><b id="lbTitle"></b><span id="lbMeta"></span></figcaption></figure>
</div>
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


