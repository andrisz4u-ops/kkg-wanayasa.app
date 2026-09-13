/**
 * science-earth-space.ts
 * Earth Science, Geography & Astronomy SVG Visual Stimulus Renderers (12 Templates)
 */

import { escapeXml } from './types';

/** Render Siklus Air dengan Panah Tahapan dan Tanda Huruf X */
export function renderSiklusAirSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'evaporasi').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 75, y: 155, name: 'Evaporasi' };
  if (pointer.includes('kondensasi') || pointer.includes('awan')) target = { x: 130, y: 65, name: 'Kondensasi' };
  else if (pointer.includes('presipitasi') || pointer.includes('hujan')) target = { x: 220, y: 95, name: 'Presipitasi (Hujan)' };
  else if (pointer.includes('infiltrasi') || pointer.includes('tanah')) target = { x: 260, y: 195, name: 'Infiltrasi / Penyerapan' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 250" width="350" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="arrRed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
    <marker id="arrBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <text x="175" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Bagan Siklus Air di Bumi</text>

  <!-- Matahari -->
  <circle cx="45" cy="55" r="18" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
  <line x1="45" y1="28" x2="45" y2="34" stroke="#f59e0b" stroke-width="2"/>
  <line x1="45" y1="76" x2="45" y2="82" stroke="#f59e0b" stroke-width="2"/>

  <!-- Lautan / Air -->
  <rect x="10" y="195" width="140" height="35" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" rx="3"/>
  <text x="75" y="217" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Laut / Danau</text>

  <!-- Daratan / Gunung -->
  <polygon points="150,230 220,135 280,230" fill="#a3e635" stroke="#65a30d" stroke-width="1.5"/>
  <polygon points="250,230 300,155 340,230" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <text x="240" y="215" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Daratan</text>

  <!-- Panah Evaporasi -->
  <path d="M 60,185 Q 65,145 75,115" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrBlue)"/>
  <path d="M 85,185 Q 90,145 95,115" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrBlue)"/>

  <!-- Awan (Kondensasi) -->
  <path d="M 120,80 A 15,15 0 0,1 145,65 A 22,22 0 0,1 180,68 A 16,16 0 0,1 195,85 L 115,85 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
  <!-- Awan Hujan Tebal -->
  <path d="M 210,75 A 18,18 0 0,1 240,60 A 25,25 0 0,1 280,65 A 18,18 0 0,1 295,82 L 205,82 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

  <!-- Tetesan Hujan (Presipitasi) -->
  <line x1="225" y1="92" x2="220" y2="108" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,3"/>
  <line x1="245" y1="92" x2="240" y2="108" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,3"/>
  <line x1="265" y1="92" x2="260" y2="108" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,3"/>

  <!-- Aliran Air Tanah (Infiltrasi) -->
  <path d="M 235,180 Q 180,210 145,210" fill="none" stroke="#0284c7" stroke-width="2" marker-end="url(#arrBlue)"/>

  <!-- Target Huruf X -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="15" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${target.x}" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="175" y="244" text-anchor="middle" font-size="11" fill="#64748b">Tahapan yang ditunjuk oleh huruf "${escapeXml(labelChar)}"</text>
