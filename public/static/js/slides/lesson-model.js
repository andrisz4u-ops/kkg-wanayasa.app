export const LAYOUTS = ['title', 'content', 'twoColumn', 'imageText', 'timeline', 'stats', 'comparison', 'quiz', 'flipcard', 'gridCards', 'activity', 'quote', 'summary', 'thankyou'];
export const text = value => value == null ? '' : typeof value === 'object' ? text(value.text || value.point || value.bullet || value.desc || value.description || value.explanation || value.title || value.name || '') : String(value).replace(/\*\*(.*?)\*\*/g, '$1').replace(/<[^>]*>/g, '').trim();
const list = value => {
  const source = value && !Array.isArray(value) && typeof value === 'object' ? value.points || value.bullets || value.items || value.bulletPoints || value.content || value : value;
  return (Array.isArray(source) ? source : source ? [source] : []).map(text).filter(Boolean);
};
export const isLearningObjectivesSlide = slide => /^(?:slide\s*\d*\s*[:.)-]?\s*)?(?:tujuan\s+(?:pembelajaran|belajar)|learning\s+objectives?)\b/i.test(text(slide?.title || slide?.judul));
export function normalizeSlide(raw = {}, index = 0) {
  if (typeof raw !== 'object' || raw === null) raw = { content: list(raw) };
  const q = Array.isArray(raw.question) ? raw.question[0] : raw.question;
  const question = q && typeof q === 'object' ? q : {};
  const content = [raw.content, raw.points, raw.bullets, raw.bulletPoints, raw.body, raw.description, raw.poin, raw.materi].map(list).find(items => items.length) || [];
  const rawCards = Array.isArray(raw.cards) ? raw.cards : Array.isArray(raw.gridCards) ? raw.gridCards : [];
  let cards = rawCards.map(row => typeof row === 'string' ? { title: text(row), desc: '', badge: '' } : { title: text(row?.title || row?.heading || row?.label || row?.name), desc: text(row?.desc || row?.description || row?.text || row?.content || row?.penjelasan), badge: text(row?.badge || row?.tag || row?.kategori) });
  if (!cards.length && raw.layout === 'gridCards' && content.length >= 2) {
    cards = content.slice(0, 4).map(c => {
      const parts = c.split(/[:\-|]/);
      return parts.length > 1 ? { title: text(parts[0]), desc: text(parts.slice(1).join('-')), badge: '' } : { title: text(c), desc: '', badge: '' };
    });
  }
  return {
    ...raw, layout: LAYOUTS.includes(raw.layout) ? raw.layout : 'content', title: text(raw.title || raw.judul) || `Slide ${index + 1}`,
    subtitle: text(raw.subtitle || raw.subjudul), content,
    leftTitle: text(raw.leftTitle || raw.left_title), leftContent: list(raw.leftContent || raw.left_content), rightTitle: text(raw.rightTitle || raw.right_title), rightContent: list(raw.rightContent || raw.right_content),
    question: text(question.text || question.question || question.prompt || q), quizOptions: list(raw.quizOptions || raw.options || question.quizOptions || question.options), quizAnswer: text(raw.quizAnswer || raw.answer || question.quizAnswer || question.answer), quizExplanation: text(raw.quizExplanation || raw.explanation || question.quizExplanation),
    timeline: (Array.isArray(raw.timeline) ? raw.timeline : []).map((row, i) => typeof row === 'string' ? { title: row, desc: '', step: String(i + 1) } : { step: text(row?.step) || String(i + 1), title: text(row?.title || row?.name), desc: text(row?.desc || row?.description || row?.text) }),
    stats: (Array.isArray(raw.stats) ? raw.stats : []).map(row => ({ value: text(row?.value ?? row?.angka), label: text(row?.label || row?.title), desc: text(row?.desc) })),
    flipcards: (Array.isArray(raw.flipcards) ? raw.flipcards : []).map(row => ({ front: text(row?.front || row?.term), back: text(row?.back || row?.definition || row?.answer) })),
    cards,
    instruction: text(raw.instruction), time: text(raw.time), groupSize: text(raw.groupSize), materials: text(raw.materials), quote: text(raw.quote), author: text(raw.author),
    speakerNotes: text(raw.speakerNotes), visual: normalizeVisual(raw.visual), image: raw.image && /^(?:https?:\/\/|data:image\/)/.test(raw.image.url) ? raw.image : undefined,
    imageQuery: text(raw.imageQuery || raw.image_query), imagePrompt: text(raw.imagePrompt || raw.image_prompt),
  };
}
export function normalizeVisual(raw) {
  if (!raw || !['fraction', 'process', 'cycle', 'numberLine', 'concept'].includes(raw.type)) return undefined;
  return { type: raw.type, label: text(raw.label), numerator: Number(raw.numerator), denominator: Number(raw.denominator), min: Number(raw.min), max: Number(raw.max), value: Number(raw.value), nodes: (Array.isArray(raw.nodes) ? raw.nodes : []).map(node => ({ label: text(node?.label || node?.title || node), detail: text(node?.detail || node?.desc) })) };
}
export function normalizeDeck(raw, topic = '') {
  const source = raw?.presentation || raw?.data || raw;
  const slides = Array.isArray(source) ? source : source?.slides || source?.slide || [];
  return { title: text(source?.title || source?.judul) || topic || 'Presentasi pembelajaran', subtitle: text(source?.subtitle), slides: (Array.isArray(slides) ? slides : []).map(normalizeSlide), meta: source?.meta || {} };
}
export function normalizeGeneratedDeck(raw, topic = '') {
  const deck = normalizeDeck(raw, topic);
  deck.slides = deck.slides.filter(slide => !isLearningObjectivesSlide(slide));
  return deck;
}
export function answerIndex(slide) {
  const answer = text(slide.quizAnswer).toLowerCase();
  if (!answer) return -1;
  const letter = answer.match(/^([a-d])(?:[.\s:)\-]|$)/i);
  if (letter && letter[1].charCodeAt(0) - 97 < slide.quizOptions.length) return letter[1].charCodeAt(0) - 97;
  return slide.quizOptions.findIndex(option => text(option).replace(/^[a-d][.\s:)\-]+/i, '').toLowerCase() === answer);
}
export function slideIssues(input) {
  const s = normalizeSlide(input); const issues = [];
  const words = v => text(v).split(/\s+/).filter(Boolean).length;
  if (!s.title || /^Slide \d+$/.test(s.title)) issues.push('Isi judul yang menjelaskan gagasan slide.');
  if (words(s.title) > 15 || s.title.length > 120) issues.push('Ringkas judul menjadi paling banyak 15 kata / 120 karakter.');
  if (words(s.subtitle) > 35) issues.push('Ringkas subjudul menjadi paling banyak 35 kata.');
  const points = ['twoColumn', 'comparison'].includes(s.layout) ? [...s.leftContent, ...s.rightContent] : s.content;
  if (points.some(point => words(point) > 50 || point.length > 320)) issues.push('Ringkas setiap poin agar tetap nyaman dibaca siswa (maksimal 50 kata / 320 karakter).');
  if (s.content.length > 6 || s.leftContent.length > 4 || s.rightContent.length > 4) issues.push('Gunakan paling banyak 6 poin materi atau 4 poin per kolom.');
  if (['content', 'summary', 'imageText'].includes(s.layout) && !s.content.length) issues.push('Tambahkan konsep inti yang akan dipelajari.');
  if (s.layout === 'imageText' && !s.visual && !s.image && !s.imageQuery) issues.push('Tambahkan diagram yang terkait materi atau pilih layout Konsep inti.');
  if (['comparison', 'twoColumn'].includes(s.layout) && (!s.leftTitle || !s.rightTitle || !s.leftContent.length || !s.rightContent.length)) issues.push('Lengkapi kedua judul dan isi kolom.');
  if (s.layout === 'timeline' && (s.timeline.length < 2 || s.timeline.length > 5 || s.timeline.some(row => !row.title || words(row.title) > 10 || words(row.desc) > 35))) issues.push('Isi 2 sampai 5 tahap dengan judul pendek dan penjelasan ringkas.');
  if (s.layout === 'stats' && (!s.stats.length || s.stats.length > 4 || s.stats.some(row => !row.value || !row.label || words(row.desc) > 25))) issues.push('Isi 1 sampai 4 angka yang mempunyai makna; jangan membuat statistik pengganti.');
  if (s.layout === 'quiz' && (!s.question || s.quizOptions.length < 2 || s.quizOptions.length > 4 || answerIndex(s) < 0 || !s.quizExplanation || new Set(s.quizOptions.map(v => v.toLowerCase())).size !== s.quizOptions.length || s.quizOptions.some(v => words(v) > 20) || words(s.question) > 45)) issues.push('Lengkapi pertanyaan, 2 sampai 4 pilihan berbeda, jawaban sah dan pembahasan singkat.');
  if (s.layout === 'flipcard' && (!s.flipcards.length || s.flipcards.length > 4 || s.flipcards.some(row => !row.front || !row.back || words(row.front) > 12 || words(row.back) > 30))) issues.push('Lengkapi 1 sampai 4 kartu dengan istilah dan jawaban ringkas.');
  if (s.layout === 'gridCards' && (!s.cards.length || s.cards.length < 2 || s.cards.length > 4 || s.cards.some(row => !row.title || words(row.title) > 15 || words(row.desc) > 50))) issues.push('Isi 2 sampai 4 kartu konsep dengan judul dan penjelasan yang jelas.');
  if (s.layout === 'activity' && (!s.instruction || words(s.instruction) > 65)) issues.push('Tuliskan aktivitas konkret dengan instruksi paling banyak 65 kata.');
  if (s.layout === 'quote' && !s.quote) issues.push('Isi definisi atau kutipan, dan cantumkan sumber untuk kutipan tokoh.');
  if (s.visual?.type === 'fraction' && (!Number.isInteger(s.visual.denominator) || s.visual.denominator < 2 || s.visual.denominator > 12 || !Number.isInteger(s.visual.numerator) || s.visual.numerator < 0 || s.visual.numerator > s.visual.denominator)) issues.push('Diagram pecahan memerlukan pembilang 0 sampai penyebut, dengan penyebut 2 sampai 12.');
  if (['process', 'cycle', 'concept'].includes(s.visual?.type) && (s.visual.nodes.length < 2 || s.visual.nodes.length > 5 || s.visual.nodes.some(row => !row.label || words(row.label) > 8))) issues.push('Diagram memerlukan 2 sampai 5 label.');
  if (s.visual?.type === 'numberLine' && (!Number.isFinite(s.visual.min) || !Number.isFinite(s.visual.max) || !Number.isFinite(s.visual.value) || s.visual.max <= s.visual.min || s.visual.value < s.visual.min || s.visual.value > s.visual.max)) issues.push('Periksa batas dan posisi nilai pada garis bilangan.');
  return issues;
}
export function deckIssues(deck, expectedCount, { allowCountMismatch = false } = {}) {
  const issues = deck.slides.flatMap((slide, i) => slideIssues(slide).map(message => `Slide ${i + 1}: ${message}`));
  if (!allowCountMismatch && expectedCount != null && deck.slides.length !== expectedCount) issues.unshift(`Jumlah slide ${deck.slides.length}, target ${expectedCount}.`);
  if (expectedCount != null && deck.slides.length) {
    if (deck.slides[0].layout !== 'title') issues.push('Awali deck dengan pembuka yang memberi konteks pelajaran.');
    if (!['summary', 'thankyou'].includes(deck.slides.at(-1).layout)) issues.push('Akhiri deck dengan rangkuman atau pertanyaan refleksi.');
    if (deck.slides.length >= 6 && !deck.slides.some(s => s.layout === 'activity')) issues.push('Sertakan aktivitas konkret yang dapat dilakukan siswa.');
    if (deck.slides.length >= 6 && !deck.slides.some(s => ['quiz', 'flipcard'].includes(s.layout))) issues.push('Sertakan pemeriksaan pemahaman siswa.');
  }
  if (!deck.slides.length) issues.unshift('Presentasi belum mempunyai slide.');
  if (deck.slides.length >= 6 && new Set(deck.slides.map(s => s.layout)).size < 3) issues.push('Variasikan setidaknya 3 jenis layout untuk deck 6 slide atau lebih.');
  return issues;
}
export function teacherNotes(slide) {
  const s = normalizeSlide(slide);
  return [s.speakerNotes, s.layout === 'quiz' ? `Jawaban: ${s.quizOptions[answerIndex(s)] || s.quizAnswer}. ${s.quizExplanation}` : '', s.layout === 'flipcard' ? s.flipcards.map(row => `${row.front}: ${row.back}`).join('\n') : ''].filter(Boolean).join('\n\n');
}
