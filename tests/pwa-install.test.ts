import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Install Prompt & Best Practice UX Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../public/static/js/main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  it('should define updatePwaInstallButtons to manage header button visibility', () => {
    expect(mainJs).toContain('window.updatePwaInstallButtons = function()');
    expect(mainJs).toContain("document.getElementById('header-pwa-install-btn')");
    expect(mainJs).toContain("document.getElementById('mobile-header-pwa-install-btn')");
  });

  it('should prevent floating banner from showing on desktop screens', () => {
    expect(mainJs).toContain('if (window.innerWidth >= 768)');
    expect(mainJs).toContain("document.getElementById('pwa-install-banner')?.remove()");
  });

  it('should support 14-day snooze when banner is dismissed on mobile', () => {
    expect(mainJs).toContain("localStorage.setItem('pwa_banner_dismissed_until'");
    expect(mainJs).toContain("localStorage.getItem('pwa_banner_dismissed_until')");
    expect(mainJs).toContain('14 * 24 * 60 * 60 * 1000');
  });

  it('should render header-pwa-install-btn in desktop top navigation bar', () => {
    expect(mainJs).toContain('id="header-pwa-install-btn"');
    expect(mainJs).toContain('onclick="window.promptPwaInstall()"');
    expect(mainJs).toContain('Pasang Aplikasi');
  });

  it('should render mobile-header-pwa-install-btn in mobile top bar', () => {
    expect(mainJs).toContain('id="mobile-header-pwa-install-btn"');
    expect(mainJs).toContain('onclick="window.promptPwaInstall()"');
  });

  it('should not show aggressive 0-second banner on desktop during beforeinstallprompt', () => {
    expect(mainJs).toContain('if (!window.isPwaStandalone() && window.innerWidth < 768)');
  });
});
