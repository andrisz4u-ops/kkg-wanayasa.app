import { describe, it, expect } from 'vitest';
import { generateRppBuffer } from '../src/lib/docx/rpp';

describe('RPP DOCX Generation', () => {
    const baseInput = {
        namaSekolah: 'SDN 2 Nangerang',
        namaGuru: 'Andris Hadiansyah, S.Pd',
        nipGuru: '198901012022211001',
        namaKepalaSekolah: 'Hj. Siti, M.Pd',
        nipKepalaSekolah: '197001011995032001',
        mataPelajaran: 'Matematika',
        topik: 'Perkalian Bilangan Cacah sampai 100.000',
        jenjangKelas: 'Kelas 5',
        semester: 'Ganjil',
        alokasiWaktu: '3 x 2 JP (3 Pertemuan)',
        jumlahPertemuan: 3,
        strategi: 'Problem Based Learning',
        profilLulusan: ['Bernalar Kritis', 'Gotong Royong'],
        tahunAjaran: '2026/2027'
    };

    const mockContent3Pertemuan = {
        identifikasi: {
            kesiapan: 'Sebagian besar murid telah memahami konsep perkalian dasar.',
            karakteristik: 'Visual dan Kinestetik.',
            kebutuhan: 'Bimbingan bertahap pada perkalian bersusun.'
        },
        desain: {
            capaian: 'Peserta didik dapat melakukan operasi perkalian bilangan cacah.',
            metode_pembelajaran: {
                strategi: 'Problem Based Learning',
                langkah_langkah: ['Orientasi masalah', 'Organisasi belajar', 'Penyelidikan']
            },
            sarana_prasarana: {
                sumber_belajar: 'Buku Guru dan Buku Siswa',
                media: 'Tabel nilai tempat',
                alat_peraga: 'Kartu angka'
            },
            diferensiasi: {
                visual: 'Bagan nilai tempat',
                auditori: 'Penjelasan konsep',
                kinestetik: 'Permainan kartu angka'
            }
        },
        pertemuan: [
            {
                nomor: 1,
                tujuan_pertemuan: ['Memahami konsep perkalian dasar 100.000'],
                kegiatan: {
                    pendahuluan: { isi: 'Guru menyapa dan berdoa.', waktu: '10 menit' },
                    mindful: { isi: 'Latihan pernapasan dan fokus.', waktu: '15 menit' },
                    meaningful: { isi: 'Diskusi studi kasus peternak.', waktu: '35 menit' },
                    joyful: { isi: 'Kuis interaktif kelompok.', waktu: '10 menit' },
                    penutup: { isi: 'Refleksi dan kesimpulan.', waktu: '10 menit' }
                },
                lkpd: {
                    identitas_petunjuk: '1. Bacalah petunjuk dengan seksama.',
                    tujuan_siswa: 'Mampu mengalikan bilangan cacah.',
                    masalah: 'Pak Harun memiliki 25.000 ayam.',
                    aktivitas: 'Isi tabel nilai tempat.',
                    hasil_kerja: 'Tuliskan hasil akhir.',
                    penilaian: '1. 25.000 x 5 = ...'
                }
            },
            {
                nomor: 2,
                // AI might return string instead of array for tujuan_pertemuan
                tujuan_pertemuan: '1. Menerapkan strategi perkalian cepat. 2. Menyelesaikan soal cerita.',
                kegiatan: {
                    pendahuluan: 'Guru menyapa dan ice breaking.',
                    mindful: 'Refleksi materi pertemuan 1.',
                    meaningful: 'Penyelidikan mandiri.',
                    joyful: 'Game estafet angka.',
                    penutup: 'Penugasan refleksi.'
                },
                lkpd: {
                    identitas_petunjuk: 'Kerjakan secara berpasangan.',
                    tujuan_siswa: 'Menyelesaikan masalah kontekstual.',
                    masalah: 'Koperasi sekolah membeli beras.',
                    aktivitas: 'Buat model matematika.',
                    hasil_kerja: 'Lembar jawaban bertingkat.',
                    penilaian: [
                        { nomor: 1, soal: 'Berapa total harga 100 kg beras jika per kg 15.000?' }
                    ]
                }
            },
            {
                nomor: 3,
                tujuan_pertemuan: ['Evaluasi dan pemecahan masalah kompleks'],
                kegiatan: {
                    pendahuluan: { isi: 'Apersepsi dan penguatan motivasi.', waktu: '10 menit' },
                    mindful: { isi: 'Analisis studi kasus riil.', waktu: '20 menit' },
                    meaningful: { isi: 'Presentasi hasil proyek kelompok.', waktu: '30 menit' },
                    joyful: { isi: 'Apresiasi dan tepuk salut.', waktu: '10 menit' },
                    penutup: { isi: 'Doa penutup dan salam.', waktu: '10 menit' }
                },
                lkpd: {
                    identitas_petunjuk: '1. Bacalah soal dengan teliti.\n2. Diskusikan.',
                    tujuan_siswa: 'Mampu merancang strategi perkalian efisien.',
                    masalah: 'Pak Harun peternak ayam dengan 25.000 ekor.',
                    aktivitas: '1. Tuliskan dalam tabel nilai tempat.\n2. Hitung jumlah telur.',
                    hasil_kerja: 'Tuliskan tabel nilai tempat dan langkah-langkah.',
                    penilaian: '1. Soal 1\n2. Soal 2\n3. Soal 3\n4. Soal 4\n5. Soal 5'
                }
            }
        ],
        asesmen: {
            formatif: 'Observasi selama diskusi kelompok dan LKPD.',
            sumatif: 'Tes tertulis 10 butir soal pilihan ganda dan esai.'
        }
    };

    it('should successfully generate DOCX buffer for 3 pertemuan without error', async () => {
        const buffer = await generateRppBuffer(
            baseInput as any,
            mockContent3Pertemuan as any,
            {
                nama_organisasi: 'KKG Kecamatan Wanayasa',
                alamat_sekretariat: 'Jl. Raya Wanayasa No. 12',
                tahun_ajaran: '2026/2027'
            }
        );

        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(1000);
        // Verify DOCX ZIP header PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
        expect(buffer[0]).toBe(0x50);
        expect(buffer[1]).toBe(0x4B);
        expect(buffer[2]).toBe(0x03);
        expect(buffer[3]).toBe(0x04);
    });

    it('should handle activities when formatted as array of items', async () => {
        const contentWithArrayKegiatan = {
            identifikasi: { kesiapan: 'Baik' },
            desain: { capaian: 'Capaian test', sarana_prasarana: 'Buku teks', diferensiasi: 'Bervariasi' },
            pertemuan: [
                {
                    nomor: 1,
                    tujuan_pertemuan: 'Tujuan tunggal sebagai string',
                    kegiatan: [
                        { fase: 'pendahuluan', isi: 'Aktivitas 1', waktu: '10m' },
                        { fase: 'mindful', isi: 'Aktivitas 2', waktu: '15m' },
                        { fase: 'meaningful', isi: 'Aktivitas 3', waktu: '35m' },
                        { fase: 'joyful', isi: 'Aktivitas 4', waktu: '10m' },
                        { fase: 'penutup', isi: 'Aktivitas 5', waktu: '10m' }
                    ]
                }
            ],
            asesmen: { formatif: 'Formatif', sumatif: 'Sumatif' }
        };

        const buffer = await generateRppBuffer(
            baseInput as any,
            contentWithArrayKegiatan as any,
            { nama_organisasi: 'KKG', alamat_sekretariat: 'Sekretariat' }
        );

        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(1000);
    });

    it('should handle stringified JSON in LKPD and missing optional fields', async () => {
        const contentWithStringLKPD = {
            identifikasi: {},
            desain: {},
            pertemuan: [
                {
                    nomor: 1,
                    tujuan_pertemuan: ['Tujuan 1'],
                    kegiatan: { pendahuluan: { isi: 'Intro' } },
                    lkpd: JSON.stringify({
                        identitas_petunjuk: 'Petunjuk',
                        tujuan_siswa: 'Tujuan',
                        masalah: 'Masalah',
                        aktivitas: 'Aktivitas',
                        hasil_kerja: 'Hasil',
                        penilaian: 'Penilaian'
                    })
                }
            ]
        };

        const buffer = await generateRppBuffer(
            baseInput as any,
            contentWithStringLKPD as any,
            { nama_organisasi: 'KKG' }
        );

        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(1000);
    });
});
