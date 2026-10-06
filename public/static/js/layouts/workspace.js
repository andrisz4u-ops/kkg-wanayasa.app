import { state } from '../state.js';
import { avatar, escapeHtml } from '../utils.js';

export function mountWorkspaceLayout(app, options) {
  const { content, ...layout } = options;
  app.innerHTML = renderWorkspaceLayout({ ...layout, content: '' });
  app.querySelector('#page-content-wrapper').innerHTML = content;
}

function visibleSections(sections) {
  const canManage = ['super_admin', 'admin', 'operator'].includes(state.user?.role);
  return sections.filter(section => !section.admin || canManage)
    .map(section => ({ ...section, items: section.items.filter(item => item.public || (item.auth && state.user) || (item.admin && canManage)) }))
    .filter(section => section.items.length);
}

function sidebarStorageKey() {
  return `kkg-sidebar-compact:${state.user?.id ?? 'guest'}`;
}

export function getWorkspaceSidebarCompact() {
  try { return localStorage.getItem(sidebarStorageKey()) === '1'; }
  catch { return false; }
}

export function renderWorkspaceNavigation(sections, page, expandedSections, surface = 'desktop') {
  return visibleSections(sections).map(section => {
    const items = section.items;
    expandedSections[section.id] ??= section.items.some(item => item.page === page) || section.defaultOpen;
    const expanded = !!expandedSections[section.id];
    const targetId = `nav-${surface}-${section.id}`;
    return `<div class="wk-nav-group">
      <button type="button" class="wk-nav-section nav-section-toggle-${section.id}" onclick="window.toggleNavSection('${section.id}')" aria-expanded="${expanded}" aria-controls="${targetId}">
        <span>${section.title}</span><i class="nav-section-chevron-${section.id} fas fa-chevron-down ${expanded ? 'rotate-180' : ''}" aria-hidden="true"></i>
      </button>
      <div id="${targetId}" class="nav-section-content-${section.id} ${expanded ? '' : 'hidden'}" role="group" aria-label="${section.title}">
        ${items.map(item => `<button type="button" class="wk-nav-item ${page === item.page ? 'wk-nav-active' : ''}" data-feature="${escapeHtml(item.page)}" onclick="window.closeWorkspaceMenu?.(); navigate('${item.page}')" ${page === item.page ? 'aria-current="page"' : ''}>
          <i class="fas ${item.icon}" aria-hidden="true"></i><span>${item.label}</span>${item.beta ? '<small>Beta</small>' : ''}
        </button>`).join('')}
      </div>
    </div>`;
  }).join('');
}

export function renderWorkspaceTopNavigation(sections, page) {
  const visible = visibleSections(sections);
  const workspace = visible.find(section => section.id === 'ruang-kerja');
  const direct = item => item ? `<button type="button" class="wk-top-link ${page === item.page ? 'wk-top-active' : ''}" onclick="window.closeWorkspaceTopMenus(); navigate('${item.page}')" ${page === item.page ? 'aria-current="page"' : ''}>${escapeHtml(item.page === 'kalender' ? 'Agenda' : item.label)}</button>` : '';
  const group = section => {
    const active = section.items.some(item => item.page === page);
    const label = section.id === 'komunitas' ? 'Komunitas' : section.title;
    return `<div class="wk-top-group" data-workspace-menu="${section.id}">
      <button type="button" id="workspace-top-trigger-${section.id}" class="wk-top-link ${active ? 'wk-top-active' : ''}" onclick="window.toggleWorkspaceTopMenu('${section.id}', event)" aria-expanded="false" aria-controls="workspace-top-panel-${section.id}"><span>${escapeHtml(label)}</span><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
      <div id="workspace-top-panel-${section.id}" class="wk-top-panel hidden" aria-labelledby="workspace-top-trigger-${section.id}">
        ${section.items.map(item => `<button type="button" class="wk-top-destination ${page === item.page ? 'wk-top-destination-active' : ''}" onclick="window.closeWorkspaceTopMenus(); navigate('${item.page}')" ${page === item.page ? 'aria-current="page"' : ''}><i class="fas ${item.icon}" aria-hidden="true"></i><span>${escapeHtml(item.label)}</span>${item.beta ? '<small>Beta</small>' : ''}</button>`).join('')}
      </div>
    </div>`;
  };
  return direct(workspace?.items.find(item => item.page === 'home'))
    + visible.filter(section => !['ruang-kerja', 'administrasi'].includes(section.id)).map(group).join('')
    + direct(workspace?.items.find(item => item.page === 'kalender'))
    + direct(workspace?.items.find(item => item.page === 'pengumuman'))
    + visible.filter(section => section.id === 'administrasi').map(group).join('');
}

