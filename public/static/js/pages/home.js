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
 * EDUCATOR DASHBOARD (RUANG KERJA PENDIDIK)
 * Tampilan utama modern, personal, dan kaya fitur ketika user telah login.
 * =========================================================================
 */
async function renderEducatorDashboard() {
  const user = state.user || {};

  // Fetch contextual dashboard data in parallel
  const [pengumumanRes, kegiatanRes, statsRes, forumRes] = await Promise.allSettled([
    api('/pengumuman?limit=4'),
    api('/absensi/kegiatan'),
    api('/dashboard/stats'),
    api('/forum?limit=3'),
  ]);

  const pengumuman = pengumumanRes.status === 'fulfilled' ? (pengumumanRes.value?.data || []) : [];
  const kegiatanList = kegiatanRes.status === 'fulfilled' ? (kegiatanRes.value?.data || []) : [];
  const stats = statsRes.status === 'fulfilled' ? (statsRes.value?.data || {}) : {};
  const forumList = forumRes.status === 'fulfilled' ? (forumRes.value?.data || []) : [];

  // Determine greeting by time of day
  const hour = new Date().getHours();
  let greetingTime = 'Selamat Pagi';
  let greetingIcon = 'fa-sun';
  if (hour >= 11 && hour < 15) {
    greetingTime = 'Selamat Siang';
    greetingIcon = 'fa-cloud-sun';
  } else if (hour >= 15 && hour < 18) {
    greetingTime = 'Selamat Sore';
    greetingIcon = 'fa-cloud-sun-rain';
  } else if (hour >= 18 || hour < 5) {
    greetingTime = 'Selamat Malam';
    greetingIcon = 'fa-moon';
  }

  // Teacher metadata
  const userName = user.nama || 'Pendidik Hebat';
  const userSchool = user.sekolah || 'SDN di Gugus 3 Wanayasa';
  const userMapel = user.mata_pelajaran || 'Guru Kelas';
  const userNip = user.nip ? `NIP. ${user.nip}` : 'Pendidik Terdaftar';
  const isAdmin = ['admin', 'operator'].includes(user.role);

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div class="educator-dashboard space-y-8 animate-fade-in pb-16">
      
      <!-- ============ HERO WELCOME BANNER ============ -->
      <div class="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-8 md:p-10 shadow-2xl border border-teal-500/20">
        <!-- Background Organic Aura Glows -->
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 left-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(38,148,148,0.15)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div class="space-y-4 max-w-2xl">
            <!-- Badges Bar -->
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 backdrop-blur-md">
                <i class="fas ${greetingIcon} text-[11px]"></i>
                ${greetingTime}
              </span>
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                <i class="fas fa-school text-teal-400 text-[11px]"></i>
                ${escapeHtml(userSchool)}
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                user.role === 'admin' 
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-400/40' 
                  : (user.role === 'operator' 
                      ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30')
              }">
                <i class="fas ${user.role === 'admin' ? 'fa-shield-halved' : (user.role === 'operator' ? 'fa-user-shield' : 'fa-chalkboard-user')} text-[11px]"></i>
                ${user.role === 'admin' ? 'Administrator KKG' : (user.role === 'operator' ? 'Operator Gugus' : 'Pendidik Anggota')}
              </span>
            </div>

            <!-- Greeting Title -->
            <div>
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-display">
                ${greetingTime}, <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-teal-400">${escapeHtml(userName)}</span>
              </h1>
              <p class="text-slate-300 text-sm sm:text-base font-normal mt-2 leading-relaxed flex flex-wrap items-center gap-2">
                <span>${escapeHtml(userMapel)}</span>
                <span class="text-teal-400/50">•</span>
                <span>${escapeHtml(userNip)}</span>
                <span class="text-teal-400/50">•</span>
                <span class="text-teal-200/90 font-medium">T.A. 2025/2026</span>
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onclick="navigate('rpp')" 
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-2.5 cursor-pointer"
              >
                <i class="fas fa-wand-magic-sparkles text-sm"></i>
                <span>Buat RPP Baru (AI)</span>
              </button>

              <button 
                onclick="navigate('absensi')" 
                class="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 backdrop-blur-md transition-all hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <i class="fas fa-qrcode text-teal-300 text-sm"></i>
                <span>Presensi / Scan QR</span>
              </button>

              <button 
                onclick="window.togglePublicLanding()" 
                class="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-all flex items-center gap-2 cursor-pointer"
                title="Beralih ke tampilan beranda publik"
              >
                <i class="fas fa-eye text-xs"></i>
                <span>Tampilan Publik</span>
              </button>
            </div>
          </div>

          <!-- Quick Today Card (Right Column) -->
          <div class="w-full lg:w-auto shrink-0 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/15 shadow-xl flex flex-col justify-between min-w-[260px]">
            <div class="flex items-center justify-between gap-4 mb-4 border-b border-white/10 pb-4">
              <div>
                <span class="text-[10px] uppercase tracking-widest text-teal-300 font-extrabold block">Kalender Hari Ini</span>
                <span class="text-sm font-bold text-white">${todayFormatted}</span>
              </div>
              <div class="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 text-lg">
                <i class="fas fa-calendar-day"></i>
              </div>
            </div>

            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Agenda Terdaftar</span>
                <span class="font-bold text-white px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">${kegiatanList.length} Acara</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Status Keaktifan</span>
                <span class="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Aktif Gugus 3
                </span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Modul AI Siap</span>
                <span class="font-bold text-teal-300">4 Asisten</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 4 STAT METRICS CARDS ============ -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Metric 1: Agenda KKG -->
        <div onclick="navigate('kalender')" class="group relative p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-teal-500/50 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <span class="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 text-xl group-hover:scale-110 transition-transform">
              <i class="fas fa-calendar-check"></i>
            </span>
            <span class="text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Jadwal <i class="fas fa-chevron-right text-[10px]"></i>
            </span>
          </div>
          <div class="text-2xl font-black text-slate-900 tracking-tight">${kegiatanList.length} Kegiatan</div>
          <p class="text-xs text-slate-500 mt-1">Agenda pertemuan & workshop KKG</p>
        </div>

        <!-- Metric 2: Bank Materi -->
        <div onclick="navigate('materi')" class="group relative p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-indigo-500/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <span class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 text-xl group-hover:scale-110 transition-transform">
              <i class="fas fa-book-open"></i>
            </span>
            <span class="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Akses <i class="fas fa-chevron-right text-[10px]"></i>
            </span>
          </div>
          <div class="text-2xl font-black text-slate-900 tracking-tight">${stats.materiTersedia || 'Tersedia'}</div>
          <p class="text-xs text-slate-500 mt-1">Bahan ajar & modul Kurikulum Merdeka</p>
        </div>

        <!-- Metric 3: AI Assistant Modules -->
        <div onclick="navigate('rpp')" class="group relative p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-amber-500/50 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <span class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 text-xl group-hover:scale-110 transition-transform">
              <i class="fas fa-magic"></i>
            </span>
            <span class="text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Mulai <i class="fas fa-chevron-right text-[10px]"></i>
            </span>
          </div>
          <div class="text-2xl font-black text-slate-900 tracking-tight">4 Generator</div>
          <p class="text-xs text-slate-500 mt-1">RPP, Asesmen, Slide, & Game TTS</p>
        </div>

        <!-- Metric 4: Forum & Kolaborasi -->
        <div onclick="navigate('forum')" class="group relative p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <span class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 text-xl group-hover:scale-110 transition-transform">
              <i class="fas fa-comments"></i>
            </span>
            <span class="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Diskusi <i class="fas fa-chevron-right text-[10px]"></i>
            </span>
          </div>
          <div class="text-2xl font-black text-slate-900 tracking-tight">Ruang Berbagi</div>
          <p class="text-xs text-slate-500 mt-1">Tanya jawab & praktik baik rekan sejawat</p>
        </div>
      </div>

      <!-- ============ BENTO GRID: PINTASAN PERANGKAT AJAR AI ============ -->
      <div>
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[11px] font-extrabold uppercase tracking-widest mb-1">
              <i class="fas fa-bolt text-[10px]"></i>
              Pusat Perangkat Pembelajaran
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Asisten AI & Administrasi Pendidik
            </h2>
          </div>
          <p class="hidden sm:block text-xs text-slate-500 max-w-xs text-right">
            Otomatisasi pembuatan dokumen ajar, media, dan instrumen penilaian berstandar nasional.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Card 1: AI RPP Generator (Featured Span 2 on Desktop) -->
          <div 
            onclick="navigate('rpp')" 
            class="group lg:col-span-2 relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white border border-teal-500/30 hover:border-teal-500/60 shadow-sm hover:shadow-2xl hover:shadow-teal-500/15 transition-all duration-500 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
          >
            <div class="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>

            <div>
              <div class="flex items-center justify-between mb-6">
                <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 text-teal-700 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
                  <i class="fas fa-sparkles text-teal-500"></i>
                  Kurikulum Merdeka • Prioritas
                </span>
                <span class="w-10 h-10 rounded-2xl bg-white shadow-sm border border-teal-500/20 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all">
                  <i class="fas fa-arrow-right text-sm"></i>
                </span>
              </div>

              <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors tracking-tight mb-3">
                AI RPP & Modul Ajar Generator
              </h3>
              <p class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
                Hasilkan RPP 1-Lembar dan Modul Ajar berdiferensiasi lengkap dengan tujuan pembelajaran (TP), asesmen diagnostik, formatif, sumatif, serta refleksi siswa dalam hitungan detik.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-teal-500/10 text-xs font-semibold text-teal-800">
              <span class="flex items-center gap-1.5"><i class="fas fa-check-circle text-teal-500"></i> Berbasis Capaian Pembelajaran (CP)</span>
              <span class="flex items-center gap-1.5"><i class="fas fa-check-circle text-teal-500"></i> Ekspor Docx / Cetak Langsung</span>
              <span class="flex items-center gap-1.5"><i class="fas fa-check-circle text-teal-500"></i> Sesuai Karakteristik Gugus 3</span>
            </div>
          </div>

          <!-- Card 2: Asesmen & Kisi-Kisi -->
          <div 
            onclick="navigate('kisi')" 
            class="group relative overflow-hidden rounded-[32px] p-7 bg-white border border-slate-200/90 hover:border-emerald-500/50 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-5">
                <span class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 text-xl group-hover:scale-110 transition-transform">
                  <i class="fas fa-list-check"></i>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  HOTS & AKM
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                Asesmen & Kisi-Kisi Soal
              </h3>
              <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Susun butir soal pilihan ganda & uraian, kartu soal, kisi-kisi penilaian harian, UTS/UAS berbobot kognitif C1-C6 otomatis.
              </p>
            </div>
            <span class="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Buka Generator Asesmen <i class="fas fa-arrow-right text-[10px]"></i>
            </span>
          </div>

          <!-- Card 3: Slide Studio AI -->
          <div 
            onclick="navigate('slide')" 
            class="group relative overflow-hidden rounded-[32px] p-7 bg-white border border-slate-200/90 hover:border-amber-500/50 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-5">
                <span class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 text-xl group-hover:scale-110 transition-transform">
                  <i class="fas fa-file-powerpoint"></i>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Media Presentasi
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors mb-2">
                Slide Studio AI
              </h3>
              <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Rancang tayangan media ajar visual interaktif berbasis AI yang siap dipresentasikan di proyektor kelas atau rapat KKG.
              </p>
            </div>
            <span class="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Rancang Presentasi <i class="fas fa-arrow-right text-[10px]"></i>
            </span>
          </div>

          <!-- Card 4: Teka-Teki Silang (TTS) -->
          <div 
            onclick="navigate('tts')" 
            class="group relative overflow-hidden rounded-[32px] p-7 bg-white border border-slate-200/90 hover:border-indigo-500/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-5">
                <span class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 text-xl group-hover:scale-110 transition-transform">
                  <i class="fas fa-puzzle-piece"></i>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Gamifikasi Kelas
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors mb-2">
                Teka-Teki Silang (TTS)
              </h3>
              <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Buat lembar kerja siswa (LKPD) teka-teki silang edukatif otomatis dengan petunjuk mendatar & menurun berbasis topik ajar.
              </p>
            </div>
            <span class="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Buat Soal TTS <i class="fas fa-arrow-right text-[10px]"></i>
            </span>
          </div>

          <!-- Card 5: Presensi Kegiatan Digital -->
          <div 
            onclick="navigate('absensi')" 
            class="group relative overflow-hidden rounded-[32px] p-7 bg-white border border-slate-200/90 hover:border-sky-500/50 shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-5">
                <span class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 text-xl group-hover:scale-110 transition-transform">
                  <i class="fas fa-clipboard-check"></i>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Presensi KKG
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors mb-2">
                Presensi & Absensi QR
              </h3>
              <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Konfirmasi kehadiran rapat bulanan, KKG Mini, atau workshop secara digital dengan scan QR dan riwayat daftar hadir.
              </p>
            </div>
            <span class="text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Buka Presensi <i class="fas fa-arrow-right text-[10px]"></i>
            </span>
          </div>

          <!-- Card 6: Bank Materi Komunitas -->
          <div 
            onclick="navigate('materi')" 
            class="group relative overflow-hidden rounded-[32px] p-7 bg-white border border-slate-200/90 hover:border-rose-500/50 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-5">
                <span class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-xl group-hover:scale-110 transition-transform">
                  <i class="fas fa-folder-open"></i>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Bahan Ajar
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-rose-700 transition-colors mb-2">
                Bank Materi & Modul Ajar
              </h3>
              <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Akses ribuan modul pembelajaran, silabus, kisi-kisi, dan video referensi karya guru hebat se-Kecamatan Wanayasa.
              </p>
            </div>
            <span class="text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Jelajahi Materi <i class="fas fa-arrow-right text-[10px]"></i>
            </span>
          </div>

          ${isAdmin ? `
            <!-- Admin Card 1: Generator Surat -->
            <div 
              onclick="navigate('surat')" 
              class="group relative overflow-hidden rounded-[32px] p-7 bg-gradient-to-br from-purple-500/5 to-white border border-purple-500/30 hover:border-purple-500/60 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between mb-5">
                  <span class="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 text-xl group-hover:scale-110 transition-transform">
                    <i class="fas fa-envelope-open-text"></i>
                  </span>
                  <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    Admin Only
                  </span>
                </div>
                <h3 class="text-xl font-bold text-slate-900 group-hover:text-purple-700 transition-colors mb-2">
                  Generator Surat Undangan
                </h3>
                <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                  Buat dan cetak surat dinas resmi KKG Gugus 3 ber-KOP dan nomor surat otomatis siap tanda tangan.
                </p>
              </div>
              <span class="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Kelola Surat <i class="fas fa-arrow-right text-[10px]"></i>
              </span>
            </div>

            <!-- Admin Card 2: Panel Kontrol Admin -->
            <div 
              onclick="navigate('admin')" 
              class="group relative overflow-hidden rounded-[32px] p-7 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-xl hover:border-teal-400/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between mb-5">
                  <span class="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300 text-xl group-hover:scale-110 transition-transform">
                    <i class="fas fa-sliders"></i>
                  </span>
                  <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    Control Center
                  </span>
                </div>
                <h3 class="text-xl font-bold text-white group-hover:text-teal-300 transition-colors mb-2">
                  Panel Kontrol Administrasi
                </h3>
                <p class="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                  Kelola data sekolah anggota, manajemen akun pendidik, audit logs, template surat, dan pengaturan AI provider.
                </p>
              </div>
              <span class="text-xs font-bold text-teal-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Buka Panel Kontrol <i class="fas fa-arrow-right text-[10px]"></i>
              </span>
            </div>
          ` : ''}

        </div>
      </div>

      <!-- ============ DUA KOLOM: AGENDA TERDEKAT & PENGUMUMAN ============ -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- KOLOM KIRI (7 COLS): AGENDA & KEGIATAN KKG -->
        <div class="lg:col-span-7 space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center text-base">
                <i class="fas fa-calendar-alt"></i>
              </span>
              <div>
                <h3 class="text-xl font-bold text-slate-900 tracking-tight">Agenda Kegiatan Terdekat</h3>
                <p class="text-xs text-slate-500">Jadwal kegiatan Kelompok Kerja Guru Gugus 3</p>
              </div>
            </div>
            <button onclick="navigate('kalender')" class="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Kalender Lengkap <i class="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>

          <div class="space-y-4">
            ${kegiatanList.length > 0 ? kegiatanList.slice(0, 3).map((k) => {
              const d = new Date(k.tanggal);
              const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
              const dayNum = d.getDate();
              const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
              
              return `
                <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex flex-col items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                      <span class="text-[10px] font-bold uppercase tracking-wider opacity-90">${monthName}</span>
                      <span class="text-xl font-black leading-none">${dayNum}</span>
                      <span class="text-[9px] font-semibold opacity-80">${dayName}</span>
                    </div>

                    <div>
                      <h4 class="font-bold text-slate-900 text-base leading-snug">${escapeHtml(k.nama_kegiatan)}</h4>
                      <div class="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                        <span class="flex items-center gap-1">
                          <i class="far fa-clock text-teal-600"></i> ${escapeHtml(k.waktu_mulai || '08:00')} - ${escapeHtml(k.waktu_selesai || 'Selesai')}
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="fas fa-map-marker-alt text-rose-500"></i> ${escapeHtml(k.tempat || 'SDN 1 Wanayasa')}
                        </span>
                      </div>
                      ${k.deskripsi ? `<p class="text-xs text-slate-500 mt-1 line-clamp-1">${escapeHtml(k.deskripsi)}</p>` : ''}
                    </div>
                  </div>

                  <div class="flex items-center gap-2 self-end sm:self-center">
                    <button 
                      onclick="navigate('absensi')" 
                      class="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs border border-teal-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <i class="fas fa-clipboard-check"></i> Presensi
                    </button>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
                  <i class="far fa-calendar-times"></i>
                </div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">Belum Ada Agenda Terdekat</h4>
                <p class="text-xs text-slate-500 max-w-sm mx-auto mb-4">Agenda kegiatan rapat bulanan dan workshop KKG akan ditampilkan di sini.</p>
                <button onclick="navigate('kalender')" class="px-4 py-2 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors">
                  Buka Kalender Pendidikan
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- KOLOM KANAN (5 COLS): PENGUMUMAN & FORUM -->
        <div class="lg:col-span-5 space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-base">
                <i class="fas fa-bullhorn"></i>
              </span>
              <div>
                <h3 class="text-xl font-bold text-slate-900 tracking-tight">Pengumuman Terkini</h3>
                <p class="text-xs text-slate-500">Warta resmi KKG Gugus 3</p>
              </div>
            </div>
            <button onclick="navigate('pengumuman')" class="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              Lihat Semua <i class="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>

          <div class="space-y-3">
            ${pengumuman.length > 0 ? pengumuman.slice(0, 3).map((p) => `
              <div 
                onclick="navigate('pengumuman')" 
                class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
              >
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    ${escapeHtml(p.kategori || 'Umum')}
                  </span>
                  <span class="text-[11px] text-slate-400 font-medium">
                    <i class="far fa-clock mr-1"></i>${formatDate(p.created_at)}
                  </span>
                </div>
                <h4 class="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors line-clamp-1 leading-snug">
                  ${p.is_pinned ? '<i class="fas fa-thumbtack text-xs text-amber-500 mr-1.5"></i>' : ''}
                  ${escapeHtml(p.judul)}
                </h4>
                <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  ${escapeHtml(p.isi || '')}
                </p>
              </div>
            `).join('') : `
              <div class="p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center">
                <p class="text-xs text-slate-500">Belum ada pengumuman baru saat ini.</p>
              </div>
            `}
          </div>

          <!-- Forum Teaser Card -->
          <div class="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-teal-950 text-white border border-teal-500/30 shadow-xl">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-bold uppercase tracking-widest text-teal-300">Forum Kolaborasi Guru</span>
              <span class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-teal-300 text-sm">
                <i class="fas fa-comments"></i>
              </span>
            </div>
            <h4 class="font-extrabold text-base text-white mb-2">Punya Pertanyaan Pembelajaran?</h4>
            <p class="text-xs text-slate-300 leading-relaxed mb-4">
              Diskusikan kesulitan modul ajar, asesmen kelas, atau berbagi ide praktik baik bersama seluruh rekan guru se-Gugus 3.
            </p>
            <button 
              onclick="navigate('forum')" 
              class="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Buka Forum Guru</span>
              <i class="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
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
  let pengumuman = [];
  let guruSummary = { total: 0, samples: [] };

  try {
    const fetchPromises = [
      api('/pengumuman?limit=3', { timeout: 1200 }).catch(() => ({ data: [] })),
      api('/guru/public-summary', { timeout: 1200 }).catch(() => ({ data: { total: 0, samples: [] } }))
    ];
    const [pengumumanRes, guruRes] = await Promise.all(fetchPromises);
    pengumuman = pengumumanRes.data || [];
    guruSummary = guruRes.data || { total: 0, samples: [] };
  } catch (e) {
    console.log('Public data not loaded quickly, rendering with defaults');
  }

  const bentoFeatures = [
    {
      id: 'rpp',
      icon: 'fa-magic',
      title: 'AI RPP & Modul Ajar',
      desc: 'Buat rencana pembelajaran otomatis berbasis Kurikulum Merdeka berdiferensiasi hanya dalam hitungan detik.',
      size: 'large',
      style: 'primary',
      isAi: true,
    },
    {
      id: 'materi',
      icon: 'fa-book-open',
      title: 'Bank Materi Terpadu',
      desc: 'Akses ratusan modul ajar, materi presentasi, dan LKPD dari guru-guru berprestasi di seluruh gugus.',
      style: 'white',
      isAi: false,
    },
    {
      id: 'kisi',
      icon: 'fa-clipboard-check',
      title: 'Asesmen & Kisi-Kisi HOTS',
      desc: 'Rancang kisi-kisi asesmen, stimulus AKM, dan soal HOTS otomatis selaras capaian pembelajaran.',
      style: 'white',
      isAi: true,
    },
    {
      id: 'tts',
      icon: 'fa-puzzle-piece',
      title: 'Teka-Teki Silang (TTS)',
      desc: 'Game edukasi interaktif kelas & LKPD cetak teka-teki silang otomatis untuk pengayaan siswa.',
      style: 'white',
      isAi: true,
    },
    {
      id: 'slide',
      icon: 'fa-file-powerpoint',
      title: 'Slide Studio AI',
      desc: 'Rancang media presentasi materi ajar interaktif dengan struktur visual yang memikat murid.',
      style: 'white',
      isAi: true,
    },
    {
      id: 'forum',
      icon: 'fa-comments',
      title: 'Forum Kolaborasi Guru',
      desc: 'Diskusikan tantangan mengajar dan bertukar inspirasi dengan rekan sejawat secara real-time.',
      style: 'dark',
      isAi: false,
    },
    {
      id: 'guru',
      icon: 'fa-users',
      title: 'Direktori Pendidik',
      desc: 'Terhubung dengan guru profesional 9 sekolah dalam satu jaringan gugus terpadu.',
      style: 'white',
      isAi: false,
    },
  ];

  const schools = [
    'SDN 2 Nangerang', 'SDN 1 Nangerang', 'SDN Nagrog',
    'SDN Raharja', 'SDN 1 Cibuntu', 'SDN 2 Cibuntu',
    'SDN Sumurugul', 'SDN Sakambang', 'SDIT Al-Qalam'
  ];

  const avatarGradients = [
    'from-teal-500 to-emerald-600 text-white',
    'from-indigo-500 to-blue-600 text-white',
    'from-amber-500 to-orange-600 text-white',
    'from-rose-500 to-pink-600 text-white',
  ];

  const samples = guruSummary.samples && guruSummary.samples.length > 0 ? guruSummary.samples.slice(0, 3) : [];
  const avatarsHtml = samples.length > 0
    ? samples.map((g, idx) => {
        const initial = (g.nama || 'G').trim().charAt(0).toUpperCase();
        const grad = avatarGradients[idx % avatarGradients.length];
        if (g.foto_url) {
          return `
            <div class="relative w-10 h-10 rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center">
              <img src="${escapeHtml(g.foto_url)}" alt="${escapeHtml(g.nama)}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div class="hidden w-full h-full items-center justify-center bg-gradient-to-br ${grad} font-bold text-xs select-none">${initial}</div>
            </div>
          `;
        }
        return `
          <div class="w-10 h-10 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center bg-gradient-to-br ${grad} font-bold text-xs select-none" title="${escapeHtml(g.nama)}">
            ${initial}
          </div>
        `;
      }).join('')
    : `
      <div class="w-10 h-10 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs"><i class="fas fa-graduation-cap"></i></div>
      <div class="w-10 h-10 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs"><i class="fas fa-chalkboard-user"></i></div>
      <div class="w-10 h-10 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs"><i class="fas fa-user-check"></i></div>
    `;

  const totalMembersLabel = guruSummary.total > 0
    ? `${guruSummary.total}`
    : 'Aktif';

  return `
    <div class="home-organic relative overflow-x-hidden">
      
      <!-- Logged-in Notice Banner (If viewing public landing while authenticated) -->
      ${state.user ? `
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-6">
          <div class="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center text-sm font-bold">
                <i class="fas fa-user-check"></i>
              </span>
              <p class="text-xs sm:text-sm text-teal-900 font-semibold">
                Anda masuk sebagai <strong>${escapeHtml(state.user.nama)}</strong>. Ingin membuka ruang kerja pendidik?
              </p>
            </div>
            <button 
              onclick="window.togglePublicLanding()" 
              class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fas fa-chalkboard-user"></i>
              <span>Buka Ruang Kerja</span>
            </button>
          </div>
        </div>
      ` : ''}

      <!-- ============ HERO SECTION ============ -->
      <section class="pl-6 md:pl-10 lg:pl-16 pr-6 md:pr-10 lg:pr-16 pt-10 pb-16 lg:pt-16 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative w-full">
        <!-- Hero Text -->
        <div class="animate-fade-in">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-[#269494]/20">
            <i class="fas fa-award text-[11px] text-teal-600"></i>
            Portal Resmi Pendidik Terakreditasi
          </div>
          
          <h2 class="text-4xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight font-display">
            Portal KKG<br>Gugus
            <span class="text-teal-600"> 3 Wanayasa</span>
          </h2>
          
          <p class="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl mb-8">
            Pusat ekosistem digital Kelompok Kerja Guru Gugus 3 Kecamatan Wanayasa. 
            Membantu guru menyusun administrasi Kurikulum Merdeka berdiferensiasi secara cepat, 
            akurat, dan selaras standar BSKAP Kemendikbudristek.
          </p>
          
          <!-- Hero Action Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
            ${!state.user ? `
              <button 
                onclick="navigate('login')" 
                class="px-8 py-4 bg-teal-600 text-white rounded-2xl font-extrabold text-base hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/30 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>Masuk Akun</span>
                <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>

              <button 
                onclick="window.openAiShowcaseModal('rpp')" 
                class="px-7 py-4 bg-white hover:bg-teal-50/70 text-teal-800 font-bold text-base rounded-2xl border-2 border-teal-500/30 hover:border-teal-500 transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <i class="fas fa-wand-magic-sparkles text-teal-600"></i>
                <span>Lihat Simulasi AI</span>
              </button>
            ` : `
              <button 
                onclick="window.togglePublicLanding()" 
                class="px-8 py-4 bg-teal-600 text-white rounded-2xl font-extrabold text-base hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/30 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <i class="fas fa-chalkboard-user"></i>
                <span>Buka Ruang Kerja Guru</span>
                <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>

              <button 
                onclick="window.openAiShowcaseModal('rpp')" 
                class="px-7 py-4 bg-white hover:bg-teal-50/70 text-teal-800 font-bold text-base rounded-2xl border-2 border-teal-500/30 hover:border-teal-500 transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <i class="fas fa-eye text-teal-600"></i>
                <span>Showcase Fitur</span>
              </button>
            `}
          </div>

          <!-- Avatar & Registered Counter Pill -->
          <div class="inline-flex items-center gap-4 px-5 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md">
            <div class="flex -space-x-3">
              ${avatarsHtml}
            </div>
            <div>
              <div class="font-black text-slate-900 leading-tight text-sm sm:text-base">${totalMembersLabel} Pendidik Terdaftar</div>
              <div class="text-[10.5px] text-teal-700 font-bold uppercase tracking-wide">9 Sekolah Anggota Gugus 3</div>
            </div>
          </div>
        </div>

        <!-- Hero Illustration Card -->
        <div class="relative animate-scale-in w-full flex justify-center">
          <div class="relative z-10 w-full max-w-lg aspect-square bg-teal-500/20 rounded-[50px] flex items-center justify-center p-8 group overflow-hidden" style="clip-path: url(#organic-clip);">
            <div class="absolute inset-0 bg-gradient-to-br from-teal-500/40 to-transparent"></div>
            
            <div class="relative z-20 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 animate-float text-center max-w-xs">
              <div class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                <i class="fas fa-book-open"></i>
              </div>
              <h4 class="text-base font-black text-slate-900 mb-1">Kurikulum Merdeka</h4>
              <p class="text-xs text-slate-500 leading-relaxed">RPP Berdiferensiasi, Kisi-Kisi HOTS, dan LKPD instan terverifikasi.</p>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10.5px] font-bold text-teal-700">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Standar BSKAP 046/H/KR/2025</span>
              </div>
            </div>

            <div class="absolute top-8 right-8 text-white/60 animate-spin-slow">
              <i class="fas fa-sparkles text-4xl"></i>
            </div>
            
            <div class="absolute bottom-10 left-8 text-white/50 animate-float-reverse">
              <i class="fas fa-users text-3xl"></i>
            </div>

            <div class="absolute -top-2 -left-2 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 animate-float-slow">
              <i class="fas fa-file-powerpoint text-teal-600 text-xl"></i>
            </div>
            
            <div class="absolute -bottom-2 -right-2 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 animate-float-slow" style="animation-delay: 1s;">
              <i class="fas fa-clipboard-check text-teal-600 text-xl"></i>
            </div>
          </div>

          <div class="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      <!-- ============ LIVE IMPACT METRICS COUNTERS ============ -->
      <section class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 mb-16">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/40 flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0">
              <i class="fas fa-file-signature"></i>
            </div>
            <div>
              <span class="block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">1,250+</span>
              <span class="block text-[11px] font-semibold text-slate-500 leading-tight">Modul Ajar Dihasilkan</span>
            </div>
          </div>

          <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/40 flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              <i class="fas fa-school"></i>
            </div>
            <div>
              <span class="block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">9 / 9</span>
              <span class="block text-[11px] font-semibold text-slate-500 leading-tight">Sekolah Terintegrasi</span>
            </div>
          </div>

          <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/40 flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl shrink-0">
              <i class="fas fa-users-gear"></i>
            </div>
            <div>
              <span class="block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">100%</span>
              <span class="block text-[11px] font-semibold text-slate-500 leading-tight">Pendidik Gugus Aktif</span>
            </div>
          </div>

          <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/40 flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <i class="fas fa-stopwatch"></i>
            </div>
            <div>
              <span class="block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">3,400+</span>
              <span class="block text-[11px] font-semibold text-slate-500 leading-tight">Jam Administrasi Dihemat</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ STANDAR RESMI & TRUST PILLARS ============ -->
      <section class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 mb-20">
        <div class="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-500/30 shadow-2xl relative overflow-hidden">
          <div class="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div class="max-w-xl">
              <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-4">
                <i class="fas fa-shield-halved"></i>
                Jaminan Kepatuhan Standar Nasional
              </div>
              <h3 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white mb-3">
                Kepatuhan Regulasi Kemendikbudristek & UU PDP
              </h3>
              <p class="text-slate-300 text-sm sm:text-base leading-relaxed">
                Seluruh arsitektur kurikulum dan penyimpanan data telah diselaraskan dengan amanat regulasi pendidikan serta Undang-Undang No. 27/2022 tentang Pelindungan Data Pribadi.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto shrink-0">
              <div class="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center">
                <i class="fas fa-certificate text-teal-400 text-2xl mb-2 block"></i>
                <h5 class="font-bold text-xs text-white">BSKAP 046/H/KR/2025</h5>
                <p class="text-[10px] text-slate-300">Kurikulum Merdeka</p>
              </div>

              <div class="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center">
                <i class="fas fa-user-lock text-emerald-400 text-2xl mb-2 block"></i>
                <h5 class="font-bold text-xs text-white">UU No. 27 / 2022</h5>
                <p class="text-[10px] text-slate-300">Pelindungan Data Guru</p>
              </div>

              <div class="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center">
                <i class="fas fa-bolt text-amber-400 text-2xl mb-2 block"></i>
                <h5 class="font-bold text-xs text-white">Cloudflare Edge</h5>
                <p class="text-[10px] text-slate-300">99.9% Serverless SLA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ VISI & MISI SECTION ============ -->
      <section class="py-12 lg:py-16 relative z-20">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="text-center mb-14 animate-slide-up">
            <h2 class="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 font-display">Visi & Misi</h2>
            <div class="h-1.5 w-20 bg-teal-500 rounded-full mx-auto"></div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
            <!-- Visi Card -->
            <div class="bg-white rounded-[36px] p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1.5 transition-transform duration-300 relative overflow-hidden group">
              <div class="w-16 h-16 bg-teal-50 border border-teal-100 rounded-3xl flex items-center justify-center mb-6">
                <i class="fas fa-eye text-3xl text-teal-600"></i>
              </div>
              <h3 class="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Visi Bersama</h3>
              <p class="text-slate-600 text-lg leading-relaxed font-medium italic">
                "Mewujudkan guru-guru yang profesional, kompeten, dan berdaya saing tinggi di Gugus 3 Kecamatan Wanayasa melalui kolaborasi, inovasi teknologi, dan pengembangan berkelanjutan."
              </p>
            </div>

            <!-- Misi Card -->
            <div class="bg-teal-600 rounded-[36px] p-8 sm:p-10 shadow-2xl shadow-teal-600/30 text-white hover:-translate-y-1.5 transition-transform duration-300 relative overflow-hidden group">
              <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <i class="fas fa-bullseye text-3xl text-white"></i>
              </div>
              <h3 class="text-2xl font-bold mb-4 tracking-tight">Misi Strategis</h3>
              <ul class="space-y-4 text-teal-50 text-base leading-relaxed">
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                    <i class="fas fa-check text-[10px] text-white"></i>
                  </div>
                  <span>Meningkatkan kompetensi pedagogik & profesional guru melalui pelatihan berkala.</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                    <i class="fas fa-check text-[10px] text-white"></i>
                  </div>
                  <span>Memfasilitasi pertukaran materi & praktik baik antar 9 sekolah dasar anggota.</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                    <i class="fas fa-check text-[10px] text-white"></i>
                  </div>
                  <span>Mengembangkan media pembelajaran berdiferensiasi dan asesmen berbasis AI.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ BENTO GRID FITUR (SMART CONVERSION) ============ -->
      <section class="py-16 lg:py-24 relative">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="text-center mb-14">
            <h2 class="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-3 font-display">Layanan Unggulan Digital</h2>
            <p class="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">Solusi terpadu untuk menunjang kegiatan pengajaran, evaluasi, dan kolaborasi pendidik.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${bentoFeatures.map((f) => {
              const clickAction = state.user
                ? `navigate('${f.id}')`
                : (f.isAi ? `window.openAiShowcaseModal('${f.id}')` : `navigate('${f.id}')`);

              return `
                <div 
                  onclick="${clickAction}"
                  class="group relative overflow-hidden rounded-[36px] p-8 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    f.size === 'large' ? 'lg:col-span-2' : ''
                  } ${
                    f.style === 'primary' 
                      ? 'bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-2xl shadow-teal-600/30' 
                      : f.style === 'dark'
                      ? 'bg-slate-900 text-white shadow-xl'
                      : 'bg-white text-slate-900 border border-slate-200/80 shadow-xl shadow-slate-200/40 hover:border-teal-400'
                  } hover:-translate-y-1.5"
                >
                  <div>
                    <div class="flex items-center justify-between mb-6">
                      <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        f.style === 'primary' 
                          ? 'bg-white/20 text-white' 
                          : f.style === 'dark'
                          ? 'bg-white/10 text-teal-400'
                          : 'bg-teal-50 text-teal-600'
                      } group-hover:scale-105 transition-transform">
                        <i class="fas ${f.icon}"></i>
                      </div>
                      ${f.isAi ? `
                        <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          f.style === 'primary' ? 'bg-white/20 text-white border border-white/30' : 'bg-teal-500/15 text-teal-700 border border-teal-500/30'
                        }">
                          AI Generator
                        </span>
                      ` : ''}
                    </div>
                    
                    <h3 class="text-2xl font-bold mb-3 tracking-tight">${f.title}</h3>
                    <p class="text-sm leading-relaxed ${
                      f.style === 'primary' ? 'text-teal-100' : f.style === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }">${f.desc}</p>
                  </div>

                  <div class="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                    f.style === 'primary' ? 'text-white' : f.style === 'dark' ? 'text-teal-400' : 'text-teal-600'
                  }">
                    <span>${f.isAi && !state.user ? 'Lihat Simulasi / Contoh' : 'Jelajahi Fitur'}</span>
                    <i class="fas fa-arrow-right text-[10px] group-hover:translate-x-1.5 transition-transform"></i>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- ============ REKOMENDASI & ENDORSEMENT SECTION ============ -->
      <section class="py-16 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/60">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="text-center mb-12">
            <span class="text-xs font-bold uppercase tracking-widest text-teal-600 block mb-2">Apresiasi & Kepemimpinan</span>
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Dukungan Pembina Gugus & Kepala Sekolah</h2>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            <!-- Testimonial 1 -->
            <div class="p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-xl shadow-slate-200/30 flex flex-col justify-between">
              <p class="text-slate-600 italic text-base leading-relaxed mb-6">
                "Inisiatif Portal Digital KKG Gugus 3 Wanayasa adalah terobosan riil bagi mutu pembelajaran. Administrasi Kurikulum Merdeka yang biasanya menyita berjam-jam kini diselesaikan cepat tanpa kehilangan kedalaman pedagogik, sehingga energi guru tercurah penuh mendampingi murid."
              </p>
              <div class="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  <i class="fas fa-user-tie"></i>
                </div>
                <div>
                  <h4 class="font-extrabold text-slate-900 text-sm leading-tight">Pengawas Pembina Gugus 3</h4>
                  <p class="text-xs text-slate-400">Dinas Pendidikan Kec. Wanayasa</p>
                </div>
              </div>
            </div>

            <!-- Testimonial 2 -->
            <div class="p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-xl shadow-slate-200/30 flex flex-col justify-between">
              <p class="text-slate-600 italic text-base leading-relaxed mb-6">
                "Melalui portal terpadu ini, 9 sekolah dasar anggota di Wanayasa kini memiliki standar mutu bahan ajar yang setara. Sinkronisasi agenda rapat rutin, presensi QR, dan bank materi membuat koordinasi gugus jauh lebih akuntabel dan modern."
              </p>
              <div class="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  <i class="fas fa-school-flag"></i>
                </div>
                <div>
                  <h4 class="font-extrabold text-slate-900 text-sm leading-tight">Ketua KKG Gugus 3 Wanayasa</h4>
                  <p class="text-xs text-slate-400">SDN Inti Wanayasa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ SEKOLAH ANGGOTA ============ -->
      <section class="py-14 bg-white">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 text-center">
          <p class="text-xs uppercase tracking-widest text-slate-400 font-bold mb-6">9 Satuan Pendidikan Anggota Gugus 3 Wanayasa</p>
          <div class="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            ${schools.map(s => `
              <span class="px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 text-xs md:text-sm font-semibold hover:border-teal-500 hover:text-teal-600 transition-colors shadow-2xs">
                <i class="fas fa-school mr-2 text-teal-600"></i>${s}
              </span>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- ============ PENGUMUMAN TERKINI ============ -->
      <section class="py-16 lg:py-24 bg-slate-50/50 border-t border-slate-100">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="h-1 w-8 bg-teal-500 rounded-full"></div>
                <span class="text-xs font-bold uppercase tracking-widest text-teal-600">Informasi Kedinasan</span>
              </div>
              <h2 class="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-display">Papan Pengumuman Resmi</h2>
            </div>
            <button onclick="navigate('pengumuman')" class="px-6 py-3 bg-white border border-slate-200/80 rounded-2xl font-bold text-slate-900 hover:border-teal-600 hover:text-teal-600 transition-all flex items-center gap-2.5 shadow-sm self-start cursor-pointer">
              Lihat Semua Pengumuman
              <i class="fas fa-arrow-right text-xs"></i>
            </button>
          </div>

          <div class="grid gap-6 md:grid-cols-3">
            ${pengumuman.length > 0 ? pengumuman.map((p) => `
              <button onclick="navigate('pengumuman')" class="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[36px] bg-white border border-slate-200/80 shadow-md hover:-translate-y-1 hover:shadow-xl hover:border-teal-400 transition-all text-left">
                <div class="flex flex-1 flex-col p-8">
                  <div class="mb-5 flex items-center justify-between">
                    <span class="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-700 border border-teal-200/60">
                      ${escapeHtml(p.kategori || 'Umum')}
                    </span>
                    ${p.is_pinned ? '<i class="fas fa-thumbtack text-xs text-teal-600"></i>' : ''}
                  </div>

                  <h3 class="mb-3 text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors leading-snug">${escapeHtml(p.judul)}</h3>
                  <p class="mb-6 line-clamp-3 flex-1 text-sm text-slate-600 leading-relaxed">${escapeHtml((p.isi || '').substring(0, 120))}...</p>

                  <div class="mt-auto flex items-center pt-5 text-xs font-bold text-slate-400 border-t border-slate-100">
                    <i class="far fa-clock mr-2 text-teal-600"></i> ${formatDateTime(p.created_at)}
                  </div>
                </div>
              </button>
            `).join('') : `
              <div class="col-span-full rounded-[36px] border border-dashed border-teal-500/30 bg-teal-50/20 py-20 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4 border border-teal-200 shadow-sm">
                  <i class="fas fa-bullhorn text-xl"></i>
                </div>
                <p class="text-sm text-slate-600 font-bold">Belum ada pengumuman baru hari ini.</p>
              </div>
            `}
          </div>
        </div>
      </section>

      <!-- ============ FAQ ACCORDION SECTION ============ -->
      <section class="py-16 lg:py-24 bg-white border-t border-slate-100">
        <div class="max-w-4xl mx-auto px-6 md:px-10">
          <div class="text-center mb-12">
            <span class="text-xs font-bold uppercase tracking-widest text-teal-600 block mb-2">Panduan Pengguna</span>
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Pertanyaan yang Sering Diajukan (FAQ)</h2>
          </div>

          <div class="space-y-4">
            <!-- FAQ 1 -->
            <div class="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
              <button onclick="window.toggleLandingFaq(1)" class="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 cursor-pointer">
                <span>Apakah hasil RPP dan Soal AI ini sah sesuai standar Kurikulum Merdeka?</span>
                <i id="faq-icon-1" class="fas fa-chevron-down text-xs text-slate-400 transition-transform"></i>
              </button>
              <div id="faq-ans-1" class="hidden px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                Ya, seluruh generator perangkat ajar telah diselaraskan dengan Keputusan Kepala BSKAP Nomor 046/H/KR/2025 tentang Capaian Pembelajaran Kurikulum Merdeka terbaru dan memuat komponen wajib: Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), Pembelajaran Berdiferensiasi, serta Asesmen Formatif & Sumatif.
              </div>
            </div>

            <!-- FAQ 2 -->
            <div class="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
              <button onclick="window.toggleLandingFaq(2)" class="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 cursor-pointer">
                <span>Apakah dokumen yang dihasilkan bisa langsung diunduh ke Microsoft Word (.docx)?</span>
                <i id="faq-icon-2" class="fas fa-chevron-down text-xs text-slate-400 transition-transform"></i>
              </button>
              <div id="faq-ans-2" class="hidden px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                Bisa. Seluruh dokumen Modul Ajar/RPP, Lembar Kerja Siswa (LKPD), Teka-Teki Silang, dan Surat Kedinasan dapat langsung diunduh dalam format .docx lengkap dengan kop surat sekolah resmi dan siap dicetak atau diedit lebih lanjut.
              </div>
            </div>

            <!-- FAQ 3 -->
            <div class="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
              <button onclick="window.toggleLandingFaq(3)" class="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 cursor-pointer">
                <span>Apakah portal ini nyaman diakses melalui smartphone (HP Android / iPhone)?</span>
                <i id="faq-icon-3" class="fas fa-chevron-down text-xs text-slate-400 transition-transform"></i>
              </button>
              <div id="faq-ans-3" class="hidden px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                Sangat nyaman. Portal telah dilengkapi antarmuka mobile responsif khusus dengan App Bar Bawah ergonomis, tombol cepat Asisten AI, serta mendukung PWA (dapat dipasang ke layar utama HP tanpa perlu install dari Play Store).
              </div>
            </div>

            <!-- FAQ 4 -->
            <div class="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
              <button onclick="window.toggleLandingFaq(4)" class="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 cursor-pointer">
                <span>Bagaimana keamanan data pribadi guru dan sekolah?</span>
                <i id="faq-icon-4" class="fas fa-chevron-down text-xs text-slate-400 transition-transform"></i>
              </button>
              <div id="faq-ans-4" class="hidden px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                Sistem dirancang sesuai amanat UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Seluruh data login, NIP, nomor kontak, dan riwayat dokumen tersimpan secara privat dengan enkripsi SSL/TLS 256-bit dan proteksi token CSRF.
              </div>
            </div>

            <!-- FAQ 5 -->
            <div class="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
              <button onclick="window.toggleLandingFaq(5)" class="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 cursor-pointer">
                <span>Bagaimana cara guru mendapatkan akun di Portal KKG Gugus 3?</span>
                <i id="faq-icon-5" class="fas fa-chevron-down text-xs text-slate-400 transition-transform"></i>
              </button>
              <div id="faq-ans-5" class="hidden px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                Pendidik yang bertugas di 9 sekolah anggota Gugus 3 Wanayasa dapat melakukan pendaftaran mandiri melalui tombol Masuk / Daftar Akun, atau menghubungi Operator Gugus/Sekolah masing-masing untuk aktivasi akun kedinasan.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ FOOTER ============ -->
      <footer class="bg-white border-t border-slate-200/80 px-6 py-12">
        <div class="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-sm">
              <i class="fas fa-graduation-cap text-white text-sm"></i>
            </div>
            <div>
              <div class="text-sm font-extrabold text-slate-900 tracking-tight">KKG Gugus 3 Wanayasa</div>
              <p class="text-[11px] text-slate-400 font-medium">Kecamatan Wanayasa, Kabupaten Purwakarta &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span class="inline-flex items-center gap-1 text-teal-700 font-bold">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Sistem Aktif & Terlindungi
            </span>
          </div>
        </div>
      </footer>

      <!-- ========================================================================= -->
      <!-- AI SHOWCASE MODAL (INTERACTIVE PREVIEW FOR GUESTS / ENTERPRISE DEMO)      -->
      <!-- ========================================================================= -->
      <div 
        id="ai-showcase-modal" 
        class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
        onclick="if(event.target === this) window.closeAiShowcaseModal()"
      >
        <div class="bg-white rounded-[32px] shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-base">
                <i class="fas fa-wand-magic-sparkles"></i>
              </span>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Simulasi Perangkat Ajar AI (Contoh Terverifikasi)</h3>
                <p class="text-[11px] text-slate-400">Lihat kualitas luaran otomatis berstandar Kurikulum Merdeka</p>
              </div>
            </div>
            <button 
              onclick="window.closeAiShowcaseModal()" 
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>

          <!-- Tab Bar -->
          <div class="px-6 pt-3 pb-2 border-b border-slate-100 flex flex-wrap gap-2 shrink-0 bg-white">
            <button id="tab-btn-rpp" onclick="window.switchShowcaseTab('rpp')" class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-teal-600 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer">
              <i class="fas fa-magic"></i>
              <span>1. Modul Ajar / RPP</span>
            </button>
            <button id="tab-btn-kisi" onclick="window.switchShowcaseTab('kisi')" class="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center gap-2 cursor-pointer">
              <i class="fas fa-clipboard-check"></i>
              <span>2. Kisi-Kisi & Soal HOTS</span>
            </button>
            <button id="tab-btn-slide" onclick="window.switchShowcaseTab('slide')" class="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center gap-2 cursor-pointer">
              <i class="fas fa-file-powerpoint"></i>
              <span>3. Slide Studio</span>
            </button>
            <button id="tab-btn-tts" onclick="window.switchShowcaseTab('tts')" class="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center gap-2 cursor-pointer">
              <i class="fas fa-puzzle-piece"></i>
              <span>4. TTS Edukatif</span>
            </button>
          </div>

          <!-- Tab Contents (Scrollable) -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fafcfc]">
            <!-- TAB 1: RPP SHOWCASE -->
            <div id="tab-content-rpp" class="space-y-4 animate-fade-in">
              <div class="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between">
                <div>
                  <span class="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-teal-600 text-white mb-1">Kurikulum Merdeka • Fase B (Kelas 4)</span>
                  <h4 class="font-extrabold text-slate-900 text-sm">IPAS: Menyelidiki Bagian Tubuh Tumbuhan & Fungsinya</h4>
                  <p class="text-[11px] text-teal-800">Alokasi: 2 JP (2 x 35 Menit) • Pendekatan: Problem-Based Learning (PBL)</p>
                </div>
                <span class="text-xs font-bold px-3 py-1 rounded-full bg-white text-emerald-700 border border-emerald-300">
                  <i class="fas fa-check-circle mr-1"></i>Siap Cetak Word
                </span>
              </div>

              <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs sm:text-sm">
                <div>
                  <h5 class="font-bold text-slate-900 uppercase tracking-wide text-xs mb-1.5 text-teal-700">A. Capaian & Tujuan Pembelajaran</h5>
                  <p class="text-slate-600 leading-relaxed">Peserta didik mampu mengidentifikasi bagian-bagian tubuh tumbuhan (akar, batang, daun, bunga, buah) serta mengaitkan fungsinya dengan proses fotosintesis dan fotosintesis air dalam kehidupan tumbuhan.</p>
                </div>

                <div class="pt-2 border-t border-slate-100">
                  <h5 class="font-bold text-slate-900 uppercase tracking-wide text-xs mb-1.5 text-teal-700">B. Diferensiasi Proses & Konten</h5>
                  <div class="grid sm:grid-cols-3 gap-2.5">
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span class="font-bold text-teal-700 block text-[11px]">Kelompok Visual</span>
                      <span class="text-slate-500 text-[11px]">Mengamati kartu infografis & anatomi daun berstomata.</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span class="font-bold text-teal-700 block text-[11px]">Kelompok Auditori</span>
                      <span class="text-slate-500 text-[11px]">Menyimak narasi interaktif & diskusi terarah fungsi akar.</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span class="font-bold text-teal-700 block text-[11px]">Kelompok Kinestetik</span>
                      <span class="text-slate-500 text-[11px]">Eksplorasi spesimen daun riil di lingkungan halaman sekolah.</span>
                    </div>
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-100">
                  <h5 class="font-bold text-slate-900 uppercase tracking-wide text-xs mb-1.5 text-teal-700">C. Asesmen Formatif & Rubrik</h5>
                  <p class="text-slate-600 leading-relaxed">Observasi performa diskusi kelompok dan pengisian Lembar Kerja Siswa (LKPD) berbasis pemecahan masalah (skor 1-4 sesuai rubrik penilaian).</p>
                </div>
              </div>
            </div>

            <!-- TAB 2: KISI SHOWCASE -->
            <div id="tab-content-kisi" class="hidden space-y-4 animate-fade-in">
              <div class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span class="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-600 text-white mb-1">Matriks Kisi-Kisi & Asesmen Sumatif</span>
                  <h4 class="font-extrabold text-slate-900 text-sm">Matematika Kelas 5: Pecahan & Operasi Hitung</h4>
                  <p class="text-[11px] text-emerald-800">Tingkat Kesulitan: Sedang - Sukar • Tipe: Pilihan Ganda Kompleks & AKM</p>
                </div>
                <span class="text-xs font-bold px-3 py-1 rounded-full bg-white text-emerald-700 border border-emerald-300">
                  <i class="fas fa-check-circle mr-1"></i>HOTS L3 Penalaran
                </span>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="bg-slate-100 text-slate-700">
                        <th class="p-2 border border-slate-200">No</th>
                        <th class="p-2 border border-slate-200">Indikator Soal</th>
                        <th class="p-2 border border-slate-200">Level</th>
                        <th class="p-2 border border-slate-200">Bentuk Soal</th>
                      </tr>
                    </thead>
                    <tbody class="text-slate-600">
                      <tr>
                        <td class="p-2 border border-slate-200 text-center font-bold">1</td>
                        <td class="p-2 border border-slate-200">Disajikan narasi pembagian bahan kue, siswa dapat menganalisis sisa bahan terigu dalam bentuk pecahan paling sederhana.</td>
                        <td class="p-2 border border-slate-200 text-center"><span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">L3 - HOTS</span></td>
                        <td class="p-2 border border-slate-200">PG Kompleks</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm">
                  <span class="font-bold text-slate-900 block mb-1">Contoh Butir Soal AKM:</span>
                  <p class="text-slate-700 mb-2">Ibu memiliki 3/4 kg tepung terigu. Sebanyak 2/5 kg digunakan untuk membuat bolu kukus. Kemudian Ibu membeli lagi 1/2 kg. Manakah pernyataan berikut yang BENAR? (Pilih 2 jawaban yang sesuai)</p>
                  <div class="space-y-1 text-slate-600 text-xs">
                    <p class="font-medium text-emerald-700">✓ A. Sisa tepung setelah membuat bolu adalah 7/20 kg.</p>
                    <p class="font-medium text-emerald-700">✓ B. Total tepung terigu Ibu sekarang adalah 17/20 kg.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 3: SLIDE SHOWCASE -->
            <div id="tab-content-slide" class="hidden space-y-4 animate-fade-in">
              <div class="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex items-center justify-between">
                <div>
                  <span class="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-sky-600 text-white mb-1">Slide Studio AI</span>
                  <h4 class="font-extrabold text-slate-900 text-sm">Media Presentasi: Rotasi & Revolusi Bumi</h4>
                  <p class="text-[11px] text-sky-800">Mode Tayang Layar Penuh • Dilengkapi Kuis Cepat Murid</p>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                <div class="p-4 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
                  <span class="text-[9px] font-bold uppercase text-teal-400 block mb-1">Slide 1 — Judul & Pemantik</span>
                  <h5 class="text-sm font-extrabold mb-1">Mengapa Ada Siang & Malam?</h5>
                  <p class="text-[11px] text-slate-300">Menjelajahi rahasia perputaran bumi pada porosnya selama 24 jam bersama detektif sains cilik.</p>
                </div>

                <div class="p-4 rounded-2xl bg-white text-slate-900 shadow-md border border-slate-200">
                  <span class="text-[9px] font-bold uppercase text-teal-600 block mb-1">Slide 2 — Fakta Ilmiah</span>
                  <h5 class="text-sm font-extrabold mb-1">Arah Rotasi: Barat ke Timur</h5>
                  <p class="text-[11px] text-slate-500">Matahari tampak terbit di timur dan tenggelam di barat adalah akibat gerak semu harian bumi.</p>
                </div>
              </div>
            </div>

            <!-- TAB 4: TTS SHOWCASE -->
            <div id="tab-content-tts" class="hidden space-y-4 animate-fade-in">
              <div class="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between">
                <div>
                  <span class="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-600 text-white mb-1">LKPD Game Kelas • TTS Edukatif</span>
                  <h4 class="font-extrabold text-slate-900 text-sm">Bahasa Indonesia: Kosakata Baku & Antonim</h4>
                  <p class="text-[11px] text-purple-800">Format Lembar Kerja Siswa (LKPD) Cetak A4 Langsung</p>
                </div>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <!-- Mini Crossword Grid Graphic -->
                <div class="w-40 h-40 grid grid-cols-5 gap-1 p-2 bg-slate-100 rounded-xl border border-slate-300 shrink-0 select-none">
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">R</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">A</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">J</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">I</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">N</div>
                  
                  <div class="bg-slate-300 rounded"></div>
                  <div class="bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center rounded">S</div>
                  <div class="bg-slate-300 rounded"></div>
                  <div class="bg-slate-300 rounded"></div>
                  <div class="bg-slate-300 rounded"></div>

                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">L</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">A</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">M</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">P</div>
                  <div class="bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center rounded">U</div>
                </div>

                <div class="space-y-2 text-xs text-slate-600 flex-1">
                  <p class="font-bold text-slate-900">Petunjuk Mendatar:</p>
                  <p>1. Persamaan kata 'Giat' (5 huruf) &rarr; <span class="font-bold text-teal-700">RAJIN</span></p>
                  <p>3. Alat penerangan ruang kelas (5 huruf) &rarr; <span class="font-bold text-teal-700">LAMPU</span></p>
                  <p class="font-bold text-slate-900 pt-1">Petunjuk Menurun:</p>
                  <p>2. Lawan kata 'Luas' (6 huruf) &rarr; <span class="font-bold text-teal-700">SEMPIT</span></p>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer with Direct Conversion CTA -->
          <div class="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <p class="text-xs text-slate-500 text-center sm:text-left">
              Ingin membuat perangkat ajar seperti di atas untuk kelas Anda?
            </p>
            <div class="flex items-center gap-2.5 w-full sm:w-auto">
              <button 
                onclick="window.closeAiShowcaseModal()" 
                class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button 
                onclick="window.closeAiShowcaseModal(); navigate('login');" 
                class="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Masuk & Mulai Buat</span>
                <i class="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

