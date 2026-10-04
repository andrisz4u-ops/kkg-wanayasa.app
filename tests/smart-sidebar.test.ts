import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Smart Sidebar Codebase Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../public/static/js/main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  it('should have replaced "Asisten AI" category with "Perangkat Pembelajaran"', () => {
    expect(mainJs).toContain("title: 'Perangkat Pembelajaran'");
    expect(mainJs).not.toContain("title: 'Asisten AI'");
  });

  it('should not have "(AI)" in item labels', () => {
    expect(mainJs).toContain("label: 'Analisis CP & ATP'");
    expect(mainJs).toContain("label: 'Modul Ajar (RPP)'");
    expect(mainJs).toContain("label: 'Asesmen & Kisi-Kisi'");
    expect(mainJs).toContain("label: 'Media Presentasi'");
    expect(mainJs).not.toContain("label: 'Analisis CP (AI)'");
    expect(mainJs).not.toContain("label: 'Buat RPP (AI)'");
  });

  it('should have Smart Sidebar functions defined', () => {
    expect(mainJs).toContain('window.toggleSidebarCollapse = function()');
    expect(mainJs).toContain('window.handleSidebarSearch = function(');
    expect(mainJs).toContain('window.clearSidebarSearch = function(');
    expect(mainJs).toContain('renderDesktopSidebar(page)');
  });

  it('should have Smart Search input and keyboard shortcut handlers', () => {
    expect(mainJs).toContain('id="sidebar-search-input"');
    expect(mainJs).toContain("e.key === 'k' || e.key === 'K'");
    expect(mainJs).toContain("e.key === '['");
  });

  it('should have replaced AI labels in mobile bottom sheet and nav', () => {
    expect(mainJs).toContain('Perangkat Pembelajaran Hub');
    expect(mainJs).toContain('>Perangkat Pembelajaran</h3>');
    expect(mainJs).not.toContain('>Asisten AI Pendidik</h3>');
  });

  it('should have updated pageMetadata to Perangkat Pembelajaran', () => {
    expect(mainJs).toContain("'analisis-cp': { title: 'Analisis CP, TP & ATP (BSKAP 046/2025)', icon: 'fa-book-bookmark', category: 'Perangkat Pembelajaran' }");
    expect(mainJs).toContain("rpp: { title: 'Generator Modul Ajar (RPP)', icon: 'fa-file-pen', category: 'Perangkat Pembelajaran' }");
    expect(mainJs).toContain("slide: { title: 'Media Presentasi Pembelajaran', icon: 'fa-file-powerpoint', category: 'Perangkat Pembelajaran' }");
  });
});
