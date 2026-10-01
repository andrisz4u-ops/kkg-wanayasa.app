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
  const namaKkg = state.settings?.nama_kkg || state.tenant?.nama || 'KKG';
  const kecamatan = state.settings?.kecamatan || 'Kecamatan';
  const userName = user.nama || 'Pendidik Hebat';
  const userSchool = user.sekolah || `SDN Anggota ${namaKkg}`;
  const userMapel = user.mata_pelajaran || 'Guru Kelas';
  const userNip = user.nip ? `NIP. ${user.nip}` : 'Pendidik Terdaftar';
  const isAdmin = ['super_admin', 'admin', 'operator'].includes(user.role);

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
                <span class="text-teal-200/90 font-medium current-tahun-ajaran-display">T.A ${escapeHtml(state.settings?.tahun_ajaran || '2026/2027')}</span>
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onclick="navigate('analisis-cp')" 
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-2.5 cursor-pointer"
              >
                <i class="fas fa-book-bookmark text-sm"></i>
                <span>Analisis CP (AI)</span>
              </button>

              ${isAdmin ? `
              <button 
                onclick="navigate('program-sekolah')" 
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-2.5 cursor-pointer"
              >
                <i class="fas fa-file-lines text-sm"></i>
                <span>Program Sekolah (AI)</span>
              </button>
              ` : ''}

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
                  Aktif ${escapeHtml(namaKkg)}
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
              <span class="flex items-center gap-1.5"><i class="fas fa-check-circle text-teal-500"></i> Sesuai Karakteristik Gugus & Sekolah</span>
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

          <!-- Card 4: Game Edukasi & TTS -->
          <div 
            onclick="navigate('games')" 
            class="group relative overflow-hidden rounded-[32px] p-7 bg-white border border-slate-200/90 hover:border-indigo-500/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-5">
                <span class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 text-xl group-hover:scale-110 transition-transform">
                  <i class="fas fa-gamepad"></i>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Layar Sentuh IFP
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors mb-2">
                Game Edukasi & TTS
              </h3>
              <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Pusat game edukasi kelas untuk layar sentuh IFP: Adu Perkalian, Ular Tangga, Tarik Tambang, Puzzle Peta, dan Teka-Teki Silang.
              </p>
            </div>
            <span class="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Buka Game Edukasi <i class="fas fa-arrow-right text-[10px]"></i>
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
                Akses ribuan modul pembelajaran, silabus, kisi-kisi, dan video referensi karya guru hebat se-${escapeHtml(kecamatan)}.
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
                  Buat dan cetak surat dinas resmi ${escapeHtml(namaKkg)} ber-KOP dan nomor surat otomatis siap tanda tangan.
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
                <p class="text-xs text-slate-500">Jadwal kegiatan ${escapeHtml(namaKkg)}</p>
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
                          <i class="fas fa-map-marker-alt text-rose-500"></i> ${escapeHtml(k.tempat || (state.sekolahList?.[0]?.nama || 'Sekretariat KKG'))}
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
                <p class="text-xs text-slate-500">Warta resmi ${escapeHtml(namaKkg)}</p>
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
              Diskusikan kesulitan modul ajar, asesmen kelas, atau berbagi ide praktik baik bersama seluruh rekan guru anggota ${escapeHtml(namaKkg)}.
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
      <span class="word">RuangKKG<small>Untuk guru Indonesia</small></span>
    </a>
    <nav class="nav" aria-label="Navigasi utama">
      <a href="#fitur">Modul AI</a>
      <a href="#dokumentasi">Dokumentasi</a>
      <a href="#tentang">Tentang</a>
      <a href="#harga">Harga</a>
      <a href="#testimoni">Testimoni</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="head-cta">
      ${state.user ? `
        <button onclick="window.togglePublicLanding()" class="btn btn-primary btn-sm" style="background:var(--brand-strong); color:#ffffff !important; border-radius:12px;">
          <i class="fas fa-arrow-left" style="margin-right:4px;"></i> Workspace Saya
        </button>
      ` : `
        <button onclick="navigate('login')" class="btn btn-ghost btn-sm" style="cursor:pointer;">Masuk</button>
        <button onclick="navigate('login')" class="btn btn-primary btn-sm" style="cursor:pointer; color:#ffffff !important;">Coba Gratis</button>
      `}
      <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="mobileNav" aria-label="Buka menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      </button>
    </div>
  </div>
