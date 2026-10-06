import { beforeEach, describe, expect, it } from 'vitest';
import { state } from '../public/static/js/state.js';
import { renderWorkspaceLayout, renderWorkspaceNavigation, renderWorkspaceTopNavigation, renderWorkspaceSidebarNavigation } from '../public/static/js/layouts/workspace.js';

const sections = [
  { id: 'ruang-kerja', title: 'Ruang Kerja', items: [
    { page: 'home', label: 'Beranda', public: true },
    { page: 'kalender', label: 'Kalender & Agenda', public: true },
    { page: 'pengumuman', label: 'Pengumuman', public: true },
  ] },
  { id: 'asisten-ai', title: 'Perangkat ajar', items: [
    { page: 'analisis-cp', label: 'Analisis CP', public: true },
    { page: 'rpp', label: 'Buat RPP', public: true },
    { page: 'program-sekolah', label: 'Program Sekolah', admin: true },
    { page: 'kisi', label: 'Buat Asesmen', public: true },
    { page: 'slide', label: 'Slide Presentasi', public: true },
    { page: 'games', label: 'Game Edukasi', public: true },
  ] },
  { id: 'komunitas', title: 'Kegiatan & Komunitas', items: [
    { page: 'forum', label: 'Forum', public: true },
    { page: 'absensi', label: 'Presensi', auth: true },
  ] },
  { id: 'administrasi', title: 'Administrasi', admin: true, items: [
    { page: 'admin', label: 'Panel Kontrol', admin: true },
  ] },
];

beforeEach(() => {
  localStorage.clear();
  state.user = { id: 42, role: 'user', nama: 'Dewi' };
  document.body.innerHTML = '';
});

const renderSidebarLayout = () => renderWorkspaceLayout({
  content: '<h1>RPP</h1>', page: 'rpp', meta: { title: 'RPP' }, name: 'RuangKKG',
  topNav: '', sidebarNav: renderWorkspaceSidebarNavigation(sections, 'rpp'),
  mobileNav: '', bottomNav: '', aiSheet: '', notificationBell: '',
});

