import { renderEducatorDashboard } from './educator-dashboard.js';
export { initEducatorDashboard } from './educator-dashboard.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { formatDateTime, formatDate, escapeHtml } from '../utils.js';

// Global toggle for switching between Educator Dashboard and Public Landing
window.togglePublicLanding = function () {
  state.showPublicLanding = !state.showPublicLanding;
  if (window.renderApp) {
    window.renderApp();
  } else {
    navigate('home');
  }
};

/**
 * Main Home Page Renderer
 * Switches between Educator Dashboard (when logged in) and Public Landing Page.
 */
export async function renderHome() {
  if (state.user && !state.showPublicLanding) {
    return await renderEducatorDashboard();
  }
  return await renderPublicHome();
}

/**
 * =========================================================================
 * GLOBAL HANDLERS FOR PUBLIC LANDING PAGE (PHASE 1 ENTERPRISE)
 * =========================================================================
 */
window.__activeShowcaseTab = 'rpp';

window.openAiShowcaseModal = function (initialTab = 'rpp') {
  window.__activeShowcaseTab = initialTab;
  const modal = document.getElementById('ai-showcase-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  window.switchShowcaseTab(initialTab);
};

window.closeAiShowcaseModal = function () {
  const modal = document.getElementById('ai-showcase-modal');
  if (modal) modal.classList.add('hidden');
};

window.switchShowcaseTab = function (tab) {
  window.__activeShowcaseTab = tab;
  const tabs = ['rpp', 'kisi', 'slide', 'tts'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const content = document.getElementById(`tab-content-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-teal-600 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer';
      } else {
        btn.className = 'px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center gap-2 cursor-pointer';
      }
    }
    if (content) {
      if (t === tab) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    }
  });
};

window.toggleLandingFaq = function (index) {
  const answer = document.getElementById(`faq-ans-${index}`);
  const icon = document.getElementById(`faq-icon-${index}`);
  if (!answer) return;
  const isHidden = answer.classList.contains('hidden');
  if (isHidden) {
    answer.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
  } else {
    answer.classList.add('hidden');
    if (icon) icon.classList.remove('rotate-180');
  }
};

/**
 * =========================================================================
 * PUBLIC HOME / LANDING PAGE (PHASE 1 ENTERPRISE UPGRADE)
 * Tampilan publik / tamu untuk promosi, kepercayaan dinas, dan branding portal.
 * =========================================================================
 */

async function renderPublicHome() {
  // Ensure scoped class on body
  if (typeof document !== 'undefined') {
    document.body.classList.add('rk-landing');
  }

  // Schedule interactive bindings after DOM insertion
  setTimeout(() => {
    initPublicLandingRedesign();
  }, 50);

  return `
    <div class="rk-landing" id="landing-root">
      <!-- ================= HEADER ================= -->
<header class="site-head" id="top">
  <div class="wrap head-in">
    <a class="brand" href="#beranda" aria-label="RuangKKG — beranda">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9.6L4 20.5Z"/><path d="M9.5 9.5l2 2 3.8-3.8"/></svg>
      </span>
      <span class="word">RuangKKG<small>Untuk guru SD Indonesia</small></span>
    </a>
    <nav class="nav" aria-label="Navigasi utama">
      <a href="#fitur">Modul AI</a>
      <a href="#tentang">Tentang</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="head-cta">
      ${state.user ? `
        <button onclick="window.togglePublicLanding()" class="btn btn-primary btn-sm" style="background:var(--brand-strong); color:#fff; border-radius:12px;">
          <i class="fas fa-arrow-left" style="margin-right:4px;"></i> Workspace Saya
        </button>
      ` : `
        <button onclick="navigate('login')" class="btn btn-ghost btn-sm" style="cursor:pointer;">Masuk</button>
         <button onclick="navigate('login')" class="btn btn-primary btn-sm" style="cursor:pointer;">Mulai</button>
      `}
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
  ${state.user ? `
    <button onclick="window.togglePublicLanding()" class="btn btn-primary" style="width:100%; margin-top:0.8rem;">Ke Workspace Saya</button>
  ` : `
    <button onclick="navigate('login')" class="btn btn-ghost" style="width:100%; margin-top:0.8rem;">Masuk</button>
     <button onclick="navigate('login')" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">Masuk atau Daftar</button>
  `}
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
           <a class="btn btn-primary" href="/login" onclick="navigate('login'); return false;">Buka RuangKKG
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
          <a href="/login" onclick="navigate('login'); return false;" class="btn btn-sm btn-accent mod-next-btn">
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
           Baca <a href="/privacy-policy" onclick="navigate('privacy-policy'); return false;">Kebijakan Privasi</a> untuk informasi pengelolaan data. Untuk bertanya tentang layanan, hubungi <a href="mailto:admin@ruangkkg.my.id">admin@ruangkkg.my.id</a>.
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
             <p>Informasi tentang data akun dan dokumen yang Anda simpan tersedia dalam <a href="/privacy-policy" onclick="navigate('privacy-policy'); return false;">Kebijakan Privasi RuangKKG</a>. Jika ada pertanyaan tentang data Anda, hubungi <a href="mailto:admin@ruangkkg.my.id">admin@ruangkkg.my.id</a>.</p>
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
             <p>Untuk mengetahui paket, biaya, dan cara pembayaran yang berlaku, hubungi <a href="mailto:admin@ruangkkg.my.id?subject=Informasi%20paket%20RuangKKG">tim RuangKKG melalui email</a> sebelum memilih layanan.</p>
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
       <h2>Mulai susun perangkat ajar dari kebutuhan kelas Anda.</h2>
       <p>Gunakan Analisis CP sebagai titik awal, lalu lanjutkan ke RPP, asesmen, slide, atau game edukasi sesuai kegiatan belajar yang Anda rencanakan.</p>
      <div class="row">
         <button onclick="navigate('login')" class="btn btn-accent" style="cursor:pointer;">Buka RuangKKG
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
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
          <span class="word">RuangKKG</span>
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
        <ul><li><a href="#faq">Pusat Bantuan (FAQ)</a></li><li><a href="mailto:admin@ruangkkg.my.id?subject=Bantuan%20RuangKKG">Hubungi CS</a></li><li><a href="#faq">Panduan penggunaan</a></li></ul>
      </div>
    </div>
    <div class="foot-bottom">
       <span>© 2026 RuangKKG · ruangkkg.my.id — Dibuat di Indonesia untuk guru SD.</span>
      <div class="links"><a href="/terms" onclick="navigate('terms'); return false;">Syarat &amp; Ketentuan</a><a href="/privacy-policy" onclick="navigate('privacy-policy'); return false;">Kebijakan Privasi</a><a href="mailto:support@ruangkkg.my.id">Bantuan CS</a></div>
    </div>
  </div>
</footer>

    </div>
  `;
}

/**
 * Interactive event bindings for the public redesign landing page
 */
function initPublicLandingRedesign() {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Header scroll shadow
  const head = document.querySelector('.site-head');
  const onScroll = () => {
    if (head) head.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2. Mobile Menu
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    menuBtn.onclick = () => {
      const open = mobileNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    };
    mobileNav.querySelectorAll('a, button').forEach(el => {
      el.onclick = () => {
        mobileNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      };
    });
  }

  // 3. Smooth Scrolling for all hash links
  const hashLinks = document.querySelectorAll('a[href^="#"]');
  hashLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        if (window.location.hash !== '#' + targetId) {
          history.pushState(history.state || { page: 'home', params: {} }, '', '#' + targetId);
        }
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        // Close mobile nav if open
        if (mobileNav && mobileNav.classList.contains('open') && link.closest('.mobile-nav')) {
          mobileNav.classList.remove('open');
          if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // 3.1. Scrollspy
  const navLinks = Array.from(document.querySelectorAll('.site-head .nav a'));
  const spySections = ['fitur', 'tentang', 'faq']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  if ('IntersectionObserver' in window && navLinks.length && spySections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -55% 0px' });
    spySections.forEach(s => spy.observe(s));
  }

  // 3.2. Modul AI Interactive Tabs Showcase
  const modChips = Array.from(document.querySelectorAll('.mod-chip[data-mod-tab]'));
  const modPanels = Array.from(document.querySelectorAll('.mod-panel'));

  function switchModTab(targetId, shouldScroll) {
    if (!targetId) return;
    let found = false;
    modChips.forEach(chip => {
      const isMatch = chip.getAttribute('data-mod-tab') === targetId;
      chip.classList.toggle('is-active', isMatch);
      chip.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      if (isMatch) found = true;
    });
    if (!found) return;

    modPanels.forEach(panel => {
      const isMatch = panel.id === targetId;
      panel.classList.toggle('is-active', isMatch);
      if (isMatch) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    if (shouldScroll) {
      const strip = document.querySelector('.mod-strip');
      if (strip) {
        const topPos = strip.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: topPos, behavior: 'smooth' });
      }
    }
  }

  modChips.forEach((chip, idx) => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = chip.getAttribute('data-mod-tab');
      switchModTab(targetId, false);
      if (history.replaceState) {
        history.replaceState(history.state || { page: 'home', params: {} }, '', '#' + targetId);
      }
    });

    // Keyboard support: Left/Right arrows
    chip.addEventListener('keydown', (e) => {
      let targetIndex = -1;
      if (e.key === 'ArrowRight') {
        targetIndex = (idx + 1) % modChips.length;
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (idx - 1 + modChips.length) % modChips.length;
      }
      if (targetIndex !== -1) {
        e.preventDefault();
        const nextChip = modChips[targetIndex];
        nextChip.focus();
        const targetId = nextChip.getAttribute('data-mod-tab');
        switchModTab(targetId, false);
        if (history.replaceState) {
          history.replaceState(history.state || { page: 'home', params: {} }, '', '#' + targetId);
        }
      }
    });
  });

  // Workflow Next buttons
  document.querySelectorAll('.mod-next-btn[data-next-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nextId = btn.getAttribute('data-next-tab');
      switchModTab(nextId, true);
      if (history.replaceState) {
        history.replaceState(history.state || { page: 'home', params: {} }, '', '#' + nextId);
      }
    });
  });

  // Handle URL hash on load
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    if (['mod-cp', 'mod-rpp', 'mod-asesmen', 'mod-slide', 'mod-game'].includes(hash)) {
      switchModTab(hash, false);
      requestAnimationFrame(() => document.getElementById('fitur')?.scrollIntoView({ behavior: 'auto' }));
    } else if (['beranda', 'fitur', 'tentang', 'faq'].includes(hash)) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'auto' }));
    }
  }

  // 4. Animated Counters
  const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const counters = document.querySelectorAll('.count');
  counters.forEach(el => {
    const to = parseInt(el.getAttribute('data-to'), 10) || 0;
    if (reduceMotion) {
      el.textContent = fmt(to);
      return;
    }
    let t0 = null;
    const dur = 1200;
    function step(t) {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  // Hero AI Magic Demo
  (function () {
    const magic = document.getElementById("magicDemo");
    const typeEl = document.getElementById("mType");
    if (!magic || !typeEl) return;
    const PROMPT = "Buatkan RPP Koding & KA kelas 5 tentang algoritma logika.";
    if (reduceMotion) {
      typeEl.textContent = PROMPT;
      magic.setAttribute("data-phase", "result");
      return;
    }
    function typeText(done) {
      let i = 0;
      typeEl.textContent = "";
      magic.setAttribute("data-phase", "prompt");
      const typingTimer = setInterval(() => {
        i += 1;
        typeEl.textContent = PROMPT.slice(0, i);
        if (i >= PROMPT.length) { clearInterval(typingTimer); setTimeout(done, 700); }
      }, 38);
    }
    const showResult = () => typeText(() => magic.setAttribute("data-phase", "result"));
    if ("IntersectionObserver" in window) {
      let started = false;
      new IntersectionObserver((entries, io) => {
        entries.forEach(e => {
          if (e.isIntersecting && !started) { started = true; showResult(); io.disconnect(); }
        });
      }, { threshold: 0.2 }).observe(magic);
    } else { showResult(); }
  })();

  // FAQ Accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (q && a) {
      q.onclick = () => {
        const open = item.classList.toggle('open');
        q.setAttribute('aria-expanded', open ? 'true' : 'false');
        a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
      };
    }
  });

  // 7. Decorative Mockup QR (Canvas)
  function drawQR(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const N = 25;
    const s = canvas.width / N;
    let seed = 0;
    const str = canvas.getAttribute('data-seed') || 'rk';
    for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    function finder(cx, cy) {
      ctx.fillStyle = '#10231c';
      ctx.fillRect(cx * s, cy * s, 7 * s, 7 * s);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((cx + 1) * s, (cy + 1) * s, 5 * s, 5 * s);
      ctx.fillStyle = '#10231c';
      ctx.fillRect((cx + 2) * s, (cy + 2) * s, 3 * s, 3 * s);
    }
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const inF = (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
        if (inF) continue;
        if (rnd() > 0.52) {
          ctx.fillStyle = '#10231c';
          ctx.fillRect(x * s, y * s, s, s);
        }
      }
    }
    finder(0, 0);
    finder(N - 7, 0);
    finder(0, N - 7);
  }
  document.querySelectorAll('canvas.qr').forEach(drawQR);

}
