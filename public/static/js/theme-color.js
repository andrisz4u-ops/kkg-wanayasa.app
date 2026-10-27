/**
 * KKG Portal Theme Color Engine
 * Provides dynamic white-label theme presets across the web application
 */

export const THEME_PRESETS = {
  teal: {
    id: 'teal',
    name: 'Teal Emerald Organik',
    tag: 'Default Fresh',
    desc: 'Warna default portal: hijau kebiruan segar, nyaman, dan modern.',
    primary: '#269494',
    dark: '#1a7474',
    light: '#f0fdfa',
    cardLight: '#e0f2f1',
    accent: '#155e5e',
    deepDark: '#0b3529',
    glow: 'rgba(38, 148, 148, 0.25)',
    swatch: 'linear-gradient(135deg, #269494 0%, #1a7474 100%)'
  },
  blue: {
    id: 'blue',
    name: 'Biru Pendidikan (Kemendikbud)',
    tag: 'Resmi & Nasional',
    desc: 'Formal dan berwibawa khas dinas pendidikan nasional.',
    primary: '#2563eb',
    dark: '#1d4ed8',
    light: '#eff6ff',
    cardLight: '#dbeafe',
    accent: '#1e40af',
    deepDark: '#0f172a',
    glow: 'rgba(37, 99, 235, 0.25)',
    swatch: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo EduTech',
    tag: 'Digital & Cerdas',
    desc: 'Nuansa teknologi digital modern, futuristik, dan transformatif.',
    primary: '#4f46e5',
    dark: '#4338ca',
    light: '#eef2ff',
    cardLight: '#e0e7ff',
    accent: '#3730a3',
    deepDark: '#1e1b4b',
    glow: 'rgba(79, 70, 229, 0.25)',
    swatch: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Zamrud (Madrasah)',
    tag: 'Islami & Sejuk',
    desc: 'Alami, sejuk, mencerminkan keteduhan dan nilai madrasah.',
    primary: '#059669',
    dark: '#047857',
    light: '#ecfdf5',
    cardLight: '#d1fae5',
    accent: '#065f46',
    deepDark: '#064e3b',
    glow: 'rgba(5, 150, 105, 0.25)',
    swatch: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
  },
  amber: {
    id: 'amber',
    name: 'Emas Nusantara (Terracotta)',
    tag: 'Hangat & Karismatik',
    desc: 'Hangat, elegan, membangkitkan energi dan antusiasme belajar.',
    primary: '#d97706',
    dark: '#b45309',
    light: '#fffbeb',
    cardLight: '#fef3c7',
    accent: '#92400e',
    deepDark: '#451a03',
    glow: 'rgba(217, 119, 6, 0.25)',
    swatch: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
  },
  rose: {
    id: 'rose',
    name: 'Merah Marun (Crimson Royal)',
    tag: 'Tegas & Berani',
    desc: 'Bermartabat, melambangkan dedikasi dan kepemimpinan pendidik.',
    primary: '#e11d48',
    dark: '#be123c',
    light: '#fff1f2',
    cardLight: '#ffe4e6',
    accent: '#9f1239',
    deepDark: '#4c0519',
    glow: 'rgba(225, 29, 72, 0.25)',
    swatch: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
  }
};

/**
 * Get stored theme color from localStorage
 */
export function getStoredThemeColor() {
  try {
    return localStorage.getItem('kkg_theme_color') || 'teal';
  } catch (e) {
    return 'teal';
  }
}

/**
 * Apply selected theme color dynamically to document
 */
