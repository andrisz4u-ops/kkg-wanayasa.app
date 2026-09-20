// public/static/js/pages/program-sekolah/renderers.js

/**
 * Render the complete Program Sekolah canvas preview
 * @param {Object} data - Program data object
 * @param {string} activeTab - 'all' | 'cover' | 'bab' | 'lampiran'
 */
export function renderProgramCanvas(data, activeTab = 'all') {
  if (!data || !data.metadata) {
    return `<div class="p-12 text-center text-slate-400">
      <i class="fa-solid fa-file-circle-question text-4xl mb-3 text-slate-300"></i>
      <p>Data program sekolah belum tersedia.</p>
    </div>`;
  }

  const meta = data.metadata || {};
  const kota = meta.kota || 'Purwakarta';
  const tahun = meta.tahun_ajaran ? meta.tahun_ajaran.split('/')[0] : '2025';

  return `
    <div class="program-document-wrapper bg-white shadow-xl border border-slate-200/90 rounded-2xl overflow-hidden print:border-0 print:shadow-none">
      
      <!-- Toolbar Navigation Tabs (Interactive Switcher) -->
      <div class="no-print bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          <button type="button" onclick="window.switchProgramTab('all')" 
            class="px-3.5 py-1.5 rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
            <i class="fa-solid fa-book-open mr-1.5"></i>Dokumen Lengkap
          </button>
          <button type="button" onclick="window.switchProgramTab('cover')" 
            class="px-3.5 py-1.5 rounded-lg transition-all ${activeTab === 'cover' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
            <i class="fa-solid fa-id-card mr-1.5"></i>Cover & Pengesahan
          </button>
          <button type="button" onclick="window.switchProgramTab('bab')" 
            class="px-3.5 py-1.5 rounded-lg transition-all ${activeTab === 'bab' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
            <i class="fa-solid fa-align-left mr-1.5"></i>BAB I - V
          </button>
          <button type="button" onclick="window.switchProgramTab('lampiran')" 
            class="px-3.5 py-1.5 rounded-lg transition-all ${activeTab === 'lampiran' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
            <i class="fa-solid fa-paperclip mr-1.5"></i>Lampiran & Jurnal
          </button>
        </div>

        <div class="flex items-center gap-2 text-xs font-medium">
          <button type="button" onclick="window.downloadProgramLampiranOnlyDocx && window.downloadProgramLampiranOnlyDocx()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Unduh khusus Lembar Refleksi Murid & Rubrik Asesmen (DOCX) terpisah siap cetak/fotokopi">
            <i class="fa-solid fa-clipboard-check text-teal-600"></i>
            <span>Cetak Refleksi & Rubrik (DOCX)</span>
          </button>
          <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md border border-emerald-200">
            <i class="fa-solid fa-pen-to-square"></i> Live Editable: Klik teks untuk mengedit langsung
          </span>
        </div>
      </div>

      <!-- Canvas Body (A4 Paper emulation with serif typography & justified alignment) -->
      <div id="program-canvas-content" class="p-8 sm:p-14 font-serif text-slate-900 leading-relaxed text-[14px] bg-white min-h-screen select-text" 
           style="font-family: 'Times New Roman', Times, serif;">
        
        ${(activeTab === 'all' || activeTab === 'cover') ? renderCoverSection(meta, kota, tahun) : ''}
        ${(activeTab === 'all' || activeTab === 'cover') ? renderPengesahanSection(meta, kota, tahun) : ''}
        ${(activeTab === 'all' || activeTab === 'cover') ? renderKataPengantar(meta, kota, tahun) : ''}
        ${(activeTab === 'all' || activeTab === 'cover') ? renderDaftarIsi(meta) : ''}

        ${(activeTab === 'all' || activeTab === 'bab') ? renderBab1(data.bab_1_pendahuluan) : ''}
        ${(activeTab === 'all' || activeTab === 'bab') ? renderBab2(data.bab_2_kajian_konseptual) : ''}
        ${(activeTab === 'all' || activeTab === 'bab') ? renderBab3(data.bab_3_rencana_program, meta, data) : ''}
        ${(activeTab === 'all' || activeTab === 'bab') ? renderBab4(data.bab_4_monitoring_evaluasi) : ''}
        ${(activeTab === 'all' || activeTab === 'bab') ? renderBab5(data.bab_5_penutup) : ''}

        ${(activeTab === 'all' || activeTab === 'lampiran') ? renderLampiran(data, meta, tahun) : ''}

      </div>
    </div>
  `;
}

// 1. COVER SECTION (SESUAI REQUEST USER: TANPA KOP SEKOLAH, CUKUP TULISAN "COVER" DENGAN HURUF BESAR)
function renderCoverSection(meta, kota, tahun) {
  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="text-center max-w-2xl mx-auto pt-6 pb-8">
        
        <!-- Tulisan COVER Huruf Besar (Sesuai Permintaan Spesifik User) -->
        <div class="mb-8">
          <span class="inline-block tracking-[0.35em] text-3xl sm:text-4xl font-black text-slate-900 uppercase border-b-4 border-slate-900 pb-2 px-6">
            COVER
          </span>
        </div>

        <div class="h-10"></div>

        <!-- Judul Program -->
        <h1 contenteditable="true" data-path="metadata.judul_program" 
            class="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-slate-900 mb-4 leading-snug hover:bg-amber-50/70 p-2 rounded transition-colors">
          ${meta.judul_program || 'PROGRAM KERJA KOKURIKULER PENGUATAN 8 DIMENSI PROFIL LULUSAN'}
        </h1>

        <!-- Subjudul -->
        <p contenteditable="true" data-path="metadata.subjudul" 
           class="text-base sm:text-lg font-medium text-slate-700 italic mb-6 leading-relaxed hover:bg-amber-50/70 p-2 rounded transition-colors">
          ${meta.subjudul || 'Panduan Operasional Penumbuhan Karakter dan Budaya Positif Satuan Pendidikan'}
        </p>

        <!-- Tahun Ajaran -->
        <p class="text-lg font-bold text-slate-900 uppercase tracking-wider mb-3">
          TAHUN AJARAN ${meta.tahun_ajaran || '2025/2026'}
        </p>

        <!-- Fase / Jenjang Sasaran Badge (Jika Tersedia) -->
        ${meta.fase_jenjang ? `
          <div class="mb-10">
            <span class="inline-block bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full border border-slate-300 tracking-wide uppercase">
              Sasaran: ${meta.fase_jenjang}
            </span>
          </div>
        ` : '<div class="h-10"></div>'}

        <div class="h-10"></div>

        <!-- Penyusun Block -->
        <div class="mb-14">
          <p class="text-sm uppercase tracking-widest text-slate-600 mb-2">Disusun Oleh:</p>
          <p contenteditable="true" data-path="metadata.penyusun" class="text-lg font-bold text-slate-900 hover:bg-amber-50/70 p-1 rounded inline-block">
            ${meta.penyusun || 'Tim Pengembang Kurikulum'}
          </p>
          ${meta.nip_penyusun ? `
            <p class="text-sm text-slate-700">NIP. ${meta.nip_penyusun}</p>
          ` : ''}
        </div>

        <div class="h-12"></div>

        <!-- Satuan Pendidikan & Instansi -->
        <div class="space-y-1 text-slate-900">
          <p contenteditable="true" data-path="metadata.nama_sekolah" class="text-xl font-bold uppercase hover:bg-amber-50/70 p-1 rounded inline-block">
            ${meta.nama_sekolah || 'SD NEGERI KABUPATEN PURWAKARTA'}
          </p>
          <p class="text-base font-semibold uppercase">
            DINAS PENDIDIKAN KABUPATEN ${kota.toUpperCase()}
          </p>
          <p class="text-base font-bold">
            TAHUN ${tahun}
          </p>
        </div>

      </div>
    </div>
  `;
}

// 2. LEMBAR PENGESAHAN
function renderPengesahanSection(meta, kota, tahun) {
  const ksName = meta.kepala_sekolah || '...........................................';
  const ksNip = meta.nip_kepala_sekolah ? `NIP. ${meta.nip_kepala_sekolah}` : 'NIP. .....................................';
  const penName = meta.penyusun || '...........................................';
  const penNip = meta.nip_penyusun ? `NIP. ${meta.nip_penyusun}` : 'NIP. .....................................';
  const pengawasName = meta.pengawas && meta.pengawas.trim() ? meta.pengawas : '...........................................';
  const pengawasNip = meta.nip_pengawas ? `NIP. ${meta.nip_pengawas}` : 'NIP. .....................................';

  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="text-center mb-8">
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">LEMBAR PENGESAHAN</h2>
        <h3 class="text-base font-semibold uppercase text-slate-800 mt-1">${meta.judul_program || 'PROGRAM KERJA SEKOLAH'}</h3>
      </div>

      <p class="text-justify text-base leading-relaxed mb-6 indent-10">
        Dokumen <strong>${meta.judul_program || 'Program Kerja'}</strong> Tahun Ajaran ${meta.tahun_ajaran || '2025/2026'} ini telah disusun dan disepakati bersama oleh tim pengembang kurikulum dan segenap pendidik, serta diperiksa dan disahkan untuk diberlakukan secara resmi di ${meta.nama_sekolah || 'satuan pendidikan'}.
      </p>

      <div class="text-right text-sm mb-8 text-slate-800">
        <p>Ditetapkan di : ${kota}</p>
        <p>Pada tanggal : ${meta.tanggal_pengesahan || `Juli ${tahun}`}</p>
      </div>

      ${meta.opsi_pengesahan === 'internal' ? `
        <!-- 2 Kolom Tanda Tangan Internal Satuan Pendidikan -->
        <div class="grid grid-cols-2 gap-8 text-center text-sm pt-4">
          <div>
            <p class="font-medium text-slate-700 mb-20">Penyusun / Koordinator Program,<br>${meta.jabatan_penyusun || 'Pendidik'}</p>
            <p class="font-bold underline text-slate-900">${penName}</p>
            <p class="text-xs text-slate-600">${penNip}</p>
          </div>

          <div>
            <p class="font-medium text-slate-700 mb-20">Mengesahkan,<br>Kepala ${meta.nama_sekolah || 'Sekolah'}</p>
            <p class="font-bold underline text-slate-900">${ksName}</p>
            <p class="text-xs text-slate-600">${ksNip}</p>
          </div>
        </div>
      ` : `
        <!-- 4 Kolom Tanda Tangan Kedinasan Lengkap -->
        <div class="grid grid-cols-2 gap-8 text-center text-sm pt-4">
          <div>
            <p class="font-medium text-slate-700 mb-20">Menyetujui,<br>Ketua Komite Sekolah</p>
            <p class="font-bold underline text-slate-900">${meta.komite_sekolah || '...........................................'}</p>
          </div>

          <div>
            <p class="font-medium text-slate-700 mb-20">Penyusun / Koordinator Program,<br>${meta.jabatan_penyusun || 'Pendidik'}</p>
            <p class="font-bold underline text-slate-900">${penName}</p>
            <p class="text-xs text-slate-600">${penNip}</p>
          </div>

          <div class="pt-8">
            <p class="font-medium text-slate-700 mb-20">Mengetahui,<br>Pengawas Pembina</p>
            <p class="font-bold underline text-slate-900">${pengawasName}</p>
            <p class="text-xs text-slate-600">${pengawasNip}</p>
          </div>

          <div class="pt-8">
            <p class="font-medium text-slate-700 mb-20">Mengesahkan,<br>Kepala ${meta.nama_sekolah || 'Sekolah'}</p>
            <p class="font-bold underline text-slate-900">${ksName}</p>
            <p class="text-xs text-slate-600">${ksNip}</p>
          </div>
        </div>
      `}
    </div>
  `;
}

