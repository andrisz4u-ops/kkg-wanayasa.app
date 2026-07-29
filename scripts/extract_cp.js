import mammoth from 'mammoth';
import fs from 'fs';

const docxPath = 'C:\\Users\\Andris PC\\Videos\\CP SD.docx';
const outputPath = 'c:\\Users\\Andris PC\\Pictures\\genspark\\webapp\\tmp_cp_text.txt';

async function extract() {
    try {
        const result = await mammoth.extractRawText({path: docxPath});
        const text = result.value;
        fs.writeFileSync(outputPath, text);
        console.log('Extraction complete. Saved to ' + outputPath);
    } catch (e) {
        console.error('Extraction failed:', e);
    }
}

extract();