</svg>`;
}

/** Render Peta Kepulauan Indonesia Vektor SVG Kartografis Asli Presisi Tinggi (Berdasarkan Kontur Resmi) */
export function renderPetaIndonesiaSvg(params: { pointer?: string; label?: string; highlight?: boolean }): string {
  const pointer = (params.pointer || 'jawa').toLowerCase().trim();
  const labelChar = params.label || 'X';
  const highlight = params.highlight !== false;

  // Data Jalur Vektor Visi Kartografis Akurat (7 Gugus Kepulauan Utama)
  const pathSumatra = "M 23.6,37.6 L 20.4,40.9 L 19.6,43.8 L 21.8,51.1 L 34.5,64.5 L 42.9,68.5 L 44.4,72.9 L 48.0,76.5 L 48.7,82.4 L 50.5,84.2 L 55.6,85.6 L 61.1,90.4 L 65.5,102.0 L 66.2,107.8 L 80.0,122.4 L 88.7,145.6 L 103.3,161.6 L 107.6,168.9 L 113.1,174.4 L 124.0,181.6 L 129.5,189.3 L 136.4,194.7 L 139.6,193.6 L 140.0,190.4 L 145.1,192.5 L 146.5,191.1 L 149.5,191.8 L 150.2,190.4 L 154.2,190.0 L 155.6,184.2 L 155.6,160.2 L 158.5,156.5 L 157.8,152.9 L 165.5,156.9 L 166.5,150.7 L 168.7,147.8 L 160.7,142.7 L 158.5,134.0 L 154.5,131.5 L 150.2,132.2 L 145.8,137.3 L 145.1,136.5 L 144.0,137.6 L 144.0,139.8 L 146.5,142.4 L 151.3,143.5 L 144.4,143.8 L 143.3,140.5 L 138.9,136.2 L 138.2,128.2 L 135.6,125.6 L 129.8,125.6 L 126.5,122.4 L 131.6,113.6 L 128.7,104.9 L 121.8,98.7 L 116.7,98.0 L 115.6,96.9 L 115.6,93.3 L 113.8,91.5 L 107.3,91.5 L 106.2,90.4 L 106.9,86.0 L 105.1,83.5 L 98.5,83.5 L 94.9,81.3 L 90.5,83.5 L 89.1,82.7 L 84.4,75.8 L 62.5,56.2 L 60.4,51.8 L 52.7,42.7 L 39.6,43.5 L 28.0,37.6 L 24.4,37.6 Z M 25.1,73.3 L 24.0,74.4 L 24.7,79.5 L 35.3,84.9 L 37.8,83.1 L 37.8,80.2 L 33.8,76.2 L 25.8,73.3 Z M 45.5,91.5 L 41.5,94.0 L 41.5,96.2 L 46.5,102.0 L 49.8,108.2 L 54.5,105.6 L 55.3,99.8 L 49.1,92.2 L 46.2,91.5 Z M 57.8,111.1 L 56.0,112.9 L 56.0,120.2 L 58.5,122.7 L 61.5,122.7 L 63.3,120.2 L 62.5,114.4 L 58.5,111.1 Z M 61.5,124.2 L 58.9,126.0 L 58.9,129.6 L 61.8,136.2 L 65.1,140.2 L 68.7,140.2 L 70.5,138.4 L 70.5,135.5 L 67.6,127.5 L 65.1,124.9 L 62.2,124.2 Z M 76.7,143.8 L 74.9,145.6 L 74.9,148.5 L 81.8,158.4 L 85.8,157.3 L 85.8,152.2 L 83.6,147.8 L 80.4,144.5 L 77.5,143.8 Z M 178.5,146.0 L 172.4,152.9 L 175.6,156.9 L 179.3,156.2 L 182.9,159.1 L 186.9,156.5 L 187.6,152.2 L 182.9,146.7 L 179.3,146.0 Z M 145.1,202.0 L 144.7,204.5 L 145.5,202.4 Z";
  const pathKalimantan = "M 291.3,53.6 L 285.5,55.8 L 282.9,59.1 L 281.5,69.3 L 274.9,76.5 L 273.5,83.1 L 268.0,92.9 L 255.6,94.4 L 248.4,91.5 L 242.5,91.5 L 239.6,92.9 L 234.5,98.7 L 222.2,98.7 L 217.8,100.2 L 208.0,90.4 L 206.5,86.0 L 204.7,84.9 L 198.5,90.4 L 192.0,101.3 L 193.5,107.8 L 197.8,112.2 L 197.8,114.4 L 194.9,117.3 L 194.9,118.7 L 197.8,122.4 L 199.3,129.6 L 201.1,131.5 L 207.3,131.1 L 208.0,134.0 L 205.8,137.6 L 209.5,142.7 L 209.5,150.7 L 211.3,153.3 L 219.3,156.2 L 225.1,156.2 L 229.5,154.7 L 230.5,161.6 L 232.4,164.2 L 237.5,160.5 L 242.5,162.0 L 249.8,158.4 L 252.0,158.4 L 256.4,162.7 L 264.4,162.0 L 266.2,164.5 L 266.2,167.5 L 268.7,170.7 L 273.1,170.7 L 283.3,165.6 L 284.7,165.6 L 289.1,170.0 L 291.3,170.0 L 293.1,168.2 L 293.8,163.8 L 292.4,154.4 L 296.7,145.6 L 294.5,136.9 L 299.3,134.4 L 309.1,124.5 L 309.1,113.6 L 311.3,107.1 L 314.5,103.8 L 324.0,105.3 L 326.2,104.5 L 328.7,101.3 L 328.7,99.8 L 324.7,95.8 L 315.6,89.6 L 317.1,82.4 L 311.3,71.5 L 314.9,63.5 L 314.2,59.1 L 305.1,54.4 L 292.0,53.6 Z";
  const pathJawa = "M 150.2,190.4 L 149.1,192.2 L 151.6,192.5 L 152.0,193.6 L 149.1,200.9 L 145.5,202.4 L 145.5,205.3 L 151.6,207.8 L 156.7,207.8 L 157.8,208.9 L 157.1,211.8 L 159.6,214.4 L 170.5,216.5 L 177.8,220.2 L 187.3,220.2 L 192.4,218.7 L 199.6,219.5 L 213.5,224.5 L 231.6,228.9 L 250.5,228.2 L 257.1,231.8 L 260.7,231.8 L 266.5,228.9 L 274.5,232.5 L 277.5,232.5 L 281.5,229.3 L 282.2,225.6 L 279.6,223.1 L 276.0,221.6 L 269.5,222.4 L 267.6,221.3 L 266.9,217.6 L 262.2,215.1 L 249.8,215.8 L 246.5,214.0 L 255.6,213.6 L 261.5,210.7 L 263.3,208.9 L 258.5,204.9 L 235.3,204.2 L 230.2,201.3 L 222.9,201.3 L 220.0,197.6 L 216.4,198.4 L 209.8,204.9 L 199.6,204.2 L 195.3,203.5 L 186.5,197.6 L 178.5,195.5 L 172.0,191.1 L 161.8,193.3 L 150.9,190.4 Z";
  const pathSulawesi = "M 406.9,87.1 L 396.7,97.3 L 392.4,99.5 L 382.2,100.2 L 369.8,98.7 L 363.3,97.3 L 356.7,93.6 L 352.4,93.6 L 347.3,100.2 L 343.6,99.5 L 340.7,100.9 L 336.7,105.6 L 334.5,119.5 L 330.2,128.9 L 330.2,136.9 L 327.3,140.5 L 327.3,144.9 L 322.2,155.1 L 322.2,160.2 L 326.9,163.5 L 330.5,162.7 L 332.4,165.3 L 331.6,176.9 L 327.3,187.1 L 328.0,190.0 L 332.7,192.5 L 345.8,191.1 L 346.9,190.0 L 347.6,188.5 L 346.2,184.9 L 344.7,170.4 L 347.6,165.3 L 347.6,160.9 L 345.5,153.6 L 348.7,151.8 L 352.4,151.8 L 349.8,163.1 L 352.4,166.4 L 358.5,170.4 L 357.8,178.4 L 360.7,181.3 L 358.5,184.2 L 358.5,187.1 L 361.8,190.4 L 364.0,190.4 L 366.5,184.9 L 365.8,180.5 L 370.5,175.1 L 370.2,179.1 L 368.0,183.5 L 368.0,190.0 L 372.7,193.3 L 380.0,191.1 L 382.5,187.8 L 381.1,181.3 L 383.3,173.3 L 383.3,166.7 L 381.5,164.9 L 374.2,164.9 L 372.4,163.1 L 371.6,155.8 L 362.2,139.8 L 369.1,136.5 L 375.6,130.0 L 376.7,130.4 L 375.3,131.8 L 375.3,136.2 L 376.4,137.3 L 381.5,135.8 L 385.8,138.7 L 388.4,132.5 L 386.5,130.0 L 381.8,128.2 L 383.6,127.8 L 386.2,123.8 L 382.9,120.5 L 379.3,120.5 L 374.2,122.7 L 370.5,122.7 L 366.9,124.9 L 358.9,124.9 L 353.8,131.5 L 350.9,131.5 L 344.7,124.5 L 342.5,119.5 L 342.5,115.8 L 346.5,110.4 L 353.8,108.9 L 367.6,109.6 L 380.0,111.8 L 397.5,111.1 L 400.7,108.5 L 404.4,102.0 L 410.9,94.7 L 410.9,91.8 L 407.6,87.1 Z M 399.6,133.6 L 396.7,135.1 L 394.2,139.1 L 396.7,143.1 L 409.8,141.6 L 412.7,143.1 L 417.8,148.9 L 420.4,147.8 L 419.6,143.5 L 423.3,141.3 L 424.7,139.1 L 424.4,137.3 L 413.5,136.5 L 400.4,133.6 Z";
  const pathPapua = "M 475.3,112.5 L 470.2,114.7 L 469.8,116.5 L 476.0,123.5 L 486.9,120.5 L 489.5,118.0 L 488.7,115.8 L 485.5,113.3 L 476.0,112.5 Z M 500.7,117.6 L 495.6,121.3 L 489.1,122.7 L 484.7,125.6 L 478.2,124.2 L 477.8,129.6 L 481.8,133.6 L 492.0,136.5 L 494.5,141.3 L 499.3,145.3 L 510.5,145.6 L 503.6,150.4 L 495.6,149.6 L 494.5,150.7 L 495.6,154.7 L 500.7,156.2 L 504.0,159.5 L 505.5,169.6 L 507.3,171.5 L 515.3,170.0 L 517.5,163.5 L 522.5,167.8 L 537.1,175.1 L 546.5,176.5 L 553.1,180.2 L 561.1,181.6 L 567.6,184.5 L 575.3,191.5 L 579.6,198.7 L 581.8,204.5 L 581.8,208.9 L 584.0,213.3 L 583.6,214.4 L 578.5,214.4 L 575.3,217.6 L 569.5,230.7 L 585.8,229.6 L 591.6,226.7 L 596.7,226.7 L 603.3,229.6 L 614.9,240.5 L 616.7,239.5 L 617.5,236.5 L 617.5,214.0 L 616.0,208.2 L 616.0,149.3 L 612.7,146.7 L 593.1,141.6 L 581.5,135.1 L 572.7,132.2 L 567.6,134.4 L 562.5,140.9 L 553.1,143.1 L 544.7,155.1 L 540.0,157.6 L 535.3,154.4 L 532.4,148.5 L 526.5,141.3 L 526.5,126.0 L 524.0,123.5 L 516.0,119.8 L 509.5,117.6 L 501.5,117.6 Z M 541.5,120.5 L 538.9,121.6 L 539.6,124.5 L 548.7,131.5 L 554.5,130.7 L 555.6,127.5 L 549.5,122.0 L 546.5,120.5 L 542.2,120.5 Z M 531.3,124.2 L 529.5,127.5 L 532.0,132.2 L 534.9,131.5 L 537.5,128.9 L 537.5,126.0 L 535.6,124.2 L 532.0,124.2 Z M 540.7,133.6 L 539.6,134.7 L 540.4,136.9 L 548.0,140.9 L 557.5,140.2 L 561.5,137.6 L 560.7,135.5 L 553.1,133.6 L 541.5,133.6 Z M 510.2,183.8 L 506.5,187.5 L 503.6,186.0 L 501.8,187.8 L 501.8,195.1 L 503.6,198.4 L 508.7,198.4 L 512.7,195.8 L 513.5,187.8 L 512.7,184.2 L 510.9,183.8 Z M 529.1,184.5 L 525.1,188.5 L 520.7,203.8 L 521.5,207.5 L 524.0,209.3 L 529.1,209.3 L 531.6,206.7 L 535.3,195.1 L 533.8,187.8 L 529.8,184.5 Z M 491.3,208.5 L 485.5,211.5 L 482.2,215.5 L 482.2,220.5 L 477.8,226.4 L 478.9,228.9 L 485.5,227.5 L 495.3,214.7 L 497.5,209.6 L 496.4,208.5 L 492.0,208.5 Z";
  const pathMaluku = "M 450.5,77.6 L 445.8,81.6 L 446.5,85.3 L 449.8,88.5 L 452.7,88.5 L 456.7,83.1 L 456.7,80.9 L 454.2,78.4 L 451.3,77.6 Z M 441.8,83.5 L 438.5,86.0 L 434.9,94.0 L 434.9,99.1 L 438.5,102.7 L 436.4,106.4 L 436.4,109.3 L 439.3,115.1 L 433.1,116.2 L 429.8,119.5 L 431.3,124.5 L 436.7,127.8 L 440.4,126.4 L 442.5,123.5 L 444.7,125.6 L 447.6,125.6 L 449.5,120.9 L 445.8,113.6 L 446.5,110.7 L 452.7,111.1 L 456.0,109.3 L 456.0,105.6 L 450.9,103.5 L 456.0,96.9 L 456.0,91.8 L 449.1,90.7 L 445.8,84.5 L 442.5,83.5 Z M 438.9,129.3 L 434.9,131.8 L 434.2,135.5 L 436.0,138.0 L 439.6,139.5 L 444.7,139.5 L 447.3,136.9 L 446.5,133.3 L 443.3,130.0 L 439.6,129.3 Z M 471.6,135.1 L 466.2,137.6 L 466.9,141.3 L 470.2,143.1 L 476.0,142.4 L 477.8,139.8 L 477.8,136.9 L 476.0,135.1 L 472.4,135.1 Z M 450.5,149.6 L 445.5,151.8 L 439.3,156.5 L 439.3,158.0 L 441.5,159.5 L 441.5,166.0 L 442.5,167.1 L 452.7,164.2 L 455.6,159.8 L 468.0,161.3 L 477.5,166.4 L 481.1,166.4 L 482.9,164.5 L 482.2,158.0 L 477.5,154.0 L 473.1,153.3 L 467.3,149.6 L 451.3,149.6 Z M 422.9,153.3 L 418.2,156.5 L 416.7,161.6 L 419.3,165.6 L 423.6,167.8 L 433.1,167.1 L 436.4,162.4 L 433.1,155.5 L 428.7,153.3 L 423.6,153.3 Z M 424.4,215.1 L 420.0,217.3 L 414.2,218.0 L 412.4,220.5 L 412.4,222.0 L 414.2,223.1 L 424.4,223.1 L 428.7,221.6 L 429.8,216.9 L 428.0,215.1 L 425.1,215.1 Z M 465.1,216.5 L 462.5,218.4 L 462.5,223.5 L 464.4,225.3 L 468.0,225.3 L 470.5,222.7 L 470.5,219.1 L 465.8,216.5 Z";
  const pathBaliNusra = "M 401.8,221.6 L 391.6,223.8 L 380.7,223.1 L 363.3,228.2 L 356.7,228.2 L 344.4,223.8 L 340.7,224.5 L 330.9,230.0 L 330.2,234.4 L 331.3,235.5 L 353.8,236.9 L 368.4,235.5 L 380.0,232.5 L 393.8,232.5 L 401.1,231.1 L 404.7,229.6 L 408.0,225.6 L 406.2,222.4 L 402.5,221.6 Z M 308.0,222.4 L 302.2,226.0 L 298.5,226.0 L 294.9,229.6 L 294.5,225.6 L 292.7,223.8 L 288.4,223.8 L 283.6,227.8 L 282.9,232.2 L 286.2,236.9 L 290.5,236.9 L 292.7,234.7 L 293.8,238.0 L 295.6,239.1 L 302.2,236.9 L 308.0,236.9 L 313.1,234.7 L 321.8,235.5 L 328.0,230.7 L 327.3,226.4 L 323.3,223.8 L 308.7,222.4 Z M 403.3,234.7 L 397.5,236.9 L 393.8,241.3 L 388.7,240.5 L 384.0,244.5 L 384.0,248.9 L 378.9,252.5 L 378.9,254.0 L 383.6,257.3 L 392.4,256.5 L 401.5,250.4 L 405.1,246.0 L 405.8,241.6 L 408.7,238.0 L 406.9,234.7 L 404.0,234.7 Z M 335.6,239.1 L 323.3,241.3 L 322.2,246.7 L 324.0,248.5 L 332.0,249.3 L 335.6,252.9 L 340.0,255.1 L 346.5,254.4 L 351.3,250.4 L 344.4,242.7 L 338.5,239.1 L 336.4,239.1 Z M 377.8,256.5 L 374.5,259.1 L 372.4,263.5 L 373.5,266.0 L 380.7,265.3 L 383.3,263.5 L 383.3,258.4 L 378.5,256.5 Z";

  // Koordinat target dan posisi badge penunjuk huruf [X]
  let target = { x: 213.2, y: 211.3, name: 'Pulau Jawa', badgeX: 213.2, badgeY: 246, dir: 'down' };
  let isTarget = {
    sumatra: false,
    jawa: false,
    kalimantan: false,
    sulawesi: false,
    papua: false,
    maluku: false,
    baliNusra: false
  };

  if (pointer.includes('sumat')) {
    target = { x: 96.5, y: 121.4, name: 'Pulau Sumatra', badgeX: 52, badgeY: 62, dir: 'up' };
    isTarget.sumatra = true;
  } else if (pointer.includes('kalim') || pointer.includes('borneo')) {
    target = { x: 258.6, y: 119.6, name: 'Pulau Kalimantan', badgeX: 258.6, badgeY: 52, dir: 'up' };
    isTarget.kalimantan = true;
  } else if (pointer.includes('sulaw') || pointer.includes('celebes')) {
    target = { x: 368.9, y: 143.4, name: 'Pulau Sulawesi', badgeX: 368.9, badgeY: 58, dir: 'up' };
    isTarget.sulawesi = true;
  } else if (pointer.includes('papua') || pointer.includes('irian')) {
    target = { x: 530.7, y: 164.6, name: 'Pulau Papua', badgeX: 530.7, badgeY: 68, dir: 'up' };
    isTarget.papua = true;
  } else if (pointer.includes('maluku') || pointer.includes('seram') || pointer.includes('halmahera') || pointer.includes('ambon')) {
    target = { x: 446.9, y: 145.3, name: 'Kepulauan Maluku', badgeX: 446.9, badgeY: 58, dir: 'up' };
    isTarget.maluku = true;
  } else if (pointer.includes('bali') || pointer.includes('nusa') || pointer.includes('lombok') || pointer.includes('flores') || pointer.includes('timor') || pointer.includes('ntb') || pointer.includes('ntt')) {
    target = { x: 351.9, y: 238.6, name: 'Kepulauan Nusa Tenggara & Bali', badgeX: 351.9, badgeY: 260, dir: 'down' };
    isTarget.baliNusra = true;
  } else {
    // Default: Pulau Jawa
    isTarget.jawa = true;
  }

  // Palet Warna: pulau sasaran di-highlight merah jika highlight aktif
  const colTargetFill = highlight ? '#e11d48' : '#10b981';
  const colTargetStroke = highlight ? '#9f1239' : '#047857';
  const swTarget = highlight ? 2.2 : 1.2;

  const colNormalFill = '#10b981';
  const colNormalStroke = '#047857';
  const swNormal = 1.2;

  const fillSumatra = isTarget.sumatra ? colTargetFill : colNormalFill;
  const strokeSumatra = isTarget.sumatra ? colTargetStroke : colNormalStroke;
  const swSumatra = isTarget.sumatra ? swTarget : swNormal;

  const fillJawa = isTarget.jawa ? colTargetFill : colNormalFill;
  const strokeJawa = isTarget.jawa ? colTargetStroke : colNormalStroke;
  const swJawa = isTarget.jawa ? swTarget : swNormal;

  const fillKalimantan = isTarget.kalimantan ? colTargetFill : colNormalFill;
  const strokeKalimantan = isTarget.kalimantan ? colTargetStroke : colNormalStroke;
  const swKalimantan = isTarget.kalimantan ? swTarget : swNormal;

  const fillSulawesi = isTarget.sulawesi ? colTargetFill : colNormalFill;
  const strokeSulawesi = isTarget.sulawesi ? colTargetStroke : colNormalStroke;
  const swSulawesi = isTarget.sulawesi ? swTarget : swNormal;

  const fillPapua = isTarget.papua ? colTargetFill : colNormalFill;
  const strokePapua = isTarget.papua ? colTargetStroke : colNormalStroke;
  const swPapua = isTarget.papua ? swTarget : swNormal;

  const fillMaluku = isTarget.maluku ? colTargetFill : colNormalFill;
  const strokeMaluku = isTarget.maluku ? colTargetStroke : colNormalStroke;
  const swMaluku = isTarget.maluku ? swTarget : swNormal;

  const fillBaliNusra = isTarget.baliNusra ? colTargetFill : colNormalFill;
  const strokeBaliNusra = isTarget.baliNusra ? colTargetStroke : colNormalStroke;
  const swBaliNusra = isTarget.baliNusra ? swTarget : swNormal;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280" width="640" height="280" style="background:#f0f9ff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <marker id="arrPeta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
    <filter id="shadowPeta" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0.8" dy="1.5" stdDeviation="1.2" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Latar Belakang Samudra & Grid Kartografis Koordinat Halus -->
  <rect width="640" height="280" fill="url(#oceanGrad)" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <line x1="20" y1="90" x2="620" y2="90" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="20" y1="160" x2="620" y2="160" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="20" y1="230" x2="620" y2="230" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="130" y1="35" x2="130" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="260" y1="35" x2="260" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="390" y1="35" x2="390" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="520" y1="35" x2="520" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>

  <!-- Judul Kartografi -->
  <text x="320" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Peta Kepulauan Indonesia</text>

  <!-- Kompas Mata Angin (Wind Rose) di Pojok Kanan Atas -->
  <g transform="translate(605, 38)">
    <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
    <polygon points="0,-12 3,-3 0,0 -3,-3" fill="#e11d48"/>
    <polygon points="0,12 3,3 0,0 -3,3" fill="#64748b"/>
    <polygon points="12,0 3,3 0,0 3,-3" fill="#64748b"/>
    <polygon points="-12,0 -3,3 0,0 -3,-3" fill="#64748b"/>
    <text x="0" y="-15" text-anchor="middle" font-size="9" font-weight="bold" fill="#e11d48">U</text>
  </g>

  <!-- Skala Batang Simbolis di Pojok Kiri Bawah -->
  <g transform="translate(24, 258)">
    <rect x="0" y="-5" width="28" height="4" fill="#0f172a"/>
    <rect x="28" y="-5" width="28" height="4" fill="#ffffff" stroke="#0f172a" stroke-width="0.8"/>
    <text x="0" y="6" font-size="7.5" fill="#475569" font-weight="600">0</text>
    <text x="48" y="6" font-size="7.5" fill="#475569" font-weight="600">500 km</text>
  </g>

  <!-- KEPULAUAN INDONESIA (VEKTOR KARTOGRAFIS ASLI PRESISI TINGGI) -->
  <g filter="url(#shadowPeta)">
    <!-- 1. Sumatra & Kepulauan Sekitarnya (Nias, Mentawai, Bangka, Belitung) -->
    <path d="${pathSumatra}" fill="${fillSumatra}" stroke="${strokeSumatra}" stroke-width="${swSumatra}" />

    <!-- 2. Kalimantan -->
    <path d="${pathKalimantan}" fill="${fillKalimantan}" stroke="${strokeKalimantan}" stroke-width="${swKalimantan}" />

    <!-- 3. Jawa & Madura -->
    <path d="${pathJawa}" fill="${fillJawa}" stroke="${strokeJawa}" stroke-width="${swJawa}" />

    <!-- 4. Bali & Nusa Tenggara (Lombok, Sumbawa, Flores, Sumba, Timor) -->
    <path d="${pathBaliNusra}" fill="${fillBaliNusra}" stroke="${strokeBaliNusra}" stroke-width="${swBaliNusra}" />

    <!-- 5. Sulawesi (4 Semenanjung K-Shape & Kepulauan Sekitarnya) -->
    <path d="${pathSulawesi}" fill="${fillSulawesi}" stroke="${strokeSulawesi}" stroke-width="${swSulawesi}" />

    <!-- 6. Maluku (Halmahera, Seram, Buru, Ambon, Kei, Aru) -->
    <path d="${pathMaluku}" fill="${fillMaluku}" stroke="${strokeMaluku}" stroke-width="${swMaluku}" />

    <!-- 7. Papua (Doberai Bird's Head, Biak, Yapen, Pulau Dolak) -->
    <path d="${pathPapua}" fill="${fillPapua}" stroke="${strokePapua}" stroke-width="${swPapua}" />
  </g>

  <!-- Garis Penunjuk & Badge Lingkaran Target Huruf X -->
  <g>
    <line x1="${target.badgeX}" y1="${target.badgeY}" x2="${target.x}" y2="${target.y}" stroke="#e11d48" stroke-width="2.5" marker-end="url(#arrPeta)"/>
    <circle cx="${target.badgeX}" cy="${target.badgeY}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${target.badgeX}" y="${target.badgeY + 4.5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Instruksi Soal Bawah (Zero-Spoiler) -->
  <text x="320" y="268" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan pulau yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

export function renderTataSuryaSvg(params: any): string {
  const pointer = String(params.pointer || '3').toLowerCase();
  const labelChar = params.label || 'X';

  const planets = [
    { id: 'merkurius', num: 1, name: 'Merkurius', x: 80, r: 4.5, fill: '#94a3b8', stroke: '#64748b' },
    { id: 'venus', num: 2, name: 'Venus', x: 115, r: 7.5, fill: '#fbbf24', stroke: '#d97706' },
    { id: 'bumi', num: 3, name: 'Bumi', x: 160, r: 8, fill: '#38bdf8', stroke: '#0284c7', isBumi: true },
    { id: 'mars', num: 4, name: 'Mars', x: 205, r: 6, fill: '#ef4444', stroke: '#b91c1c' },
    { id: 'yupiter', num: 5, name: 'Yupiter', x: 280, r: 18, fill: '#d97706', stroke: '#b45309', isJup: true },
    { id: 'saturnus', num: 6, name: 'Saturnus', x: 360, r: 13, fill: '#fde047', stroke: '#ca8a04', isSat: true },
    { id: 'uranus', num: 7, name: 'Uranus', x: 430, r: 10, fill: '#67e8f9', stroke: '#06b6d4' },
    { id: 'neptunus', num: 8, name: 'Neptunus', x: 485, r: 9.5, fill: '#3b82f6', stroke: '#1d4ed8' }
  ];

  let targetIndex = 2; // Default Bumi (ke-3)
  planets.forEach((p, idx) => {
    if (pointer === String(p.num) || pointer === p.id || pointer === p.name.toLowerCase() || (pointer === 'jupiter' && p.id === 'yupiter')) {
      targetIndex = idx;
    }
  });

  const cy = 135;

  const starDots = [
    [50, 40], [90, 230], [140, 50], [190, 240], [230, 45],
    [260, 220], [310, 35], [370, 235], [420, 55], [470, 225], [510, 40]
  ].map(([sx, sy]) => `<circle cx="${sx}" cy="${sy}" r="1" fill="#ffffff" opacity="0.7"/>`).join('');

  const asteroids = [
    [236, 60], [242, 90], [238, 120], [244, 150], [237, 180], [243, 210]
  ].map(([ax, ay]) => `<circle cx="${ax}" cy="${ay}" r="1.5" fill="#64748b" opacity="0.75"/>`).join('');

  const renderedPlanets = planets.map((p, idx) => {
    const isTarget = idx === targetIndex;
    let planetGraphic = '';

    if (p.isBumi) {
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>
        <circle cx="${p.x - 2}" cy="${cy - 2}" r="3" fill="#22c55e" opacity="0.8"/>
        <circle cx="${p.x + 3}" cy="${cy + 2}" r="2.5" fill="#22c55e" opacity="0.8"/>
      `;
    } else if (p.isJup) {
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>
        <line x1="${p.x - 17}" y1="${cy - 6}" x2="${p.x + 17}" y2="${cy - 6}" stroke="#fef3c7" stroke-width="2" opacity="0.6"/>
        <line x1="${p.x - 17}" y1="${cy}" x2="${p.x + 17}" y2="${cy}" stroke="#78350f" stroke-width="2.5" opacity="0.7"/>
        <line x1="${p.x - 16}" y1="${cy + 7}" x2="${p.x + 16}" y2="${cy + 7}" stroke="#fef3c7" stroke-width="2" opacity="0.6"/>
        <ellipse cx="${p.x + 6}" cy="${cy + 7}" rx="3.5" ry="2" fill="#dc2626"/>
      `;
    } else if (p.isSat) {
      planetGraphic = `
        <ellipse cx="${p.x}" cy="${cy}" rx="25" ry="6" transform="rotate(-18 ${p.x} ${cy})" fill="none" stroke="#fef08a" stroke-width="3.5" opacity="0.9"/>
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>
        <path d="M ${p.x - 22},${cy + 7} A 25 6 0 0 0 ${p.x + 22},${cy - 7}" transform="rotate(-18 ${p.x} ${cy})" fill="none" stroke="#fef08a" stroke-width="3.5" opacity="0.9"/>
      `;
    } else {
      planetGraphic = `<circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>`;
    }

    const numberText = `<text x="${p.x}" y="240" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">(${p.num})</text>`;

    let targetBadge = '';
    if (isTarget) {
      const badgeY = cy - p.r - 28;
      targetBadge = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r + 7}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3,2"/>
        <line x1="${p.x}" y1="${badgeY + 12}" x2="${p.x}" y2="${cy - p.r - 7}" stroke="#f43f5e" stroke-width="2" marker-end="url(#arrSurya)"/>
        <circle cx="${p.x}" cy="${badgeY}" r="12" fill="#f43f5e" stroke="#ffffff" stroke-width="2"/>
        <text x="${p.x}" y="${badgeY + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }

    return `
      <path d="M ${p.x},35 A ${p.x * 2} 400 0 0 1 ${p.x},235" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3"/>
      ${planetGraphic}
      ${numberText}
      ${targetBadge}
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 270" width="520" height="270" style="background:#090d1a; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <radialGradient id="sunGlow" cx="20%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </radialGradient>
    <marker id="arrSurya" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f43f5e" />
    </marker>
  </defs>

  <rect width="520" height="270" fill="#090d1a" stroke="#334155" stroke-width="1.5" rx="6"/>
  ${starDots}
  ${asteroids}

  <text x="260" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#f8fafc">Diagram Sistem Tata Surya</text>

  <circle cx="0" cy="${cy}" r="52" fill="url(#sunGlow)"/>
  <text x="22" y="${cy + 4}" font-size="10" font-weight="bold" fill="#ffffff" opacity="0.9">Matahari</text>

  ${renderedPlanets}

  <text x="260" y="260" text-anchor="middle" font-size="10.5" font-weight="600" fill="#94a3b8">Perhatikan planet yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

/**
 * Render Gerhana Matahari & Gerhana Bulan
 * Menampilkan posisi matahari, bulan, bumi, serta zona umbra dan penumbra
 */
export function renderGerhanaSvg(params: {
  jenis?: 'matahari' | 'bulan';
  pointer?: string;
  label?: string;
}): string {
  const jenis = (params.jenis || 'matahari').toLowerCase();
  const isMatahari = jenis === 'matahari';
  const pointer = (params.pointer || 'umbra').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 320, y: 130 };
  if (pointer.includes('penumbra') || pointer === '2') {
    target = { x: 320, y: 88 };
  } else if (pointer.includes('bulan')) {
    target = isMatahari ? { x: 230, y: 130 } : { x: 390, y: 130 };
  } else if (pointer.includes('bumi')) {
    target = isMatahari ? { x: 380, y: 130 } : { x: 240, y: 130 };
  }

  // Objek Tengah & Objek Kanan tergantung jenis gerhana
  const middleName = isMatahari ? 'Bulan' : 'Bumi';
  const rightName = isMatahari ? 'Bumi' : 'Bulan';
  const middleR = isMatahari ? 14 : 30;
  const rightR = isMatahari ? 30 : 14;
  const middleFill = isMatahari ? '#475569' : '#0284c7';
  const rightFill = isMatahari ? '#0284c7' : '#64748b';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </radialGradient>
    <linearGradient id="earthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>

  <rect width="480" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Skema Peristiwa Gerhana ${isMatahari ? 'Matahari' : 'Bulan'}</text>

  <!-- Kerucut Bayangan Penumbra (Abu-abu Terang) -->
  <polygon points="70,90 230,${130 + middleR} 440,${130 + rightR + 35} 440,${130 - rightR - 35} 230,${130 - middleR} 70,170" fill="#cbd5e1" fill-opacity="0.35"/>

  <!-- Kerucut Bayangan Umbra (Gelap / Pekat) -->
  <polygon points="70,90 230,${130 - middleR} 370,130 230,${130 + middleR} 70,170" fill="#334155" fill-opacity="0.5"/>
  ${!isMatahari ? `<polygon points="240,${130 - middleR} 440,${130 - 15} 440,${130 + 15} 240,${130 + middleR}" fill="#1e293b" fill-opacity="0.6"/>` : ''}

  <!-- Garis Berkas Cahaya Batas -->
  <line x1="70" y1="90" x2="440" y2="${130 + rightR + 35}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4"/>
  <line x1="70" y1="170" x2="440" y2="${130 - rightR - 35}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4"/>
  <line x1="70" y1="90" x2="370" y2="130" stroke="#d97706" stroke-width="1.2"/>
  <line x1="70" y1="170" x2="370" y2="130" stroke="#d97706" stroke-width="1.2"/>

  <!-- Matahari (Kiri) -->
  <circle cx="70" cy="130" r="40" fill="url(#sunGlow)" stroke="#b45309" stroke-width="2"/>
  <!-- Label Matahari -->
  <g>
    <rect x="35" y="45" width="70" height="20" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="1"/>
    <text x="70" y="59" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#b45309">Matahari</text>
  </g>

  <!-- Objek Tengah (Bulan pada Gerhana Matahari, Bumi pada Gerhana Bulan) -->
  <circle cx="230" cy="130" r="${middleR}" fill="${middleFill}" stroke="#0f172a" stroke-width="2"/>
  <!-- Label Objek Tengah (Atas) -->
  <g>
    <rect x="${230 - 32}" y="42" width="64" height="20" rx="4" fill="#ffffff" stroke="#475569" stroke-width="1"/>
    <text x="230" y="56" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#1e293b">${middleName}</text>
  </g>

  <!-- Objek Kanan (Bumi pada Gerhana Matahari, Bulan pada Gerhana Bulan) -->
  <circle cx="380" cy="130" r="${rightR}" fill="${rightFill}" stroke="#0f172a" stroke-width="2"/>
  <!-- Label Objek Kanan (Bawah Objek) -->
  <g>
    <rect x="${380 - 32}" y="175" width="64" height="20" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1"/>
    <text x="380" y="189" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">${rightName}</text>
  </g>

  <!-- Callout Label Zona Bayangan (Zona Berbeda Tanpa Tabrakan) -->
  <g>
    <rect x="275" y="210" width="75" height="20" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1"/>
    <text x="312.5" y="224" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#334155">1. Umbra</text>
  </g>
  <g>
    <rect x="300" y="42" width="85" height="20" rx="4" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
    <text x="342.5" y="56" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#64748b">2. Penumbra</text>
  </g>

  <!-- Target Badge X (Kontras Tinggi) -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Keterangan Bawah -->
  <text x="240" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Daerah bayangan yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 13. Render Fase-Fase Bulan Mengelilingi Bumi */
export function renderFaseBulanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'purnama').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 75, y: 135, name: 'Bulan Purnama' }; // Posisi 5 (kiri)
  if (pointer.includes('baru') || pointer.includes('mati')) target = { x: 305, y: 135, name: 'Bulan Baru' };
  else if (pointer.includes('kuartir 1') || pointer.includes('paruh awal') || pointer.includes('atas')) target = { x: 190, y: 55, name: 'Kuartir Pertama' };
  else if (pointer.includes('kuartir 3') || pointer.includes('paruh akhir') || pointer.includes('bawah')) target = { x: 190, y: 215, name: 'Kuartir Ketiga' };
  else if (pointer.includes('sabit')) target = { x: 270, y: 78, name: 'Bulan Sabit' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 270" width="420" height="270" style="background:#0f172a; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="210" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#f8fafc">Fase-Fase Bulan Mengelilingi Bumi</text>

  <!-- Sinar Matahari Datang dari Kanan -->
  <g>
    <line x1="395" y1="65" x2="365" y2="65" stroke="#facc15" stroke-width="2"/>
    <line x1="395" y1="135" x2="365" y2="135" stroke="#facc15" stroke-width="2.5"/>
    <line x1="395" y1="205" x2="365" y2="205" stroke="#facc15" stroke-width="2"/>
    <text x="380" y="148" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#fde047">Sinar Matahari</text>
  </g>

  <!-- Garis Orbit Lingkaran -->
  <circle cx="190" cy="135" r="95" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>

  <!-- Bumi di Pusat -->
  <circle cx="190" cy="135" r="22" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
  <ellipse cx="186" cy="132" rx="10" ry="14" fill="#22c55e"/>
  <text x="190" y="139" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">Bumi</text>

  <!-- Posisi 1: Bulan Baru (Kanan) -->
  <circle cx="285" cy="135" r="14" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
  <text x="285" y="160" text-anchor="middle" font-size="7.5" fill="#94a3b8">Bulan Baru</text>

  <!-- Posisi 3: Kuartir Pertama (Atas) -->
  <path d="M 190,40 A 14 14 0 0 1 190,68 Z" fill="#fef08a"/>
  <path d="M 190,40 A 14 14 0 0 0 190,68 Z" fill="#1e293b"/>
  <circle cx="190" cy="54" r="14" fill="none" stroke="#64748b" stroke-width="1"/>
  <text x="190" y="38" text-anchor="middle" font-size="7.5" fill="#94a3b8">Kuartir I</text>

  <!-- Posisi 5: Bulan Purnama (Kiri) -->
  <circle cx="95" cy="135" r="14" fill="#fef08a" stroke="#facc15" stroke-width="1.5"/>
  <text x="95" y="160" text-anchor="middle" font-size="7.5" fill="#fde047">Purnama</text>

  <!-- Posisi 7: Kuartir Ketiga (Bawah) -->
  <path d="M 190,202 A 14 14 0 0 1 190,230 Z" fill="#fef08a"/>
  <path d="M 190,202 A 14 14 0 0 0 190,230 Z" fill="#1e293b"/>
  <circle cx="190" cy="216" r="14" fill="none" stroke="#64748b" stroke-width="1"/>
  <text x="190" y="242" text-anchor="middle" font-size="7.5" fill="#94a3b8">Kuartir III</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="258" text-anchor="middle" font-size="10.5" font-weight="600" fill="#cbd5e1">Fase bulan yang ditunjukkan oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 14. Render Struktur Lapisan Bumi */
export function renderLapisanBumiSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'mantel').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 275, y: 95, name: 'Mantel Bumi' };
  if (pointer.includes('kerak') || pointer.includes('crust')) target = { x: 310, y: 65, name: 'Kerak Bumi' };
  else if (pointer.includes('inti luar') || pointer.includes('outer')) target = { x: 235, y: 135, name: 'Inti Luar Cair' };
  else if (pointer.includes('inti dalam') || pointer.includes('inner')) target = { x: 185, y: 175, name: 'Inti Dalam Padat' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Struktur Lapisan Bumi</text>

  <!-- Potongan Irisan Bumi Melingkar -->
  <g transform="translate(140, 180)">
    <!-- Inti Luar & Mantel Concentric Arcs -->
    <path d="M 0,0 L 130,-130 A 184 184 0 0 0 -130,-130 Z" fill="#b45309"/> <!-- Mantel Atas -->
    <path d="M 0,0 L 105,-105 A 148 148 0 0 0 -105,-105 Z" fill="#ea580c"/> <!-- Mantel Bawah -->
    <path d="M 0,0 L 75,-75 A 106 106 0 0 0 -75,-75 Z" fill="#f59e0b"/> <!-- Inti Luar -->
    <path d="M 0,0 L 40,-40 A 56 56 0 0 0 -40,-40 Z" fill="#fef08a"/> <!-- Inti Dalam -->
    <!-- Kerak Tipis di Luar -->
    <path d="M 130,-130 A 184 184 0 0 0 -130,-130" fill="none" stroke="#15803d" stroke-width="4"/>
  </g>

  <!-- Label Lapisan Kanan (Anti-Overlap) -->
  <g>
    <rect x="260" y="48" width="125" height="20" rx="4" fill="#ffffff" stroke="#16a34a" stroke-width="1"/>
    <text x="322.5" y="62" text-anchor="middle" font-size="9" font-weight="bold" fill="#166534">1. Kerak Bumi (Crust)</text>
    <line x1="260" y1="58" x2="220" y2="68" stroke="#16a34a" stroke-width="1"/>
  </g>
  <g>
    <rect x="260" y="85" width="125" height="20" rx="4" fill="#ffffff" stroke="#ea580c" stroke-width="1"/>
    <text x="322.5" y="99" text-anchor="middle" font-size="9" font-weight="bold" fill="#c2410c">2. Mantel Bumi (Mantle)</text>
    <line x1="260" y1="95" x2="210" y2="105" stroke="#ea580c" stroke-width="1"/>
  </g>
  <g>
    <rect x="260" y="125" width="125" height="20" rx="4" fill="#d97706" stroke="#b45309" stroke-width="1"/>
    <text x="322.5" y="139" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">3. Inti Luar (Outer Core)</text>
    <line x1="260" y1="135" x2="190" y2="135" stroke="#d97706" stroke-width="1"/>
  </g>
  <g>
    <rect x="260" y="165" width="125" height="20" rx="4" fill="#eab308" stroke="#854d0e" stroke-width="1"/>
    <text x="322.5" y="179" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">4. Inti Dalam (Inner Core)</text>
    <line x1="260" y1="175" x2="160" y2="165" stroke="#eab308" stroke-width="1"/>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Lapisan bumi yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 15. Render Profil Lapisan Tanah (Horizon) */
export function renderLapisanTanahSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'topsoil').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 110, y: 88, name: 'Horizon A (Topsoil)' };
  if (pointer.includes('organik') || pointer.includes('humus') || pointer.includes('horizon o')) target = { x: 110, y: 55, name: 'Horizon O (Organik)' };
  else if (pointer.includes('subsoil') || pointer.includes('horizon b') || pointer.includes('lempung')) target = { x: 110, y: 125, name: 'Horizon B (Subsoil)' };
  else if (pointer.includes('regolit') || pointer.includes('lapuk') || pointer.includes('horizon c')) target = { x: 110, y: 168, name: 'Horizon C (Regolit)' };
  else if (pointer.includes('batuan dasar') || pointer.includes('bedrock') || pointer.includes('horizon r')) target = { x: 110, y: 205, name: 'Horizon R (Batuan Induk)' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="190" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Profil Lapisan (Horizon) Tanah</text>

  <!-- Kolom Profil Lapisan Tanah -->
  <g>
    <!-- Horizon O: Organik (Hitam/Cokelat Sangat Tua) -->
    <rect x="50" y="45" width="120" height="24" fill="#3f2e21" stroke="#271a10" stroke-width="1"/>
    <!-- Horizon A: Topsoil Subur (Cokelat Tua) -->
    <rect x="50" y="69" width="120" height="38" fill="#5c4033" stroke="#3f2e21" stroke-width="1"/>
    <!-- Horizon B: Subsoil Lempung (Kuning Cokelat) -->
    <rect x="50" y="107" width="120" height="42" fill="#a06535" stroke="#5c4033" stroke-width="1"/>
    <!-- Horizon C: Batuan Lapuk (Cokelat Abu Butiran) -->
    <rect x="50" y="149" width="120" height="40" fill="#c49a6c" stroke="#a06535" stroke-width="1"/>
    <!-- Horizon R: Batuan Induk Pejal (Abu-abu Keras) -->
    <rect x="50" y="189" width="120" height="35" rx="2" fill="#78716c" stroke="#57534e" stroke-width="1"/>
  </g>

  <!-- Label Sisi Kanan (Anti-Overlap) -->
  <g>
    <rect x="185" y="46" width="165" height="19" rx="4" fill="#ffffff" stroke="#3f2e21" stroke-width="1"/>
    <text x="267" y="59" text-anchor="middle" font-size="9" font-weight="bold" fill="#3f2e21">Horizon O (Seresah &amp; Humus)</text>
  </g>
  <g>
    <rect x="185" y="78" width="165" height="19" rx="4" fill="#ffffff" stroke="#5c4033" stroke-width="1"/>
    <text x="267" y="91" text-anchor="middle" font-size="9" font-weight="bold" fill="#5c4033">Horizon A (Topsoil Subur)</text>
  </g>
  <g>
    <rect x="185" y="118" width="165" height="19" rx="4" fill="#ffffff" stroke="#a06535" stroke-width="1"/>
    <text x="267" y="131" text-anchor="middle" font-size="9" font-weight="bold" fill="#a06535">Horizon B (Subsoil Lempung)</text>
  </g>
  <g>
    <rect x="185" y="158" width="165" height="19" rx="4" fill="#ffffff" stroke="#c49a6c" stroke-width="1"/>
    <text x="267" y="171" text-anchor="middle" font-size="9" font-weight="bold" fill="#a06535">Horizon C (Regolit / Batuan Lapuk)</text>
  </g>
  <g>
    <rect x="185" y="196" width="165" height="19" rx="4" fill="#ffffff" stroke="#78716c" stroke-width="1"/>
    <text x="267" y="209" text-anchor="middle" font-size="9" font-weight="bold" fill="#57534e">Horizon R (Batuan Induk Pejal)</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Lapisan tanah yang ditunjuk oleh tanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 22. Render Pembagian Zona Waktu Indonesia */
export function renderZonaWaktuIndonesiaSvg(params: { zona?: string; label?: string }): string {
  const zona = (params.zona || 'wita').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 1; // 0: WIB, 1: WITA, 2: WIT
  if (zona.includes('wib') || zona.includes('barat')) activeIdx = 0;
  else if (zona.includes('wit') && !zona.includes('wita') || zona.includes('timur')) activeIdx = 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Pembagian Tiga Zona Waktu di Indonesia</text>

  <!-- Peta Kepulauan Indonesia Sederhana & Batas Garis Bujur -->
  <rect x="15" y="45" width="390" height="90" rx="8" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2"/>
  <!-- Batas Wilayah Vertikal Garis Putus -->
  <line x1="145" y1="45" x2="145" y2="135" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4 3"/>
  <line x1="275" y1="45" x2="275" y2="135" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4 3"/>

  <!-- Ikon Jam Perbandingan Waktu -->
  <!-- Kolom WIB -->
  <g>
    <circle cx="80" cy="75" r="16" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
    <line x1="80" y1="75" x2="80" y2="64" stroke="#0f172a" stroke-width="2"/>
    <line x1="80" y1="75" x2="72" y2="82" stroke="#0f172a" stroke-width="1.6"/>
    <text x="80" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">07.00 WIB</text>
    <text x="80" y="122" text-anchor="middle" font-size="8" fill="#64748b">Meridian 105° BT</text>
  </g>

  <!-- Kolom WITA -->
  <g>
    <circle cx="210" cy="75" r="16" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
    <line x1="210" y1="75" x2="210" y2="64" stroke="#0f172a" stroke-width="2"/>
    <line x1="210" y1="75" x2="200" y2="75" stroke="#0f172a" stroke-width="1.6"/>
    <text x="210" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534">08.00 WITA</text>
    <text x="210" y="122" text-anchor="middle" font-size="8" fill="#64748b">Meridian 120° BT</text>
  </g>

  <!-- Kolom WIT -->
  <g>
    <circle cx="340" cy="75" r="16" fill="#ffffff" stroke="#d97706" stroke-width="2"/>
    <line x1="340" y1="75" x2="340" y2="64" stroke="#0f172a" stroke-width="2"/>
    <line x1="340" y1="75" x2="328" y2="75" stroke="#0f172a" stroke-width="1.6"/>
    <text x="340" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">09.00 WIT</text>
    <text x="340" y="122" text-anchor="middle" font-size="8" fill="#64748b">Meridian 135° BT</text>
  </g>

  <!-- Kartu Penjelasan Wilayah di Bawah -->
  <rect x="15" y="145" width="120" height="75" rx="6" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="75" y="162" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1">WIB (UTC+7)</text>
  <text x="75" y="180" text-anchor="middle" font-size="8" fill="#475569">Sumatra, Jawa,</text>
  <text x="75" y="194" text-anchor="middle" font-size="8" fill="#475569">Kalbar, Kalteng</text>

  <rect x="145" y="145" width="120" height="75" rx="6" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="205" y="162" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">WITA (UTC+8)</text>
  <text x="205" y="180" text-anchor="middle" font-size="8" fill="#475569">Sulawesi, Bali,</text>
  <text x="205" y="194" text-anchor="middle" font-size="8" fill="#475569">NTB, NTT, Kalsel</text>

  <rect x="275" y="145" width="120" height="75" rx="6" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="335" y="162" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b45309">WIT (UTC+9)</text>
  <text x="335" y="180" text-anchor="middle" font-size="8" fill="#475569">Kepulauan Maluku</text>
  <text x="335" y="194" text-anchor="middle" font-size="8" fill="#475569">&amp; Tanah Papua</text>

  <!-- Target Badge X -->
  <circle cx="${[75, 205, 335][activeIdx]}" cy="145" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${[75, 205, 335][activeIdx]}" y="149" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="246" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Zona waktu yang ditunjuk oleh huruf "${escapeXml(labelChar)}" berselisih ... jam dari WIB</text>
</svg>`;
}

