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
  <title>Portal Digital KKG</title>
  <meta name="description" content="Portal Digital Kelompok Kerja Guru (KKG)">
  <meta name="theme-color" content="${theme.primary}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Portal KKG">

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
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#f8fdfd] z-50">
      <div class="relative mb-8">
        <div class="w-20 h-20 border-[3px] rounded-full animate-spin" style="border-color: ${theme.cardLight}; border-top-color: ${theme.primary};"></div>
        <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 rounded-xl animate-pulse" style="background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.dark} 100%);"></div>
        </div>
      </div>
      <h2 class="text-2xl font-display font-extrabold text-slate-900 tracking-tight mb-2" id="splash-title">Portal Digital KKG</h2>
      <p id="loading-status" class="text-sm text-slate-400 font-medium animate-pulse">Memuat Aplikasi...</p>
    </div>
  </div>
  
  <div id="toast-container"></div>
  
  <noscript>
    <div class="fixed inset-0 flex items-center justify-center bg-white z-[9999] text-center p-4">
      <div>
        <h1 class="text-2xl font-bold text-red-600 mb-2">JavaScript Diperlukan</h1>
        <p class="text-gray-600">Aplikasi ini memerlukan JavaScript untuk berjalan. Mohon aktifkan JavaScript di browser Anda.</p>
      </div>
    </div>
  </noscript>

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


