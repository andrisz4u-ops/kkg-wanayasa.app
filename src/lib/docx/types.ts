export interface SuratData {
    nomor_surat: string;
    jenis_kegiatan: string;
    tanggal_kegiatan: string;
    waktu_kegiatan: string;
    tempat_kegiatan: string;
    agenda: string;
    peserta?: string[];
    penanggung_jawab: string;
    isi_surat: string;
    created_at: string;
}

export interface ProkerData {
    tahun_ajaran: string;
    visi: string;
    misi: string;
    kegiatan: any[];
    analisis_kebutuhan?: string;
    isi_dokumen: string;
    created_at: string;
}

export interface LaporanData {
    judul_laporan: string;
    periode: string;
    pendahuluan_latar_belakang: string;
    pendahuluan_tujuan: string;
    pendahuluan_manfaat: string;
    pelaksanaan_waktu_tempat: string;
    pelaksanaan_materi: string;
    pelaksanaan_peserta: string;
    hasil_uraian: string;
    hasil_tindak_lanjut: string;
    hasil_dampak: string;
    penutup_simpulan: string;
    penutup_saran: string;
    created_at?: string;
}

export interface KKGSettings {
    nama_ketua?: string;
    nip_ketua?: string;
    alamat_sekretariat?: string;
    tahun_ajaran?: string;
    nama_organisasi?: string;
    kop_surat_url?: string;
}

// Assuming Kegiatan type is defined elsewhere or implicitly 'any'
export interface Kegiatan {
    nama_kegiatan: string;
    waktu_pelaksanaan: string;
    penanggung_jawab: string;
    anggaran: string;
    indikator: string;
}

// ============================================
// Document Styles
// ============================================

export const FONT_FAMILY = 'Times New Roman';
export const FONT_SIZE_NORMAL = 24; // 12pt
export const FONT_SIZE_SMALL = 22; // 11pt
export const FONT_SIZE_HEADER = 28; // 14pt
export const FONT_SIZE_TITLE = 32; // 16pt

// ============================================
// Helper Functions
// ============================================

// Clean markdown symbols and convert to plain text
// Helper to clean markdown and sanitize text for DOCX

export interface RppInputData {
    namaSekolah: string;
    namaKepalaSekolah?: string;
    nipKepalaSekolah?: string;
    namaGuru: string;
    nipGuru?: string;
    mataPelajaran: string;
    topik: string;
    jenjangKelas: string;
    semester: string;
    alokasiWaktu: string;
    strategi: string;
    modelPembelajaran: string;
    jumlahPertemuan: string;
    aspekPerkembangan?: string; 
    profilLulusan?: string[];
    tanggal?: string;
    tahunAjaran?: string;
    jabatanGuru?: string;
}

export interface RppContentData {
    identifikasi?: any;
    desain?: any;
    pertemuan?: Array<{
        nomor: number;
        tujuan_pertemuan?: string[];
        tujuan?: string[];
        kegiatan?: {
            pendahuluan?: { isi?: string; waktu?: string };
            mindful?: { isi?: string; waktu?: string };
            meaningful?: { isi?: string; waktu?: string };
            joyful?: { isi?: string; waktu?: string };
            penutup?: { isi?: string; waktu?: string };
        };
        lkpd?: {
            identitas_petunjuk?: string;
            tujuan_siswa?: string;
            masalah?: string;
            aktivitas?: string;
            hasil_kerja?: string;
            penilaian?: string;
        };
    }>;
    asesmen?: { formatif?: string; sumatif?: string };
}

// Helper: create bordered table cell for RPP