/** 23. Render Siklus Pembentukan Batuan Bumi */
export function renderSiklusBatuanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'beku').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 95, y: 80, name: 'Batuan Beku' };
  if (pointer.includes('sedimen') || pointer.includes('endapan')) target = { x: 305, y: 80, name: 'Batuan Sedimen' };
  else if (pointer.includes('metamorf') || pointer.includes('malihan')) target = { x: 305, y: 190, name: 'Batuan Metamorf' };
  else if (pointer.includes('magma') || pointer.includes('cair pijar')) target = { x: 95, y: 190, name: 'Dapur Magma' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 270" width="420" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="rockArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Siklus Pembentukan Batuan Bumi</text>

  <!-- Panah Penghubung Siklus -->
  <!-- Magma -> Batuan Beku (Pendinginan) -->
  <line x1="95" y1="175" x2="95" y2="98" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>
  <!-- Batuan Beku -> Sedimen (Pelapukan & Erosi) -->
  <line x1="140" y1="80" x2="250" y2="80" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>
  <!-- Sedimen -> Metamorf (Suhu & Tekanan Tinggi) -->
  <line x1="305" y1="98" x2="305" y2="175" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>
  <!-- Metamorf -> Magma (Peleburan / Melting) -->
  <line x1="250" y1="190" x2="140" y2="190" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>

  <!-- Teks Proses pada Panah (Anti-Overlap) -->
  <text x="50" y="138" font-size="8" font-weight="600" fill="#0369a1">Pendinginan</text>
  <text x="195" y="72" text-anchor="middle" font-size="8" font-weight="600" fill="#0369a1">Pelapukan &amp; Pengendapan</text>
  <text x="355" y="138" font-size="8" font-weight="600" fill="#0369a1">Suhu &amp; Tekanan</text>
  <text x="195" y="204" text-anchor="middle" font-size="8" font-weight="600" fill="#0369a1">Peleburan (Melting)</text>

  <!-- Kotak 1: Magma (Kiri Bawah) -->
  <rect x="50" y="175" width="90" height="32" rx="6" fill="#fee2e2" stroke="#ef4444" stroke-width="1.8"/>
  <text x="95" y="195" text-anchor="middle" font-size="10" font-weight="bold" fill="#991b1b">Magma Pijar</text>

  <!-- Kotak 2: Batuan Beku (Kiri Atas) -->
  <rect x="50" y="65" width="90" height="32" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.8"/>
  <text x="95" y="85" text-anchor="middle" font-size="10" font-weight="bold" fill="#075985">Batuan Beku</text>

  <!-- Kotak 3: Batuan Sedimen (Kanan Atas) -->
  <rect x="260" y="65" width="90" height="32" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.8"/>
  <text x="305" y="85" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">Batuan Sedimen</text>

  <!-- Kotak 4: Batuan Metamorf (Kanan Bawah) -->
  <rect x="260" y="175" width="90" height="32" rx="6" fill="#f3e8ff" stroke="#a855f7" stroke-width="1.8"/>
  <text x="305" y="195" text-anchor="middle" font-size="10" font-weight="bold" fill="#6b21a8">Batuan Metamorf</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Tahap siklus batuan pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// 21. Gerak Semu Tahunan Matahari
export function renderGerakSemuMatahariSvg(params: any): string {
  const pointer = String(params.bulan || params.pointer || 'juni').toLowerCase();
  const labelChar = params.label || 'X';

  const points = [
    { id: 'juni', bulan: '21 Juni (23.5° LU)', x: 190, y: 60 },
    { id: 'september', bulan: '23 September (0°)', x: 260, y: 105 },
    { id: 'desember', bulan: '22 Desember (23.5° LS)', x: 190, y: 150 },
    { id: 'maret', bulan: '21 Maret (0° Khatulistiwa)', x: 120, y: 105 }
  ];

  let target = points.find(p => pointer.includes(p.id)) || points[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Peredaran Gerak Semu Tahunan Matahari</text>

  <!-- Garis Lintang Acuan -->
  <line x1="50" y1="60" x2="330" y2="60" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="340" y="63" font-size="7.5" font-weight="bold" fill="#b45309">23.5° LU</text>

  <line x1="50" y1="105" x2="330" y2="105" stroke="#10b981" stroke-width="1.5"/>
  <text x="340" y="108" font-size="7.5" font-weight="bold" fill="#047857">0° (Khatulistiwa)</text>

  <line x1="50" y1="150" x2="330" y2="150" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="340" y="153" font-size="7.5" font-weight="bold" fill="#b45309">23.5° LS</text>

  <!-- Lintasan Gelombang Sinus Gerak Semu Matahari -->
  <path d="M 120 105 Q 155 60 190 60 Q 225 60 260 105 Q 225 150 190 150 Q 155 150 120 105 Z" fill="none" stroke="#ef4444" stroke-width="2"/>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="198" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Posisi matahari pada simbol "[${escapeXml(labelChar)}]" terjadi pada bulan ...</text>
</svg>`;
}

// 22. Musim dan Revolusi Bumi (Kemiringan Sumbu 23.5°)
export function renderMusimDanRevolusiBumiSvg(params: any): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="400" height="220" style="background:#0f172a; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="400" height="220" fill="#0f172a" stroke="#334155" stroke-width="1.5" rx="8"/>
  <text x="200" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#f8fafc">Revolusi Bumi &amp; Kemiringan Sumbu 23.5°</text>

  <!-- Orbit Elips Putus-putus -->
  <ellipse cx="200" cy="115" rx="140" ry="55" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Matahari di Pusat -->
  <circle cx="200" cy="115" r="22" fill="#f59e0b" stroke="#fbbf24" stroke-width="3" filter="drop-shadow(0 0 10px #f59e0b)"/>
  <text x="200" y="119" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">Matahari</text>

  <!-- Posisi Bumi Juni (Kiri) - Miring ke Arah Matahari -->
  <g transform="translate(70, 115)">
    <line x1="-12" y1="-28" x2="12" y2="28" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="15" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
    <text x="0" y="32" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#94a3b8">21 Juni</text>
  </g>

  <!-- Posisi Bumi Desember (Kanan) - Miring Menjauhi Matahari -->
  <g transform="translate(330, 115)">
    <line x1="-12" y1="-28" x2="12" y2="28" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="15" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
    <text x="0" y="32" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#94a3b8">22 Des</text>
    <!-- Target Badge -->
    <circle cx="0" cy="0" r="10" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
    <text x="0" y="4" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  </g>

  <text x="200" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#94a3b8">Kondisi musim di belahan bumi utara pada posisi "[${escapeXml(labelChar)}]" adalah musim ...</text>
</svg>`;
}

// 23. Siklus Karbon dan Oksigen
export function renderSiklusKarbonOksigenSvg(params: any): string {
  const pointer = String(params.pointer || params.tahap || 'fotosintesis').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'fotosintesis', name: 'Fotosintesis (Menyerap CO2, Melepas O2)', x: 105, y: 100 },
    { id: 'respirasi', name: 'Respirasi Hewan (Menghirup O2, Melepas CO2)', x: 275, y: 100 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="coArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
    </marker>
    <marker id="ocArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <rect width="380" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Daur Karbon Dioksida (CO2) &amp; Oksigen (O2)</text>

  <!-- Tumbuhan Hijau (Kiri) -->
  <g transform="translate(70, 100)">
    <circle cx="0" cy="0" r="30" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text x="0" y="5" text-anchor="middle" font-size="16">🌳</text>
    <text x="0" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#166534">Tumbuhan</text>
  </g>

  <!-- Hewan / Sapi (Kanan) -->
  <g transform="translate(310, 100)">
    <circle cx="0" cy="0" r="30" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text x="0" y="5" text-anchor="middle" font-size="16">🐄</text>
    <text x="0" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#92400e">Hewan</text>
  </g>

  <!-- Panah Atas: Oksigen (O2) dari Tumbuhan ke Hewan -->
  <path d="M 105 75 Q 190 45 275 75" fill="none" stroke="#0284c7" stroke-width="2.2" marker-end="url(#ocArr)"/>
  <text x="190" y="55" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Oksigen (O2)</text>

  <!-- Panah Bawah: Karbon Dioksida (CO2) dari Hewan ke Tumbuhan -->
  <path d="M 275 125 Q 190 155 105 125" fill="none" stroke="#059669" stroke-width="2.2" marker-end="url(#coArr)"/>
  <text x="190" y="152" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#047857">Karbon Dioksida (CO2)</text>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Gas yang dilepaskan pada alur bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}
