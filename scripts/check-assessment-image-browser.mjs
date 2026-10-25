import { createServer } from 'vite';
import { chromium } from 'playwright';

// Local-only fixture: no account session, provider API, or production bindings.
const server = await createServer({ configFile: false, appType: 'custom', server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  const { generateVisualStimulus, getVisualCatalog } = await server.ssrLoadModule('/src/lib/visual-engine.ts');
  const { preparePackageContent } = await server.ssrLoadModule('/src/lib/assessment-packages.ts');
  const { normalizeAssessmentImages } = await server.ssrLoadModule('/src/lib/assessment-image-durability.ts');
  const cases = [];
  for (const item of getVisualCatalog()) {
    for (const [variant, params] of [['sample', item.sampleParams], ['empty', {}]]) {
      const visual_stimulus = { type: item.id, params };
      const rendered = generateVisualStimulus(visual_stimulus);
      const normalized = await normalizeAssessmentImages({}, 1, { pg: [{ no: 1, soal: 'Diagram.', visual_stimulus,
        gambar: { type: 'svg', svg: rendered.svg, url: rendered.dataUri } }] });
      const prepared = preparePackageContent(normalized.content);
      cases.push({ id: `${item.id}/${variant}`, svg: prepared.content.pg[0].gambar.svg });
    }
  }
  server.middlewares.use('/image-contract-cases', (_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(cases));
  });
  server.middlewares.use('/image-contract', (_req, res) => {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><html><head><title>Assessment image contract</title></head><body>
      <h1>Assessment image contract</h1><pre id="result">running</pre>
      <script type="module">
        window.docx = { BorderStyle: { NONE: 'none', SINGLE: 'single' } };
        const { sanitizeAssessmentSvg, prepareAssessmentExportImages } = await import('/static/js/asesmen-docx.js');
        const cases = await fetch('/image-contract-cases').then(res => res.json());
        const failures = [];
        for (const item of cases) {
          try {
            const svg = sanitizeAssessmentSvg(item.svg, 1572864);
            const image = new Image();
            await new Promise((resolve, reject) => {
              const timer = setTimeout(() => reject(new Error('decode timeout')), 3000);
              image.onload = () => { clearTimeout(timer); resolve(); };
              image.onerror = () => { clearTimeout(timer); reject(new Error('decode failed')); };
              image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
            });
            if (image.naturalWidth <= 0 || image.naturalHeight <= 0) throw new Error('invalid dimensions');
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            canvas.getContext('2d').drawImage(image, 0, 0);
            if (!canvas.toDataURL('image/png').startsWith('data:image/png;base64,')) throw new Error('raster failed');
          } catch (error) { failures.push({ id: item.id, message: error.message }); }
        }
        const sectionFailures = [];
        const selected = cases.filter(item => ['siklus_air/sample', 'persegi_panjang/sample', 'organ_pencernaan/sample'].includes(item.id));
        const exportData = { pg: selected.map((item, index) => ({ no: index + 1,
          soal: 'Perhatikan gambar berikut.', gambar: { type: 'svg', svg: item.svg,
          url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(item.svg) } })) };
        const prepared = await prepareAssessmentExportImages(exportData);
        if (!prepared.ready || prepared.images.size !== selected.length) sectionFailures.push(...prepared.failures);
        window.imageContractResult = { checked: cases.length, failures,
          exportImageCount: prepared.images.size, exportFailures: sectionFailures };
        document.getElementById('result').textContent = JSON.stringify(window.imageContractResult);
      </script></body></html>`);
  });
  await server.listen();
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Fixture server has no TCP address');
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('**/*', route => route.request().url().startsWith(`${origin}/`)
    ? route.continue() : route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/image-contract`);
  await page.waitForFunction(() => !!window.imageContractResult, undefined, { timeout: 120_000 });
  const result = await page.evaluate(() => window.imageContractResult);
  console.log(JSON.stringify({ ...result, pageErrors: errors }, null, 2));
  if (result.checked !== cases.length || result.failures.length || result.exportFailures.length
    || result.exportImageCount !== 3 || errors.length) process.exitCode = 1;
} finally {
  try { await browser?.close(); }
  finally { await server.close(); }
}
