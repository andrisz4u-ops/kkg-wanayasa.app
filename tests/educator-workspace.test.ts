import { beforeEach, describe, expect, it, vi } from 'vitest';
import { state } from '../public/static/js/state.js';
import { api } from '../public/static/js/api.js';
import { saveDocArchive, openArchiveDrawer } from '../public/static/js/storage-archive.js';
import { getUpcomingActivities, getRecentWorkspaceDocuments, renderEducatorDashboard, initEducatorDashboard } from '../public/static/js/pages/educator-dashboard.js';

vi.mock('../public/static/js/api.js', () => ({ api: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  state.user = { id: 42, role: 'user', nama: 'Dewi Lestari', sekolah: 'SDN 1 Wanayasa' };
  state.pageParams = {};
  vi.mocked(api).mockReset().mockResolvedValue({ success: true, data: [] });
});

describe('Educator workspace', () => {
  it('keeps today and future events, rejecting past and invalid dates', () => {
    const items = [
      { tanggal: '2026-09-30', nama_kegiatan: 'Kemarin' },
      { tanggal: '2026-10-01', nama_kegiatan: 'Hari ini', waktu_mulai: '09:00' },
      { tanggal: '2026-10-02', nama_kegiatan: 'Besok', waktu_mulai: '08:00' },
      { tanggal: '2026-02-30', nama_kegiatan: 'Tanggal tidak valid' },
      { tanggal: 'invalid', nama_kegiatan: 'Tidak ada tanggal' },
    ];
    expect(getUpcomingActivities(items, new Date(2026, 9, 1, 23, 59)).map(item => item.nama_kegiatan)).toEqual(['Hari ini', 'Besok']);
  });

  it('sorts the soonest agenda before later events and times', () => {
    const events = [
      { tanggal: '2026-10-03', waktu_mulai: '08:00' },
      { tanggal: '2026-10-02', waktu_mulai: '13:00' },
      { tanggal: '2026-10-02', waktu_mulai: '09:00' },
    ];
    expect(getUpcomingActivities(events, new Date(2026, 9, 1)).map(item => item.waktu_mulai)).toEqual(['09:00', '13:00', '08:00']);
  });

  it('only shows documents saved for the current user', () => {
    saveDocArchive({ module: 'rpp', title: 'Dokumen Dewi', content: {}, inputData: {} });
    state.user = { id: 99, role: 'user', nama: 'Guru lain' };
    saveDocArchive({ module: 'slide', title: 'Dokumen guru lain', content: {}, inputData: {} });
    expect(getRecentWorkspaceDocuments().map(item => item.title)).toEqual(['Dokumen guru lain']);
    state.user = { id: 42, role: 'user', nama: 'Dewi' };
    expect(getRecentWorkspaceDocuments().map(item => item.title)).toEqual(['Dokumen Dewi']);
  });

  it('restores a requested document through its existing module callback', () => {
    const doc = saveDocArchive({ module: 'rpp', title: 'RPP saya', content: { topik: 'Pecahan' }, inputData: {} });
    state.pageParams = { archiveId: doc.id };
    const onSelect = vi.fn();
    openArchiveDrawer({ module: 'rpp', onSelect });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: doc.id, title: 'RPP saya' }));
    expect(state.pageParams.archiveId).toBeUndefined();
    expect(document.getElementById('kkg-archive-drawer-root')).toBeNull();
  });

  it('shows stored creation dates and sends Buka to the original module archive', () => {
    const doc = saveDocArchive({ module: 'kisi', title: 'Asesmen Pecahan', subtitle: 'Matematika kelas 5', content: {}, inputData: {} });
    document.body.innerHTML = renderEducatorDashboard();
    const button = document.querySelector('#workspace-documents button');
    expect(button?.textContent).toContain('Buka');
    expect(button?.getAttribute('onclick')).toBe(`navigate('kisi', { archiveId: '${doc.id}' })`);
    expect(document.querySelector('#workspace-documents time')?.getAttribute('datetime')).toBe(new Date(doc.createdAt).toISOString());
    expect(document.querySelector('#workspace-documents th:nth-child(2)')?.textContent).toBe('Tanggal dibuat');
    expect(document.getElementById(button?.getAttribute('aria-describedby') || '')?.textContent).toBe('Asesmen Pecahan');
  });

  it('does not restore a document belonging to a different user', () => {
    const doc = saveDocArchive({ module: 'rpp', title: 'Pribadi', content: {}, inputData: {} });
    state.user = { id: 99, role: 'user', nama: 'Guru lain' };
    state.pageParams = { archiveId: doc.id };
    const onSelect = vi.fn();
    openArchiveDrawer({ module: 'rpp', onSelect });
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.getElementById('kkg-archive-drawer-root')).not.toBeNull();
  });

  it.each(['user', 'operator'])('does not request approval data for %s', async role => {
    state.user.role = role;
    document.body.innerHTML = renderEducatorDashboard();
    await initEducatorDashboard();
    expect(vi.mocked(api).mock.calls.some(([path]) => path === '/admin/users/pending')).toBe(false);
    expect(document.getElementById('workspace-approvals')).toBeNull();
    expect(Boolean(document.getElementById('workspace-management-title'))).toBe(role === 'operator');
  });

  it.each(['admin', 'super_admin'])('shows approval data for %s', async role => {
    state.user.role = role;
    vi.mocked(api).mockImplementation(async path => ({ success: true, data: path === '/admin/users/pending' ? [{ id: 12 }] : [] }));
    document.body.innerHTML = renderEducatorDashboard();
    await initEducatorDashboard();
    expect(document.getElementById('workspace-approvals')?.textContent).toContain('1 anggota menunggu persetujuan');
  });

  it('keeps useful sections when a data source fails and distinguishes error from empty', async () => {
    vi.mocked(api).mockImplementation(async path => {
      if (path === '/absensi/kegiatan') throw new Error('Unavailable');
      return { success: true, data: [] };
    });
    document.body.innerHTML = renderEducatorDashboard();
    expect(document.getElementById('workspace-agenda')?.getAttribute('aria-busy')).toBe('true');
    await initEducatorDashboard();
    expect(document.getElementById('workspace-agenda')?.textContent).toContain('Agenda belum dapat dimuat');
    expect(document.getElementById('workspace-announcements')?.textContent).toContain('Belum ada pengumuman');
    expect(document.getElementById('workspace-tools-title')).not.toBeNull();
  });

  it('escapes names and document titles before rendering', () => {
    state.user.nama = '<img src=x onerror=alert(1)>';
    saveDocArchive({ module: 'rpp', title: '<script>alert(1)</script>', content: {}, inputData: {} });
    document.body.innerHTML = renderEducatorDashboard();
    expect(document.querySelector('#educator-workspace img')).toBeNull();
    expect(document.querySelector('#educator-workspace script')).toBeNull();
    expect(document.getElementById('workspace-documents')?.textContent).toContain('<script>alert(1)</script>');
  });
});