export function renderWorkspaceSidebarNavigation(sections, page) {
  const permitted = new Map(visibleSections(sections).flatMap(section => section.items).map(item => [item.page, item]));
  const featured = [
    ['home', 'Beranda'],
    ['analisis-cp', 'Analisis CP'],
    ['rpp', 'RPP'],
    ['kisi', 'Asesmen'],
    ['slide', 'Slide'],
    ['games', 'Game Edukasi'],
  ];
  if (['super_admin', 'admin', 'operator'].includes(state.user?.role)) {
    featured.push(['program-sekolah', 'Program'], ['admin', 'Panel Kontrol']);
  }
  const items = featured.filter(([destination]) => permitted.has(destination))
    .map(([destination, label]) => ({ ...permitted.get(destination), label }));
  return `<section class="wk-persistent-group wk-featured-group" aria-label="Fitur unggulan">
    ${items.map(item => `<button type="button" class="wk-persistent-link ${page === item.page ? 'wk-persistent-active' : ''}" data-feature="${escapeHtml(item.page)}" title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}" onclick="window.closeWorkspaceTopMenus(); navigate('${item.page}')" ${page === item.page ? 'aria-current="page"' : ''}>
      <i class="fas ${item.icon}" aria-hidden="true"></i><span>${escapeHtml(item.label)}</span>${item.beta ? '<small>Beta</small>' : ''}
    </button>`).join('')}
  </section>`;
}

export function renderWorkspaceBottomNav(page) {
  const items = [
    { page: 'home', label: 'Beranda', icon: 'fa-home' },
    { page: 'absensi', label: 'Presensi', icon: 'fa-qrcode' },
    { page: 'ai', label: 'Perangkat ajar', icon: 'fa-file-lines' },
    { page: 'materi', label: 'Materi', icon: 'fa-book-open' },
    { page: 'profile', label: 'Profil', icon: 'fa-user' },
  ];
  const aiActive = ['analisis-cp', 'program-sekolah', 'rpp', 'kisi', 'slide', 'tts', 'games'].includes(page);
  return `<nav id="mobile-bottom-nav" class="wk-bottom-nav" aria-label="Navigasi utama ponsel">${items.map(item => {
    const active = page === item.page || (item.page === 'ai' && aiActive);
    const action = item.page === 'ai' ? 'window.toggleMobileAiSheet()' : `navigate('${item.page}')`;
    return `<button type="button" class="${active ? 'wk-bottom-active' : ''}" onclick="${action}" ${active ? 'aria-current="page"' : ''}><i class="fas ${item.icon}" aria-hidden="true"></i><span>${item.label}</span></button>`;
  }).join('')}</nav>`;
}