describe('Workspace navigation', () => {
  it('persists the compact sidebar for the current account only', () => {
    document.body.innerHTML = renderSidebarLayout();
    window.toggleWorkspaceSidebar();
    expect(document.querySelector('.workspace-shell')?.classList.contains('wk-sidebar-compact')).toBe(true);
    expect(document.getElementById('sidebar-collapse-toggle')?.getAttribute('aria-label')).toBe('Perluas menu samping');
    document.body.innerHTML = renderSidebarLayout();
    expect(document.querySelector('.workspace-shell')?.classList.contains('wk-sidebar-compact')).toBe(true);
    state.user.id = 99;
    document.body.innerHTML = renderSidebarLayout();
    expect(document.querySelector('.workspace-shell')?.classList.contains('wk-sidebar-compact')).toBe(false);
  });

  it('shows a single featured group without a search field', () => {
    document.body.innerHTML = renderSidebarLayout();
    expect(document.querySelectorAll('.wk-persistent-group')).toHaveLength(1);
    expect(document.querySelector('.wk-sidebar-header strong')?.textContent).toBe('Fitur unggulan');
    expect(document.getElementById('sidebar-search')).toBeNull();
  });

  it.each(['user', 'operator', 'admin', 'super_admin'])('shows the ordered role-specific shortcuts while retaining full header and drawer routes for %s', role => {
    state.user.role = role;
    const desktop = document.createElement('nav');
    desktop.innerHTML = renderWorkspaceTopNavigation(sections, 'home');
    const drawer = document.createElement('nav');
    drawer.innerHTML = renderWorkspaceNavigation(sections, 'home', {}, 'mobile');
    const sidebar = document.createElement('nav');
    sidebar.innerHTML = renderWorkspaceSidebarNavigation(sections, 'rpp');
    const destinations = (root: Element) => [...root.querySelectorAll('button[onclick]')]
      .map(button => button.getAttribute('onclick')?.match(/navigate\('([^']+)'\)/)?.[1])
       .filter(Boolean);
    expect(destinations(desktop).sort()).toEqual(destinations(drawer).sort());
    const expected = ['home', 'analisis-cp', 'rpp', 'kisi', 'slide', 'games'];
    const labels = ['Beranda', 'Analisis CP', 'RPP', 'Asesmen', 'Slide', 'Game Edukasi'];
    if (role !== 'user') {
      expected.push('program-sekolah', 'admin');
      labels.push('Program', 'Panel Kontrol');
    }
    expect(destinations(sidebar)).toEqual(expected);
    expect([...sidebar.querySelectorAll('.wk-persistent-link')].map(link => (link as HTMLElement).dataset.feature)).toEqual(expected);
    expect([...sidebar.querySelectorAll('.wk-persistent-link > span')].map(label => label.textContent)).toEqual(labels);
    expect(destinations(sidebar).every(destination => destinations(desktop).includes(destination))).toBe(true);
    expect(destinations(sidebar)).not.toContain('kalender');
    expect(destinations(desktop)).toEqual(expect.arrayContaining(['kalender', 'pengumuman', 'forum', 'absensi']));
    expect(sidebar.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(sidebar.querySelector('[aria-current="page"]')?.textContent).toContain('RPP');
    expect(destinations(desktop).includes('admin')).toBe(role !== 'user');
    expect(destinations(desktop).includes('program-sekolah')).toBe(role !== 'user');
  });

  it('does not add an unavailable or unauthorized shortcut and does not mark a different page active', () => {
    state.user.role = 'operator';
    const sidebar = document.createElement('nav');
    sidebar.innerHTML = renderWorkspaceSidebarNavigation(sections.filter(section => !section.admin).map(section => ({
      ...section, items: section.items.filter(item => !item.admin && item.page !== 'slide'),
    })), 'forum');
    expect(sidebar.querySelector('[onclick*="program-sekolah"]')).toBeNull();
    expect(sidebar.querySelector('[onclick*="admin"]')).toBeNull();
    expect(sidebar.querySelector('[onclick*="slide"]')).toBeNull();
    expect(sidebar.querySelector('[aria-current="page"]')).toBeNull();
  });

  it('opens one group at a time and returns focus to its trigger on Escape', () => {
    document.body.innerHTML = renderWorkspaceTopNavigation(sections, 'rpp');
    window.toggleWorkspaceTopMenu('asisten-ai');
    expect(document.getElementById('workspace-top-panel-asisten-ai')?.classList.contains('hidden')).toBe(false);
    window.toggleWorkspaceTopMenu('komunitas');
    expect(document.getElementById('workspace-top-trigger-asisten-ai')?.getAttribute('aria-expanded')).toBe('false');
    const trigger = document.getElementById('workspace-top-trigger-komunitas');
    document.getElementById('workspace-top-panel-komunitas')?.querySelector('button')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes the menu when focus or a click leaves the group', () => {
    document.body.innerHTML = renderWorkspaceTopNavigation(sections, 'home');
    const trigger = document.getElementById('workspace-top-trigger-asisten-ai');
    window.toggleWorkspaceTopMenu('asisten-ai');
    document.querySelector<HTMLButtonElement>('button')?.focus();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    window.toggleWorkspaceTopMenu('asisten-ai');
    document.body.click();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
  });

  it('identifies the active destination while leaving closed groups collapsed', () => {
    document.body.innerHTML = renderWorkspaceTopNavigation(sections, 'analisis-cp');
    expect(document.querySelector('[aria-current="page"]')?.textContent).toContain('Analisis CP');
    expect(document.getElementById('workspace-top-trigger-asisten-ai')?.classList.contains('wk-top-active')).toBe(true);
    expect(document.querySelectorAll('[aria-expanded="true"]').length).toBe(0);
  });
});
