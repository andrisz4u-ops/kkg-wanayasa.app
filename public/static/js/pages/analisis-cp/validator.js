// Client-side validation & auto-repair untuk hasil output Analisis CP
// public/static/js/pages/analisis-cp/validator.js

/**
 * Validasi dan perbaikan otomatis data Analisis CP sebelum rendering atau penyimpanan
 * @param {object} rawData - Data mentah hasil generate AI atau dari cache/DB
 * @param {Array} inputChapters - Daftar bab yang dimasukkan pengguna
 * @param {object} formMeta - Data form/identitas sekolah
 * @returns {object} Data terstruktur yang sudah tervalidasi dan diperbaiki
 */
export function validateAndRepairAnalysisData(rawData, inputChapters = [], formMeta = {}) {
  const data = (rawData && typeof rawData === 'object') ? JSON.parse(JSON.stringify(rawData)) : {};

  // 1. Normalisasi Metadata
  data.metadata = data.metadata || {};
  data.metadata.satuan_pendidikan = data.metadata.satuan_pendidikan || formMeta.namaSekolah || 'SDN';
  data.metadata.mata_pelajaran = data.metadata.mata_pelajaran || formMeta.mataPelajaran || '';
  data.metadata.fase = data.metadata.fase || formMeta.fase || 'Fase C';

  const rawKelas = String(data.metadata.kelas || formMeta.jenjangKelas || '5');
  const kelasNum = rawKelas.replace(/\D/g, '') || '5';
  data.metadata.kelas = kelasNum;
  data.metadata.fase_kelas = data.metadata.fase_kelas || `${data.metadata.fase}/${kelasNum}`;
  data.metadata.tahun_pembelajaran = data.metadata.tahun_pembelajaran || formMeta.tahunAjaran || '2025/2026';

  // 2. Normalisasi Semesters
  if (!Array.isArray(data.semesters) || data.semesters.length === 0) {
    if (Array.isArray(data.babs) && data.babs.length > 0) {
      data.semesters = [
        {
          semester: 1,
          semester_label: 'SEMESTER 1',
          babs: data.babs.filter(b => b.semester !== 2)
        },
        {
          semester: 2,
          semester_label: 'SEMESTER 2',
          babs: data.babs.filter(b => b.semester === 2)
        }
      ];
    } else {
      data.semesters = [
        { semester: 1, semester_label: 'SEMESTER 1', babs: [] },
        { semester: 2, semester_label: 'SEMESTER 2', babs: [] }
      ];
    }
  }

  // 3. Verifikasi Kelengkapan Bab Sesuai Input
  if (Array.isArray(inputChapters) && inputChapters.length > 0) {
    const existingBabNos = new Set();
    for (const sem of data.semesters) {
      if (Array.isArray(sem.babs)) {
        for (const b of sem.babs) {
          if (typeof b.no === 'number') existingBabNos.add(b.no);
        }
      }
    }

    // Jika ada bab dari input yang terlewat oleh AI, sisipkan otomatis
    for (const ch of inputChapters) {
      if (!existingBabNos.has(ch.no)) {
        const targetSem = ch.semester === 2 ? 2 : 1;
        let semObj = data.semesters.find(s => s.semester === targetSem);
        if (!semObj) {
          semObj = { semester: targetSem, semester_label: `SEMESTER ${targetSem}`, babs: [] };
          data.semesters.push(semObj);
        }
        if (!Array.isArray(semObj.babs)) semObj.babs = [];

        const materiList = Array.isArray(ch.materi_pokok) && ch.materi_pokok.length > 0
          ? ch.materi_pokok
          : [ch.bab || `Topik ${ch.no}`];

        semObj.babs.push({
          no: ch.no,
          bab: ch.bab || `Bab ${ch.no}`,
          cp: formMeta.baseCP || 'Peserta didik memahami dan menerapkan kompetensi dasar sesuai kurikulum.',
          materi_list: materiList,
          items: materiList.map((m) => ({
            kode_tp: '',
            materi_pokok: m,
            tp: `Peserta didik mampu memahami dan menguasai materi ${m}.`,
            atp: `Mempelajari konsep dasar ${m}, mendiskusikannya secara kelompok, dan mengerjakan asesmen formatif.`,
            alokasi_waktu: '4 JP'
          }))
        });
        existingBabNos.add(ch.no);
      }
    }
  }

  // 4. Pastikan Urutan Semester & Penomoran Kode TP Sekuensial Global (5.1, 5.2, 5.3, ...)
  data.semesters.sort((a, b) => (a.semester || 1) - (b.semester || 1));

  let globalTpCounter = 1;
  for (const sem of data.semesters) {
    if (!sem.semester_label) {
      sem.semester_label = `SEMESTER ${sem.semester || 1}`;
    }
    if (!Array.isArray(sem.babs)) sem.babs = [];
    sem.babs.sort((a, b) => (a.no || 0) - (b.no || 0));

    for (const bab of sem.babs) {
      if (!Array.isArray(bab.items) || bab.items.length === 0) {
        bab.items = [
          {
            kode_tp: `${kelasNum}.${globalTpCounter++}`,
            materi_pokok: bab.bab || 'Materi Pokok',
            tp: `Peserta didik mampu memahami konsep ${bab.bab || 'materi ini'}.`,
            atp: `Eksplorasi konsep, diskusi terbimbing, dan penerapan kompetensi.`,
            alokasi_waktu: '4 JP'
          }
        ];
      } else {
        for (const item of bab.items) {
          // Selalu tegakkan kode_tp sekuensial kedinasan tanpa reset antar bab
          item.kode_tp = `${kelasNum}.${globalTpCounter++}`;

          // Format alokasi waktu standar (misal "4 JP")
          if (!item.alokasi_waktu || typeof item.alokasi_waktu !== 'string') {
            item.alokasi_waktu = '4 JP';
          } else {
            const jpMatch = item.alokasi_waktu.match(/\d+/);
            const jpNum = jpMatch ? parseInt(jpMatch[0], 10) : 4;
            item.alokasi_waktu = `${jpNum} JP`;
          }

          if (!item.materi_pokok) item.materi_pokok = bab.bab || 'Materi Pokok';
          if (!item.tp) item.tp = `Peserta didik mampu memahami konsep ${item.materi_pokok}.`;
          if (!item.atp) item.atp = `Aktivitas pembelajaran dan latihan kompetensi terkait ${item.materi_pokok}.`;
        }
      }
    }
  }

  return data;
}