export function renderWorkspaceLayout({ content, page, meta, name, topNav, sidebarNav = '', mobileNav, bottomNav, aiSheet, notificationBell }) {
  const user = state.user;
  const role = ({ admin: 'Administrator', super_admin: 'Super admin', operator: 'Operator' })[user?.role] || 'Pendidik';
  const canManage = ['admin', 'super_admin', 'operator'].includes(user?.role);
  const logo = escapeHtml(state.settings?.logo_url || '/static/img/logo-kkg.png');
  const sidebarCompact = getWorkspaceSidebarCompact();
  const brand = `<span class="wk-brand-medallion"><img src="${logo}" alt="Logo KKG" onerror="this.onerror=null; this.src='/static/img/logo-kkg.png'"></span><span class="wk-brand-copy"><strong>${escapeHtml(name)}</strong><small>Guru SD dan KKG</small></span>`;
  const accountActions = `<button type="button" onclick="window.closeUserDropdown(); navigate('profile')"><i class="fas fa-user" aria-hidden="true"></i>Profil saya</button>${canManage ? `<button type="button" onclick="window.closeUserDropdown(); navigate('admin')"><i class="fas fa-sliders" aria-hidden="true"></i>Panel kontrol</button>` : ''}<button type="button" onclick="window.closeUserDropdown(); window.promptPwaInstall(document.getElementById('user-profile-btn'))"><i class="fas fa-mobile-screen-button" aria-hidden="true"></i>Pasang aplikasi</button><button type="button" class="wk-signout" onclick="window.closeUserDropdown(); logout()"><i class="fas fa-arrow-right-from-bracket" aria-hidden="true"></i>Keluar akun</button>`;
  return `<div class="workspace-shell wk-monochrome wk-paper-studio wk-organic-studio ${page === 'home' ? 'wk-paper-home' : ''} ${sidebarCompact ? 'wk-sidebar-compact' : ''}">
    <a href="#main-content" class="wk-skip-link" onclick="event.preventDefault(); document.getElementById('main-content')?.focus()">Lewati menu, ke konten utama</a>
    <div class="wk-content">
      <header id="app-desktop-header" class="wk-desktop-header">
        <button type="button" class="wk-brand" onclick="navigate('home')">${brand}</button>
        <nav id="workspace-top-navigation" class="wk-top-navigation" aria-label="Navigasi utama">${topNav}</nav>
        <div class="wk-header-actions">${notificationBell}<div class="wk-account" id="user-profile-menu-container">
          <button type="button" id="user-profile-btn" class="wk-account-button" onclick="window.closeWorkspaceTopMenus(); window.toggleUserDropdown(event)" aria-expanded="false" aria-controls="user-dropdown-menu" title="Menu akun">
            ${avatar(user?.nama || 'Pendidik', 'sm', user?.foto_url)}<span><strong>${escapeHtml(user?.nama || 'Pendidik')}</strong><small>${role}</small></span><i id="user-dropdown-arrow" class="fas fa-chevron-down" aria-hidden="true"></i>
          </button><div id="user-dropdown-menu" class="wk-account-menu hidden"><p>${escapeHtml(user?.email || '')}</p>${accountActions}</div>
        </div></div>
      </header>
      <header id="app-mobile-header" class="wk-mobile-header">
        <button type="button" id="workspace-menu-trigger" class="wk-icon-button wk-menu-trigger" onclick="window.openWorkspaceMenu()" aria-label="Buka menu utama" aria-expanded="false" aria-controls="mobile-menu"><i class="fas fa-bars" aria-hidden="true"></i><span>Menu</span></button>
        <button type="button" class="wk-mobile-brand" onclick="navigate('home')"><span class="wk-brand-medallion"><img src="${logo}" alt="Logo KKG" onerror="this.onerror=null; this.src='/static/img/logo-kkg.png'"></span><strong>${escapeHtml(name)}</strong></button>
        <button type="button" class="wk-icon-button" onclick="navigate('notifications')" aria-label="Buka notifikasi"><i class="far fa-bell" aria-hidden="true"></i>${state.unreadNotifications > 0 ? '<span class="wk-notification-dot"></span>' : ''}</button>
      </header>
      <div class="wk-workspace-body">
        <aside class="wk-persistent-sidebar print:hidden" aria-label="Navigasi samping">
          <button type="button" class="wk-sidebar-brand" onclick="navigate('home')" aria-label="${escapeHtml(name)}, buka beranda"><span class="wk-brand-medallion"><img src="${logo}" alt="" onerror="this.onerror=null; this.src='/static/img/logo-kkg.png'"></span><span class="wk-sidebar-brand-copy"><small>RuangKKG</small><strong>${escapeHtml(name)}</strong></span></button>
          <div class="wk-sidebar-controls">
            <div class="wk-sidebar-header"><strong>Fitur unggulan</strong><button type="button" id="sidebar-collapse-toggle" onclick="window.toggleWorkspaceSidebar()" aria-label="${sidebarCompact ? 'Perluas' : 'Ringkas'} menu samping" title="${sidebarCompact ? 'Perluas' : 'Ringkas'} menu samping"><i class="fas ${sidebarCompact ? 'fa-angles-right' : 'fa-angles-left'}" aria-hidden="true"></i></button></div>
          </div>
          <nav id="sidebar-nav-links" class="wk-navigation" aria-label="Menu samping">${sidebarNav}</nav>
          <p class="wk-sidebar-note">Ruang bersama guru SD dan KKG</p>
        </aside>
        <div class="wk-workspace-page">
          <div class="wk-context-bar print:hidden"><div class="wk-context-inner"><span>Ruang kerja</span><span aria-hidden="true">/</span><strong>${escapeHtml(page === 'home' ? 'Beranda' : meta.title)}</strong></div></div>
          <main id="main-content" tabindex="-1" class="wk-main"><div id="page-content-wrapper" class="wk-page ${['games', 'tts'].includes(page) ? 'wk-page-wide' : ''}">${content}</div></main>
        </div>
      </div>
      ${bottomNav}${aiSheet}
    </div>
    <div id="mobile-menu" class="wk-mobile-menu hidden">
      <div class="wk-menu-backdrop" onclick="window.closeWorkspaceMenu()" aria-hidden="true"></div>
      <div class="wk-drawer" role="dialog" aria-modal="true" aria-label="Menu utama">
        <div class="wk-drawer-top"><span class="wk-brand">${brand}</span><button type="button" id="workspace-menu-close" class="wk-icon-button" onclick="window.closeWorkspaceMenu()" aria-label="Tutup menu"><i class="fas fa-xmark" aria-hidden="true"></i></button></div>
        <nav id="mobile-nav-links" class="wk-navigation">${mobileNav}</nav>
        <div class="wk-drawer-account"><button type="button" onclick="window.closeWorkspaceMenu(); navigate('profile')">${avatar(user?.nama || 'Pendidik', 'sm', user?.foto_url)}<span>${escapeHtml(user?.nama || 'Pendidik')}<small>${role}</small></span></button><button type="button" onclick="window.closeWorkspaceMenu(); window.promptPwaInstall(document.getElementById('workspace-menu-trigger'))"><i class="fas fa-mobile-screen-button" aria-hidden="true"></i>Pasang aplikasi</button><button type="button" class="wk-signout" onclick="window.closeWorkspaceMenu(); logout()"><i class="fas fa-arrow-right-from-bracket" aria-hidden="true"></i>Keluar akun</button></div>
      </div>
    </div>
  </div>`;
}