</header>
<nav class="mobile-nav" id="mobileNav" aria-label="Navigasi seluler">
  <a href="#fitur">Modul AI</a>
  <a href="#dokumentasi">Dokumentasi</a>
  <a href="#tentang">Tentang</a>
  <a href="#harga">Harga</a>
  <a href="#testimoni">Testimoni</a>
  <a href="#faq">FAQ</a>
  ${state.user ? `
    <button onclick="window.togglePublicLanding()" class="btn btn-primary" style="width:100%; margin-top:0.8rem; color:#ffffff !important;">Ke Workspace Saya</button>
  ` : `
    <button onclick="navigate('login')" class="btn btn-ghost" style="width:100%; margin-top:0.8rem;">Masuk</button>
    <button onclick="navigate('login')" class="btn btn-primary" style="width:100%; margin-top:0.5rem; color:#ffffff !important;">Coba Gratis 30 Hari</button>
  `}
</nav>

<main>
<!-- ================= HERO ================= -->
<section class="hero" id="beranda">
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
        <span class="pill rv">✶ Baru: 5 modul AI untuk perangkat pembelajaran</span>
        <h1 class="rv rv-d1">Satu perintah guru,<br />jadi <span class="hl">RPP lengkap<svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9c40-5 90-6.5 194-4" stroke="#e9a51b" stroke-width="5" stroke-linecap="round"/></svg></span> dalam hitungan menit.</h1>
        <p class="lede rv rv-d2">RuangKKG adalah Asisten AI untuk guru Indonesia — Analisis CP, Buat RPP, Buat Asesmen, Slide Presentasi, sampai Game Edukasi. Satu alur kerja, dari dokumen kurikulum sampai kelas yang hidup.</p>
        <div class="hero-cta rv rv-d3">
          <a class="btn btn-primary" href="#harga" style="color:#ffffff !important;">Coba Gratis
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:#ffffff !important;"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <a class="btn btn-ghost" href="#fitur">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            Jelajahi 5 Modul</a>
        </div>
        <div class="hero-trust rv rv-d3">
          <div class="avatars" aria-hidden="true"><span>BR</span><span>SA</span><span>DP</span><span class="more">50+</span></div>
          <div>
            <span class="tt"><span class="stars" aria-hidden="true">★★★★★</span>Dipercaya <b>500+ pendidik &amp; anggota KKG</b></span>
            <span class="ts">Tanpa kartu kredit · Bayar via QRIS · CS bahasa Indonesia</span>
          </div>
        </div>
      </div>

      <div class="magic rv" id="magicDemo" data-phase="prompt" role="img" aria-label="Demo transformasi AI: satu kartu perintah guru berubah menjadi RPP lengkap dalam hitungan menit.">
        <div class="magic-glow" aria-hidden="true"></div>
        <div class="magic-dots" aria-hidden="true"></div>
        <div class="m-stage" aria-hidden="true">
          <div class="m-card m-prompt">
            <div class="m-head"><span class="m-who"><span class="dot">AN</span>Anda · wali kelas 5</span><span class="m-tag">Modul: Buat RPP</span></div>
            <p class="m-text"><span id="mType"></span><span class="m-caret"></span></p>
            <div class="m-foot"><span class="m-hint">Satu kalimat, bukan templat kosong.</span><span class="m-send">Kirim<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
          </div>
          <div class="m-card m-result">
            <div class="m-head"><span class="m-who ai"><span class="dot">✶</span>RPP — Koding &amp; KA Kelas 5</span><span class="m-tag hot">AI · 42 detik</span></div>
            <ul class="m-sections">
              <li style="--i:0"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Identitas &amp; tujuan pembelajaran</li>
              <li style="--i:1"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Alur kegiatan: pendahuluan–inti–penutup</li>
              <li style="--i:2"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Media &amp; logika koding sehari-hari</li>
              <li style="--i:3"><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Penilaian &amp; rubrik skor</li>
            </ul>
            <div class="m-foot"><span class="m-hint">10 halaman · siap cetak / edit</span><span class="m-send ghost">Unduh Word</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item rv"><div class="n"><span class="count" data-to="5">0</span><em> Modul</em></div><div class="l">perangkat ajar terintegrasi</div></div>
      <div class="stat-item rv rv-d1"><div class="n">&lt; 2<em> mnt</em></div><div class="l">susun modul &amp; RPP lengkap</div></div>
      <div class="stat-item rv rv-d2"><div class="n"><span class="count" data-to="100">0</span><em>%</em></div><div class="l">standar Kurikulum Merdeka</div></div>
      <div class="stat-item rv rv-d3"><div class="n">4,9<em>/5</em></div><div class="l">skor kepuasan pendidik</div></div>
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
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-rpp" style="color:#ffffff !important;">
            Lanjut ke Modul 2: Buat RPP
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:#ffffff !important;"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Modul 2: Buat RPP -->
      <div class="mod-panel" id="mod-rpp" role="tabpanel" aria-labelledby="tab-mod-rpp" hidden>
        <div class="feature">
          <div class="f-copy">
            <span class="f-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Buat RPP <span class="ai-chip">✶ AI</span></span>
            <h2>Dari analisis CP jadi RPP lengkap — hitungan menit.</h2>
            <p class="lede" style="margin-bottom:0">Pilih hasil Analisis CP atau isi tujuan sendiri, lalu AI menyusun komponen RPP: identitas, tujuan, alur kegiatan, media, sampai penilaian. Tinjau, sesuaikan dengan gaya mengajar Anda.</p>
            <ul class="checks">
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Struktur rapi: pendahuluan, kegiatan inti, penutup</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Tujuan &amp; kegiatan selaras dengan capaian</span></li>
              <li><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Ekspor Word &amp; PDF — siap cetak &amp; supervisi</span></li>
            </ul>
          </div>
          <div class="f-visual">
            <div class="mock" role="img" aria-label="Draf RPP yang disusun AI lengkap dengan alur kegiatan">
              <div class="mock-head"><span class="mt">✶ Buat RPP</span><span class="ai-badge">Draf AI · 42 detik</span></div>
              <div class="rppdoc">
                <div class="rd-head"><b>RPP — Fotosintesis (IPAS)</b><span>Kelas 4 · 1 pertemuan · 2 × 35 menit</span></div>
                <div class="rd-sec"><b>Pendahuluan · 10 menit</b><div class="ln" style="width:100%"></div><div class="ln" style="width:82%"></div></div>
                <div class="rd-sec"><b>Kegiatan Inti · 60 menit</b><div class="ln" style="width:96%"></div><div class="ln" style="width:100%"></div><div class="ln" style="width:74%"></div></div>
                <div class="rd-sec"><b>Penutup · 15 menit</b><div class="ln" style="width:88%"></div><div class="ln" style="width:64%"></div></div>
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
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-asesmen" style="color:#ffffff !important;">
            Lanjut ke Modul 3: Buat Asesmen
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:#ffffff !important;"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
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
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-slide" style="color:#ffffff !important;">
            Lanjut ke Modul 4: Slide Presentasi
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:#ffffff !important;"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
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
          <button type="button" class="btn btn-sm btn-primary mod-next-btn" data-next-tab="mod-game" style="color:#ffffff !important;">
            Lanjut ke Modul 5: Game Edukasi
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:#ffffff !important;"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
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
            <div class="mock" role="img" aria-label="Contoh game edukasi: kuis fotosintesis dengan papan skor">
              <div class="mock-head"><span class="mt">✶ Game Edukasi</span><span class="ma">24 siswa bermain</span></div>
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
                  <div class="gm-row"><b>1</b><span>Sinta</span><i>2.400</i></div>
                  <div class="gm-row"><b>2</b><span>Bagus</span><i>2.150</i></div>
                  <div class="gm-row"><b>3</b><span>Rafa</span><i>1.980</i></div>
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
          <a href="#harga" class="btn btn-sm btn-accent mod-next-btn">
            Mulai Gunakan Semua Modul (Coba Gratis)
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================= GALERI ================= -->
<section class="band section" id="dokumentasi">
  <div class="wrap">
    <div class="section-head center rv" style="max-width:640px">
      <span class="f-tag" style="color:var(--accent)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M3 17l5-4 4 3 4-4 5 5"/></svg> Galeri</span>
      <h2>Dokumentasi kegiatan komunitas</h2>
      <p class="lede" style="margin-bottom:0">Digunakan bersama dalam workshop KKG Gugus, maupun secara mandiri oleh pendidik untuk persiapan mengajar: bimtek, workshop perangkat ajar, dan rapat pengurus.</p>
    </div>
    <div class="gallery rv rv-d1" role="group" aria-label="Galeri dokumentasi kegiatan komunitas guru">
      <button class="g-item" data-cap="Bimtek Deep Learning &amp; Media Interaktif|KKG Gugus 3 · 28 Juni 2026 · 42 foto" aria-label="Perbesar foto: Bimtek Deep Learning dan Media Interaktif">
        <img src="/static/img/gallery-1.jpg" alt="Sekelompok guru berfoto bersama dengan laptop di meja saat pelatihan" loading="lazy" />
        <div class="g-cap"><b>Bimtek Deep Learning &amp; Media Interaktif</b><span>KKG Gugus 3 · 28 Juni 2026 · 42 foto</span></div>
      </button>
      <button class="g-item" data-cap="Workshop Penyusunan Perangkat KBM 2025/2026|KKG Gugus Cempaka · 23 Juli 2025 · 36 foto" aria-label="Perbesar foto: Workshop Penyusunan Perangkat KBM">
        <img src="/static/img/gallery-2.jpg" alt="Ruangan seminar sekolah dengan penceramah dan peserta guru yang menyimak presentasi" loading="lazy" />
        <div class="g-cap"><b>Workshop Perangkat KBM</b><span>KKG Gugus Cempaka · 23 Jul 2025</span></div>
      </button>
      <button class="g-item" data-cap="Rapat Pengurus — Program Semester Genap|KKG PAI Gugus Flamboyan · 21 Agu 2026 · 18 foto" aria-label="Perbesar foto: Rapat Pengurus Program Semester Genap">
        <img src="/static/img/gallery-3.jpg" alt="Diskusi para guru berpakaian batik di ruang kelas" loading="lazy" />
        <div class="g-cap"><b>Rapat Pengurus Semester Genap</b><span>KKG Flamboyan · 21 Agu 2026</span></div>
      </button>
    </div>
  </div>