export function applyThemeColor(themeKey = 'teal', persist = true) {
  const t = THEME_PRESETS[themeKey] || THEME_PRESETS.teal;
  document.documentElement.setAttribute('data-color-theme', t.id);

  if (persist) {
    try {
      localStorage.setItem('kkg_theme_color', t.id);
    } catch (e) {}
  }

  // Update root CSS Variables
  const root = document.documentElement;
  root.style.setProperty('--color-primary', t.primary);
  root.style.setProperty('--color-primary-dark', t.dark);
  root.style.setProperty('--color-primary-light', t.light);
  root.style.setProperty('--color-accent', t.accent);
  root.style.setProperty('--color-brand-primary', t.primary);
  root.style.setProperty('--color-brand-secondary', t.dark);
  root.style.setProperty('--color-brand-accent', t.primary);
  root.style.setProperty('--theme-glow', t.glow);

  // Update browser theme-color meta tag
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', t.primary);

  // Update or inject dynamic stylesheet for Tailwind utility classes override
  let dynamicStyle = document.getElementById('dynamic-theme-style');
  if (!dynamicStyle) {
    dynamicStyle = document.createElement('style');
    dynamicStyle.id = 'dynamic-theme-style';
    document.head.appendChild(dynamicStyle);
  }

  if (t.id === 'teal') {
    dynamicStyle.innerHTML = '';
    return;
  }

  dynamicStyle.innerHTML = `
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

/**
 * Render Theme Option Cards for Admin Settings
 */
export function renderThemeCards(currentTheme = 'teal') {
  return Object.values(THEME_PRESETS).map(t => {
    const isSelected = t.id === currentTheme;
    return `
      <div 
        onclick="selectThemeColor('${t.id}')"
        id="theme-card-${t.id}"
        class="theme-card cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
          isSelected 
            ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900/10' 
            : 'border-slate-200/80 bg-white/70 hover:border-slate-400 hover:bg-white'
        }"
      >
        <div class="flex items-start gap-3.5">
          <div 
            class="w-11 h-11 rounded-xl shadow-inner shrink-0 flex items-center justify-center text-white"
            style="background: ${t.swatch}"
          >
            <i class="fas fa-check text-xs transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="font-bold text-sm text-slate-900 truncate">${t.name}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
              }">${t.tag}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">${t.desc}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.THEME_PRESETS = THEME_PRESETS;
  window.getStoredThemeColor = getStoredThemeColor;
  window.applyThemeColor = applyThemeColor;
  window.renderThemeCards = renderThemeCards;
  
  window.selectThemeColor = async function(themeId) {
    const hiddenInput = document.getElementById('profil-theme_color');
    if (hiddenInput) hiddenInput.value = themeId;

    const labelEl = document.getElementById('current-theme-label');
    if (labelEl && THEME_PRESETS[themeId]) {
      labelEl.textContent = THEME_PRESETS[themeId].name;
    }

    // Update active visual state on cards
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.remove('border-slate-900', 'ring-2', 'ring-slate-900/10');
      card.classList.add('border-slate-200/80');
      const checkIcon = card.querySelector('.fa-check');
      if (checkIcon) checkIcon.classList.replace('opacity-100', 'opacity-0');
      const tag = card.querySelector('span:last-child');
      if (tag) {
        tag.classList.replace('bg-slate-900', 'bg-slate-100');
        tag.classList.replace('text-white', 'text-slate-500');
      }
    });

    const activeCard = document.getElementById(`theme-card-${themeId}`);
    if (activeCard) {
      activeCard.classList.remove('border-slate-200/80');
      activeCard.classList.add('border-slate-900', 'ring-2', 'ring-slate-900/10');
      const checkIcon = activeCard.querySelector('.fa-check');
      if (checkIcon) checkIcon.classList.replace('opacity-0', 'opacity-100');
      const tag = activeCard.querySelector('span:last-child');
      if (tag) {
        tag.classList.replace('bg-slate-100', 'bg-slate-900');
        tag.classList.replace('text-slate-500', 'text-white');
      }
    }

    // Live instant preview + localStorage persistence across the current browser!
    applyThemeColor(themeId, true);

    // Auto-save to backend database if admin is authenticated
    const isAdmin = window.state?.user && ['super_admin', 'admin', 'operator'].includes(window.state.user.role);
    if (isAdmin && window.api) {
      try {
        await window.api('/admin/settings', {
          method: 'PUT',
          body: { theme_color: themeId }
        });
        if (window.state?.settings) {
          window.state.settings.theme_color = themeId;
        }
        window.showToast?.(`✓ Tema "${THEME_PRESETS[themeId]?.name}" berhasil disimpan permanen!`, 'success');
        document.dispatchEvent(new CustomEvent('settings-updated', { detail: { theme_color: themeId } }));
      } catch (err) {
        console.warn('Auto-save theme error:', err);
        window.showToast?.(`Tema aktif di browser. Klik "Simpan Konfigurasi" di bawah untuk simpan permanen ke database.`, 'info');
      }
    } else {
      window.showToast?.(`Tema warna: ${THEME_PRESETS[themeId]?.name}`, 'info');
    }
  };

  window.quickSaveCurrentTheme = async function() {
    const currentTheme = document.getElementById('profil-theme_color')?.value || getStoredThemeColor();
    try {
      if (window.api) {
        await window.api('/admin/settings', {
          method: 'PUT',
          body: { theme_color: currentTheme }
        });
      }
      if (window.state?.settings) {
        window.state.settings.theme_color = currentTheme;
      }
      localStorage.setItem('kkg_theme_color', currentTheme);
      window.showToast?.(`Tema warna "${THEME_PRESETS[currentTheme]?.name || currentTheme}" berhasil disimpan ke database!`, 'success');
      document.dispatchEvent(new CustomEvent('settings-updated', { detail: { theme_color: currentTheme } }));
    } catch (e) {
      window.showToast?.(e.message || 'Gagal menyimpan tema warna', 'error');
    }
  };
}

