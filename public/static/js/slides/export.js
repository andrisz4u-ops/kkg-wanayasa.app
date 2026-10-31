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
      let data = node.url;
      let naturalWidth = 0;
      let naturalHeight = 0;
      if (node.url.startsWith('data:image/')) {
        const image = new Image();
        image.src = node.url;
        try { await image.decode(); } catch { throw new Error('Foto belum dapat dibaca. Ganti foto atau gunakan diagram sebelum ekspor.'); }
        naturalWidth = image.naturalWidth;
        naturalHeight = image.naturalHeight;
      } else {
        const response = await fetch(node.url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/')) throw new Error('Foto belum dapat disertakan. Ganti foto atau gunakan diagram sebelum ekspor.');
        const blob = await response.blob();
        data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
        const image = new Image(); image.src = data;
        try { await image.decode(); } catch { throw new Error('Foto belum dapat dibaca. Ganti foto atau gunakan diagram sebelum ekspor.'); }
        naturalWidth = image.naturalWidth;
        naturalHeight = image.naturalHeight;
        if (!['image/png', 'image/jpeg'].includes(blob.type)) {
          const canvas = document.createElement('canvas'); canvas.width = Math.min(2048, image.naturalWidth); canvas.height = Math.max(1, Math.round(canvas.width * image.naturalHeight / image.naturalWidth));
          const context = canvas.getContext('2d'); if (!context) throw new Error('Foto belum dapat dikonversi untuk PPTX.');
          context.drawImage(image, 0, 0, canvas.width, canvas.height); data = canvas.toDataURL('image/png');
        }
      }
      if (!naturalWidth || !naturalHeight) throw new Error('Ukuran foto belum tersedia.');
      cache.set(node.url, { url: data, imageWidth: naturalWidth, imageHeight: naturalHeight });
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
  const data = JSON.stringify({ normal: scenes.map(s => sceneSvg(s)), revealed: revealed.map(s => sceneSvg(s)), notes: scenes.map(s => s.notes), interactive: deck.slides.map(s => ['quiz', 'flipcard'].includes(s.layout)), times: deck.slides.map(s => s.time || '') }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeXml(deck.title)}</title>
<style>body{margin:0;background:#12251e;color:#fff;font:16px Calibri,Arial,sans-serif;min-height:100dvh;display:flex;flex-direction:column;position:relative}#stage{flex:1;display:grid;place-items:center;padding:12px;position:relative}#stage svg{max-height:82dvh;max-width:100%;width:auto!important}#curtain{display:none;position:fixed;inset:0;z-index:90;cursor:pointer}nav{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;padding:10px;z-index:100}button{min-height:42px;padding:6px 14px;border:1px solid #829c8e;border-radius:8px;background:#fff;color:#14392e;cursor:pointer;font-weight:600}button:focus-visible{outline:3px solid #ccebd7;outline-offset:3px}button:disabled{opacity:.55}.timer-pill{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.12);padding:2px 8px;border-radius:20px;margin-left:6px}.timer-btn{min-height:30px!important;padding:2px 8px!important;font-size:12px!important}#notes{padding:12px 24px;white-space:pre-wrap;background:#20382c;max-height:25dvh;overflow-y:auto}#position{align-self:center;padding:0 8px;font-weight:700}[hidden]{display:none!important}</style></head>
<body><div id="curtain"></div><main id="stage" aria-label="Slide"></main><nav aria-label="Kontrol presentasi"><button id="prev" title="Sebelumnya (← / PgUp)">Sebelumnya</button><span id="position" aria-live="polite"></span><button id="next" title="Berikutnya (→ / Space / PgDn)">Berikutnya</button><button id="answer" aria-pressed="false" title="Buka jawaban (A)">Buka jawaban</button><button id="teacher" aria-pressed="false" title="Catatan guru (T)">Catatan guru</button><button id="blackout" aria-pressed="false" title="Layar Gelap (B)">Layar Gelap</button><div class="timer-pill"><span id="timer-display" style="font-family:monospace;font-size:14px;font-weight:700;padding:0 4px;min-width:44px;text-align:center;">03:00</span><button type="button" id="timer-toggle" class="timer-btn" style="background:#256756;color:#fff;" title="Mulai / Jeda (M)">▶</button><button type="button" id="timer-reset" class="timer-btn" style="background:#374151;color:#fff;" title="Reset">↺</button><button type="button" class="timer-add timer-btn" data-add="60" style="background:#475569;color:#fff;">+1m</button><button type="button" class="timer-add timer-btn" data-add="180" style="background:#475569;color:#fff;">+3m</button><button type="button" class="timer-add timer-btn" data-add="300" style="background:#475569;color:#fff;">+5m</button></div></nav><aside id="notes" hidden></aside>
<script>
const deck=${data};let index=0,reveal=false,blackout=false,whiteout=false,timerSec=180,timerRun=false,timerInt=null;
const stage=document.getElementById('stage'),curtain=document.getElementById('curtain'),notes=document.getElementById('notes'),answer=document.getElementById('answer'),blackoutBtn=document.getElementById('blackout'),timerDisp=document.getElementById('timer-display'),timerToggle=document.getElementById('timer-toggle');
function fmtTime(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function updTimer(){if(!timerDisp)return;timerDisp.textContent=fmtTime(timerSec);timerDisp.style.color=timerSec===0?'#facc15':'#ffffff';}
function toggleTimer(){if(timerRun){clearInterval(timerInt);timerRun=false;timerToggle.textContent='▶';}else{if(timerSec<=0)timerSec=180;timerRun=true;timerToggle.textContent='⏸';timerInt=setInterval(()=>{if(timerSec>0){timerSec--;updTimer();if(timerSec===0){clearInterval(timerInt);timerRun=false;timerToggle.textContent='▶';}}},1000);}}
function toggleB(){whiteout=false;blackout=!blackout;curtain.style.display=blackout?'block':'none';curtain.style.background='#000000';blackoutBtn.setAttribute('aria-pressed',String(blackout));}
function toggleW(){blackout=false;whiteout=!whiteout;curtain.style.display=whiteout?'block':'none';curtain.style.background='#ffffff';}
curtain.onclick=()=>{blackout=false;whiteout=false;curtain.style.display='none';blackoutBtn.setAttribute('aria-pressed','false');};
function render(){
  stage.innerHTML=(reveal?deck.revealed:deck.normal)[index];
  document.getElementById('position').textContent=(index+1)+' / '+deck.normal.length;
  document.getElementById('prev').disabled=index===0;document.getElementById('next').disabled=index===deck.normal.length-1;
  answer.hidden=!deck.interactive[index];answer.textContent=reveal?'Tutup jawaban':'Buka jawaban';answer.setAttribute('aria-pressed',String(reveal));
  notes.textContent=deck.notes[index]||'Tidak ada catatan guru.';
  const t=deck.times&&deck.times[index];if(t&&!timerRun){const m=t.match(/(\\d+)\\s*(?:menit|m\\b|min)/i);if(m&&Number(m[1])>0){timerSec=Number(m[1])*60;updTimer();}}
}
function move(n){index=Math.max(0,Math.min(deck.normal.length-1,index+n));reveal=false;render();}
document.getElementById('prev').onclick=()=>move(-1);document.getElementById('next').onclick=()=>move(1);
answer.onclick=()=>{reveal=!reveal;render();};
document.getElementById('teacher').onclick=event=>{notes.hidden=!notes.hidden;event.currentTarget.setAttribute('aria-pressed',String(!notes.hidden));};
blackoutBtn.onclick=toggleB;timerToggle.onclick=toggleTimer;
document.getElementById('timer-reset').onclick=()=>{clearInterval(timerInt);timerRun=false;timerSec=180;timerToggle.textContent='▶';updTimer();};
document.querySelectorAll('.timer-add').forEach(b=>b.addEventListener('click',()=>{timerSec+=Number(b.dataset.add||60);updTimer();}));
document.addEventListener('keydown',event=>{
  const k=event.key;
  if(['ArrowRight','PageDown',' '].includes(k)&&!event.target.closest('button,input,textarea')){event.preventDefault();if(blackout||whiteout){curtain.click();return;}move(1);}
  else if(['ArrowLeft','PageUp','Backspace'].includes(k)&&!event.target.closest('button,input,textarea')){event.preventDefault();if(blackout||whiteout){curtain.click();return;}move(-1);}
  else if((k==='b'||k==='B')&&!event.target.closest('button,input,textarea')){event.preventDefault();toggleB();}
  else if((k==='w'||k==='W')&&!event.target.closest('button,input,textarea')){event.preventDefault();toggleW();}
  else if((k==='a'||k==='A')&&!event.target.closest('button,input,textarea')){if(deck.interactive[index]){event.preventDefault();reveal=!reveal;render();}}
  else if((k==='t'||k==='T')&&!event.target.closest('button,input,textarea')){event.preventDefault();document.getElementById('teacher').click();}
  else if((k==='m'||k==='M')&&!event.target.closest('button,input,textarea')){event.preventDefault();toggleTimer();}
});
render();updTimer();
</script></body></html>`;
}
export function download(content, fileName, type) {
  const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
