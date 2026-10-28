export const THEME_PRESETS: Record<string, {
  id: string;
  name: string;
  primary: string;
  dark: string;
  light: string;
  cardLight: string;
  accent: string;
  deepDark: string;
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
    deepDark: '#0b3529',
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
    deepDark: '#0f172a',
    glow: 'rgba(37, 99, 235, 0.25)',
  },
  indigo: {
    id: 'indigo',
    name: 'Biru Safir Ningrat',
    primary: '#2b4c6f',
    dark: '#1f3852',
    deepDark: '#0c1824',
    light: '#f0f5fa',
    cardLight: '#e2ecf5',
    accent: '#16283b',
    glow: 'rgba(43, 76, 111, 0.25)',
  },
  emerald: {
    id: 'emerald',
    name: 'Salem Muda (Apricot Blush)',
    primary: '#c26d5c',
    dark: '#9e493a',
    deepDark: '#451c15',
    light: '#fdf6f4',
    cardLight: '#fbe6e1',
    accent: '#853629',
    glow: 'rgba(194, 109, 92, 0.25)',
  },
  amber: {
    id: 'amber',
    name: 'Cokelat Cendana (Moka)',
    primary: '#6d4c3d',
    dark: '#553a2e',
    deepDark: '#271913',
    light: '#faf6f3',
    cardLight: '#f0e7e1',
    accent: '#3d281f',
    glow: 'rgba(109, 76, 61, 0.25)',
  },
  rose: {
    id: 'rose',
    name: 'Merah Marun (Burgundy)',
    primary: '#6b1d34',
    dark: '#521325',
    deepDark: '#26050f',
    light: '#fcf2f4',
    cardLight: '#f7dde3',
    accent: '#3b0b19',
    glow: 'rgba(107, 29, 52, 0.25)',
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
      --theme-glow: ${t.glow} !important;
      --mono-link: ${t.primary} !important;
      --studio-action: ${t.primary} !important;
      --studio-action-hover: ${t.dark} !important;
      --studio-action-soft: ${t.cardLight} !important;
      --os-leaf: ${t.primary} !important;
      --os-forest: ${t.deepDark} !important;
      --os-focus: ${t.primary} !important;
    }
    .workspace-shell.wk-paper-studio.wk-paper-home {
      --mono-link: ${t.primary} !important;
      --studio-action: ${t.primary} !important;
      --studio-action-hover: ${t.dark} !important;
      --studio-action-soft: ${t.cardLight} !important;
    }
    .feature-workspace {
      --fw-accent: ${t.primary} !important;
      --fw-dark: ${t.deepDark} !important;
      --fw-soft: ${t.cardLight} !important;
      --os-focus: ${t.primary} !important;
      --page-accent: ${t.primary} !important;
      --page-accent-2: ${t.accent} !important;
      --page-soft: ${t.cardLight} !important;
      --page-ink: ${t.deepDark} !important;
    }
    body {
      background-image:
        radial-gradient(ellipse 600px 400px at 85% 10%, ${t.glow}, transparent),
        radial-gradient(ellipse 500px 500px at 10% 80%, ${t.glow}, transparent) !important;
    }

    /* Buttons & Interactive Elements */
    .btn-primary, button.bg-teal-500, a.bg-teal-500, .bg-teal-500, .bg-primary-500 {
      background-color: ${t.primary} !important;
      border-color: ${t.primary} !important;
      color: #ffffff !important;
    }
    .btn-primary:hover, button.bg-teal-500:hover, a.bg-teal-500:hover, .hover\\:bg-teal-600:hover, .bg-teal-600, .bg-primary-600 {
      background-color: ${t.dark} !important;
      border-color: ${t.dark} !important;
    }
    .hover\\:bg-teal-700:hover, .bg-teal-700 {
      background-color: ${t.accent} !important;
      border-color: ${t.accent} !important;
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

    /* Persistent Sidebar & Navigation */
    .workspace-shell.wk-organic-studio .wk-persistent-sidebar,
    .workspace-shell.wk-organic-studio .wk-drawer {
      background: linear-gradient(158deg, ${t.accent} 0%, ${t.dark} 52%, ${t.deepDark} 100%) !important;
      border-color: ${t.primary}33 !important;
    }
    .feature-workspace[data-studio-kind="generator"] .fs-heading,
    .feature-workspace[data-studio-kind="control"] .fs-heading,
    .wk-organic-studio.wk-paper-home .wk-green-dashboard .wk-welcome {
      background: linear-gradient(118deg, ${t.accent}, ${t.dark}) !important;
      border-color: ${t.primary} !important;
      color: #ffffff !important;
    }
    .wk-organic-studio .wk-persistent-link.wk-persistent-active,
    .wk-organic-studio .wk-drawer .wk-nav-item.wk-nav-active {
      color: ${t.dark} !important;
      background: ${t.cardLight} !important;
      border-color: ${t.cardLight} !important;
    }
    .wk-organic-studio :is(.wk-persistent-active, .wk-nav-active) > i {
      color: ${t.primary} !important;
      background: #ffffff !important;
    }
    .wk-organic-studio .wk-top-active::after,
    .wk-top-active::after {
      background: ${t.primary} !important;
    }
    .wk-organic-studio .wk-top-link.wk-top-active,
    .wk-top-link.wk-top-active {
      color: ${t.primary} !important;
    }

    /* Canvas & Studio Page Backgrounds */
    .workspace-shell.wk-paper-studio,
    .workspace-shell.wk-paper-studio.wk-paper-home {
      --mono-canvas: ${t.light} !important;
      --mono-soft: ${t.light} !important;
      --mono-line: ${t.cardLight} !important;
      --mono-link: ${t.primary} !important;
      --studio-action: ${t.primary} !important;
      --studio-action-hover: ${t.dark} !important;
      --studio-action-soft: ${t.cardLight} !important;
      background: ${t.light} !important;
    }

    /* Admin / Workspace Management Card on Home */
    .wk-paper-studio.wk-paper-home .wk-green-dashboard .wk-management,
    .wk-management {
      background: ${t.light} !important;
      border: 1px solid ${t.cardLight} !important;
    }
    .wk-management .wk-eyebrow {
      background: ${t.cardLight} !important;
      color: ${t.accent} !important;
    }
    .wk-management .wk-management-links a,
    .wk-management a {
      color: ${t.primary} !important;
    }
    .wk-management .wk-management-links a:hover,
    .wk-management a:hover {
      color: ${t.dark} !important;
    }
    .wk-approval-summary i,
    .wk-approval-summary svg {
      color: ${t.primary} !important;
    }

    /* Community Access & Links on Home */
    .wk-paper-studio.wk-paper-home .wk-studio-community-links button:hover {
      background: ${t.cardLight} !important;
    }
    .wk-paper-studio.wk-paper-home .wk-green-dashboard .wk-documents-empty {
      background: ${t.light} !important;
      border-color: ${t.cardLight} !important;
    }
    .wk-paper-studio.wk-paper-home .wk-green-dashboard .wk-empty-file {
      color: ${t.primary} !important;
    }
    .wk-announcement-list li button:hover strong {
      color: ${t.primary} !important;
    }
    .wk-discussion-icon {
      color: ${t.primary} !important;
    }
    .wk-discussion-list li button:hover strong {
      color: ${t.primary} !important;
    }

    /* Admin Dashboard Metric Grids */
    #panel-dashboard > .grid:has(#metric-new-users) > div {
      background: ${t.light} !important;
      border-color: ${t.cardLight} !important;
    }
    #panel-dashboard > .grid:has(#total-guru) > div:hover {
      border-color: ${t.primary} !important;
    }

    /* AI Monitor & Slide Studio */
    .ai-generation-notice, .ai-monitor {
      background: ${t.light} !important;
      border-color: ${t.cardLight} !important;
    }
    .slide-classroom-studio {
      --slide-accent: ${t.primary} !important;
      --slide-soft: ${t.cardLight} !important;
      --slide-line: ${t.cardLight} !important;
    }

    /* Beranda (Home Dashboard) Dynamic Overrides */
    .wk-paper-studio.wk-paper-home .wk-studio-launch-primary {
      background: linear-gradient(130deg, ${t.primary}, ${t.accent}) !important;
      color: #ffffff !important;
    }
    .wk-paper-studio.wk-paper-home .wk-studio-launch-primary:hover {
      background: linear-gradient(130deg, ${t.dark}, ${t.deepDark}) !important;
    }
    .wk-paper-studio.wk-paper-home .wk-studio-launch-cp {
      background: ${t.cardLight} !important;
      border: 1px solid ${t.primary}33 !important;
      color: ${t.deepDark} !important;
    }
    .wk-paper-studio.wk-paper-home .wk-studio-launch-cp .wk-studio-launch-icon {
      color: ${t.primary} !important;
    }
    .wk-paper-studio.wk-paper-home .wk-studio-launch-cp small {
      color: ${t.accent}dd !important;
    }
    .wk-paper-studio.wk-paper-home .wk-green-dashboard .wk-support-tool-icon,
    .wk-paper-studio.wk-paper-home .wk-green-dashboard .wk-support-tool:hover {
      color: ${t.primary} !important;
    }
    .wk-paper-studio .wk-paper-dashboard .wk-open-document,
    .wk-open-document {
      background: ${t.cardLight} !important;
      color: ${t.accent} !important;
      border: 1px solid ${t.primary}22 !important;
    }
    .wk-paper-studio .wk-paper-dashboard .wk-open-document:hover,
    .wk-open-document:hover {
      background: ${t.light} !important;
      color: ${t.primary} !important;
      border-color: ${t.primary} !important;
    }
    .wk-section-kicker {
      color: ${t.primary} !important;
    }

    /* Admin Dashboard Panel Overrides */
    #panel-dashboard > :first-child,
    .ui-admin-actions {
      background: linear-gradient(125deg, ${t.deepDark}, ${t.accent}) !important;
      border-color: ${t.primary}44 !important;
      color: #ffffff !important;
    }
    #panel-dashboard > :first-child p,
    .ui-admin-actions p {
      color: ${t.cardLight} !important;
    }
    #panel-dashboard > :first-child #dashboard-mode-label {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.25) !important;
      color: #ffffff !important;
    }
    #panel-dashboard > :first-child .flex-wrap > button:not(:first-child) {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.25) !important;
      color: #ffffff !important;
    }
    #panel-dashboard > :first-child .flex-wrap > button:not(:first-child):hover {
      background: rgba(255, 255, 255, 0.22) !important;
    }
    #panel-dashboard > .grid:has(#total-guru) > div > div:first-child > span:first-child {
      background: ${t.cardLight} !important;
      color: ${t.primary} !important;
      border-color: ${t.primary}33 !important;
    }
    #panel-dashboard > .grid:has(#total-guru) > div:hover {
      border-color: ${t.primary}66 !important;
    }
    #panel-dashboard :is(#dash-period-7, #dash-period-30, #dash-period-90, #density-comfort-btn, #density-compact-btn).bg-primary-600 {
      background-color: ${t.primary} !important;
      border-color: ${t.primary} !important;
      color: #ffffff !important;
    }
    #panel-dashboard :is(#dash-period-7, #dash-period-30, #dash-period-90, #density-comfort-btn, #density-compact-btn).bg-primary-600:hover {
      background-color: ${t.dark} !important;
      border-color: ${t.dark} !important;
    }
    .feature-workspace [data-control-tab][aria-current="page"],
    .control-context-link.is-active {
      background: ${t.primary} !important;
      border-color: ${t.dark} !important;
      color: #ffffff !important;
    }
    .control-mode button[aria-pressed="true"],
    .control-mode .fw-action[aria-pressed="true"] {
      background: ${t.primary} !important;
      border-color: ${t.primary} !important;
      color: #ffffff !important;
    }

    /* Primary Generate / Submit Action Buttons across workspaces */
    .feature-workspace .fw-action:is(.rpp-generate-btn, .asesmen-generate-btn, #btn-submit-generate, #sg-btn-instant-flow, #generate-proker-btn, #btn-generate-program),
    .feature-workspace[data-feature-page="rpp"] #btn-generate-rpp.rpp-generate-btn,
    .feature-workspace[data-feature-page="kisi"] #asesmen-form .asesmen-action-footer > .asesmen-generate-btn.fw-action,
    .feature-workspace[data-composition="analisis-cp"] .fw-cp-generate-action #btn-submit-generate,
    .feature-workspace[data-feature-page="analisis-cp"][data-composition="analisis-cp"] .fw-cp-generate-action #btn-submit-generate,
    .slide-classroom-studio button.ss-primary {
      background: linear-gradient(110deg, ${t.accent}, ${t.primary}) !important;
      border-color: ${t.dark} !important;
      color: #ffffff !important;
      box-shadow: 0 6px 18px ${t.glow} !important;
    }
    .feature-workspace .fw-action:is(.rpp-generate-btn, .asesmen-generate-btn, #btn-submit-generate, #sg-btn-instant-flow, #generate-proker-btn, #btn-generate-program):hover,
    .feature-workspace[data-feature-page="rpp"] #btn-generate-rpp.rpp-generate-btn:hover,
    .feature-workspace[data-feature-page="kisi"] #asesmen-form .asesmen-action-footer > .asesmen-generate-btn.fw-action:hover,
    .feature-workspace[data-composition="analisis-cp"] .fw-cp-generate-action #btn-submit-generate:hover,
    .slide-classroom-studio button.ss-primary:hover {
      background: linear-gradient(110deg, ${t.dark}, ${t.deepDark}) !important;
      border-color: ${t.deepDark} !important;
    }

    /* Chapter Semester Toggle Buttons (SMT 1 & SMT 2 in Analisis CP) */
    .feature-workspace[data-composition="analisis-cp"] #chapters-list-container .fw-chapter-card .btn-toggle-sem.bg-sky-500,
    .feature-workspace #chapters-list-container .btn-toggle-sem.bg-sky-500 {
      background: ${t.primary} !important;
      border-color: ${t.dark} !important;
      color: #ffffff !important;
    }
    .feature-workspace[data-composition="analisis-cp"] #chapters-list-container .fw-chapter-card .btn-toggle-sem.bg-purple-600,
    .feature-workspace #chapters-list-container .btn-toggle-sem.bg-purple-600 {
      background: ${t.accent} !important;
      border-color: ${t.deepDark} !important;
      color: #ffffff !important;
    }

    /* 8 Dimensi Profil Lulusan Chips (RPP) */
    .feature-workspace[data-feature-page="rpp"] #profil-tags .rpp-tag,
    #profil-tags .rpp-tag {
      background: ${t.cardLight} !important;
      border: 1px solid ${t.primary}44 !important;
      color: ${t.accent} !important;
    }
    .feature-workspace[data-feature-page="rpp"] #profil-tags .rpp-tag:hover,
    #profil-tags .rpp-tag:hover {
      background: ${t.light} !important;
      border-color: ${t.primary} !important;
      color: ${t.primary} !important;
    }
    .feature-workspace[data-feature-page="rpp"] #profil-tags .rpp-tag.active,
    #profil-tags .rpp-tag.active {
      background: ${t.primary} !important;
      border-color: ${t.dark} !important;
      color: #ffffff !important;
    }

    /* Step Badges, Section Title Icons & Accents */
    .feature-workspace .fw-heading-icon,
    .fw-section-title > i,
    .fw-section-title i {
      color: ${t.primary} !important;
    }
    .feature-workspace .fw-badge,
    .feature-workspace[data-feature-page] .fw-badge {
      background-color: ${t.cardLight} !important;
      color: ${t.accent} !important;
      border-color: ${t.primary}44 !important;
    }
    .feature-workspace[data-feature-page] .fw-form-progress .fw-progress-steps > li.done .fw-step-count {
      background: ${t.cardLight} !important;
      color: ${t.accent} !important;
      border-color: ${t.primary} !important;
    }
    .feature-workspace[data-feature-page] .fw-form-progress .fw-progress-fill {
      background: linear-gradient(90deg, ${t.accent}, ${t.primary}) !important;
    }

    /* Active pills and toggles (PDF vs Teks, Cakupan 1 Tahun Penuh) */
    .btn-cakupan-toggle.active,
    .btn-source-toggle.active,
    #tab-btn-pdf.active,
    #tab-btn-pdf[class~="bg-white"],
    .feature-workspace .fw-action:is(#tab-btn-pdf, #tab-btn-text)[class~="bg-white"] {
      background: ${t.primary} !important;
      border-color: ${t.dark} !important;
      color: #ffffff !important;
    }
    #game-catalog-filter-chips button.bg-teal-500 {
      background-color: ${t.primary} !important;
      border-color: ${t.primary} !important;
      color: #ffffff !important;
    }
    .ui-loading-card i {
      color: ${t.primary} !important;
    }

    /* Focus Outlines */
    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible,
    .feature-workspace .fw-field:focus {
      outline-color: ${t.primary} !important;
    }

    /* Dark Mode Theme Support */
    .dark .feature-workspace[data-feature-page="rpp"] #btn-generate-rpp.rpp-generate-btn,
    .dark .feature-workspace[data-feature-page="kisi"] #asesmen-form .asesmen-action-footer > .asesmen-generate-btn.fw-action,
    .dark .feature-workspace[data-feature-page="analisis-cp"][data-composition="analisis-cp"] .fw-cp-generate-action #btn-submit-generate {
      background: linear-gradient(120deg, ${t.deepDark}, ${t.accent}) !important;
      border-color: ${t.primary} !important;
    }
    .dark #panel-dashboard > :first-child {
      background: linear-gradient(125deg, ${t.deepDark}, ${t.accent}) !important;
      border-color: ${t.primary}44 !important;
    }
    .dark #panel-dashboard > .grid:has(#total-guru) > div > div:first-child > span:first-child {
      background: ${t.deepDark} !important;
      color: ${t.light} !important;
      border-color: ${t.primary}44 !important;
    }
    .dark .wk-paper-studio.wk-paper-home .wk-studio-launch-cp {
      background: ${t.deepDark} !important;
      border-color: ${t.primary}44 !important;
      color: ${t.light} !important;
    }
  `;
}

function htmlText(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

export function renderHTML(initialTheme: string = 'teal', profile: Record<string, string> = {}): string {
  const APP_VERSION = Date.now().toString(36);
  const theme = THEME_PRESETS[initialTheme] || THEME_PRESETS.teal;
  const themeCss = getThemeCss(initialTheme);
  const appName = htmlText(profile.app_name || 'RuangKKG');
  const orgName = htmlText(profile.nama_kkg || 'Untuk guru SD Indonesia');
  const appUrl = htmlText(profile.app_url || profile.website_kkg || '');
  const contact = htmlText(profile.email_kkg || '');
  const contactLink = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email_kkg || '')
    ? `<a href="mailto:${contact}">${contact}</a>`
    : '<span>Kontak pengurus belum dikonfigurasi</span>';
  const bootProfile = JSON.stringify(profile).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth" data-color-theme="${theme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} | ${orgName}</title>
    <meta name="description" content="RuangKKG membantu guru SD di KKG menganalisis CP, menyusun draf RPP dan asesmen, serta menyiapkan slide dan game edukasi dalam satu ruang kerja.">
  <meta name="author" content="${orgName}">
    <meta property="og:title" content="${appName} | ${orgName}">
    <meta property="og:description" content="Analisis CP, draf RPP dan asesmen, slide, serta game edukasi untuk guru SD di KKG.">
  <meta property="og:url" content="${appUrl}">
  <meta property="og:site_name" content="${appName}">
  <meta name="theme-color" content="${theme.primary}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${appName}">

  <link rel="icon" type="image/png" href="/static/icons/icon-192x192.png">
  <link rel="apple-touch-icon" href="/static/icons/icon-192x192.png">
   <link rel="manifest" href="/api/settings/manifest">
   <script>window.__KKG_ORGANIZATION__ = ${bootProfile};</script>
  
  <link rel="stylesheet" href="/static/style.css?v=${APP_VERSION}">

  <style id="dynamic-theme-style">${themeCss}</style>
  <style id="boot-shell-style">
    #boot-skeleton { display: none; }
    html.kkg-boot-auth #landing-root { display: none !important; }
    html.kkg-boot-auth #boot-skeleton {
      display: flex; min-height: 60vh; align-items: center; justify-content: center;
      color: var(--color-text-secondary); font-size: 0.95rem;
    }
  </style>

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
  <script>
    // Hide the pre-rendered public landing shell before first paint when the
    // UI-only login marker is present (logged-in browser, hard reload). Auth
    // decisions still happen in JS after /auth/me resolves; this only avoids
    // the landing flash. Crawlers/visitors without the marker are unaffected.
    (function() {
      try {
        if (/(?:^|;\\s*)kkg_logged_in=1(?:;|$)/.test(document.cookie)) {
          document.documentElement.classList.add('kkg-boot-auth');
        }
      } catch (e) {}
    })();
  </script>
  <div id="boot-skeleton" aria-hidden="true"><span>Memuat RuangKKG…</span></div>
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
      <span class="word">${appName}<small>${orgName}</small></span>
    </a>
    <nav class="nav" aria-label="Navigasi utama">
      <a href="#fitur">Modul AI</a>
      <a href="#tentang">Tentang</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="head-cta">
      <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-ghost btn-sm">Masuk</a>
       <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-primary btn-sm">Mulai</a>
      <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="mobileNav" aria-label="Buka menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      </button>
    </div>
  </div>
</header>
<nav class="mobile-nav" id="mobileNav" aria-label="Navigasi seluler">
  <a href="#fitur">Modul AI</a>
  <a href="#tentang">Tentang</a>
  <a href="#faq">FAQ</a>
   <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-primary" style="width:100%; margin-top:0.8rem;">Masuk atau Daftar</a>
</nav>

<main>
<!-- ================= HERO ================= -->
<section class="hero" id="beranda">
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
         <span class="pill rv">5 modul AI untuk perangkat pembelajaran</span>
         <h1 class="rv rv-d1">Satu perintah guru,<br />jadi <span class="hl">draf RPP<svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9c40-5 90-6.5 194-4" stroke="#e9a51b" stroke-width="5" stroke-linecap="round"/></svg></span> yang siap ditinjau.</h1>
         <p class="lede rv rv-d2">RuangKKG membantu guru SD di KKG menganalisis CP, menyusun draf RPP dan asesmen, serta menyiapkan slide dan game edukasi dalam satu alur kerja.</p>
        <div class="hero-cta rv rv-d3">
           <a class="btn btn-primary" href="/login" onclick="window.navigate && window.navigate('login'); return false;">Buka RuangKKG
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <a class="btn btn-ghost" href="#fitur">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            Jelajahi 5 Modul</a>
        </div>
        <div class="hero-trust rv rv-d3">
          <div>
             <span class="tt">Ruang kerja untuk guru SD dan KKG</span>
            <span class="ts">Susun perangkat ajar dan kelola kegiatan dalam satu portal.</span>
          </div>
        </div>
      </div>

       <div class="magic rv" id="magicDemo" data-phase="prompt" role="img" aria-label="Ilustrasi: contoh perintah guru dan susunan draf RPP yang dapat ditinjau.">
        <div class="magic-glow" aria-hidden="true"></div>
        <div class="magic-dots" aria-hidden="true"></div>
        <div class="m-stage" aria-hidden="true">
          <div class="m-card m-prompt">
            <div class="m-head"><span class="m-who"><span class="dot">AN</span>Anda · wali kelas 5</span><span class="m-tag">Modul: Buat RPP</span></div>
            <p class="m-text"><span id="mType"></span><span class="m-caret"></span></p>
            <div class="m-foot"><span class="m-hint">Satu kalimat, bukan templat kosong.</span><span class="m-send">Kirim<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
          </div>
          <div class="m-card m-result">
             <div class="m-head"><span class="m-who ai"><span class="dot">✶</span>RPP — Koding &amp; KA Kelas 5</span><span class="m-tag hot">Contoh hasil</span></div>
            <ul class="m-sections">
              <li style="--i:0"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Identitas &amp; tujuan pembelajaran</li>
              <li style="--i:1"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Alur kegiatan: pendahuluan–inti–penutup</li>
              <li style="--i:2"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Media &amp; logika koding sehari-hari</li>
              <li style="--i:3"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Penilaian &amp; rubrik skor</li>
            </ul>
             <div class="m-foot"><span class="m-hint">Draf untuk ditinjau dan disunting</span><span class="m-send ghost">Ekspor Word</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item rv"><div class="n">5 <em>modul AI</em></div><div class="l">Analisis CP, RPP, asesmen, slide, dan game</div></div>
      <div class="stat-item rv rv-d1"><div class="n">CP <em>→ RPP</em></div><div class="l">Alur perangkat ajar yang terhubung</div></div>
      <div class="stat-item rv rv-d2"><div class="n">DOCX <em>· PPTX</em></div><div class="l">Ekspor dokumen dan presentasi</div></div>
      <div class="stat-item rv rv-d3"><div class="n">Guru <em>· KKG</em></div><div class="l">Alat mengajar dan ruang kerja komunitas</div></div>
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
             <h2>Dari analisis CP ke draf RPP yang siap ditinjau.</h2>
            <p class="lede" style="margin-bottom:0">Pilih hasil Analisis CP atau isi tujuan sendiri, lalu AI menyusun komponen RPP: identitas, tujuan, alur kegiatan, media, sampai penilaian. Tinjau, sesuaikan dengan gaya mengajar Anda.</p>
            <ul class="checks">
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Struktur rapi: pendahuluan, kegiatan inti, penutup</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Tujuan &amp; kegiatan selaras dengan capaian</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Ekspor Word &amp; PDF — siap cetak &amp; supervisi</span></li>
            </ul>
          </div>
          <div class="f-visual">
             <div class="mock" role="img" aria-label="Ilustrasi contoh draf RPP dengan alur kegiatan">
               <div class="mock-head"><span class="mt">✶ Buat RPP</span><span class="ai-badge">Contoh draf</span></div>
              <div class="rppdoc">
                <div class="rd-head"><b>RPP — Fotosintesis (IPAS)</b><span>Kelas 4 · 1 pertemuan · 2 × 35 menit</span></div>
                <div class="rd-sec"><b>Pendahuluan · 10 menit</b><div class="ln" style="width:100%"></div><div class="ln" style="width:82%"></div></div>
                 <div class="rd-sec"><b>Kegiatan Inti · 50 menit</b><div class="ln" style="width:96%"></div><div class="ln" style="width:100%"></div><div class="ln" style="width:74%"></div></div>
                 <div class="rd-sec"><b>Penutup · 10 menit</b><div class="ln" style="width:88%"></div><div class="ln" style="width:64%"></div></div>
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
             <div class="mock" role="img" aria-label="Ilustrasi tampilan game edukasi: kuis fotosintesis dengan contoh papan skor">
               <div class="mock-head"><span class="mt">✶ Game Edukasi</span><span class="ma">Contoh tampilan</span></div>
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
                   <div class="gm-row"><b>1</b><span>Peserta A</span><i>2.400</i></div>
                   <div class="gm-row"><b>2</b><span>Peserta B</span><i>2.150</i></div>
                   <div class="gm-row"><b>3</b><span>Peserta C</span><i>1.980</i></div>
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
          <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-sm btn-accent mod-next-btn">
             Buka 5 Modul di RuangKKG
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================= TENTANG RUANGKKG ================= -->
<section class="section" id="tentang" style="padding-top:0">
  <div class="wrap">
    <div class="section-head rv">
      <span class="pill"><span class="dot"></span> Tentang RuangKKG</span>
        <h2>Ruang kerja guru SD, dari CP sampai perangkat ajar.</h2>
        <p class="lede">Di RuangKKG, guru SD dapat menganalisis CP, menyusun RPP dan asesmen, serta menyiapkan slide dan game edukasi dalam satu alur. Setiap draf tetap perlu ditinjau dan disesuaikan dengan kelas.</p>
    </div>

    <div class="rv rv-d1" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
      <!-- Card 1: Identitas & Founder -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
           <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(38,148,148,0.1); color:#116d6d; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:800;">
            AH
          </div>
          <div>
            <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">Andris Hadiansyah</h3>
              <span style="font-size:0.8rem; color:#116d6d; font-weight:600;">Perintis RuangKKG</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
            Andris mengembangkan RuangKKG sebagai alat bantu menyusun perangkat ajar bagi guru SD di KKG.
        </p>
      </div>

      <!-- Card 2: KKG guru SD -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(37,99,235,0.1); color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem; height:1.25rem;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
              <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">Untuk guru SD dan KKG</h3>
              <span style="font-size:0.8rem; color:#2563eb; font-weight:600;">Kelompok Kerja Guru SD</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
            Guru SD dapat memulai dari dokumen CP, lalu memakai materi yang sama saat menyiapkan RPP, asesmen, dan kegiatan kelas bersama KKG.
        </p>
      </div>

      <!-- Card 3: Operasional & Kepatuhan Data -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(22,163,74,0.1); color:#16a34a; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem; height:1.25rem;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
             <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">Data dan bantuan</h3>
              <span style="font-size:0.8rem; color:#137336; font-weight:600;">Informasi untuk pengguna</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
           Baca <a href="/privacy-policy" onclick="window.navigate && window.navigate('privacy-policy'); return false;">Kebijakan Privasi</a> untuk informasi pengelolaan data. Untuk bertanya tentang layanan, hubungi ${contactLink}.
        </p>
      </div>
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
             <p>Informasi tentang data akun dan dokumen yang Anda simpan tersedia dalam <a href="/privacy-policy" onclick="window.navigate && window.navigate('privacy-policy'); return false;">Kebijakan Privasi</a>. Jika ada pertanyaan tentang data Anda, hubungi ${contactLink}.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bagaimana cara guru mendapatkan akun dan mulai mencoba?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
             <p>Tekan &ldquo;Buka RuangKKG&rdquo; atau &ldquo;Masuk&rdquo;, lalu pilih tab Daftar pada halaman akun. Setelah masuk, Anda dapat melihat modul dan akses yang tersedia untuk akun Anda.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
             <span>Bagaimana guru SD di KKG menggunakan RuangKKG?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
             <p>Guru SD di KKG dapat memulai dengan analisis CP, lalu menyiapkan draf RPP, asesmen, slide, dan game sesuai kelas yang diampu. Setiap draf perlu ditinjau sebelum digunakan di kelas.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bagaimana sistem pembayarannya jika ingin upgrade ke Paket Pro?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
             <p>Untuk mengetahui ketentuan layanan yang berlaku pada ${orgName}, hubungi ${contactLink}.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Apakah ada panduan penggunaan atau pelatihan bagi guru?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p>Panduan penggunaan dan bantuan layanan tersedia melalui pengurus ${orgName}: ${contactLink}.</p>
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
       <h2>Mulai susun perangkat ajar dari kebutuhan kelas Anda.</h2>
       <p>Gunakan Analisis CP sebagai titik awal, lalu lanjutkan ke RPP, asesmen, slide, atau game edukasi sesuai kegiatan belajar yang Anda rencanakan.</p>
      <div class="row">
         <a href="/login" onclick="window.navigate && window.navigate('login'); return false;" class="btn btn-accent">Buka RuangKKG
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
        <a class="btn btn-ghost" href="#fitur">Lihat 5 Modul AI</a>
      </div>
       <p class="cta-note">Masuk atau daftar untuk melihat modul yang tersedia.</p>
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
          <span class="word">${appName}</span>
        </a>
          <p>Ruang kerja guru SD dan KKG: analisis CP, RPP, asesmen, slide, dan game edukasi dalam satu alur.</p>
      </div>
      <div class="foot-col">
         <h3>Produk</h3>
        <ul><li><a href="#fitur">Fitur AI</a></li><li><a href="#tentang">Tentang Kami</a></li><li><a href="#faq">FAQ</a></li></ul>
      </div>
      <div class="foot-col">
         <h3>Modul AI</h3>
        <ul><li><a href="#fitur">Analisis CP &amp; ATP</a></li><li><a href="#fitur">Modul Ajar / RPP</a></li><li><a href="#fitur">Asesmen &amp; Kisi-Kisi</a></li><li><a href="#fitur">Slide Presentasi &amp; Game</a></li></ul>
      </div>
      <div class="foot-col">
         <h3>Bantuan</h3>
        <ul><li><a href="#faq">Pusat Bantuan (FAQ)</a></li><li>${contactLink}</li><li><a href="#faq">Panduan penggunaan</a></li></ul>
      </div>
    </div>
    <div class="foot-bottom">
       <span>© ${new Date().getFullYear()} ${appName} · ${orgName}</span>
      <div class="links"><a href="/terms" onclick="window.navigate && window.navigate('terms'); return false;">Syarat &amp; Ketentuan</a><a href="/privacy-policy" onclick="window.navigate && window.navigate('privacy-policy'); return false;">Kebijakan Privasi</a>${contactLink}</div>
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


