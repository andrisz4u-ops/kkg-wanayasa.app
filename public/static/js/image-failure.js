const IMAGE_FAILURE_REASONS = {
  duplicate_image_rejected: 'gambar ini sama dengan soal lain',
  duplicate_visual_rejected: 'diagram ini sama dengan soal lain',
  image_not_selected: 'tidak terpilih karena kuota gambar',
  image_search_unavailable: 'pencarian gambar gagal',
  required_diagram_missing: 'soal membutuhkan gambar, tetapi tidak ada yang tersedia',
  required_image_missing: 'gambar wajib tidak ditemukan',
  image_generation_disabled: 'pembuatan gambar dinonaktifkan',
  expired_or_missing: 'tautan gambar sudah kedaluwarsa atau hilang',
  untrusted_svg: 'diagram tidak lolos validasi keamanan',
  invalid_image: 'berkas gambar tidak valid',
  image_unavailable: 'gambar tidak tersedia',
};

export function describeImageFailure(image) {
  if (!image || typeof image !== 'object') return '';
  const reason = image.imageUnavailableReason || image.imageWarningReason;
  const label = IMAGE_FAILURE_REASONS[reason];
  return label ? ` Alasan: ${label}.` : '';
}