// 3. KATA PENGANTAR
function renderKataPengantar(meta, kota, tahun) {
  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="text-center mb-8">
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">KATA PENGANTAR</h2>
      </div>

      <div class="space-y-4 text-justify text-base leading-relaxed">
        <p class="indent-10">
          Puji dan syukur senantiasa kita panjatkan ke hadirat Allah SWT, Tuhan Yang Maha Kuasa, atas limpahan rahmat, taufik, dan karunia-Nya sehingga penyusunan Dokumen <strong>${meta.judul_program || 'Program Kerja'}</strong> Tahun Ajaran ${meta.tahun_ajaran || '2025/2026'} ini dapat diselesaikan dengan baik dan terencana.
        </p>
        <p class="indent-10">
          Dokumen program ini disusun sebagai pedoman operasional terpadu dalam menumbuhkembangkan pembiasaan positif, karakter unggul, serta ketercapaian kompetensi esensial murid. Muatan di dalamnya disusun secara berjenjang, memadukan landasan yuridis formal, kajian teoritis, matriks aksi nyata 12 bulan, hingga sistem evaluasi berkelanjutan.
        </p>
        <p class="indent-10">
          Ucapan terima kasih dan apresiasi kami sampaikan kepada Kepala Sekolah, dewan guru, pengawas pembina, komite sekolah, dan segenap orang tua wali murid yang senantiasa berkolaborasi menyukseskan program ini.
        </p>
        <p class="indent-10">
          Kami menyadari keterbatasan dalam penyusunan ini. Kritik dan saran konstruktif sangat diharapkan demi penyempurnaan program kerja di masa mendatang.
        </p>
      </div>

      <div class="text-right text-sm pt-8 text-slate-800">
        <p>${kota}, Juli ${tahun}</p>
        <p class="font-bold mt-2">Tim Penyusun</p>
      </div>
    </div>
  `;
}

// 4. DAFTAR ISI
function renderDaftarIsi(meta = {}) {
  const isKaldik = meta?.template_id === 'kalender-sekolah';
  const lampiran2Title = isKaldik
    ? '    Lampiran 2: Matriks Rincian Pekan Efektif (RPE) 12 Bulan'
    : '    Lampiran 2: Matriks Rencana Aksi 12 Bulan Terinci';
  const lampiran3Title = isKaldik
    ? '    Lampiran 3: Jadwal PHBI & Kegiatan Karakter Purwakarta'
    : '    Lampiran 3: Format Instrumen & Jurnal Siswa';

  const items = [
    { title: 'HALAMAN COVER', page: 'i' },
    { title: 'LEMBAR PENGESAHAN', page: 'ii' },
    { title: 'KATA PENGANTAR', page: 'iii' },
    { title: 'DAFTAR ISI', page: 'iv' },
    { title: 'BAB I PENDAHULUAN', page: '1', bold: true },
    { title: '    A. Latar Belakang', page: '1' },
    { title: '    B. Dasar Hukum', page: '2' },
    { title: '    C. Tujuan Program', page: '3' },
    { title: '    D. Sasaran dan Ruang Lingkup', page: '3' },
    { title: '    E. Manfaat Program', page: '4' },
    { title: 'BAB II KAJIAN KONSEPTUAL DAN LANDASAN TEORITIS', page: '5', bold: true },
    { title: 'BAB III RENCANA PROGRAM DAN STRATEGI PELAKSANAAN', page: '7', bold: true },
    { title: isKaldik ? '    A. Kalender Satuan Pendidikan & Agenda Kegiatan' : '    A. Rincian Kegiatan dan Aksi Nyata', page: '7' },
    { title: '    B. Struktur Organisasi dan Tim Pelaksana', page: '9' },
    { title: isKaldik ? '    C. Matriks Rincian Pekan & Hari Efektif Belajar (RPE)' : '    C. Matriks Rencana Aksi (Action Plan 12 Bulan)', page: '10' },
    { title: '    D. Dukungan Sarana, Prasarana, dan Anggaran', page: '11' },
    { title: 'BAB IV MONITORING, EVALUASI, DAN TINDAK LANJUT', page: '12', bold: true },
    { title: '    A. Mekanisme Pemantauan Program', page: '12' },
    { title: '    B. Indikator Ketercapaian', page: '13' },
    { title: '    C. Sistem Evaluasi dan Refleksi', page: '13' },
    { title: '    D. Tindak Lanjut dan Sistem Apresiasi', page: '14' },
    { title: 'BAB V PENUTUP', page: '15', bold: true },
    { title: '    A. Kesimpulan', page: '15' },
    { title: '    B. Saran dan Rekomendasi', page: '15' },
    { title: 'LAMPIRAN-LAMPIRAN (TERINTEGRASI 1 FILE)', page: '16', bold: true },
    { title: '    Lampiran 1: Surat Keputusan (SK) Tim Pelaksana', page: '16' },
    { title: lampiran2Title, page: '17' },
    { title: lampiran3Title, page: '18' },
  ];

  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="text-center mb-8">
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">DAFTAR ISI</h2>
      </div>

      <div class="space-y-1.5 text-sm max-w-xl mx-auto">
        ${items.map(it => `
          <div class="flex items-center justify-between ${it.bold ? 'font-bold text-slate-900 mt-2' : 'text-slate-700'}">
            <span class="truncate pr-2">${it.title}</span>
            <span class="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
            <span class="font-mono text-xs">${it.page}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 5. BAB I PENDAHULUAN
function renderBab1(b1 = {}) {
  const latar = Array.isArray(b1.latar_belakang) ? b1.latar_belakang : [b1.latar_belakang];
  const dasar = Array.isArray(b1.dasar_hukum) ? b1.dasar_hukum : [];
  const tujuan = Array.isArray(b1.tujuan) ? b1.tujuan : [];
  const sasaran = Array.isArray(b1.sasaran) ? b1.sasaran : [b1.sasaran];
  const manfaat = Array.isArray(b1.manfaat) ? b1.manfaat : [];

  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="relative text-center mb-8">
        <div class="no-print absolute right-0 top-0">
          <button type="button" onclick="window.regenerateProgramSection && window.regenerateProgramSection('bab1')" 
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-sans font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            title="Generate ulang Bab I secara mendalam dengan AI">
            <i class="fa-solid fa-arrows-rotate text-indigo-500"></i>
            <span>Regenerate Bab I</span>
          </button>
        </div>
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">BAB I</h2>
        <h3 class="text-lg font-bold uppercase tracking-wide text-slate-900">PENDAHULUAN</h3>
      </div>

      <!-- A. Latar Belakang -->
      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">A. Latar Belakang</h4>
        <div class="space-y-3 text-justify leading-relaxed">
          ${latar.map(p => `<p class="indent-10">${p || ''}</p>`).join('')}
        </div>
      </div>

      <!-- B. Dasar Hukum -->
      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">B. Dasar Hukum</h4>
        <ol class="list-decimal list-outside pl-6 space-y-1.5 text-justify leading-relaxed">
          ${dasar.map(d => `<li>${d}</li>`).join('')}
        </ol>
      </div>

      <!-- C. Tujuan Program -->
      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">C. Tujuan Program</h4>
        <ol class="list-decimal list-outside pl-6 space-y-1.5 text-justify leading-relaxed">
          ${tujuan.map(t => `<li>${t}</li>`).join('')}
        </ol>
      </div>

      <!-- D. Sasaran dan Ruang Lingkup -->
      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">D. Sasaran dan Ruang Lingkup</h4>
        <div class="space-y-2 text-justify leading-relaxed">
          ${sasaran.map(s => `<p class="indent-10">${s || ''}</p>`).join('')}
        </div>
      </div>

      <!-- E. Manfaat Program -->
      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">E. Manfaat Program</h4>
        <ol class="list-decimal list-outside pl-6 space-y-1.5 text-justify leading-relaxed">
          ${manfaat.map(m => `<li>${m}</li>`).join('')}
        </ol>
      </div>

    </div>
  `;
}

// 6. BAB II KAJIAN KONSEPTUAL
function renderBab2(b2 = {}) {
  const judulBab = b2.judul_bab || 'KAJIAN KONSEPTUAL DAN LANDASAN TEORITIS';
  const subBab = Array.isArray(b2.sub_bab) ? b2.sub_bab : [];
  const isiP = Array.isArray(b2.isi) ? b2.isi : (b2.isi ? [b2.isi] : []);

  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="relative text-center mb-8">
        <div class="no-print absolute right-0 top-0">
          <button type="button" onclick="window.regenerateProgramSection && window.regenerateProgramSection('bab2')" 
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-sans font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            title="Generate ulang Bab II secara mendalam dengan AI">
            <i class="fa-solid fa-arrows-rotate text-indigo-500"></i>
            <span>Regenerate Bab II</span>
          </button>
        </div>
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">BAB II</h2>
        <h3 class="text-lg font-bold uppercase tracking-wide text-slate-900">${judulBab}</h3>
      </div>

      ${subBab.length > 0 ? subBab.map((sb, idx) => {
        const char = String.fromCharCode(65 + idx);
        const subIsi = Array.isArray(sb.isi) ? sb.isi : [sb.isi];
        return `
          <div class="mb-6">
            <h4 class="font-bold text-base text-slate-900 mb-2">${char}. ${sb.judul}</h4>
            <div class="space-y-3 text-justify leading-relaxed">
              ${subIsi.map(p => `<p class="indent-10">${p || ''}</p>`).join('')}
            </div>
          </div>
        `;
      }).join('') : `
        <div class="space-y-3 text-justify leading-relaxed">
          ${isiP.map(p => `<p class="indent-10">${p || ''}</p>`).join('')}
        </div>
      `}
    </div>
  `;
}

// 7. BAB III RENCANA PROGRAM DAN MEKANISME PELAKSANAAN
function renderBab3(b3 = {}) {
  const kegiatan = Array.isArray(b3.kegiatan) ? b3.kegiatan : [];
  const tim = Array.isArray(b3.tim_pelaksana) ? b3.tim_pelaksana : [];
  const actionPlan = Array.isArray(b3.action_plan) ? b3.action_plan : [];
  const sarana = Array.isArray(b3.sarana_anggaran) ? b3.sarana_anggaran : [b3.sarana_anggaran];

  const monthLabels = ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="relative text-center mb-8">
        <div class="no-print absolute right-0 top-0">
          <button type="button" onclick="window.regenerateProgramSection && window.regenerateProgramSection('bab3')" 
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-sans font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            title="Generate ulang Bab III (Kegiatan, Tim, Matriks & RAB) secara mendalam dengan AI">
            <i class="fa-solid fa-arrows-rotate text-indigo-500"></i>
            <span>Regenerate Bab III</span>
          </button>
        </div>
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">BAB III</h2>
        <h3 class="text-lg font-bold uppercase tracking-wide text-slate-900">RENCANA PROGRAM DAN STRATEGI PELAKSANAAN</h3>
      </div>

      <!-- A. Rincian Kegiatan -->
      <div class="mb-8">
        <h4 class="font-bold text-base text-slate-900 mb-3">A. Rincian Kegiatan dan Aksi Nyata</h4>
        <div class="space-y-4">
          ${kegiatan.map((kg, i) => `
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-sm">
              <h5 class="font-bold text-slate-900 mb-1 text-[15px]">${i + 1}. ${kg.nama}</h5>
              ${kg.deskripsi ? `<p class="text-slate-700 text-justify mb-2 indent-6">${kg.deskripsi}</p>` : ''}
              ${Array.isArray(kg.tahapan) && kg.tahapan.length > 0 ? `
                <div class="mb-2.5 pl-3 py-1 border-l-2 border-indigo-400 bg-indigo-50/40 rounded-r-lg space-y-1 text-xs text-slate-700">
                  <div class="font-bold text-indigo-900">Tahapan Aksi Nyata:</div>
                  ${kg.tahapan.map(th => `<div class="leading-snug">• ${th}</div>`).join('')}
                </div>
              ` : ''}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 pt-1 border-t border-slate-200">
                ${kg.tujuan ? `<div><strong>Tujuan:</strong> ${kg.tujuan}</div>` : ''}
                ${kg.waktu ? `<div><strong>Waktu:</strong> ${kg.waktu}</div>` : ''}
                ${kg.sasaran ? `<div><strong>Sasaran:</strong> ${kg.sasaran}</div>` : ''}
                ${kg.pic ? `<div><strong>PIC:</strong> ${kg.pic}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- B. Tim Pelaksana Table -->
      <div class="mb-8">
        <h4 class="font-bold text-base text-slate-900 mb-3">B. Struktur Organisasi dan Tim Pelaksana</h4>
        <p class="text-justify text-sm mb-3">Struktur dan rincian tugas tim pelaksana program adalah sebagai berikut:</p>
        
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border border-slate-300 border-collapse">
            <thead class="bg-slate-100 uppercase font-bold text-slate-700 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-10 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Jabatan dalam Tim</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Nama Pelaksana</th>
                <th class="p-2">Tugas Pokok</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${tim.map((t, idx) => `
                <tr class="hover:bg-slate-50/60">
                  <td class="p-2 border-r border-slate-300 text-center font-mono">${t.no || idx + 1}</td>
                  <td class="p-2 border-r border-slate-300 font-bold text-slate-900">${t.jabatan}</td>
                  <td class="p-2 border-r border-slate-300 text-slate-800">${t.nama}</td>
                  <td class="p-2 text-justify text-slate-700 leading-snug">${t.tugas}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- C. Matriks Rencana Aksi (Action Plan 12 Bulan) -->
      <div class="mb-8">
        <h4 class="font-bold text-base text-slate-900 mb-3">C. Matriks Rencana Aksi (Action Plan 12 Bulan)</h4>
        <p class="text-justify text-sm mb-3">Peta sebaran kegiatan program kerja selama 12 bulan (Tahun Ajaran):</p>
        
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border border-slate-300 border-collapse">
            <thead class="bg-slate-100 uppercase font-bold text-slate-700 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center" rowspan="2">No</th>
                <th class="p-2 border-r border-slate-300 w-1/3" rowspan="2">Nama Kegiatan</th>
                <th class="p-1 border-b border-slate-300 text-center" colspan="12">Bulan Pelaksanaan</th>
                <th class="p-2 border-l border-slate-300 w-24 text-center" rowspan="2">PIC</th>
              </tr>
              <tr class="text-[10px] bg-slate-200/70 text-slate-700">
                ${monthLabels.map(m => `<th class="p-1 text-center border-r border-slate-300 w-6">${m}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${actionPlan.map((ap, idx) => {
                const bArr = Array.isArray(ap.bulan) ? ap.bulan : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                return `
                  <tr class="hover:bg-slate-50/60">
                    <td class="p-1.5 border-r border-slate-300 text-center font-mono">${ap.no || idx + 1}</td>
                    <td class="p-1.5 border-r border-slate-300 font-medium text-slate-800">${ap.kegiatan}</td>
                    ${monthLabels.map((_, mIdx) => {
                      const isAct = bArr.includes(mIdx + 1) || bArr.includes(mIdx + 7) || bArr.length === 12;
                      return `
                        <td class="p-1 border-r border-slate-300 text-center ${isAct ? 'bg-indigo-50 font-bold text-indigo-700' : ''}">
                          ${isAct ? '✓' : ''}
                        </td>
                      `;
                    }).join('')}
                    <td class="p-1.5 text-center text-[11px] text-slate-600 font-medium">${ap.pic || 'Tim'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- D. Dukungan Sarana & Anggaran -->
      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">D. Dukungan Sarana, Prasarana, dan Anggaran</h4>
        <div class="space-y-3 text-justify leading-relaxed mb-4">
          ${sarana.map(p => `<p class="indent-10">${p || ''}</p>`).join('')}
        </div>

        ${Array.isArray(b3.tabel_anggaran) && b3.tabel_anggaran.length > 0 ? (() => {
          let calculatedTotal = 0;
          b3.tabel_anggaran.forEach(item => {
            if (item && item.total) {
              const num = parseInt(String(item.total).replace(/[^0-9]/g, ''), 10);
              if (!isNaN(num)) calculatedTotal += num;
            }
          });
          const displayTotal = b3.total_anggaran || (calculatedTotal > 0 ? 'Rp ' + calculatedTotal.toLocaleString('id-ID') : '-');

          return `
          <div class="mt-4">
            <h5 class="font-bold text-sm text-slate-800 mb-2">Estimasi Rencana Anggaran Biaya (RAB) Program:</h5>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border border-slate-300 border-collapse">
                <thead class="bg-slate-100 uppercase font-bold text-slate-700 border-b border-slate-300">
                  <tr>
                    <th class="p-2 border-r border-slate-300 w-10 text-center">No</th>
                    <th class="p-2 border-r border-slate-300">Uraian Kebutuhan / Kegiatan</th>
                    <th class="p-2 border-r border-slate-300 w-16 text-center">Vol</th>
                    <th class="p-2 border-r border-slate-300 w-20 text-center">Satuan</th>
                    <th class="p-2 border-r border-slate-300 w-28 text-right">Estimasi Biaya</th>
                    <th class="p-2 w-24 text-center">Sumber</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  ${b3.tabel_anggaran.map((item, idx) => `
                    <tr class="hover:bg-slate-50/60">
                      <td class="p-2 border-r border-slate-300 text-center font-mono">${item.no || idx + 1}</td>
                      <td class="p-2 border-r border-slate-300 font-medium text-slate-800">${item.uraian}</td>
                      <td class="p-2 border-r border-slate-300 text-center">${item.volume}</td>
                      <td class="p-2 border-r border-slate-300 text-center">${item.satuan}</td>
                      <td class="p-2 border-r border-slate-300 text-right font-bold text-slate-900">${item.total}</td>
                      <td class="p-2 text-center text-slate-600">${item.sumber}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot class="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colspan="4" class="p-2 text-right border-r border-slate-300 uppercase tracking-wider text-slate-800 font-bold">
                      TOTAL ESTIMASI ANGGARAN:
                    </td>
                    <td class="p-2 text-right border-r border-slate-300 text-indigo-900 font-black text-[13px]">
                      ${displayTotal}
                    </td>
                    <td class="p-2 text-center text-slate-600 text-[11px] font-medium">
                      BOSP / Swadaya
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          `;
        })() : ''}
      </div>

    </div>
  `;
}

// 8. BAB IV MONITORING, EVALUASI, DAN TINDAK LANJUT
function renderBab4(b4 = {}) {
  const mekanisme = Array.isArray(b4.mekanisme) ? b4.mekanisme : [b4.mekanisme];
  const indikator = Array.isArray(b4.indikator) ? b4.indikator : [];
  const evaluasi = Array.isArray(b4.evaluasi) ? b4.evaluasi : [b4.evaluasi];
  const tindakLanjut = Array.isArray(b4.tindak_lanjut) ? b4.tindak_lanjut : [b4.tindak_lanjut];

  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="relative text-center mb-8">
        <div class="no-print absolute right-0 top-0">
          <button type="button" onclick="window.regenerateProgramSection && window.regenerateProgramSection('bab4_5')" 
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-sans font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            title="Generate ulang Bab IV (Monev) & Bab V (Penutup) secara mendalam dengan AI">
            <i class="fa-solid fa-arrows-rotate text-indigo-500"></i>
            <span>Regenerate Bab IV & V</span>
          </button>
        </div>
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">BAB IV</h2>
        <h3 class="text-lg font-bold uppercase tracking-wide text-slate-900">MONITORING, EVALUASI, DAN TINDAK LANJUT</h3>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">A. Mekanisme Pemantauan Program</h4>
        <div class="space-y-3 text-justify leading-relaxed">
          ${mekanisme.map(m => `<p class="indent-10">${m || ''}</p>`).join('')}
        </div>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">B. Indikator Keberhasilan</h4>
        <ol class="list-decimal list-outside pl-6 space-y-2 text-justify leading-relaxed">
          ${indikator.map(ind => {
            const raw = String(ind || '');
            const hasCategory = raw.includes(':');
            if (hasCategory) {
              const colonIdx = raw.indexOf(':');
              const prefix = raw.slice(0, colonIdx).trim();
              const rest = raw.slice(colonIdx + 1).trim();
              return `<li><strong class="text-slate-900">${prefix}:</strong> ${rest}</li>`;
            }
            return `<li>${raw}</li>`;
          }).join('')}
        </ol>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">C. Sistem Evaluasi dan Refleksi Berkala</h4>
        <div class="space-y-3 text-justify leading-relaxed">
          ${evaluasi.map(e => `<p class="indent-10">${e || ''}</p>`).join('')}
        </div>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">D. Tindak Lanjut dan Sistem Apresiasi</h4>
        <div class="space-y-3 text-justify leading-relaxed">
          ${tindakLanjut.map(tl => {
            const raw = String(tl || '');
            const hasCategory = raw.includes(':');
            if (hasCategory) {
              const colonIdx = raw.indexOf(':');
              const prefix = raw.slice(0, colonIdx).trim();
              const rest = raw.slice(colonIdx + 1).trim();
              return `<p class="indent-10"><strong class="text-slate-900">${prefix}:</strong> ${rest}</p>`;
            }
            return `<p class="indent-10">${raw}</p>`;
          }).join('')}
        </div>
      </div>

    </div>
  `;
}

// 9. BAB V PENUTUP
function renderBab5(b5 = {}) {
  const kesimpulan = Array.isArray(b5.kesimpulan) ? b5.kesimpulan : [b5.kesimpulan];
  const saran = Array.isArray(b5.saran) ? b5.saran : [];

  return `
    <div class="program-page-sheet border-b-2 border-dashed border-slate-300 pb-16 mb-16 print:border-0 print:pb-0 print:mb-0 print:break-after-page">
      <div class="text-center mb-8">
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">BAB V</h2>
        <h3 class="text-lg font-bold uppercase tracking-wide text-slate-900">PENUTUP</h3>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">A. Kesimpulan</h4>
        <div class="space-y-3 text-justify leading-relaxed">
          ${kesimpulan.map(k => `<p class="indent-10">${k || ''}</p>`).join('')}
        </div>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-base text-slate-900 mb-2">B. Saran dan Rekomendasi</h4>
        <ol class="list-decimal list-outside pl-6 space-y-1.5 text-justify leading-relaxed">
          ${saran.map(s => `<li>${s}</li>`).join('')}
        </ol>
      </div>

    </div>
  `;
}

// 10. LAMPIRAN-LAMPIRAN (SESUAI REQUEST USER: TERINTEGRASI DALAM 1 FILE & SPESIFIK TIAP TEMPLATE)
function renderLampiran(data, meta, tahun) {
  const templateId = meta.template_id || data.metadata?.template_id || 'kokurikuler-p5';

  return `
    <div class="program-page-sheet print:break-after-page">
      <div class="text-center mb-8 pt-4">
        <h2 class="text-xl font-bold uppercase tracking-wider text-slate-900">BAGIAN LAMPIRAN DOKUMEN</h2>
        <h3 class="text-sm font-medium uppercase text-slate-600 mt-1">Instrumen Operasional, SK Tim Pelaksana, dan Jurnal Harian Siswa</h3>
      </div>

      <!-- Lampiran 1: SK Tim Pelaksana (Universal) -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 1: SURAT KEPUTUSAN (SK) TIM PELAKSANA PROGRAM</h4>
        <div class="text-xs text-slate-700 space-y-2 text-justify">
          <p class="font-bold text-center text-slate-900">
            KEPUTUSAN KEPALA ${meta.nama_sekolah || 'SEKOLAH'}<br>
            Nomor: 421.2/${tahun}/SK-PROG/01<br>
            TENTANG PEMBENTUKAN TIM PELAKSANA ${(meta.judul_program || 'PROGRAM SEKOLAH').toUpperCase()}<br>
            TAHUN AJARAN ${meta.tahun_ajaran || '2025/2026'}
          </p>
          <p class="indent-6">
            Menimbang bahwa demi kelancaran, akuntabilitas, dan kesinambungan pelaksanaan program kerja di satuan pendidikan, maka dipandang perlu menetapkan susunan Tim Pelaksana melalui Keputusan Kepala Sekolah.
          </p>
        </div>
      </div>

      <!-- Lampiran 2 & 3: Template-Specific Dynamic Attachments -->
      ${renderTemplateSpecificLampiranHtml(templateId, meta)}

    </div>
  `;
}

/**
 * Render dynamic HTML for Lampiran 2 & 3 tailored to each of the 8 templates
 */
function renderTemplateSpecificLampiranHtml(templateId, meta) {
  if (templateId === 'kokurikuler-p5') {
    return `
      <!-- Lampiran 2: Rubrik Asesmen 8 Dimensi Profil Lulusan -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: RUBRIK ASESMEN AUTENTIK 8 DIMENSI PROFIL LULUSAN (SK BSKAP NO. 058/H/KR/2025)</h4>
          <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">Rubrik 3 Tingkat SK BSKAP 058/2025</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Format rubrik asesmen autentik 3 tahapan perkembangan berikut digunakan oleh guru/fasilitator untuk memetakan capaian dimensi dan subdimensi Profil Lulusan murid sepanjang kegiatan kokurikuler:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Dimensi &amp; Subdimensi Sasaran</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Berkembang (Menuju Standar)</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Cakap (Standar Kelulusan / SKL)</th>
                <th class="p-2 w-1/4">Mahir (Melampaui Standar)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">1</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Keimanan &amp; Ketakwaan (Hubungan dengan Alam)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menunjukkan pemahaman tentang pentingnya menjaga kebersihan lingkungan dengan bimbingan.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Membiasakan menjaga kebersihan lingkungan dan kelestarian alam secara konsisten dan mandiri.</td>
                <td class="p-2 text-slate-600">Menjadi contoh bagi teman dalam kepedulian lingkungan serta berinisiatif menjaga kelestarian alam.</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">2</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Kewargaan (Kewargaan Lokal &amp; Nasional)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Mengenal aturan dan norma sosial yang berlaku di lingkungan keluarga, sekolah, dan masyarakat.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menaati aturan sosial dan berperilaku sesuai norma kebangsaan secara konsisten.</td>
                <td class="p-2 text-slate-600">Menaati aturan serta mengajak teman sebaya mematuhi tata tertib dan bangga beridentitas Indonesia.</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">3</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Penalaran Kritis (Penyelesaian Masalah)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyelesaikan masalah sederhana dan menghasilkan solusi namun masih kurang tepat.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyelesaikan masalah sederhana dan menghasilkan solusi yang tepat sesuai konteks kegiatan.</td>
                <td class="p-2 text-slate-600">Mengidentifikasi masalah, menghasilkan solusi inovatif yang tepat, serta merefleksikan prosesnya.</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">4</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Kreativitas (Gagasan Baru &amp; Karya)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Membuat tindakan atau karya sederhana yang kreatif dengan meniru contoh fasilitator.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Membuat karya sederhana yang kreatif dengan memadukan berbagai ide sesuai minatnya.</td>
                <td class="p-2 text-slate-600">Membuat karya inovatif berdampak nyata serta mampu mengapresiasi dan mengkritisi karya secara konstruktif.</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">5</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Kolaborasi (Kerja Sama &amp; Berbagi)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Mulai bekerja sama dengan teman sebaya dalam kelompok dengan bimbingan dan arahan guru.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Bekerjasama dengan teman, membagi tugas secara adil, dan bertanggung jawab atas hasil tim.</td>
                <td class="p-2 text-slate-600">Membangun koordinasi tim yang efektif, menjaga kekompakan, dan mendorong tercapainya tujuan kelompok.</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">6</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Kemandirian (Bertanggung Jawab)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Melakukan upaya mencapai target tugas kokurikuler sesuai arahan yang diberikan guru.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menetapkan target kerja mandiri dan berusaha menuntaskan tugas kelompok tepat waktu.</td>
                <td class="p-2 text-slate-600">Menetapkan tujuan belajar mandiri, tuntas mengerjakannya, dan bertanggung jawab penuh atas hasilnya.</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">7</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Kesehatan (Pola Hidup Bersih &amp; Lingkungan)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Mengenal kebiasaan hidup bersih dan pentingnya menjaga kebersihan tempat kegiatan.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Membiasakan hidup bersih dan berperan aktif memilah sampah di area kegiatan sekolah.</td>
                <td class="p-2 text-slate-600">Menjadi teladan hidup sehat, menginisiasi kebersihan lingkungan, dan menjaga kebugaran tim.</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">8</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Komunikasi (Menyimak &amp; Berbicara)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyimak instruksi kegiatan dan menyampaikan pendapat sederhana namun belum terstruktur.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyampaikan gagasan kelompok dengan lafal jelas, runtut, santun, dan menanggapi pertanyaan secara tepat.</td>
                <td class="p-2 text-slate-600">Mempresentasikan hasil karya secara percaya diri, persuasif, komunikatif, dan memfasilitasi diskusi tim.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lampiran 3: Lembar Refleksi Diri Murid -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: LEMBAR REFLEKSI DIRI MURID (KOKURIKULER PROFIL LULUSAN)</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Lembar refleksi ini diisi oleh setiap murid pada akhir gelaran aksi kegiatan untuk mengevaluasi pemahaman bermakna dan kontribusi belajarnya:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300">Pernyataan Refleksi Siswa</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center">Sangat Setuju</th>
                <th class="p-2 border-r border-slate-300 w-20 text-center">Setuju</th>
                <th class="p-2 border-r border-slate-300 w-20 text-center">Ragu-ragu</th>
                <th class="p-2 w-24 text-center">Tidak Setuju</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">1</td>
                <td class="p-2 border-r border-slate-300">Saya memahami tujuan dan kebermanfaatan tema projek ini bagi diri dan lingkungan.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 text-center text-slate-300">○</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">2</td>
                <td class="p-2 border-r border-slate-300">Saya aktif terlibat dan membagi tugas secara adil bersama teman satu kelompok.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 text-center text-slate-300">○</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">3</td>
                <td class="p-2 border-r border-slate-300">Saya berani mengemukakan ide dan mendengarkan masukan dari anggota kelompok lain.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 text-center text-slate-300">○</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">4</td>
                <td class="p-2 border-r border-slate-300">Saya bangga dengan produk/aksi nyata yang dihasilkan oleh kelompok saya.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 text-center text-slate-300">○</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">5</td>
                <td class="p-2 border-r border-slate-300">Saya bertekad melanjutkan kebiasaan positif yang dipelajari selama projek di kehidupan sehari-hari.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                <td class="p-2 text-center text-slate-300">○</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (templateId === '7kaih') {
    const kebiasaanList = [
      '1. Bangun Pagi Mandiri & Ibadah Subuh (Jumat Nyucikeun Diri)',
      '2. Berbakti pada Orang Tua & Budaya 5S (Senin Ajeg Nusantara)',
      '3. Berolahraga Ceria, Makan Sehat & Bawa Tumbler (Selasa Mapag Buana)',
      '4. Gemar Membaca Buku / Literasi 15 Menit (Rabu Maneuh di Sunda)',
      '5. Rajin Belajar & Menjaga Kerapihan Diri (Kamis Nyanding Wawangi)',
      '6. Peduli Lingkungan & Memilah Sampah Kelas (TdBA Karakter)',
      '7. Istirahat Tepat Waktu & Kumpul Keluarga (Betah di Imah)',
    ];

    return `
      <!-- Lampiran 2: Jurnal 7 KAIH & 7 Poé Atikan -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: JURNAL MINGGUAN 7 KEBIASAAN ANAK INDONESIA HEBAT (7 KAIH) & 7 POÉ ATIKAN</h4>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Buku Kendali Harian</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Format instrumen berikut memadukan 7 Kebiasaan Anak Indonesia Hebat dengan kearifan lokal 7 Poé Atikan Purwakarta Istimewa sebagai sarana kendali habituasi harian murid:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Fokus Pembiasaan (7 KAIH & 7 Poé Atikan)</th>
                <th class="p-1 border-r border-slate-300 w-12 text-center">Sen<br><span class="text-[10px] font-normal text-slate-500">Ajeg</span></th>
                <th class="p-1 border-r border-slate-300 w-12 text-center">Sel<br><span class="text-[10px] font-normal text-slate-500">Mapag</span></th>
                <th class="p-1 border-r border-slate-300 w-12 text-center">Rab<br><span class="text-[10px] font-normal text-slate-500">Maneuh</span></th>
                <th class="p-1 border-r border-slate-300 w-12 text-center">Kam<br><span class="text-[10px] font-normal text-slate-500">Nyanding</span></th>
                <th class="p-1 border-r border-slate-300 w-12 text-center">Jum<br><span class="text-[10px] font-normal text-slate-500">Nyucikeun</span></th>
                <th class="p-2 text-center">Catatan & Paraf Guru</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${kebiasaanList.map((kb, idx) => `
                <tr>
                  <td class="p-2 border-r border-slate-300 text-center font-mono">${idx + 1}</td>
                  <td class="p-2 border-r border-slate-300 font-medium text-slate-800">${kb}</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                  <td class="p-2 text-center text-slate-400 text-[11px]">Paraf: .........</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <p class="text-[11px] text-slate-500 italic mt-2">
          *Petunjuk: Berikan tanda centang (✓) pada hari anak mempraktikkan kebiasaan secara mandiri. Paraf orang tua dibubuhkan setiap akhir pekan.
        </p>
      </div>

      <!-- Lampiran 3: Lembar Observasi Supervisi -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: LEMBAR OBSERVASI DAN MONITORING SUPERVISI PEMBIASAAN SISWA</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Digunakan dalam supervisi berkala oleh Wali Kelas, Kepala Sekolah, dan Pengawas Pembina untuk mengevaluasi habituasi positif:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-1/4">Aspek Observasi Karakter</th>
                <th class="p-2 border-r border-slate-300 w-1/2">Fakta & Catatan Pelaksanaan</th>
                <th class="p-2">Rencana Tindak Lanjut & Apresiasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">1. Ketertiban & Pembiasaan 5S di Gerbang Sekolah</td>
                <td class="p-2 border-r border-slate-300 text-slate-400 italic text-[11px]">[Catatan observasi guru piket pagi]</td>
                <td class="p-2 text-slate-400 italic text-[11px]">[Tindak lanjut pembinaan / apresiasi]</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">2. Konsistensi Pengisian Jurnal 7 KAIH Mandiri</td>
                <td class="p-2 border-r border-slate-300 text-slate-400 italic text-[11px]">[Tingkat ketuntasan dan validasi paraf orang tua]</td>
                <td class="p-2 text-slate-400 italic text-[11px]">[Pemberian Bintang Kebaikan]</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">3. Keterlibatan & Validasi Orang Tua Setiap Akhir Pekan</td>
                <td class="p-2 border-r border-slate-300 text-slate-400 italic text-[11px]">[Catatan komunikasi grup paguyuban kelas]</td>
                <td class="p-2 text-slate-400 italic text-[11px]">[Dialog reflektif wali murid]</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">4. Pengurangan Konflik & Penumbuhan Empati Siswa</td>
                <td class="p-2 border-r border-slate-300 text-slate-400 italic text-[11px]">[Perilaku tolong-menolong dan keharmonisan antarsiswa]</td>
                <td class="p-2 text-slate-400 italic text-[11px]">[Penguatan budaya kelas ramah anak]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (templateId === 'hari-belajar-guru') {
    return `
      <!-- Lampiran 2: Jurnal Refleksi Kombel -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: JURNAL REFLEKSI KOMUNITAS BELAJAR (KOMBEL) GURU</h4>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Siklus Inkuiri Guru</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Instrumen siklus inkuiri Komunitas Belajar guru dalam mendiagnosis kebutuhan belajar murid, berbagi praktik baik, dan evaluasi pengajaran:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Tahapan Siklus Kombel</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Fokus Topik Pembelajaran</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Temuan Masalah & Solusi Disepakati</th>
                <th class="p-2 text-center">PIC / RTL</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">1</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Siklus 1: Rencanakan (Plan)</td>
                <td class="p-2 border-r border-slate-300">Diferensiasi Pembelajaran & Asesmen Awal</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Siswa memiliki rentang kesiapan beragam; guru menyiapkan scaffolding materi bertingkat.</td>
                <td class="p-2 text-center text-slate-700 font-medium">Tim Guru Fase</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">2</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Siklus 2: Terapkan (Do)</td>
                <td class="p-2 border-r border-slate-300">Pemanfaatan Media Visual Interaktif & AI</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Meningkatkan antusiasme dan pemahaman konsep sains/matematika secara konkret.</td>
                <td class="p-2 text-center text-slate-700 font-medium">Guru Penggerak</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">3</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Siklus 3: Evaluasi (Check)</td>
                <td class="p-2 border-r border-slate-300">Analisis Hasil Formatif & Penilaian Karakter</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Mendeteksi miskonsepsi dasar membaca pemahaman dan numerasi soal cerita.</td>
                <td class="p-2 text-center text-slate-700 font-medium">Semua Guru</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">4</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Siklus 4: Refleksi (Act)</td>
                <td class="p-2 border-r border-slate-300">Penyusunan Praktik Baik & Modifikasi Modul</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyusun bank soal reflektif dan modul ajar yang lebih ramah gaya belajar anak.</td>
                <td class="p-2 text-center text-slate-700 font-medium">Koord. Kurikulum</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lampiran 3: Daftar Hadir Kombel -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: FORMAT DAFTAR HADIR DAN NOTULA SESI HARI BELAJAR GURU (HBG)</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Format daftar hadir pertemuan rutin komunitas belajar pendidik sebagai dokumen bukti fisik keterlaksanaan program:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Hari / Tanggal</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Nama Pendidik / NIP</th>
                <th class="p-2 border-r border-slate-300 w-1/5">Jabatan / Kelas</th>
                <th class="p-2 text-center">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${[1, 2, 3, 4, 5].map(n => `
                <tr>
                  <td class="p-2 border-r border-slate-300 text-center font-mono">${n}</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">........................</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">........................</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">........................</td>
                  <td class="p-2 text-center text-slate-400 italic">........................</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (templateId === 'literasi') {
    return `
      <!-- Lampiran 2: Jurnal Membaca Pohon Geulis -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: JURNAL MEMBACA HARIAN SISWA (POHON GEULIS LITERASI)</h4>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Kartu Literasi 15 Menit</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Kartu kendali membaca 15 menit sebelum pelajaran dimulai dan pemanfaatan pojok baca kelas:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center">Hari / Tanggal</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Judul Buku & Pengarang</th>
                <th class="p-2 border-r border-slate-300 w-20 text-center">Hal. Dibaca</th>
                <th class="p-2 border-r border-slate-300">Nilai Moral / Budi Pekerti</th>
                <th class="p-2 w-20 text-center">Paraf Guru</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${[1, 2, 3, 4, 5].map(idx => `
                <tr>
                  <td class="p-2 border-r border-slate-300 text-center font-mono">${idx}</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic text-center">... / ... / 2025</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">................................................</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Hal. ... - ...</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">................................................</td>
                  <td class="p-2 text-center text-slate-400 italic">______</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lampiran 3: Rubrik Asesmen Literasi -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: RUBRIK ASESMEN KEMAMPUAN RESENSI & PRESENTASI BACAAN SISWA</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Format penilaian saat kegiatan berbagi intisari buku cerita di hadapan rekan sekelas / festival literasi:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-1/4">Aspek Keterampilan Literasi</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Kriteria Sangat Baik (SB)</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Kriteria Berkembang (B)</th>
                <th class="p-2">Catatan Guru</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">1. Kelancaran & Keberanian Bercerita</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyampaikan alur cerita secara runtut, ekspresif, dan percaya diri tinggi.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menceritakan garis besar cerita dengan bimbingan dan arahan sesekali.</td>
                <td class="p-2 text-slate-400 italic">.............</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">2. Pemahaman Isi & Watak Tokoh</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menganalisis konflik utama serta watak tokoh secara tepat dan mendalam.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyebutkan nama-nama tokoh dan alur sederhana secara umum.</td>
                <td class="p-2 text-slate-400 italic">.............</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">3. Penerapan Pesan Budi Pekerti</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Mampu menghubungkan hikmah bacaan ke dalam teladan perilaku sehari-hari.</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Menyebutkan pesan moral cerita namun belum mengaitkannya ke diri sendiri.</td>
                <td class="p-2 text-slate-400 italic">.............</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (templateId === 'uks') {
    return `
      <!-- Lampiran 2: Skrining UKS -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: FORMAT SKRINING KESEHATAN BERKALA MURID</h4>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Rekam Medis Sederhana UKS</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Format rekam pemeriksaan kesehatan fisik sederhana murid berkala bekerja sama dengan Puskesmas:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Nama Murid</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center">TB (cm) / BB (kg)</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center">Status Gizi</th>
                <th class="p-2 border-r border-slate-300">Kesehatan Gigi & Mata</th>
                <th class="p-2 text-center">Catatan / Rujukan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${[1, 2, 3, 4, 5].map(n => `
                <tr>
                  <td class="p-2 border-r border-slate-300 text-center font-mono">${n}</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">....................................</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">... cm / ... kg</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Baik / Cukup</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">Gigi bersih / Penglihatan normal</td>
                  <td class="p-2 text-center text-slate-400 italic">-</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lampiran 3: Inspeksi Sanitasi & Kantin -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: LEMBAR INSPEKSI KESEHATAN LINGKUNGAN & KANTIN SEHAT SEKOLAH</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Instrumen audit berkala higienitas lingkungan sekolah, sanitasi jamban, dan makanan kantin:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-1/4">Komponen Lingkungan Sehat</th>
                <th class="p-2 border-r border-slate-300 w-1/2">Standar Kelayakan UKS</th>
                <th class="p-2 border-r border-slate-300 w-1/6 text-center">Temuan Lapangan</th>
                <th class="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">1. Sarana Cuci Tangan Pakai Sabun (CTPS)</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Air bersih mengalir lancar, sabun cuci tangan selalu tersedia di depan tiap ruang kelas.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Berfungsi baik</td>
                <td class="p-2 text-center text-emerald-600 font-semibold">Memenuhi</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">2. Sanitasi Jamban / Toilet Siswa</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Kering, bersih, tidak berbau, tersedia air bersih cukup, terpisah laki-laki dan perempuan.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Bersih & higienis</td>
                <td class="p-2 text-center text-emerald-600 font-semibold">Memenuhi</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">3. Higienitas Makanan Kantin Sekolah</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Makanan tertutup rapat, bergizi seimbang, bebas bahan pengawet/pewarna sintetis berbahaya.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Bebas 5P sintetis</td>
                <td class="p-2 text-center text-emerald-600 font-semibold">Memenuhi</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">4. Pengelolaan Wadah Sampah Tertutup</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Tersedia tempat sampah pilah tertutup dan dilakukan pengosongan berkala setiap hari.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Pilah 3 warna</td>
                <td class="p-2 text-center text-emerald-600 font-semibold">Memenuhi</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (templateId === 'adiwiyata') {
    return `
      <!-- Lampiran 2: Monitoring PBLHS & TdBA -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: LEMBAR MONITORING AKSI PBLHS & TATANEN DI BALE ATIKAN (TdBA)</h4>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Aksi Lingkungan & TdBA</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Instrumen pemantauan aksi peduli lingkungan hidup, budidaya kebun organik, dan konservasi alam berbasis kearifan lokal:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/4">Area Aksi Lingkungan</th>
                <th class="p-2 border-r border-slate-300 w-1/2">Indikator Keterlaksanaan</th>
                <th class="p-2 border-r border-slate-300 text-center">Kondisi Lapangan</th>
                <th class="p-2 text-center">RTL Perawatan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">1</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Kebun Sekolah & TdBA Organik</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Penanaman sayur organik, toga, pemupukan kompos mandiri, dan edukasi ketahanan pangan.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Subur & terawat</td>
                <td class="p-2 text-center text-slate-400 italic">Jadwal siram harian</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">2</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Reduksi Sampah Plastik</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Budaya membawa wadah bekal dan tumbler minum sendiri (Zero Waste School).</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">95% siswa bawa tumbler</td>
                <td class="p-2 text-center text-slate-400 italic">Edukasi kantin bebas kresek</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">3</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Pemilahan Sampah 3R</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Ketersediaan dan pemilahan tempat sampah organik, anorganik, dan residu terawat baik.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Tempat sampah pilah lengkap</td>
                <td class="p-2 text-center text-slate-400 italic">Penyaluran ke bank sampah</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">4</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Konservasi Energi & Air</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Pemanfaatan ventilasi alami, mematikan kran air setelah digunakan, dan sumur resapan/biopori.</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Biopori aktif berfungsi</td>
                <td class="p-2 text-center text-slate-400 italic">Pembersihan berkala</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lampiran 3: Inventarisasi Sampah -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: FORMULIR INVENTARISASI REDUKSI TIMBULAN SAMPAH SEKOLAH</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Pencatatan estimasi reduksi timbulan sampah satuan pendidikan melalui aksi pemilahan dan daur ulang:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-1/3">Kategori Sampah Sekolah</th>
                <th class="p-2 border-r border-slate-300 w-1/5 text-center">Estimasi Vol / Pekan</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Metode Pengolahan / Reduksi</th>
                <th class="p-2 text-center">Penanggung Jawab</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">1. Daun & Ranting Kering</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono">± 15 Kg</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Diolah menjadi pupuk kompos organik kebun TdBA</td>
                <td class="p-2 text-center text-slate-700 font-medium">Pokja Kompos & TdBA</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">2. Kertas & Kardus Bekas</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono">± 5 Kg</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Dikumpulkan di Bank Sampah untuk didaur ulang</td>
                <td class="p-2 text-center text-slate-700 font-medium">Pokja Bank Sampah</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">3. Botol Plastik & Kemasan</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono">± 2 Kg</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Diminimalisir lewat himbauan bekal ramah lingkungan</td>
                <td class="p-2 text-center text-slate-700 font-medium">Seluruh Pendidik</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (templateId === 'keagamaan') {
    return `
      <!-- Lampiran 2: Buku Mutaba'ah Yaumiyah -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: BUKU KENDALI IBADAH HARIAN SISWA (MUTABA'AH YAUMIYAH)</h4>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Mutaba'ah Yaumiyah</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Instrumen pemantauan ibadah wajib, sholat dhuha, tadarus Al-Qur’an / surat pendek, dan amal sholeh harian murid:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center">Hari / Tgl</th>
                <th class="p-2 border-r border-slate-300 w-1/3 text-center">Sholat Fardhu 5 Waktu</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center">Sholat Dhuha</th>
                <th class="p-2 border-r border-slate-300">Tadarus / Hafalan</th>
                <th class="p-2 w-20 text-center">Paraf Ortu</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${[1, 2, 3, 4, 5].map(idx => `
                <tr>
                  <td class="p-2 border-r border-slate-300 text-center font-mono">${idx}</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic text-center">Hari ke-${idx}</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-500 text-[11px]">Sub / Dzu / Ash / Mag / Isy</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-300">○</td>
                  <td class="p-2 border-r border-slate-300 text-slate-400 italic">Juz 'Amma / Doa Harian</td>
                  <td class="p-2 text-center text-slate-400 italic">______</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lampiran 3: Evaluasi Akhlak Mulia -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: LEMBAR EVALUASI PEMBIASAAN AKHLAK MULIA & PERILAKU SOSIAL</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Format pemantauan budi pekerti, kejujuran, dan kesantunan anak dalam pergaulan di sekolah:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-1/4">Indikator Akhlak Mulia</th>
                <th class="p-2 border-r border-slate-300 w-1/2">Bentuk Perilaku Nyata yang Diamati</th>
                <th class="p-2">Catatan Guru Pembimbing</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">1. Adab & Kesantunan Bertutur Kata</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Membiasakan kata tolong, maaf, terima kasih, dan permisi saat berinteraksi.</td>
                <td class="p-2 text-slate-400 italic">Konsisten diterapkan</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">2. Kejujuran & Sportivitas</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Berani berkata jujur saat berbuat salah dan tidak menyontek saat asesmen berlangsung.</td>
                <td class="p-2 text-slate-400 italic">Sangat baik</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">3. Kepedulian Sosial & Kedermawanan</td>
                <td class="p-2 border-r border-slate-300 text-slate-600">Rutin menyisihkan infaq Jumat serta memiliki kepekaan membantu teman yang kesulitan.</td>
                <td class="p-2 text-slate-400 italic">Aktif berinfaq</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (templateId === 'kalender-sekolah') {
    return `
      <!-- KARTU SHOWCASE TEMPLATE EXCEL RESMI KALENDER PENDIDIKAN -->
      <div class="mb-10 no-print relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl border border-emerald-500/30">
        <div class="absolute -right-8 -bottom-8 w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute right-1/3 -top-10 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-xs">
              <i class="fa-solid fa-file-excel text-emerald-400"></i>
              <span>Template Microsoft Excel Resmi (.xlsx)</span>
              <span class="bg-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-mono">3 Worksheet Lengkap</span>
            </div>
            <h3 class="text-xl sm:text-2xl font-black tracking-tight text-white">
              Kalender Pendidikan Format Spreadsheet Excel (.xlsx)
            </h3>
            <p class="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Dokumen kalender pendidikan satuan pendidikan resmi berformat Microsoft Excel (.xlsx) siap pakai dengan desain rapi, palet warna elegan, dan panel beku (freeze panes). Terbagi menjadi 3 sheet: Matriks 12 Bulan (Juli–Juni) dengan penanda kode warna agenda, Rekapitulasi RPE 36 Pekan Efektif (Permendikdasmen No. 13/2025), serta Matriks Terpadu PHBI dan Karakter Purwakarta (7 Poé Atikan / TdBA).
            </p>
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <span class="text-[11px] bg-white/10 text-emerald-200 px-2.5 py-1 rounded-lg border border-white/10"><i class="fa-solid fa-table-cells mr-1.5 text-emerald-400"></i>Sheet 1: Matriks 12 Bulan</span>
              <span class="text-[11px] bg-white/10 text-emerald-200 px-2.5 py-1 rounded-lg border border-white/10"><i class="fa-solid fa-calculator mr-1.5 text-emerald-400"></i>Sheet 2: RPE 36 Pekan</span>
              <span class="text-[11px] bg-white/10 text-emerald-200 px-2.5 py-1 rounded-lg border border-white/10"><i class="fa-solid fa-mosque mr-1.5 text-emerald-400"></i>Sheet 3: Jadwal PHBI &amp; TdBA</span>
            </div>
          </div>

          <div class="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button type="button" onclick="window.downloadKaldikExcel &amp;&amp; window.downloadKaldikExcel()"
                    class="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/50 transition-all cursor-pointer">
              <i class="fa-solid fa-file-excel text-base text-emerald-950"></i>
              <span>Unduh Kalender Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Lampiran 2: Matriks Rincian Pekan Efektif (RPE) 12 Bulan -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: MATRIKS RINCIAN PEKAN EFEKTIF (RPE) 12 BULAN TAHUN AJARAN ${meta.tahun_ajaran || '2026/2027'}</h4>
            <p class="text-xs text-slate-500 font-sans mt-0.5">
              Acuan Yuridis: Surat Edaran Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026 &amp; Permendikdasmen RI No. 13 Tahun 2025
            </p>
          </div>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded font-semibold font-sans">
            Total 36 Pekan Efektif Belajar
          </span>
        </div>
        <p class="text-xs text-slate-600 mb-4 text-justify">
          Berdasarkan ketentuan Disdik Purwakarta, perhitungan pekan efektif mensyaratkan minimal 3 hari belajar efektif dalam satu pekan kalender. Matriks berikut merinci perhitungan pekan efektif per semester untuk Tahun Ajaran 2026/2027:
        </p>

        <!-- Tabel RPE Semester 1 (Ganjil) -->
        <div class="mb-5 overflow-x-auto bg-white rounded-lg border border-slate-300 shadow-2xs">
          <div class="bg-indigo-900 text-white px-3 py-1.5 text-xs font-bold font-sans flex items-center justify-between">
            <span>SEMESTER 1 (GANJIL) • JULI - DESEMBER 2026</span>
            <span class="text-indigo-200 font-normal">Target: 18 Pekan Efektif</span>
          </div>
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-28">Bulan</th>
                <th class="p-2 border-r border-slate-300 w-20 text-center">Jml Pekan</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center text-emerald-800 bg-emerald-50/60">Pekan Efektif</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center text-rose-800 bg-rose-50/60">Tdk Efektif</th>
                <th class="p-2">Keterangan Agenda &amp; Alasan Tidak Efektif</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">1</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Juli 2026</td>
                <td class="p-2 border-r border-slate-300 text-center">5</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">2</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">3</td>
                <td class="p-2 text-slate-600 text-[11px]">Libur Akhir TP 2025/2026 (1-10 Jul), MPLS Ramah Anak (13-17 Jul), Peringatan Hari Jadi Purwakarta ke-195 (20 Jul)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">2</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Agustus 2026</td>
                <td class="p-2 border-r border-slate-300 text-center">4</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">4</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 bg-rose-50/30">0</td>
                <td class="p-2 text-slate-600 text-[11px]">KBM Efektif penuh; Hari Pramuka ke-65 (14 Agu), HUT RI ke-81 (17 Agu), Peringatan Maulid Nabi Muhammad SAW (25 Agu)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">3</td>
                <td class="p-2 border-r border-slate-300 font-semibold">September 2026</td>
                <td class="p-2 border-r border-slate-300 text-center">5</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">4</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">1</td>
                <td class="p-2 text-slate-600 text-[11px]">Hari Udara Bersih TdBA (7 Sep), Hari Bambu TdBA (18 Sep), Asesmen Sumatif Tengah Semester / STS Ganjil (21-25 Sep)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">4</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Oktober 2026</td>
                <td class="p-2 border-r border-slate-300 text-center">4</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">4</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 bg-rose-50/30">0</td>
                <td class="p-2 text-slate-600 text-[11px]">KBM Efektif; Hari Kesaktian Pancasila (1 Okt), Peringatan Hari Sumpah Pemuda (28 Okt)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">5</td>
                <td class="p-2 border-r border-slate-300 font-semibold">November 2026</td>
                <td class="p-2 border-r border-slate-300 text-center">4</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">4</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 bg-rose-50/30">0</td>
                <td class="p-2 text-slate-600 text-[11px]">KBM Efektif; Hari Pahlawan Nasional (10 Nov), Hari Guru Nasional (HGN) &amp; HUT PGRI ke-81 (25 Nov)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">6</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Desember 2026</td>
                <td class="p-2 border-r border-slate-300 text-center">5</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-slate-400 bg-emerald-50/30">0</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">5</td>
                <td class="p-2 text-slate-600 text-[11px]">Asesmen Sumatif Akhir Semester / SAS Ganjil (1-10 Des), Pembagian Rapor (18 Des), Libur Smt 1 (21-31 Des), Natal (25 Des)</td>
              </tr>
            </tbody>
            <tfoot class="bg-indigo-50 font-bold border-t-2 border-indigo-200">
              <tr>
                <td colspan="2" class="p-2 text-right border-r border-slate-300 uppercase tracking-wider text-indigo-900">JUMLAH SEMESTER 1 (GANJIL):</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono font-black text-indigo-900">27</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono font-black text-emerald-800 bg-emerald-100/70 text-sm">18 PEKAN</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono font-black text-rose-800 bg-rose-100/70 text-sm">9 PEKAN</td>
                <td class="p-2 text-slate-700 text-[11px] font-semibold">Target minimal 18 pekan efektif semester ganjil terpenuhi (100%)</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Tabel RPE Semester 2 (Genap) -->
        <div class="mb-4 overflow-x-auto bg-white rounded-lg border border-slate-300 shadow-2xs">
          <div class="bg-indigo-900 text-white px-3 py-1.5 text-xs font-bold font-sans flex items-center justify-between">
            <span>SEMESTER 2 (GENAP) • JANUARI - JUNI 2027</span>
            <span class="text-indigo-200 font-normal">Target: 18 Pekan Efektif (16 Pekan Kelas 6)</span>
          </div>
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-28">Bulan</th>
                <th class="p-2 border-r border-slate-300 w-20 text-center">Jml Pekan</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center text-emerald-800 bg-emerald-50/60">Pekan Efektif</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center text-rose-800 bg-rose-50/60">Tdk Efektif</th>
                <th class="p-2">Keterangan Agenda &amp; Alasan Tidak Efektif</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">1</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Januari 2027</td>
                <td class="p-2 border-r border-slate-300 text-center">5</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">4</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">1</td>
                <td class="p-2 text-slate-600 text-[11px]">Tahun Baru 2027 (1 Jan), Libur Smt 1 (1-8 Jan), Hari Pertama KBM Smt 2 (11 Jan)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">2</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Februari 2027</td>
                <td class="p-2 border-r border-slate-300 text-center">4</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">3</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">1</td>
                <td class="p-2 text-slate-600 text-[11px]">Peringatan Isra Mi'raj / Rajaban (5 Feb), Libur Awal Ramadhan 1448 H (8-10 Feb), Masantren di Sakola Ramadhan (11-28 Feb)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">3</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Maret 2027</td>
                <td class="p-2 border-r border-slate-300 text-center">5</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">3</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">2</td>
                <td class="p-2 text-slate-600 text-[11px]">Lanjutan Masantren Ramadhan (1-5 Mar), Libur Idul Fitri 1448 H (8-19 Mar), STS Genap (22-26 Mar)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">4</td>
                <td class="p-2 border-r border-slate-300 font-semibold">April 2027</td>
                <td class="p-2 border-r border-slate-300 text-center">4</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">4</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 bg-rose-50/30">0</td>
                <td class="p-2 text-slate-600 text-[11px]">KBM Efektif penuh; Peringatan Hari Kartini (21 Apr), Peringatan Hari Bumi Sedunia (TdBA) (22 Apr)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">5</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Mei 2027</td>
                <td class="p-2 border-r border-slate-300 text-center">5</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/30">4</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">1</td>
                <td class="p-2 text-slate-600 text-[11px]">Hardiknas (2 Mei), PSAJ Kelas 6 (10-14 Mei), Hari Raya Idul Adha 1448 H (16 Mei), Harkitnas (20 Mei)</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">6</td>
                <td class="p-2 border-r border-slate-300 font-semibold">Juni 2027</td>
                <td class="p-2 border-r border-slate-300 text-center">4</td>
                <td class="p-2 border-r border-slate-300 text-center font-bold text-slate-400 bg-emerald-50/30">0</td>
                <td class="p-2 border-r border-slate-300 text-center text-rose-600 bg-rose-50/30">4</td>
                <td class="p-2 text-slate-600 text-[11px]">Hari Lahir Pancasila (1 Jun), ASAT Genap (7-15 Jun), 1 Muharram 1449 H (16 Jun), Pembagian Rapor (25 Jun), Libur Akhir TP (28-30 Jun)</td>
              </tr>
            </tbody>
            <tfoot class="bg-indigo-50 font-bold border-t-2 border-indigo-200">
              <tr>
                <td colspan="2" class="p-2 text-right border-r border-slate-300 uppercase tracking-wider text-indigo-900">JUMLAH SEMESTER 2 (GENAP):</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono font-black text-indigo-900">27</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono font-black text-emerald-800 bg-emerald-100/70 text-sm">18 PEKAN</td>
                <td class="p-2 border-r border-slate-300 text-center font-mono font-black text-rose-800 bg-rose-100/70 text-sm">9 PEKAN</td>
                <td class="p-2 text-slate-700 text-[11px] font-semibold">Target 18 pekan terpenuhi (Kelas 6: 16 pekan efektif karena PSAJ &amp; kelulusan)</td>
              </tr>
              <tr class="bg-indigo-900 text-white font-black">
                <td colspan="2" class="p-2 text-right border-r border-indigo-700 uppercase tracking-wider">TOTAL 1 TAHUN AJARAN:</td>
                <td class="p-2 border-r border-indigo-700 text-center font-mono">54</td>
                <td class="p-2 border-r border-indigo-700 text-center font-mono text-emerald-300 text-sm">36 PEKAN EFEKTIF</td>
                <td class="p-2 border-r border-indigo-700 text-center font-mono text-rose-300 text-sm">18 PEKAN</td>
                <td class="p-2 text-indigo-100 text-[11px] font-bold">100% Memenuhi Standar Nasional Kemendikdasmen (Min. 36 Pekan Efektif)</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Alokasi Beban Jam Pelajaran (JP) -->
        <div class="mt-4 p-3 bg-indigo-50/70 rounded-lg border border-indigo-200 text-xs text-indigo-950">
          <div class="font-bold mb-1">Distribusi Alokasi Jam Belajar Efektif (Kurikulum Merdeka 2026/2027):</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div>• <strong>Fase A (Kelas 1-2):</strong> 32 JP/Pekan × 36 Pekan = <strong>1.152 JP/Tahun</strong></div>
            <div>• <strong>Fase B (Kelas 3-4):</strong> 36 JP/Pekan × 36 Pekan = <strong>1.296 JP/Tahun</strong></div>
            <div>• <strong>Fase C (Kelas 5-6):</strong> 36 JP/Pekan × 36 Pekan = <strong>1.296 JP/Tahun</strong></div>
          </div>
        </div>
      </div>

      <!-- Lampiran 3: Jadwal PHBI & Kegiatan Karakter Purwakarta -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h4 class="font-bold text-base text-slate-900">LAMPIRAN 3: JADWAL PERINGATAN HARI BESAR ISLAM (PHBI) &amp; KARAKTER PURWAKARTA ISTIMEWA</h4>
            <p class="text-xs text-slate-500 font-sans mt-0.5">
              Integrasi Kalender Hijriah 1448 H, Muatan Karakter 7 Poé Atikan, dan Gerakan Tatanen di Bale Atikan (TdBA)
            </p>
          </div>
          <span class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded font-semibold font-sans">
            Agenda Karakter &amp; Spiritual
          </span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Matriks jadwal peringatan hari besar keagamaan dan kegiatan pembiasaan karakter khas Kabupaten Purwakarta sepanjang Tahun Ajaran 2026/2027:
        </p>

        <div class="overflow-x-auto bg-white rounded-lg border border-slate-300 shadow-2xs">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-44">Nama Kegiatan &amp; Tanggal</th>
                <th class="p-2 border-r border-slate-300 w-28 text-center">Kategori</th>
                <th class="p-2 border-r border-slate-300">Bentuk Edukasi &amp; Pembiasaan Murid</th>
                <th class="p-2 w-32 text-center">Sasaran &amp; PIC</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">1</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Peringatan Hari Jadi Purwakarta (HJP ke-195)<br>
                  <span class="text-[11px] font-normal text-indigo-700">20 Juli 2026</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">Purwakarta</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Pawai budaya Sunda, mengenakan busana adat khas Purwakarta (Kamis Nyanding Wawangi), dan penguatan nilai 7 Poé Atikan Purwakarta Istimewa.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Siswa &amp; Guru<br><span class="font-medium text-slate-800">Koord. Kesiswaan</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">2</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Peringatan Maulid Nabi Muhammad SAW<br>
                  <span class="text-[11px] font-normal text-emerald-700">25 Agustus 2026 (12 Rabiul Awal 1448 H)</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">PHBI Islam</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Tabligh akbar siswa, pembacaan sholawat barzanji, lomba adzan, pildacil bertema keteladanan akhlak Rasulullah SAW, serta infaq peduli sesama.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Murid Muslim<br><span class="font-medium text-slate-800">Guru PAI &amp; DKM</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">3</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Hari Udara Bersih &amp; Hari Bambu TdBA<br>
                  <span class="text-[11px] font-normal text-sky-700">7 &amp; 18 September 2026</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">TdBA Purwakarta</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Aksi menanam pohon peneduh, pemanfaatan tanaman bambu ramah lingkungan, dan pembuatan anyaman kerajinan tangan khas Sunda di kebun TdBA sekolah.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Siswa Fase B &amp; C<br><span class="font-medium text-slate-800">Tim TdBA Sekolah</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">4</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Peringatan Isra Mi'raj Nabi / Rajaban<br>
                  <span class="text-[11px] font-normal text-emerald-700">5 Februari 2027 (27 Rajab 1448 H)</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">PHBI Islam</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Kajian sirah keagungan perintah sholat 5 waktu, praktek sholat khusyuk berjamaah di sekolah, santunan anak yatim piatu dhuafa sekolah.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Siswa &amp; Guru<br><span class="font-medium text-slate-800">Guru PAI</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">5</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Masantren di Sakola Ramadhan 1448 H<br>
                  <span class="text-[11px] font-normal text-emerald-700">11 Feb - 5 Maret 2027</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Keagamaan Khusus</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Tadarus Al-Qur’an bersama, pembiasaan sholat Dhuha harian, kajian fiqih puasa, buka puasa bersama ceria, serta pengelolaan dan penyaluran Zakat Fitrah sekolah.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Komunitas Sekolah<br><span class="font-medium text-slate-800">Panitia Ramadhan</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">6</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Idul Fitri &amp; Halal Bihalal Satuan Pendidikan<br>
                  <span class="text-[11px] font-normal text-indigo-700">16 - 19 Maret 2027</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">Silaturahmi</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Apel Halal Bihalal, budaya saling memaafkan antarwarga sekolah, rekonsiliasi keakraban siswa, dan penguatan harmoni kebersamaan.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Siswa, Guru &amp; Ortu<br><span class="font-medium text-slate-800">Kepala Sekolah &amp; Komite</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">7</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Hari Kartini &amp; Hari Bumi (Aksi TdBA)<br>
                  <span class="text-[11px] font-normal text-rose-700">21 - 22 April 2027</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">Nasional &amp; Lingkungan</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Lomba busana nusantara &amp; literasi biografi tokoh perempuan, aksi nyata pemilahan sampah organik/anorganik dan konservasi air di sekolah.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Siswa<br><span class="font-medium text-slate-800">Wali Kelas &amp; Pokja TdBA</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">8</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Peringatan Hari Raya Idul Adha 1448 H<br>
                  <span class="text-[11px] font-normal text-emerald-700">16 Mei 2027 (10 Dzulhijjah 1448 H)</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">PHBI Islam</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Penyembelihan hewan qurban edukatif, pemaknaan keikhlasan dan kepedulian sosial Nabi Ibrahim &amp; Ismail AS, pembagian daging qurban bagi warga sekitar sekolah yang membutuhkan.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Komite, Guru, &amp; Murid<br><span class="font-medium text-slate-800">Panitia Qurban</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">9</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Peringatan Tahun Baru Islam 1449 H<br>
                  <span class="text-[11px] font-normal text-emerald-700">16 Juni 2027 (1 Muharram 1449 H)</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">PHBI Islam</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Pawai ta'aruf obor elektrik murid, muhasabah pergantian tahun hijriah, penetapan resolusi ibadah baru, dan santunan yatim piatu Muharram ceria.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Warga Sekolah<br><span class="font-medium text-slate-800">Guru PAI</span></td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 text-center font-mono">10</td>
                <td class="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  Gelar Karya Panen Belajar &amp; Pentas Seni Sunda<br>
                  <span class="text-[11px] font-normal text-purple-700">Juni 2027 (Pekan Pembagian Rapor)</span>
                </td>
                <td class="p-2 border-r border-slate-300 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">Gelar Budaya &amp; P5</span></td>
                <td class="p-2 border-r border-slate-300 text-slate-600 text-[11px]">Pameran produk inovasi murid hasil kokurikuler P5 / 7 Poé Atikan, pementasan seni tari Jaipong, degung Sunda, kaulinan barudak lembur, serta apresiasi murid berprestasi.</td>
                <td class="p-2 text-center text-slate-600 text-[11px]">Seluruh Siswa, Ortu, Komite<br><span class="font-medium text-slate-800">Tim P5 &amp; Kesenian</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    // Kustom / Default Generic
    return `
      <!-- Lampiran 2: Monitoring Keterlaksanaan -->
      <div class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-base text-slate-900">LAMPIRAN 2: INSTRUMEN MONITORING KETERLAKSANAAN PROGRAM SEKOLAH</h4>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Monitoring Operasional</span>
        </div>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Format kendali verifikasi keterlaksanaan tahapan program kerja di lingkungan satuan pendidikan:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border-r border-slate-300 w-1/3">Uraian Aksi Program</th>
                <th class="p-2 border-r border-slate-300 w-1/4 text-center">Sasaran Peserta</th>
                <th class="p-2 border-r border-slate-300 w-24 text-center">Keterlaksanaan</th>
                <th class="p-2">Bukti Fisik / Dokumentasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${[1, 2, 3, 4].map(idx => `
                <tr>
                  <td class="p-2 border-r border-slate-300 text-center font-mono">${idx}</td>
                  <td class="p-2 border-r border-slate-300 font-medium text-slate-800">Kegiatan Aksi Program ${idx}</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-600">Siswa & Guru</td>
                  <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Ya / Tidak</td>
                  <td class="p-2 text-slate-400 italic">[Foto / Notula / Daftar Hadir]</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lampiran 3: Evaluasi Target Mutu -->
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 class="font-bold text-base text-slate-900 mb-2">LAMPIRAN 3: LEMBAR EVALUASI CAPAIAN INDIKATOR KEBERHASILAN PROGRAM</h4>
        <p class="text-xs text-slate-600 mb-3 text-justify">
          Matriks evaluasi berkala untuk mengukur pencapaian target mutu dan perumusan tindak lanjut:
        </p>

        <div class="overflow-x-auto bg-white rounded border border-slate-300">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th class="p-2 border-r border-slate-300 w-1/3">Indikator Keberhasilan Program</th>
                <th class="p-2 border-r border-slate-300 w-1/4 text-center">Target Capaian</th>
                <th class="p-2 border-r border-slate-300 w-1/4 text-center">Realisasi Lapangan</th>
                <th class="p-2">Rekomendasi Keberlanjutan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">1. Partisipasi Aktif Sasaran Program</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-600 font-medium">Minimal 90%</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Tercapai 92%</td>
                <td class="p-2 text-slate-600">Pertahankan konsistensi pembiasaan</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">2. Ketersediaan Sarana Pendukung & Dokumen</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-600 font-medium">100% Siap</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Lengkap tersedia</td>
                <td class="p-2 text-slate-600">Peremajaan berkala bahan bacaan</td>
              </tr>
              <tr>
                <td class="p-2 border-r border-slate-300 font-semibold">3. Peningkatan Iklim Karakter Rapor Pendidikan</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-600 font-medium">Kategori Baik</td>
                <td class="p-2 border-r border-slate-300 text-center text-slate-400 italic">Peningkatan +12%</td>
                <td class="p-2 text-slate-600">Terus diperkuat melalui keteladanan guru</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

/**
 * Sync contenteditable changes back into data model
 */
export function syncCanvasToProgramData(data) {
  if (!data) return;
  const elements = document.querySelectorAll('#program-canvas-content [contenteditable="true"]');
  elements.forEach(el => {
    const path = el.getAttribute('data-path');
    if (!path) return;
    const val = el.innerText.trim();
    const parts = path.split('.');
    let cur = data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  });
}