</section>

<!-- ================= TENTANG RUANGKKG ================= -->
<section class="section" id="tentang" style="padding-top:0">
  <div class="wrap">
    <div class="section-head rv">
      <span class="pill"><span class="dot"></span> Tentang RuangKKG</span>
      <h2>Platform SaaS Pedagogis Independen untuk Pendidik Indonesia.</h2>
      <p class="lede">RuangKKG adalah platform SaaS (Software as a Service) teknologi pendidikan (EdTech) yang didirikan untuk memangkas beban administrasi dan memberdayakan guru Indonesia melalui kecerdasan artifisial yang terstruktur dan terstandarisasi.</p>
    </div>

    <div class="rv rv-d1" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
      <!-- Card 1: Identitas & Founder -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(38,148,148,0.1); color:#269494; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:800;">
            AH
          </div>
          <div>
            <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">Andris Hadiansyah</h3>
            <span style="font-size:0.8rem; color:#269494; font-weight:600;">Founder &amp; Lead Architect</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
          Memulai inisiatif RuangKKG pada tahun 2025 berawal dari riset lapangan pendampingan administrasi guru di Jawa Barat. Berfokus pada arsitektur Generative AI berbasis kurikulum resmi dan sistem kolaborasi komunitas belajar.
        </p>
      </div>

      <!-- Card 2: Model Bisnis & Hubungan dengan KKG -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(37,99,235,0.1); color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem; height:1.25rem;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">SaaS Komersial Independen</h3>
            <span style="font-size:0.8rem; color:#2563eb; font-weight:600;">Mitra Teknologi Komunitas</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
          RuangKKG beroperasi sebagai entitas pengembang SaaS independen (bootstrapped). Komunitas KKG, MGMP, dan sekolah bertindak sebagai pengguna, mitra perintis, dan pelanggan layanan langganan.
        </p>
      </div>

      <!-- Card 3: Operasional & Kepatuhan Data -->
      <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:1.25rem; padding:1.75rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:2.75rem; height:2.75rem; border-radius:0.75rem; background:rgba(22,163,74,0.1); color:#16a34a; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem; height:1.25rem;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <h3 style="margin:0; font-size:1rem; font-weight:800; color:#111827;">Kepatuhan &amp; Kontak</h3>
            <span style="font-size:0.8rem; color:#16a34a; font-weight:600;">UU PDP No. 27/2022</span>
          </div>
        </div>
        <p style="font-size:0.875rem; line-height:1.6; color:#4b5563; margin:0;">
          Operasional berbasis di Jawa Barat, Indonesia. Mengedepankan prinsip <em>Zero-Data-Training</em> untuk keamanan dokumen pendidik. Kontak resmi: <strong>admin@ruangkkg.my.id</strong>.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- ================= HARGA ================= -->
