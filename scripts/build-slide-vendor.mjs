import { copyFile, mkdir } from 'node:fs/promises';
const directory = new URL('../public/static/vendor/', import.meta.url);
await mkdir(directory, { recursive: true });
await copyFile(new URL('../node_modules/pptxgenjs/dist/pptxgen.bundle.js', import.meta.url), new URL('pptxgen.bundle.js', directory));
