// Generate a version hash at server start time for cache-busting
const APP_VERSION = Date.now().toString(36);

export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Digital KKG Gugus 3 Wanayasa</title>
  <meta name="description" content="Portal Digital Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta">
  <meta name="theme-color" content="#269494">

  <link rel="icon" type="image/png" href="/favicon.png">
  
  <link rel="stylesheet" href="/static/style.css?v=${APP_VERSION}">
  
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <script src="https://cdn.jsdelivr.net/npm/docx@7.1.0/build/index.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body class="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] antialiased selection:bg-primary-500 selection:text-white">
  <div id="app">
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#f8fdfd] z-50">
      <div class="relative mb-8">
        <div class="w-20 h-20 border-[3px] border-teal-100 border-t-[#269494] rounded-full animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 bg-gradient-to-br from-[#269494] to-[#1a7474] rounded-xl animate-pulse"></div>
        </div>
      </div>
      <h2 class="text-2xl font-display font-extrabold text-slate-900 tracking-tight mb-2">KKG Gugus 3</h2>
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

