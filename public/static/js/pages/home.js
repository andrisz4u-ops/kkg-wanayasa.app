import { api } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { formatDateTime, escapeHtml } from '../utils.js';

export async function renderHome() {
  let pengumuman = [];
  try {
    const announcementPromise = api('/pengumuman?limit=3', { timeout: 1200 });
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ data: [] }), 450);
    });
    const res = await Promise.race([announcementPromise, timeoutPromise]);
    pengumuman = res.data || [];
  } catch (e) {
    console.log('Pengumuman not loaded quickly, rendering without it');
  }

  const bentoFeatures = [
    {
      id: 'rpp',
      icon: 'fa-magic',
      title: 'AI RPP Generator',
      desc: 'Buat rencana pembelajaran otomatis berbasis kurikulum nasional hanya dalam hitungan detik.',
      size: 'large', // spans 2 cols
      style: 'primary',
    },
    {
      id: 'materi',
      icon: 'fa-book-open',
      title: 'Bank Materi',
      desc: 'Akses ribuan bahan ajar dari guru-guru berprestasi di seluruh gugus.',
      style: 'white',
    },
    {
      id: 'kisi',
      icon: 'fa-clipboard-check',
      title: 'Asesmen Digital',
      desc: 'Kelola ujian dan penilaian murid secara efisien dengan sistem otomatis.',
      style: 'white',
    },
    {
      id: 'forum',
      icon: 'fa-comments',
      title: 'Forum Kolaborasi',
      desc: 'Diskusikan tantangan mengajar dengan rekan sejawat secara real-time.',
      style: 'dark',
    },
    {
      id: 'guru',
      icon: 'fa-users',
      title: 'Direktori Guru',
      desc: 'Terhubung dengan guru profesional dalam satu jaringan terpadu.',
      style: 'white',
    },
  ];

  const schools = [
    'SDN 2 Nangerang', 'SDN 1 Nangerang', 'SDN Nagrog',
    'SDN Raharja', 'SDN 1 Cibuntu', 'SDN 2 Cibuntu',
    'SDN Sumurugul', 'SDN Sakambang', 'SDIT Al-Qalam'
  ];

  return `
    <div class="home-organic relative overflow-x-hidden">
      
      <!-- ============ HERO SECTION ============ -->
      <section class="pl-6 md:pl-10 lg:pl-16 pr-0 pt-12 pb-24 lg:pt-20 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative w-full">
        <!-- Hero Text -->
        <div class="animate-fade-in">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-500 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-[#269494]/20">
            <i class="fas fa-bolt text-[10px]"></i>
            Platform Guru Masa Depan
          </div>
          
          <h2 class="text-4xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
            Portal KKG<br>Gugus
            <span class="text-teal-500"> 3 Wanayasa</span>
          </h2>
          
          <p class="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-lg mb-10">
            Pusat digital kelompok kerja guru gugus 3 Kec. Wanayasa. 
            Dirancang khusus untuk pendidik untuk mengakselerasi kecerdasan, 
            sinkronisasi, dan operasi lintas unit.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 mt-10">
            ${!state.user ? `
              <button onclick="navigate('login')" class="px-10 py-5 bg-teal-500 text-white rounded-full font-bold text-lg hover:bg-teal-600 transition-all shadow-xl shadow-teal-500/30 flex items-center justify-center gap-3 group">
                Masuk / Login
                <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            ` : `
              <button onclick="navigate('absensi')" class="px-10 py-5 bg-teal-500 text-white rounded-full font-bold text-lg hover:bg-teal-600 transition-all shadow-xl shadow-teal-500/30 flex items-center justify-center gap-3 group">
                Buka Dashboard
                <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            `}
            
            <div class="flex items-center gap-4 px-6 py-4 bg-white/80 backdrop-blur-md rounded-full border border-slate-100 shadow-lg">
              <div class="flex -space-x-3">
                ${[1, 2, 3].map(i => `
                  <img src="https://picsum.photos/seed/user${i}/100/100" class="w-10 h-10 rounded-full border-2 border-white object-cover" />
                `).join('')}
              </div>
              <div>
                <div class="font-bold text-slate-900 leading-tight">269k+</div>
                <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Pendidik Terdaftar</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Illustration -->
        <div class="relative animate-scale-in mt-12 lg:mt-0 w-full flex justify-center">
          <!-- Main Illustration Container -->
          <div class="relative z-10 w-full max-w-lg aspect-square bg-teal-500/20 rounded-[60px] flex items-center justify-center p-12 group overflow-hidden" style="clip-path: url(#organic-clip);">
            <div class="absolute inset-0 bg-gradient-to-br from-teal-500/40 to-transparent"></div>
            
            <!-- Floating Card -->
            <div class="relative z-20 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 animate-float">
              <i class="fas fa-book-open text-teal-500 text-7xl mb-6 block"></i>
              <div class="space-y-2">
                <div class="h-2 w-24 bg-slate-100 rounded"></div>
                <div class="h-2 w-16 bg-slate-100 rounded"></div>
              </div>
            </div>

            <!-- Decorative Icons -->
            <div class="absolute top-10 right-10 text-white/50 animate-spin-slow">
              <i class="fas fa-sparkles text-5xl"></i>
            </div>
            
            <div class="absolute bottom-12 left-8 text-white/40 animate-float-reverse">
              <i class="fas fa-users text-4xl"></i>
            </div>

            <div class="absolute -top-4 -left-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-float-slow">
              <i class="fas fa-file-powerpoint text-teal-600 text-2xl"></i>
            </div>
            
            <div class="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-float-slow" style="animation-delay: 1s;">
              <i class="fas fa-clipboard-check text-teal-500 text-2xl"></i>
            </div>
          </div>

          <!-- Background Blob -->
          <div class="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-500/5 rounded-full blur-3xl"></div>
        </div>
      </section>

      <!-- ============ VISI & MISI SECTION ============ -->
      <section class="py-16 lg:py-24 relative z-20">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="text-center mb-16 animate-slide-up">
            <h2 class="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Visi & Misi</h2>
            <div class="h-1 w-20 bg-teal-500 rounded-full mx-auto"></div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
            <!-- Visi Card -->
            <div class="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group animate-slide-up" style="animation-delay: 0.1s;">
              <div class="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>
              <div class="relative z-10 h-full flex flex-col">
                <div class="w-16 h-16 bg-teal-100/50 border border-teal-100 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-teal-100 transition-colors">
                  <i class="fas fa-eye text-3xl text-teal-600"></i>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Visi</h3>
                <p class="text-slate-600 text-xl leading-relaxed font-medium italic">
                  "Mewujudkan guru-guru yang profesional, kompeten, dan berdaya saing tinggi di Gugus 3 Kecamatan Wanayasa melalui kolaborasi dan pengembangan berkelanjutan."
                </p>
              </div>
            </div>

            <!-- Misi Card -->
            <div class="bg-teal-500 rounded-[40px] p-10 shadow-2xl shadow-teal-500/30 text-white hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group animate-slide-up" style="animation-delay: 0.2s;">
              <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700 blur-3xl"></div>
              <div class="relative z-10">
                <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                  <i class="fas fa-bullseye text-3xl text-white"></i>
                </div>
                <h3 class="text-2xl font-bold mb-6 tracking-tight">Misi</h3>
                <ul class="space-y-5">
                  <li class="flex items-start gap-4">
                    <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <i class="fas fa-check text-xs text-white"></i>
                    </div>
                    <span class="text-teal-50 text-lg leading-relaxed font-medium">Meningkatkan kompetensi guru melalui pelatihan dan workshop berkala</span>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <i class="fas fa-check text-xs text-white"></i>
                    </div>
                    <span class="text-teal-50 text-lg leading-relaxed font-medium">Memfasilitasi pertukaran ilmu dan pengalaman antar guru</span>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <i class="fas fa-check text-xs text-white"></i>
                    </div>
                    <span class="text-teal-50 text-lg leading-relaxed font-medium">Mendorong inovasi pembelajaran sesuai Kurikulum Merdeka</span>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <i class="fas fa-check text-xs text-white"></i>
                    </div>
                    <span class="text-teal-50 text-lg leading-relaxed font-medium">Memanfaatkan teknologi digital untuk administrasi pendidikan</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ BENTO FEATURES SECTION ============ -->
      <section class="bg-slate-50 py-24 lg:py-32 border-t border-slate-100 relative">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div class="max-w-xl">
              <h3 class="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">Ekosistem Digital<br>Untuk Guru Hebat</h3>
              <p class="text-slate-600 text-lg leading-relaxed">Berbagai fitur untuk mendukung produktivitas guru dalam satu platform yang terintegrasi.</p>
            </div>
            <button onclick="navigate('materi')" class="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 hover:border-[#269494] hover:text-teal-500 transition-all flex items-center gap-3 shadow-sm self-start">
              Lihat Semua Fitur
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            ${bentoFeatures.map((feature, i) => {
    if (feature.style === 'primary') {
      return `
                  <button onclick="navigate('${feature.id}')" class="md:col-span-2 md:row-span-2 p-8 lg:p-10 bg-teal-500 rounded-[40px] text-white relative overflow-hidden group shadow-2xl shadow-teal-500/20 text-left transition-all hover:-translate-y-1 cursor-pointer border-0">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div class="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                          <i class="fas ${feature.icon} text-3xl"></i>
                        </div>
                        <h4 class="text-3xl lg:text-4xl font-black mb-4">${feature.title}</h4>
                        <p class="text-teal-50 text-lg leading-relaxed max-w-sm">${feature.desc}</p>
                      </div>
                      <div class="mt-8 lg:mt-12 px-8 py-4 bg-white text-teal-600 rounded-2xl font-extrabold text-sm hover:bg-teal-50 shadow-md transition-all inline-flex items-center gap-3 self-start">
                        Coba Sekarang
                        <i class="fas fa-bolt"></i>
                      </div>
                    </div>
                  </button>
                `;
    } else if (feature.style === 'dark') {
      return `
                  <button onclick="navigate('${feature.id}')" class="md:col-span-1 p-8 bg-slate-900 rounded-[40px] text-white shadow-xl shadow-slate-900/10 text-left transition-all hover:-translate-y-1 cursor-pointer border-0">
                    <div class="w-12 h-12 bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center mb-6">
                      <i class="fas ${feature.icon} text-white text-xl"></i>
                    </div>
                    <h4 class="text-xl font-bold mb-3 text-white">${feature.title}</h4>
                    <p class="text-slate-300 text-sm leading-relaxed">${feature.desc}</p>
                  </button>
                `;
    } else {
      return `
                  <button onclick="navigate('${feature.id}')" class="md:col-span-1 p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left hover:-translate-y-1 cursor-pointer group">
                    <div class="w-12 h-12 bg-teal-500/10 border border-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                      <i class="fas ${feature.icon} text-teal-600 text-xl"></i>
                    </div>
                    <h4 class="text-xl font-bold text-slate-800 mb-3">${feature.title}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">${feature.desc}</p>
                  </button>
                `;
    }
  }).join('')}
          </div>
        </div>
      </section>

      <!-- ============ SCHOOLS & STATS SECTION ============ -->
      <section class="py-24 lg:py-32 relative">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <!-- School List Card -->
            <div class="lg:col-span-5">
              <div class="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                <div class="p-6 border-b border-slate-50 flex items-center justify-between bg-teal-500/5">
                  <div class="flex items-center gap-3">
                    <div class="relative flex h-3 w-3">
                      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                    </div>
                    <h3 class="text-base font-extrabold text-slate-900 uppercase tracking-wider">Daftar Sekolah</h3>
                  </div>
                  <span class="text-[10px] font-bold text-teal-500 uppercase tracking-widest bg-teal-500/10 px-3 py-1 rounded-full">G3-WNS</span>
                </div>
                
                <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${schools.map((school, i) => `
                    <div class="group flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-transparent transition-all hover:border-[#269494]/10 hover:bg-teal-500/5 cursor-default">
                      <div class="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-[#269494]/20 group-hover:bg-teal-500/10 transition-all">
                        <i class="fas fa-school text-[10px] text-slate-400 group-hover:text-teal-500 transition-colors"></i>
                      </div>
                      <span class="text-xs font-semibold text-slate-600 group-hover:text-teal-500 transition-colors">${school}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Description & Stats -->
            <div class="lg:col-span-7 lg:pl-8">
              <div class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-teal-500 border border-[#269494]/20 bg-teal-500/5 mb-6">
                <i class="fas fa-globe"></i> 9 Sekolah Terintegrasi
              </div>
              <h2 class="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Pusat Data<br><span class="text-teal-500">Terpadu</span>
              </h2>
              <p class="text-lg text-slate-600 leading-relaxed mb-10">
                Sistem pusat komunikasi dan data operasional yang terintegrasi. 
                Melayani sinkronisasi waktu nyata, distribusi arsip, dan kolaborasi 
                untuk seluruh sekolah di Gugus 3 Kecamatan Wanayasa.
              </p>
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                ${[
      { value: '09', label: 'Sekolah', suffix: '' },
      { value: '50', label: 'Guru', suffix: '+' },
      { value: 'v3', label: 'Versi', suffix: '.1' },
      { value: '99', label: 'Uptime', suffix: '%' },
    ].map(stat => `
                  <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
                    <div class="font-extrabold text-3xl text-slate-900 tracking-tighter">
                      ${stat.value}<span class="text-lg text-teal-500">${stat.suffix}</span>
                    </div>
                    <div class="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-teal-500 transition-colors">${stat.label}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ PENGUMUMAN SECTION ============ -->
      <section class="bg-slate-50 border-t border-slate-100 py-24 lg:py-32">
        <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="h-1 w-8 bg-teal-500 rounded-full"></div>
                <span class="text-xs font-bold uppercase tracking-widest text-teal-500">Informasi Terbaru</span>
              </div>
              <h2 class="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Papan Pengumuman</h2>
            </div>
            <button onclick="navigate('pengumuman')" class="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 hover:border-[#269494] hover:text-teal-500 transition-all flex items-center gap-3 shadow-sm self-start">
              Lihat Semua
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>

          <div class="grid gap-6 md:grid-cols-3">
            ${pengumuman.length > 0 ? pengumuman.map((p, i) => `
              <button onclick="navigate('pengumuman')" class="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[40px] bg-[rgba(38,148,148,0.03)] border border-[rgba(38,148,148,0.1)] shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(38,148,148,0.15)] hover:bg-[rgba(38,148,148,0.05)] text-left">
                <div class="flex flex-1 flex-col p-8">
                  <div class="mb-6 flex items-center justify-between">
                    <span class="rounded-full bg-teal-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-600 border border-teal-500/20">
                      ${escapeHtml(p.kategori || 'Umum')}
                    </span>
                    ${p.is_pinned ? '<i class="fas fa-thumbtack text-xs text-teal-500"></i>' : ''}
                  </div>

                  <h3 class="mb-4 text-xl font-bold text-teal-900 group-hover:text-teal-600 transition-colors leading-snug">${escapeHtml(p.judul)}</h3>
                  <p class="mb-8 line-clamp-3 flex-1 text-sm text-slate-600 leading-relaxed">${escapeHtml((p.isi || '').substring(0, 120))}...</p>

                  <div class="mt-auto flex items-center pt-6 text-xs font-bold text-teal-500/80 border-t border-teal-500/10">
                    <i class="far fa-clock mr-2"></i> ${formatDateTime(p.created_at)}
                  </div>
                </div>
                ${p.is_pinned ? '<div class="h-1.5 w-full bg-gradient-to-r from-teal-500 to-teal-400"></div>' : '<div class="h-1.5 w-full bg-teal-500/10 group-hover:bg-teal-500/30 transition-colors"></div>'}
              </button>
            `).join('') : `
              <div class="col-span-full rounded-[40px] border border-dashed border-teal-500/20 bg-teal-500/5 py-24 text-center">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-500/10 mb-6 border border-teal-500/20 shadow-sm">
                  <i class="fas fa-bullhorn text-2xl text-teal-500"></i>
                </div>
                <p class="text-sm text-teal-700 font-bold">Belum ada pengumuman saat ini.</p>
              </div>
            `}
          </div>
        </div>
      </section>

      <!-- ============ FOOTER ============ -->
      <footer class="bg-white border-t border-slate-100 px-6 py-12">
        <div class="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <i class="fas fa-graduation-cap text-white text-sm"></i>
            </div>
            <div>
              <div class="text-sm font-extrabold text-slate-900 tracking-tight">KKG Gugus 3 Wanayasa</div>
              <p class="text-[10px] text-slate-400 font-medium tracking-wide">Kec. Wanayasa, Kab. Purwakarta &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `;
}
