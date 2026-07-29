/**
 * Beranda Performance Profiling Script
 * Mengukur DOMContentLoaded, Load, FCP, LCP untuk halaman Beranda
 * Runs: 3 iterations dengan fresh context setiap run
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';

const URL = 'http://localhost:5174/';
const RUNS = 3;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkServerReady(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) return true;
    } catch (_) {}
    await wait(1000);
  }
  return false;
}

async function measureRun(browser, runNumber) {
  console.log(`\n  [Run ${runNumber}] Opening fresh context...`);

  // Fresh browser context setiap run (no cache carryover)
  const context = await browser.newContext({
    // Empty cache & storage every run
    storageState: undefined,
  });

  // Enable performance metrics via CDP
  const page = await context.newPage();

  // Collect paint timings via PerformanceObserver before navigation
  await page.addInitScript(() => {
    window.__perfMetrics = {};
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window.__perfMetrics.fcp = entry.startTime;
        }
        if (entry.entryType === 'largest-contentful-paint') {
          window.__perfMetrics.lcp = entry.startTime;
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  });

  const startTime = Date.now();

  // Navigate and wait for full page load
  const response = await page.goto(URL, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait a bit for LCP to settle
  await wait(2000);

  // Get Navigation Timing via JS
  const navTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return nav ? {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadEvent: nav.loadEventEnd - nav.startTime,
      ttfb: nav.responseStart - nav.requestStart,
      domInteractive: nav.domInteractive - nav.startTime,
    } : null;
  });

  // Get paint metrics
  const paintMetrics = await page.evaluate(() => {
    return window.__perfMetrics || {};
  });

  // Take screenshot for visual confirmation
  await page.screenshot({
    path: `scripts/profile-run${runNumber}.png`,
    fullPage: false,
  });

  await context.close();

  const result = {
    run: runNumber,
    dcl: navTiming?.domContentLoaded ? Math.round(navTiming.domContentLoaded) : null,
    load: navTiming?.loadEvent ? Math.round(navTiming.loadEvent) : null,
    ttfb: navTiming?.ttfb ? Math.round(navTiming.ttfb) : null,
    domInteractive: navTiming?.domInteractive ? Math.round(navTiming.domInteractive) : null,
    fcp: paintMetrics.fcp ? Math.round(paintMetrics.fcp) : null,
    lcp: paintMetrics.lcp ? Math.round(paintMetrics.lcp) : null,
  };

  console.log(`  [Run ${runNumber}] Results:`);
  console.log(`    TTFB:            ${result.ttfb ?? 'N/A'} ms`);
  console.log(`    DOMInteractive:  ${result.domInteractive ?? 'N/A'} ms`);
  console.log(`    DOMContentLoaded:${result.dcl ?? 'N/A'} ms`);
  console.log(`    Load Event:      ${result.load ?? 'N/A'} ms`);
  console.log(`    FCP:             ${result.fcp ?? 'N/A'} ms`);
  console.log(`    LCP:             ${result.lcp ?? 'N/A'} ms`);

  return result;
}

function average(runs, key) {
  const vals = runs.map(r => r[key]).filter(v => v !== null);
  if (vals.length === 0) return 'N/A';
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function rating(ms, good, needs) {
  if (ms === 'N/A') return '❓';
  if (ms <= good) return '🟢 Good';
  if (ms <= needs) return '🟡 Needs Improvement';
  return '🔴 Poor';
}

async function main() {
  console.log('='.repeat(60));
  console.log('  BERANDA PERFORMANCE PROFILING');
  console.log('='.repeat(60));
  console.log(`  URL: ${URL}`);
  console.log(`  Runs: ${RUNS}`);
  console.log('='.repeat(60));

  // Check if server is already running
  console.log('\n[1/3] Checking dev server...');
  let serverProcess = null;
  const serverReady = await checkServerReady(URL, 3);

  if (!serverReady) {
    console.log('  Dev server not running. Starting...');
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true,
      detached: false,
    });

    serverProcess.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line.includes('localhost') || line.includes('ready') || line.includes('Local')) {
        console.log(`  Server: ${line}`);
      }
    });
    serverProcess.stderr.on('data', (d) => {
      // suppress noisy output
    });

    console.log('  Waiting for server to be ready...');
    const ready = await checkServerReady(URL, 30);
    if (!ready) {
      console.error('  ERROR: Dev server failed to start in 30s');
      process.exit(1);
    }
    console.log('  Server is ready!');
    await wait(1000); // extra settle time
  } else {
    console.log('  Dev server already running ✓');
  }

  // Launch browser
  console.log('\n[2/3] Launching Chromium (headless)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // Run profiling iterations
  console.log('\n[3/3] Running profiling iterations...');
  const results = [];
  for (let i = 1; i <= RUNS; i++) {
    const result = await measureRun(browser, i);
    results.push(result);
    if (i < RUNS) await wait(500); // small gap between runs
  }

  await browser.close();

  // Shutdown dev server if we started it
  if (serverProcess) {
    serverProcess.kill();
    console.log('\n  Dev server stopped.');
  }

  // Compute averages
  const avg = {
    ttfb: average(results, 'ttfb'),
    domInteractive: average(results, 'domInteractive'),
    dcl: average(results, 'dcl'),
    load: average(results, 'load'),
    fcp: average(results, 'fcp'),
    lcp: average(results, 'lcp'),
  };

  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('  HASIL PROFILING - BERANDA LOAD METRICS');
  console.log('='.repeat(60));
  console.log('');
  console.log('  Run-by-run (ms):');
  console.log('  ┌────┬──────┬─────┬──────┬───────┬──────┬──────┐');
  console.log('  │ Run│ TTFB │ DCL │ Load │ Inter │  FCP │  LCP │');
  console.log('  ├────┼──────┼─────┼──────┼───────┼──────┼──────┤');
  for (const r of results) {
    const fmt = (v) => (v ?? 'N/A').toString().padStart(5);
    console.log(`  │  ${r.run} │${fmt(r.ttfb)} │${fmt(r.dcl)} │${fmt(r.load)} │${fmt(r.domInteractive)} │${fmt(r.fcp)} │${fmt(r.lcp)} │`);
  }
  console.log('  ├────┼──────┼─────┼──────┼───────┼──────┼──────┤');
  const fmtA = (v) => v.toString().padStart(5);
  console.log(`  │ AVG│${fmtA(avg.ttfb)} │${fmtA(avg.dcl)} │${fmtA(avg.load)} │${fmtA(avg.domInteractive)} │${fmtA(avg.fcp)} │${fmtA(avg.lcp)} │`);
  console.log('  └────┴──────┴─────┴──────┴───────┴──────┴──────┘');
  console.log('');
  console.log('  Web Vitals Assessment (averages):');
  console.log(`    TTFB:             ${avg.ttfb} ms  ${rating(avg.ttfb, 800, 1800)}`);
  console.log(`    DOMContentLoaded: ${avg.dcl} ms`);
  console.log(`    Load Event:       ${avg.load} ms`);
  console.log(`    FCP:              ${avg.fcp} ms  ${rating(avg.fcp, 1800, 3000)}`);
  console.log(`    LCP:              ${avg.lcp} ms  ${rating(avg.lcp, 2500, 4000)}`);
  console.log('');
  console.log('  Screenshots saved: scripts/profile-run{1,2,3}.png');
  console.log('='.repeat(60));

  // Output raw JSON for further analysis
  console.log('\n  Raw JSON:');
  console.log(JSON.stringify({ results, averages: avg }, null, 2));
}

main().catch(err => {
  console.error('Profiling failed:', err.message);
  process.exit(1);
});