<section class="section" id="harga">
  <div class="wrap">
    <div class="section-head center rv">
      <span class="pill"><span class="dot"></span> Harga</span>
      <h2>Harga yang masuk akal untuk urusan guru.</h2>
      <p class="lede">Mulai gratis selamanya untuk KKG kecil. Naik kelas saat butuh automasi penuh — bayar per KKG, bukan per anggota.</p>
      <div style="margin-top:1.4rem">
        <div class="toggle" role="group" aria-label="Pilih periode pembayaran">
          <button type="button" id="btnMonthly" aria-pressed="true">Bulanan</button>
          <button type="button" id="btnYearly" aria-pressed="false">Tahunan <span class="save">Hemat 18%</span></button>
        </div>
      </div>
    </div>

    <div class="price-grid">
      <div class="price rv">
        <div class="pn">Rintisan</div>
        <div class="pd">Untuk guru &amp; KKG yang baru mulai digital.</div>
        <div class="pr">
          <div class="amt">Rp 0<small>/selamanya</small></div>
          <div class="per">tanpa batas waktu</div>
        </div>
        <ul>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Akses gratis 5 Modul AI (CP, RPP, Soal, Slide, Game)</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>1 kegiatan aktif, 50 anggota KKG</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Kalender &amp; undangan kegiatan</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Absensi manual &amp; arsip 2 GB</li>
          <li class="dim"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>Absensi QR &amp; sertifikat otomatis</li>
        </ul>
        <button onclick="navigate('login')" class="btn btn-ghost" style="width:100%; cursor:pointer;">Mulai Gratis</button>
      </div>

      <div class="price feat rv rv-d1">
        <div class="ribbon">Paling populer</div>
        <div class="pn">KKG Pro</div>
        <div class="pd">Untuk KKG yang berkegiatan rutin.</div>
        <div class="pr">
          <div class="old" data-old> </div>
          <div class="amt"><span data-price data-m="Rp 49rb" data-y="Rp 39rb">Rp 49rb</span><small data-suffix>/KKG/bln</small></div>
          <div class="per" data-note>tagihan per bulan</div>
        </div>
        <ul>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><b>Akses Penuh 5 Modul AI</b> seluruh guru anggota</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Buat RPP, Asesmen &amp; Soal tanpa batas</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Kegiatan tanpa batas, 500 anggota</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Absensi QR &amp; sertifikat bernomor verifikasi</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Buku kas, SPJ siap cetak, arsip 100 GB</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Prioritas CS &amp; pendampingan pengurus</li>
        </ul>
        <button onclick="navigate('login')" class="btn btn-primary" style="width:100%; cursor:pointer; color:#ffffff !important;">Coba Gratis 30 Hari</button>
      </div>

      <div class="price rv rv-d2">
        <div class="pn">Kabupaten</div>
        <div class="pd">Untuk dinas, korcam &amp; MKKS.</div>
        <div class="pr">
          <div class="amt">Custom</div>
          <div class="per">penawaran per kebutuhan</div>
        </div>
        <ul>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><b>Lisensi AI Terintegrasi</b> se-Kecamatan / Kabupaten</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Custom format RPP &amp; KOP dinas daerah</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Semua fitur KKG Pro</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Dashboard rekap pengawas &amp; multi-gugus</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Pelatihan pengurus &amp; SLA dukungan khusus</li>
        </ul>
        <a class="btn btn-ghost" href="mailto:support@ruangkkg.my.id?subject=Penawaran%20Paket%20Kabupaten%20RuangKKG">Hubungi Kami</a>
      </div>
    </div>
    <p class="price-foot rv">Pembayaran via transfer bank, virtual account, atau QRIS — atas nama KKG, bukan perorangan. Berhenti kapan saja, data tetap bisa diekspor.</p>
  </div>