export function revealWorkspaceSidebarActive() {
  const navigation = document.getElementById('sidebar-nav-links');
  const active = navigation?.querySelector('[aria-current="page"]');
  if (!navigation?.clientHeight || !active) return;
  const bounds = navigation.getBoundingClientRect();
  const item = active.getBoundingClientRect();
  if (item.bottom > bounds.bottom) navigation.scrollTop += item.bottom - bounds.bottom + 12;
  else if (item.top < bounds.top) navigation.scrollTop -= bounds.top - item.top + 12;
}

window.toggleWorkspaceSidebar = () => {
  const shell = document.querySelector('.workspace-shell');
  const toggle = document.getElementById('sidebar-collapse-toggle');
  if (!shell || !toggle) return;
  const compact = shell.classList.toggle('wk-sidebar-compact');
  try { localStorage.setItem(sidebarStorageKey(), compact ? '1' : '0'); } catch { /* The sidebar still works when browser storage is unavailable. */ }
  const label = `${compact ? 'Perluas' : 'Ringkas'} menu samping`;
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
  toggle.querySelector('i')?.classList.toggle('fa-angles-right', compact);
  toggle.querySelector('i')?.classList.toggle('fa-angles-left', !compact);
  revealWorkspaceSidebarActive();
};

window.closeWorkspaceTopMenus = (restoreFocus = false) => {
  document.querySelectorAll('.wk-top-group').forEach(group => {
    const trigger = group.querySelector('button[aria-expanded]');
    const wasOpen = trigger?.getAttribute('aria-expanded') === 'true';
    trigger?.setAttribute('aria-expanded', 'false');
    group.querySelector('.wk-top-panel')?.classList.add('hidden');
    if (restoreFocus && wasOpen) trigger.focus();
  });
};
window.toggleWorkspaceTopMenu = (sectionId, event) => {
  event?.stopPropagation();
  const trigger = document.getElementById(`workspace-top-trigger-${sectionId}`);
  const panel = document.getElementById(`workspace-top-panel-${sectionId}`);
  if (!trigger || !panel) return;
  const open = trigger.getAttribute('aria-expanded') === 'true';
  window.closeWorkspaceTopMenus();
  window.closeUserDropdown?.();
  const notifications = document.getElementById('notification-dropdown');
  if (notifications && !notifications.classList.contains('invisible')) window.toggleNotifications?.();
  if (!open) {
    trigger.setAttribute('aria-expanded', 'true');
    panel.classList.remove('hidden');
  }
};
document.addEventListener('click', event => {
  if (!(event.target instanceof Element) || !event.target.closest('.wk-top-group')) window.closeWorkspaceTopMenus();
});
document.addEventListener('focusin', event => {
  if (!(event.target instanceof Element) || !event.target.closest('.wk-top-group')) window.closeWorkspaceTopMenus();
});
window.addEventListener('resize', () => window.closeWorkspaceTopMenus());

