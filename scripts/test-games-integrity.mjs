import { WORD_SETS_BY_FASE, TIERED_QUESTION_BANK } from '../public/static/js/pages/games/questions-bank.js';
import { PINISI_QUESTION_BANK } from '../public/static/js/pages/games/pinisi-bank.js';

console.log('=== Checking WORD_SETS_BY_FASE ===');
let wsErrors = 0;
for (const [fase, pkgs] of Object.entries(WORD_SETS_BY_FASE)) {
  pkgs.forEach((pkg, idx) => {
    pkg.words.forEach(w => {
      if (!pkg.solutions[w]) {
        console.error(`MISMATCH in ${fase} pkg ${idx+1}: word '${w}' has no solution! (Available: ${Object.keys(pkg.solutions).join(', ')})`);
        wsErrors++;
      }
    });
    for (const solKey of Object.keys(pkg.solutions)) {
      if (!pkg.words.includes(solKey)) {
        console.error(`ORPHAN SOLUTION in ${fase} pkg ${idx+1}: solution '${solKey}' not in words!`);
        wsErrors++;
      }
    }
  });
}
console.log(`Word search check complete. Errors found: ${wsErrors}`);

console.log('\n=== Checking TIERED_QUESTION_BANK options and answers ===');
let qCount = 0;
let qErrors = 0;
for (const [fase, levels] of Object.entries(TIERED_QUESTION_BANK)) {
  for (const [level, pkgs] of Object.entries(levels)) {
    pkgs.forEach((pkg, pIdx) => {
      pkg.forEach((q, qIdx) => {
        qCount++;
        if (!q.opts.includes(q.a)) {
          console.error(`INVALID ANSWER in ${fase}/${level}/pkg${pIdx+1}/q${qIdx+1}: answer '${q.a}' is NOT in opts [${q.opts.join(', ')}]`);
          qErrors++;
        }
      });
    });
  }
}
console.log(`Tiered questions checked: ${qCount}, Errors: ${qErrors}`);

console.log('\n=== Checking PINISI_QUESTION_BANK options and answers ===');
let pCount = 0;
let pErrors = 0;
for (const [fase, levels] of Object.entries(PINISI_QUESTION_BANK)) {
  for (const [level, pkgs] of Object.entries(levels)) {
    pkgs.forEach((pkg, pIdx) => {
      pkg.forEach((q, qIdx) => {
        pCount++;
        const match = q.opts.some(opt => opt.trim().toLowerCase() === q.a.trim().toLowerCase());
        if (!match) {
          console.error(`PINISI MISMATCH in ${fase}/${level}/pkg${pIdx+1}/q${qIdx+1}: answer '${q.a}' is NOT in opts [${q.opts.join(', ')}]`);
          pErrors++;
        }
        if (!q.q.includes('_____')) {
          console.error(`PINISI MISSING CLOZE in ${fase}/${level}/pkg${pIdx+1}/q${qIdx+1}: text lacks '_____': "${q.q}"`);
          pErrors++;
        }
      });
    });
  }
}
console.log(`Pinisi questions checked: ${pCount}, Errors: ${pErrors}`);