</section>


<!-- ================= TESTIMONI ================= -->
<section class="section" id="testimoni" style="padding-top:0">
  <div class="wrap">
    <div class="section-head center rv">
      <span class="pill"><span class="dot"></span> Kata mereka</span>
      <h2>Guru &amp; pengurus yang sudah merasakan bedanya.</h2>
    </div>
    <div class="testi-grid">
      <article class="testi rv">
        <p class="q">Biasanya menyusun RPP dan kisi-kisi asesmen butuh 3 malam suntuk. Lewat modul AI RuangKKG, draf perangkat siap ajar selesai sebelum jam pulang sekolah. Murid-murid pun antusias waktu kuis interaktifnya dicoba di kelas.</p>
        <div class="who"><span class="avatar" style="background:#16a34a">SR</span><div><b>Siti Rahmawati, S.Pd.</b><span>Guru Kelas 5 SD, Kab. Purwakarta</span></div></div>
      </article>
      <article class="testi rv rv-d1">
        <p class="q">Dulu SPJ nginep seminggu di meja saya. Sekarang sore setelah kegiatan selesai, laporannya sudah jadi dan siap tanda tangan.</p>
        <div class="who"><span class="avatar">RD</span><div><b>Hj. Ratna Dewi, S.Pd.</b><span>Ketua KKG Gugus 3, Bandung</span></div></div>
      </article>
      <article class="testi rv rv-d2">
        <p class="q">Absensi QR itu paling kerasa. Delapan puluh peserta, lima menit selesai, sertifikat otomatis terbit dan datanya langsung masuk tanpa rekap manual.</p>
        <div class="who"><span class="avatar a2">BS</span><div><b>Budi Santoso, S.Pd.</b><span>Sekretaris KKG, Surabaya</span></div></div>
      </article>
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
            <p><b>Privasi dan keamanan data dijamin sepenuhnya.</b> Sesuai amanat UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), seluruh data login, NIP, dan riwayat dokumen tersimpan secara privat dengan enkripsi SSL/TLS 256-bit dan proteksi CSRF. Kami menerapkan prinsip Zero-Data-Training: materi ajar Anda tidak pernah digunakan sebagai dataset latihan AI publik.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bagaimana cara guru mendapatkan akun dan mulai mencoba?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Daftar langsung dan coba gratis seketika.</b> Pendidik dapat langsung menekan tombol &ldquo;Coba Gratis&rdquo; atau &ldquo;Masuk&rdquo; untuk mendaftar mandiri. Anda langsung mendapatkan akses gratis untuk menguji 5 modul AI (Analisis CP, RPP, Kisi-Kisi, Slide, Game) tanpa perlu memasukkan kartu kredit.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bisakah dipakai untuk MGMP, MGBK, atau komunitas belajar guru jenjang lain?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Bisa dan fleksibel untuk semua jenjang pendidikan.</b> Alur kerja pedagogik RuangKKG dirancang fleksibel untuk semua jenjang pendidikan: SD, SMP, SMA, SMK, maupun madrasah (MI, MTs, MA). Pilihan fase (Fase A hingga F), tingkat kelas, dan mata pelajaran dapat disesuaikan seketika di Asisten AI.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-q" aria-expanded="false">
            <span>Bagaimana sistem pembayarannya jika ingin upgrade ke Paket Pro?</span>
            <span class="fx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          </button>
          <div class="faq-a">
            <p><b>Tersedia pembayaran instan dan resmi atas nama KKG/sekolah.</b> Pembayaran dapat dilakukan melalui transfer bank, virtual account, atau QRIS instan atas nama KKG/sekolah. Paket tahunan memberikan potongan hemat hingga 18%. Anda dapat membatalkan atau mengubah paket kapan saja tanpa penalti tersembunyi.</p>
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
      <h2>Siap memangkas waktu menyusun perangkat ajar — minggu ini juga?</h2>
      <p>Ratusan pendidik dan perintis komunitas belajar telah merasakan kemudahan 5 modul AI RuangKKG, dari Analisis CP sampai Game Edukasi — kembali punya waktu luang untuk hal terpenting: mengajar di depan kelas.</p>
      <div class="row">
        <button onclick="navigate('login')" class="btn btn-accent" style="cursor:pointer;">Mulai Gratis 30 Hari
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
        <a class="btn btn-ghost" href="#fitur">Lihat 5 Modul AI</a>
      </div>
      <p class="cta-note">Tanpa kartu kredit · Batalkan kapan saja · Data tetap milik Anda</p>
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
        <p>Platform SaaS EdTech independen untuk Kelompok Kerja Guru Indonesia — didirikan oleh Andris Hadiansyah (2025) guna merapikan administrasi agar guru fokus mengajar.</p>
      </div>
      <div class="foot-col">
        <h4>Produk</h4>
        <ul><li><a href="#fitur">Fitur AI</a></li><li><a href="#dokumentasi">Dokumentasi</a></li><li><a href="#tentang">Tentang Kami</a></li><li><a href="#harga">Harga</a></li><li><a href="#faq">FAQ</a></li></ul>
      </div>
      <div class="foot-col">
        <h4>Modul AI</h4>
        <ul><li><a href="#fitur">Analisis CP &amp; ATP</a></li><li><a href="#fitur">Modul Ajar / RPP</a></li><li><a href="#fitur">Asesmen &amp; Kisi-Kisi</a></li><li><a href="#fitur">Slide Presentasi &amp; Game</a></li></ul>
      </div>
      <div class="foot-col">
        <h4>Bantuan</h4>
        <ul><li><a href="#faq">Pusat Bantuan (FAQ)</a></li><li><a href="mailto:admin@ruangkkg.my.id?subject=Bantuan%20RuangKKG">Hubungi CS</a></li><li><a href="#testimoni">Testimoni</a></li><li><a href="#faq"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;margin-right:6px;"></span>Sistem Aktif (99.9%)</a></li></ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 RuangKKG · ruangkkg.my.id — Dibuat di Indonesia untuk guru Indonesia.</span>
      <div class="links"><a href="/terms" onclick="navigate('terms'); return false;">Syarat &amp; Ketentuan</a><a href="/privacy-policy" onclick="navigate('privacy-policy'); return false;">Kebijakan Privasi</a><a href="mailto:support@ruangkkg.my.id">Bantuan CS</a></div>
    </div>
  </div>