let menuTrigger;
window.openWorkspaceMenu = () => {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  window.closeWorkspaceTopMenus();
  menuTrigger = document.activeElement;
  menu.classList.remove('hidden');
  document.querySelector('.wk-content')?.setAttribute('inert', '');
  document.getElementById('workspace-menu-trigger')?.setAttribute('aria-expanded', 'true');
  document.getElementById('workspace-menu-close')?.focus();
};
window.closeWorkspaceMenu = () => {
  document.getElementById('mobile-menu')?.classList.add('hidden');
  document.querySelector('.wk-content')?.removeAttribute('inert');
  document.getElementById('workspace-menu-trigger')?.setAttribute('aria-expanded', 'false');
  if (menuTrigger?.isConnected) menuTrigger.focus();
};
document.addEventListener('keydown', event => {
  const menu = document.getElementById('mobile-menu');
  if (event.key === 'Escape') {
    if (menu && !menu.classList.contains('hidden')) window.closeWorkspaceMenu();
    else if (document.querySelector('.wk-top-group button[aria-expanded="true"]')) window.closeWorkspaceTopMenus(true);
    else if (document.getElementById('user-dropdown-menu') && !document.getElementById('user-dropdown-menu').classList.contains('hidden')) {
      window.closeUserDropdown?.();
      document.getElementById('user-profile-btn')?.focus();
    } else if (document.getElementById('notification-dropdown') && !document.getElementById('notification-dropdown').classList.contains('invisible')) window.toggleNotifications?.();
  }
  if (event.key !== 'Tab' || !menu || menu.classList.contains('hidden')) return;
  const controls = [...menu.querySelectorAll('button, a, input, select, [tabindex="0"]')].filter(element => element.getClientRects().length && !element.disabled);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
