import { buildScene, sceneSvg, escapeXml } from './scene.js';
import { deckIssues } from './lesson-model.js';
import { getTemplate } from './templates.js';
let loader;
export function loadPptx() {
  if (window.PptxGenJS) return Promise.resolve(window.PptxGenJS);
  if (!loader) loader = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = '/static/vendor/pptxgen.bundle.js';
    script.onload = () => {
      if (window.PptxGenJS) resolve(window.PptxGenJS);
      else { loader = null; script.remove(); reject(new Error('Pustaka PPTX belum tersedia.')); }
    };
    script.onerror = () => { loader = null; script.remove(); reject(new Error('Pustaka PPTX belum dimuat. Periksa koneksi lalu coba lagi.')); };
    document.head.append(script);
  });
  return loader;
}
export function exportScenes(deck, template, config) {
  const issues = deckIssues(deck);
  const scenes = deck.slides.map((slide, index) => buildScene(slide, template, { aspectRatio: config.aspectRatio, index, total: deck.slides.length }));
  const all = [...issues, ...scenes.flatMap((scene, i) => [...scene.warnings, ...(['quiz', 'flipcard'].includes(deck.slides[i].layout) ? buildScene(deck.slides[i], template, { aspectRatio: config.aspectRatio, reveal: true }).warnings : [])].map(w => `Slide ${i + 1}: ${w}`))];
  if (all.length) throw new Error(`Perbaiki slide sebelum ekspor: ${all.slice(0, 3).join(' ')}`);
  return scenes;
}
async function embedImages(scenes) {
  const cache = new Map();
  for (const node of scenes.flatMap(scene => scene.nodes).filter(node => node.kind === 'image')) {
    if (!cache.has(node.url)) {
      const response = await fetch(node.url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/')) throw new Error('Foto belum dapat disertakan. Ganti foto atau gunakan diagram sebelum ekspor.');
      const blob = await response.blob();
      let data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
      const image = new Image(); image.src = data;
      try { await image.decode(); } catch { throw new Error('Foto belum dapat dibaca. Ganti foto atau gunakan diagram sebelum ekspor.'); }
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('Ukuran foto belum tersedia.');
      if (!['image/png', 'image/jpeg'].includes(blob.type)) {
        const canvas = document.createElement('canvas'); canvas.width = Math.min(2048, image.naturalWidth); canvas.height = Math.max(1, Math.round(canvas.width * image.naturalHeight / image.naturalWidth));
        const context = canvas.getContext('2d'); if (!context) throw new Error('Foto belum dapat dikonversi untuk PPTX.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height); data = canvas.toDataURL('image/png');
      }
      cache.set(node.url, { url: data, imageWidth: image.naturalWidth, imageHeight: image.naturalHeight });
    }
    Object.assign(node, cache.get(node.url));
  }
}
export function populatePptx(pptx, scenes, title, template, aspectRatio) {
  const scale = 7.5 / 720;
  pptx.defineLayout({ name: 'KKG_CLASSROOM', width: scenes[0].width * scale, height: 7.5 }); pptx.layout = 'KKG_CLASSROOM';
  pptx.author = 'RuangKKG'; pptx.subject = 'Media pembelajaran SD'; pptx.title = title; pptx.lang = 'id-ID';
  const theme = getTemplate(template); pptx.theme = { headFontFace: theme.headingFont, bodyFontFace: theme.font, lang: 'id-ID' };
  for (const scene of scenes) {
    const slide = pptx.addSlide();
    for (const node of scene.nodes) {
      const common = { x: node.x * scale, y: node.y * scale, w: node.w * scale, h: node.h * scale };
      if (node.kind === 'text') slide.addText(node.lines.join('\n'), { ...common, fontFace: node.font, fontSize: node.size * scale * 72, color: node.color.replace('#', ''), bold: node.bold, align: node.align, valign: 'top', margin: 0, breakLine: false, lineSpacingMultiple: 1.23, paraSpaceAfter: 0 });
      else if (node.kind === 'image') {
        if (!node.imageWidth || !node.imageHeight) throw new Error('Ukuran foto diperlukan sebelum ekspor PPTX.');
        slide.addImage({ ...common, w: common.h * node.imageWidth / node.imageHeight, data: node.url, altText: node.alt, sizing: { type: 'cover', w: common.w, h: common.h } });
      }
      else if (node.kind === 'line') slide.addShape(pptx.ShapeType?.line || 'line', { x: node.x * scale, y: node.y * scale, w: (node.x2 - node.x) * scale, h: (node.y2 - node.y) * scale, line: { color: node.color.replace('#', ''), width: node.thickness * scale * 72 } });
      else slide.addShape(pptx.ShapeType?.[node.kind === 'ellipse' ? 'ellipse' : node.kind === 'triangle' ? 'triangle' : node.radius ? 'roundRect' : 'rect'] || (node.kind === 'ellipse' ? 'ellipse' : node.kind === 'triangle' ? 'triangle' : node.radius ? 'roundRect' : 'rect'), { ...common, rotate: node.rotation || 0, radius: (node.radius || 0) * scale, fill: { color: node.fill.replace('#', '') }, line: { color: (node.stroke || node.fill).replace('#', ''), width: node.stroke ? 1 : 0 } });
    }
    if (scene.notes) slide.addNotes(scene.notes);
  }
  return pptx;
}
export async function exportPptx(deck, template, config) {
  const scenes = exportScenes(deck, template, config); await embedImages(scenes);
  const Pptx = await loadPptx(); const pptx = populatePptx(new Pptx(), scenes, deck.title, template, config.aspectRatio);
  const blob = await pptx.write({ outputType: 'blob' });
  download(blob, `${safeName(deck.title)}.pptx`, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
}
export function safeName(title) { return String(title || 'Slide KKG').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').slice(0, 90) || 'Slide KKG'; }
export async function htmlPresentation(deck, template, config) {
  const scenes = exportScenes(deck, template, config), revealed = deck.slides.map((s, index) => buildScene(s, template, { aspectRatio: config.aspectRatio, index, total: deck.slides.length, reveal: true }));
  await embedImages([...scenes, ...revealed]);
  const data = JSON.stringify({ normal: scenes.map(s => sceneSvg(s)), revealed: revealed.map(s => sceneSvg(s)), notes: scenes.map(s => s.notes), interactive: deck.slides.map(s => ['quiz', 'flipcard'].includes(s.layout)) }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeXml(deck.title)}</title>
<style>body{margin:0;background:#12251e;color:#fff;font:16px Calibri,Arial,sans-serif;min-height:100dvh;display:flex;flex-direction:column}#stage{flex:1;display:grid;place-items:center;padding:12px}#stage svg{max-height:82dvh;max-width:100%;width:auto!important}nav{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:10px}button{min-height:44px;padding:8px 16px;border:1px solid #829c8e;border-radius:8px;background:#fff;color:#14392e;cursor:pointer}button:focus-visible{outline:3px solid #ccebd7;outline-offset:3px}button:disabled{opacity:.55}#notes{padding:12px 24px;white-space:pre-wrap;background:#20382c}#position{align-self:center;padding:8px}[hidden]{display:none!important}</style></head>
<body><main id="stage" aria-label="Slide"></main><nav aria-label="Kontrol presentasi"><button id="prev">Sebelumnya</button><span id="position" aria-live="polite"></span><button id="next">Berikutnya</button><button id="answer" aria-pressed="false">Buka jawaban</button><button id="teacher" aria-pressed="false">Catatan guru</button></nav><aside id="notes" hidden></aside>
<script>
const deck=${data};let index=0,reveal=false;
const stage=document.getElementById('stage'),notes=document.getElementById('notes'),answer=document.getElementById('answer');
function render(){
  stage.innerHTML=(reveal?deck.revealed:deck.normal)[index];
  document.getElementById('position').textContent=(index+1)+' / '+deck.normal.length;
  document.getElementById('prev').disabled=index===0;document.getElementById('next').disabled=index===deck.normal.length-1;
  answer.hidden=!deck.interactive[index];answer.textContent=reveal?'Tutup jawaban':'Buka jawaban';answer.setAttribute('aria-pressed',String(reveal));
  notes.textContent=deck.notes[index]||'Tidak ada catatan guru.';
}
function move(n){index=Math.max(0,Math.min(deck.normal.length-1,index+n));reveal=false;render();}
document.getElementById('prev').onclick=()=>move(-1);document.getElementById('next').onclick=()=>move(1);
answer.onclick=()=>{reveal=!reveal;render();};
document.getElementById('teacher').onclick=event=>{notes.hidden=!notes.hidden;event.currentTarget.setAttribute('aria-pressed',String(!notes.hidden));};
document.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||(event.key===' '&&!event.target.closest('button'))){event.preventDefault();move(1);}if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}});
render();
</script></body></html>`;
}
export function download(content, fileName, type) {
  const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