</footer>

<!-- ================= LIGHTBOX ================= -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Pratinjau foto dokumentasi">
  <button class="lb-close" id="lbClose" aria-label="Tutup pratinjau"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <figure><img id="lbImg" alt="" /><figcaption><b id="lbTitle"></b><span id="lbMeta"></span></figcaption></figure>
</div>
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
        target.scrollIntoView({ behavior: 'smooth' });
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
  const spySections = ['fitur', 'dokumentasi', 'harga', 'testimoni', 'faq']
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
        history.replaceState(null, '', '#' + targetId);
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
        history.replaceState(null, '', '#' + nextId);
      }
    });
  });

  // Handle URL hash on load
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    if (['mod-cp', 'mod-rpp', 'mod-asesmen', 'mod-slide', 'mod-game'].includes(hash)) {
      switchModTab(hash, false);
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
    let typingTimer = null;
    function typeText(done) {
      let i = 0;
      typeEl.textContent = "";
      magic.setAttribute("data-phase", "prompt");
      typingTimer = setInterval(() => {
        i += 1;
        typeEl.textContent = PROMPT.slice(0, i);
        if (i >= PROMPT.length) { clearInterval(typingTimer); setTimeout(done, 950); }
      }, 38);
    }
    function loop() {
      typeText(() => {
        magic.setAttribute("data-phase", "result");
        setTimeout(loop, 5200);
      });
    }
    if ("IntersectionObserver" in window) {
      let started = false;
      new IntersectionObserver((entries, io) => {
        entries.forEach(e => {
          if (e.isIntersecting && !started) { started = true; loop(); io.disconnect(); }
        });
      }, { threshold: 0.2 }).observe(magic);
    } else { loop(); }
  })();

  // 5. Pricing Toggle
  const btnM = document.getElementById('btnMonthly');
  const btnY = document.getElementById('btnYearly');
  function setPeriod(yearly) {
    if (btnM && btnY) {
      btnM.setAttribute('aria-pressed', yearly ? 'false' : 'true');
      btnY.setAttribute('aria-pressed', yearly ? 'true' : 'false');
    }
    document.querySelectorAll('[data-price]').forEach(el => {
      el.textContent = yearly ? el.getAttribute('data-y') : el.getAttribute('data-m');
    });
    document.querySelectorAll('[data-note]').forEach(el => {
      el.textContent = yearly ? 'dibayar tahunan · Rp 348rb/thn' : 'tagihan per bulan';
    });
    document.querySelectorAll('[data-old]').forEach(el => {
      el.textContent = yearly ? 'Rp 49rb/bln' : ' ';
    });
  }
  if (btnM && btnY) {
    btnM.onclick = () => setPeriod(false);
    btnY.onclick = () => setPeriod(true);
  }

  // 6. FAQ Accordion
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

  // 8. Gallery Lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbTitle = document.getElementById('lbTitle');
  const lbMeta = document.getElementById('lbMeta');
  const lbClose = document.getElementById('lbClose');
  if (lb && lbImg && lbClose) {
    document.querySelectorAll('.g-item').forEach(btn => {
      btn.onclick = () => {
        const img = btn.querySelector('img');
        const parts = (btn.getAttribute('data-cap') || '').split('|');
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbTitle.textContent = parts[0] || '';
        lbMeta.textContent = parts[1] || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
        lbClose.focus();
      };
    });
    function closeLB() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.removeAttribute('src');
    }
    lbClose.onclick = closeLB;
    lb.onclick = e => { if (e.target === lb) closeLB(); };
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && lb.classList.contains('open')) closeLB();
    });
  }
}
