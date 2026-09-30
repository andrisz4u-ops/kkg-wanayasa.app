/**
 * =========================================================================
 * LEGAL & COMPLIANCE MODULE: PRIVACY POLICY & TERMS OF SERVICE
 * RuangKKG Digital - AI-Powered EdTech SaaS Platform
 * Selaras dengan UU No. 27/2022 (UU PDP) & Kriteria Audit AWS Activate
 * =========================================================================
 */

import { escapeHtml } from '../utils.js';

export async function renderPrivacyPolicy() {
  window.scrollTo(0, 0);
  return `
    <div class="min-h-screen bg-slate-50 py-12 md:py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div class="max-w-4xl mx-auto">
        <!-- Top Back Nav -->
        <div class="mb-8 flex items-center justify-between">
          <button 
            onclick="navigate('home')" 
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-400 font-bold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <i class="fas fa-arrow-left"></i>
            <span>Kembali ke Beranda</span>
          </button>

          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <i class="fas fa-shield-halved text-emerald-600"></i>
            <span>Kepatuhan UU PDP No. 27/2022</span>
          </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-12 md:p-16">
          <div class="border-b border-slate-100 pb-8 mb-8">
            <div class="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center text-2xl mb-4">
              <i class="fas fa-user-shield"></i>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display mb-3">
              Kebijakan Privasi (Privacy Policy)
            </h1>
            <p class="text-sm text-slate-500">
              Terakhir diperbarui: <strong>30 September 2026</strong> &bull; Versi Dokumen: 2.1 (AWS Compliance Ready)
            </p>
          </div>

          <div class="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600">
            <!-- 1. Pendahuluan -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">1.</span> Pendahuluan &amp; Komitmen Kami
              </h2>
              <p>
                Selamat datang di <strong>RuangKKG Digital</strong> (dikelola melalui portal resmi <a href="https://ruangkkg.my.id" class="text-teal-600 underline font-semibold">https://ruangkkg.my.id</a>). Kami berkomitmen tinggi untuk melindungi hak privasi dan data pribadi setiap pengguna, yang meliputi pendidik, staf kependidikan, pengawas sekolah, dan pemangku kepentingan pendidikan di Indonesia.
              </p>
              <p class="mt-2">
                Kebijakan Privasi ini disusun berdasarkan ketentuan <strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong> serta standar keamanan komputasi awan bertaraf internasional.
              </p>
            </section>

            <!-- 2. Data yang Dikumpulkan -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">2.</span> Informasi &amp; Data yang Kami Kumpulkan
              </h2>
              <p>Kami hanya mengumpulkan data yang diperlukan untuk penyelenggaraan layanan platform EdTech SaaS kami:</p>
              <ul class="list-disc pl-6 mt-3 space-y-2 text-slate-700">
                <li><strong>Data Identitas &amp; Kedinasan:</strong> Nama lengkap, gelar, NIP/NUPTK (opsional untuk kebutuhan kop surat), pangkat/golongan, dan unit kerja (satuan pendidikan).</li>
                <li><strong>Data Kontak &amp; Akun:</strong> Alamat email aktif, nomor WhatsApp/telepon (untuk keperluan verifikasi dan notifikasi kedinasan), dan kata sandi yang dienkripsi secara satu arah (hash bcrypt).</li>
                <li><strong>Data Masukan Pembelajaran:</strong> Topik materi ajar, pilihan capaian pembelajaran (CP), tujuan pembelajaran (TP), dan parameter modul ajar yang dimasukkan ke dalam AI Generator.</li>
                <li><strong>Data Teknis Log:</strong> Alamat protokol internet (IP Address), jenis peramban (browser), dan cap waktu akses untuk keperluan keamanan dan pencegahan serangan siber.</li>
              </ul>
            </section>

            <!-- 3. Kebijakan Khusus AI & Zero Data Training -->
            <section class="p-6 rounded-2xl bg-teal-50/70 border border-teal-200">
              <h2 class="text-lg font-bold text-teal-950 mb-2 flex items-center gap-2">
                <i class="fas fa-brain text-teal-600"></i>
                <span>3. Kebijakan AI &amp; Jaminan Zero Data Training</span>
              </h2>
              <p class="text-slate-800 text-sm leading-relaxed mb-3">
                Kami sangat memprioritaskan kerahasiaan materi ajar dan data instansi Anda. Kami menjamin bahwa:
              </p>
              <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li>Seluruh prompt, input silabus, dan data asesmen yang Anda berikan ke Asisten AI <strong>TIDAK PERNAH</strong> digunakan untuk melatih model kecerdasan buatan publik (<em>Zero Training Policy</em>).</li>
                <li>Pemrosesan AI dilakukan melalui saluran API berenkripsi tingkat enterprise (Enterprise Ingestion API).</li>
                <li>Hasil dokumen modul ajar yang dibuat sepenuhnya menjadi hak milik pengguna dan sekolah Anda.</li>
              </ul>
            </section>

            <!-- 4. Penggunaan Data Pribadi -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">4.</span> Tujuan Penggunaan Informasi
              </h2>
              <p>Informasi yang kami himpun digunakan secara eksklusif untuk:</p>
              <ol class="list-decimal pl-6 mt-2 space-y-1.5 text-slate-700">
                <li>Menyediakan layanan generator perangkat ajar berbasis AI (RPP, Kisi-kisi HOTS, LKPD, Slide Studio).</li>
                <li>Mengotentikasi hak akses pengguna ke ruang kerja pendidik dan data sekolah masing-masing.</li>
                <li>Menghasilkan dokumen resmi berformat Microsoft Word (.docx) dengan kop surat sekolah yang akurat.</li>
                <li>Memfasilitasi absensi digital kegiatan KKG, forum diskusi, dan berbagi materi ajar antar sekolah anggota.</li>
                <li>Memastikan keandalan, pemantauan uptime, serta keamanan infrastruktur cloud kami.</li>
              </ol>
            </section>

            <!-- 5. Keamanan & Enkripsi Data -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">5.</span> Keamanan &amp; Infrastruktur Komputasi Awan
              </h2>
              <p>
                RuangKKG Digital menerapkan standar proteksi siber berlapis:
              </p>
              <div class="grid sm:grid-cols-2 gap-4 mt-4 text-xs sm:text-sm">
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 class="font-bold text-slate-900 mb-1"><i class="fas fa-lock text-teal-600 mr-2"></i>Enkripsi SSL/TLS 256-Bit</h4>
                  <p class="text-slate-600">Seluruh lalu lintas transmisi data antara peramban pengguna dan server dienkripsi menggunakan protokol HTTPS termutakhir.</p>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 class="font-bold text-slate-900 mb-1"><i class="fas fa-shield-virus text-indigo-600 mr-2"></i>Proteksi CSRF &amp; Rate Limiting</h4>
                  <p class="text-slate-600">Sistem dilengkapi perlindungan Cross-Site Request Forgery dan pembatas laju request untuk mencegah serangan bot dan scraping.</p>
                </div>
              </div>
            </section>

            <!-- 6. Hak Pengguna Sesuai UU PDP -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">6.</span> Hak Pengguna (Subjek Data)
              </h2>
              <p>
                Sesuai dengan UU PDP Bab VI, Anda sebagai pemilik data pribadi memiliki hak untuk:
              </p>
              <ul class="list-disc pl-6 mt-2 space-y-1.5 text-slate-700">
                <li>Mengakses, meninjau, dan memperoleh salinan data profil yang tersimpan di portal kami.</li>
                <li>Memperbaiki atau memperbarui data akun dan informasi kedinasan yang tidak akurat.</li>
                <li>Mengajukan penghapusan akun (<em>Right to be Forgotten</em>) dan pembersihan riwayat dokumen terkait.</li>
                <li>Menarik kembali persetujuan pemrosesan data pribadi sewaktu-waktu.</li>
              </ul>
            </section>

            <!-- 7. Kontak Petugas Pelindungan Data -->
            <section class="border-t border-slate-200 pt-8 mt-8">
              <h2 class="text-xl font-bold text-slate-900 mb-2">
                7. Hubungi Petugas Pelindungan Data (DPO)
              </h2>
              <p class="text-sm text-slate-600 mb-4">
                Apabila Anda memiliki pertanyaan, keberatan, atau ingin menggunakan hak Anda terkait pelindungan data pribadi, silakan hubungi tim kepatuhan data kami:
              </p>
              <div class="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 class="font-bold text-white text-base">RuangKKG Digital &bull; Tim Kepatuhan Data</h4>
                  <p class="text-slate-400 text-xs mt-0.5">Purwakarta, Jawa Barat &bull; Republik Indonesia</p>
                </div>
                <a href="mailto:admin@ruangkkg.my.id" class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2">
                  <i class="fas fa-envelope"></i>
                  <span>admin@ruangkkg.my.id</span>
                </a>
              </div>
            </section>
          </div>
        </div>

        <!-- Footer Bottom Links -->
        <div class="mt-8 text-center text-xs text-slate-500">
          <p>&copy; ${new Date().getFullYear()} RuangKKG Digital. Hak Cipta Dilindungi Undang-Undang.</p>
          <div class="mt-2 flex items-center justify-center gap-4">
            <button onclick="navigate('terms')" class="text-teal-700 hover:underline font-semibold cursor-pointer">Syarat &amp; Ketentuan Layanan</button>
            <span>&bull;</span>
            <button onclick="navigate('home')" class="text-teal-700 hover:underline font-semibold cursor-pointer">Beranda Portal</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function renderTermsOfService() {
  window.scrollTo(0, 0);
  return `
    <div class="min-h-screen bg-slate-50 py-12 md:py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div class="max-w-4xl mx-auto">
        <!-- Top Back Nav -->
        <div class="mb-8 flex items-center justify-between">
          <button 
            onclick="navigate('home')" 
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-400 font-bold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <i class="fas fa-arrow-left"></i>
            <span>Kembali ke Beranda</span>
          </button>

          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
            <i class="fas fa-scale-balanced text-teal-600"></i>
            <span>Perjanjian SaaS Pengguna</span>
          </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-12 md:p-16">
          <div class="border-b border-slate-100 pb-8 mb-8">
            <div class="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center text-2xl mb-4">
              <i class="fas fa-file-contract"></i>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display mb-3">
              Syarat &amp; Ketentuan Layanan (Terms of Service)
            </h1>
            <p class="text-sm text-slate-500">
              Terakhir diperbarui: <strong>30 September 2026</strong> &bull; Versi Dokumen: 2.1 (SaaS Agreement)
            </p>
          </div>

          <div class="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600">
            <!-- 1. Penerimaan Ketentuan -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">1.</span> Penerimaan &amp; Ruang Lingkup
              </h2>
              <p>
                Dengan mengakses, mendaftar akun, atau menggunakan perangkat lunak berbasis web <strong>RuangKKG Digital</strong> ("Layanan" atau "Platform"), Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini.
              </p>
              <p class="mt-2">
                Layanan ini ditujukan bagi para guru, kepala sekolah, tenaga kependidikan, serta instansi pendidikan yang menyelenggarakan Kurikulum Merdeka atau kurikulum nasional resmi lainnya di Indonesia.
              </p>
            </section>

            <!-- 2. Akun & Keamanan Akses -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">2.</span> Pendaftaran Akun &amp; Kewajiban Pengguna
              </h2>
              <p>Dalam memanfaatkan layanan kami, Anda sepakat untuk:</p>
              <ul class="list-disc pl-6 mt-2 space-y-1.5 text-slate-700">
                <li>Memberikan informasi yang akurat, terkini, dan dapat dipertanggungjawabkan mengenai identitas dan satuan pendidikan Anda.</li>
                <li>Menjaga kerahasiaan kata sandi dan hak akses akun Anda dari pihak yang tidak berwenang.</li>
                <li>Bertanggung jawab penuh atas segala aktivitas yang terjadi di bawah akun Anda.</li>
              </ul>
            </section>

            <!-- 3. Hak Cipta & Kepemilikan Dokumen -->
            <section class="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200">
              <h2 class="text-lg font-bold text-indigo-950 mb-2 flex items-center gap-2">
                <i class="fas fa-copyright text-indigo-600"></i>
                <span>3. Hak Kekayaan Intelektual &amp; Kepemilikan Dokumen</span>
              </h2>
              <p class="text-slate-800 text-sm leading-relaxed mb-2">
                <strong>Kepemilikan Luaran Pengguna:</strong> Seluruh modul ajar, kisi-kisi asesmen, bahan presentasi, dan materi ajar yang dihasilkan melalui akun Anda merupakan hak milik Anda dan/atau satuan pendidikan Anda seutuhnya. Anda bebas mengunduh, mencetak, menggandakan, dan menggunakannya untuk kegiatan belajar mengajar resmi.
              </p>
              <p class="text-slate-800 text-sm leading-relaxed">
                <strong>Hak Milik Platform:</strong> Kode sumber perangkat lunak, antarmuka grafis, algoritma integrasi kurikulum, dan merek dagang <em>RuangKKG Digital</em> adalah milik eksklusif pengembang RuangKKG Digital.
              </p>
            </section>

            <!-- 4. Peran Asisten AI & Kebijakan Verifikasi -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">4.</span> Pemanfaatan Asisten AI &amp; Tanggung Jawab Pedagogik
              </h2>
              <p>
                Platform kami menggunakan model kecerdasan buatan mutakhir yang dirancang khusus untuk memandu penyusunan administrasi sesuai panduan BSKAP Kemendikbudristek. Namun demikian:
              </p>
              <ul class="list-disc pl-6 mt-2 space-y-1.5 text-slate-700">
                <li>Asisten AI bertindak sebagai <strong>rekan kerja bantu (co-pilot)</strong> bagi pendidik dalam merancang pembelajaran.</li>
                <li>Pengguna tetap berkewajiban melakukan penelaahan, penyesuaian konteks lokal kelas, serta validasi profesional sebelum mengimplementasikan perangkat ajar kepada peserta didik.</li>
              </ul>
            </section>

            <!-- 5. Kebijakan Penggunaan Wajar (Fair Usage) -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">5.</span> Kebijakan Penggunaan Wajar (Fair Usage Policy)
              </h2>
              <p>Demi menjaga stabilitas dan ketersediaan layanan bagi seluruh guru, pengguna dilarang:</p>
              <ul class="list-disc pl-6 mt-2 space-y-1.5 text-slate-700">
                <li>Melakukan reverse-engineering, crawling otomatis, atau serangan DDoS terhadap API portal.</li>
                <li>Memasukkan materi yang mengandung unsur kebencian, pornografi, SARA, atau konten yang melanggar hukum RI.</li>
                <li>Menyalahgunakan kuota inferensi AI untuk keperluan non-pendidikan atau komersialisasi pihak ketiga tanpa izin.</li>
              </ul>
            </section>

            <!-- 6. Ketersediaan Layanan & SLA -->
            <section>
              <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span class="text-teal-600">6.</span> Ketersediaan Layanan &amp; Jaminan Uptime (SLA)
              </h2>
              <p>
                RuangKKG Digital berjalan di atas infrastruktur komputasi edge modern yang didesain untuk ketersediaan <strong>99.9% uptime</strong>. Pemeliharaan terjadwal akan diinformasikan sebelumnya melalui papan pengumuman resmi di portal.
              </p>
            </section>

            <!-- 7. Penutup & Hukum yang Berlaku -->
            <section class="border-t border-slate-200 pt-8 mt-8">
              <h2 class="text-xl font-bold text-slate-900 mb-2">
                7. Hukum yang Berlaku &amp; Kontak Bantuan
              </h2>
              <p class="text-sm text-slate-600 mb-4">
                Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Apabila timbul perselisihan, para pihak sepakat untuk menyelesaikan melalui musyawarah mufakat terlebih dahulu.
              </p>
              <div class="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 class="font-bold text-white text-base">Pertanyaan Hukum &amp; Kemitraan SaaS</h4>
                  <p class="text-slate-400 text-xs mt-0.5">RuangKKG Digital &bull; Purwakarta, Jawa Barat, Indonesia</p>
                </div>
                <a href="mailto:admin@ruangkkg.my.id" class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2">
                  <i class="fas fa-envelope"></i>
                  <span>admin@ruangkkg.my.id</span>
                </a>
              </div>
            </section>
          </div>
        </div>

        <!-- Footer Bottom Links -->
        <div class="mt-8 text-center text-xs text-slate-500">
          <p>&copy; ${new Date().getFullYear()} RuangKKG Digital. Hak Cipta Dilindungi Undang-Undang.</p>
          <div class="mt-2 flex items-center justify-center gap-4">
            <button onclick="navigate('privacy-policy')" class="text-teal-700 hover:underline font-semibold cursor-pointer">Kebijakan Privasi</button>
            <span>&bull;</span>
            <button onclick="navigate('home')" class="text-teal-700 hover:underline font-semibold cursor-pointer">Beranda Portal</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
