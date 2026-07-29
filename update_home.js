const fs = require('fs');
const content = `import { api } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { formatDateTime, escapeHtml } from '../utils.js';

if (typeof window !== 'undefined') {
  window.homeFutureParallax = (event) => {
    const root = event.currentTarget;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const px = Math.max(-1, Math.min(1, (x - 0.5) * 2));
    const py = Math.max(-1, Math.min(1, (y - 0.5) * 2));

    root.style.setProperty('--px', px.toFixed(4));
    root.style.setProperty('--py', py.toFixed(4));
  };

  window.homeFutureParallaxReset = (event) => {
    const root = event.currentTarget;
    if (!root) return;
    root.style.setProperty('--px', '0');
    root.style.setProperty('--py', '0');
  };
}

export async function renderHome() {
  let pengumuman = [];
  try {
    const res = await api('/pengumuman?limit=3', { timeout: 2500 });
    pengumuman = res.data || [];
  } catch (e) {
    console.log('Pengumuman not loaded quickly, rendering without it');
  }

  const features = [
    { id: 'surat', icon: 'fa-wand-magic-sparkles', title: 'Smart Generation', desc: 'AI-driven document generator for extreme time efficiency.', delay: '1' },
    { id: 'proker', icon: 'fa-diagram-project', title: 'Program Matrix', desc: 'Structured & integrated planning telemetry for operations.', delay: '2' },
    { id: 'absensi', icon: 'fa-users-viewfinder', title: 'Quantum Presensi', desc: 'Next-gen realtime tracking identity attendance system.', delay: '3' },
    { id: 'materi', icon: 'fa-book-atlas', title: 'Neural Library', desc: 'Central repository nexus for intelligence and modules.', delay: '4' },
    { id: 'forum', icon: 'fa-network-wired', title: 'Sync Node Hub', desc: 'Interactive communication uplink for rapid collaboration.', delay: '5' },
    { id: 'kalender', icon: 'fa-calendar-days', title: 'Timeline Vector', desc: 'Synchronized universal schedule grid and event planning.', delay: '6' },
  ].filter(item => !item.admin || (state.user && ['admin', 'operator'].includes(state.user.role)));

  const stats = [
    { value: '09', label: 'Active Nodes', suffix: '' },
    { value: '50', label: 'Registered Units', suffix: '+' },
    { value: 'v3', label: 'Core Version', suffix: '.1' },
    { value: '99', label: 'System Uptime', suffix: '.9%' },
  ];

  const telemetry = [
    { label: 'SYNC RATE', value: '1ms Ping', tone: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
    { label: 'THROUGHPUT', value: '1.2 Tbps', tone: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
    { label: 'SECURITY', value: 'Level 5', tone: 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10 shadow-[0_0_15px_rgba(217,70,239,0.2)]' },
  ];

  return \`
    <div class="home-future relative min-h-screen bg-[#030712] text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-100 [--px:0] [--py:0]" onmousemove="homeFutureParallax(event)" onmouseleave="homeFutureParallaxReset(event)">
      
      <!-- FUTURISTIC BACKGROUND GRID & GLOW -->
      <div class="pointer-events-none absolute inset-0 z-0">
        <!-- Center massive glow -->
        <div class="absolute -top-[20%] left-1/2 h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[120px] motion-safe:animate-pulse [animation-duration:8s] transition-transform duration-500 ease-out" style="transform: translate3d(calc(var(--px) * -30px), calc(var(--py) * -20px), 0);"></div>
        <!-- Right side accent glow -->
        <div class="absolute top-[30%] -right-[10%] h-[40rem] w-[40rem] rounded-full bg-fuchsia-600/10 blur-[100px] transition-transform duration-500 ease-out" style="transform: translate3d(calc(var(--px) * 20px), calc(var(--py) * 15px), 0);"></div>
        <!-- Bottom left deep space blue -->
        <div class="absolute -bottom-[20%] -left-[10%] h-[45rem] w-[45rem] rounded-full bg-blue-700/10 blur-[120px] transition-transform duration-500 ease-out" style="transform: translate3d(calc(var(--px) * 15px), calc(var(--py) * -15px), 0);"></div>
        
        <!-- Cyber grid -->
        <div class="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <!-- Vertical tech lines -->
        <div class="absolute inset-y-0 left-[15%] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>
        <div class="absolute inset-y-0 right-[15%] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>
        
        <!-- Scanline overlay -->
        <div class="absolute inset-0 bg-[repeating-linear-gradient(transparent_0px,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] opacity-50 mix-blend-overlay pointer-events-none"></div>
      </div>

      <!-- HERO SECTION -->
      <section class="relative z-10 flex min-h-[92vh] flex-col items-center justify-center px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <div class="mx-auto w-full max-w-7xl text-center transition-transform duration-300 ease-out" style="transform: translate3d(calc(var(--px) * 12px), calc(var(--py) * 8px), 0);">
          
          <!-- Badge -->
          <div class="opacity-0 animate-slide-up stagger-1 mb-8 inline-flex justify-center">
            <div class="group relative inline-flex items-center gap-3 rounded-full border border-cyan-500/40 bg-cyan-950/30 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:bg-cyan-900/40">
              <span class="absolute inset-0 rounded-full border border-cyan-400/0 group-hover:animate-ping group-hover:border-cyan-400/50"></span>
              <span class="relative flex h-2.5 w-2.5 items-center justify-center">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-80"></span>
                <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-200"></span>
              </span>
              SYSTEM ONLINE :: READY
            </div>
          </div>

          <!-- Main Title -->
          <div class="opacity-0 animate-slide-up stagger-2 relative">
            <h1 class="font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9]">
              <span class="block text-slate-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Portal KKG</span>
              <span class="mt-2 block bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                Nexus 3 Wanayasa
              </span>
            </h1>
          </div>

          <!-- Subtitle -->
          <div class="opacity-0 animate-slide-up stagger-3">
            <p class="mx-auto mt-8 mb-12 max-w-2xl px-4 text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl font-light">
              High-velocity digital command center. Engineered for educators to accelerate intelligence, synchronization, and cross-node operations.
            </p>
          </div>

          <!-- CTAs -->
          <div class="opacity-0 animate-slide-up stagger-4 flex flex-col items-center justify-center gap-5 sm:flex-row">
            \${!state.user ? \`
              <button onclick="navigate('login')" class="group relative overflow-hidden rounded-md border border-cyan-500 bg-cyan-500/10 px-8 py-4 font-bold tracking-wide text-cyan-50 shadow-[0_0_25px_rgba(6,182,212,0.3)] backdrop-blur-sm transition-all hover:bg-cyan-500 hover:text-slate-950 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] w-full sm:w-auto">
                <div class="absolute inset-0 flex h-full w-full jus
