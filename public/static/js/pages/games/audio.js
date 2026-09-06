/**
 * audio.js — Web Audio API Sound Synthesizer for IFP Games
 * 100% offline, zero external audio asset dependencies.
 * Dilengkapi dengan 3 level volume + mute untuk speaker IFP di kelas.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    const savedLevel = localStorage.getItem('kkg_game_sfx_volume') || 'high';
    this.volumeLevel = savedLevel; // 'high' | 'med' | 'low' | 'muted'
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getVolumeMultiplier() {
    switch (this.volumeLevel) {
      case 'high': return 1.0;
      case 'med': return 0.5;
      case 'low': return 0.2;
      case 'muted': return 0.0;
      default: return 1.0;
    }
  }

  getVolumeInfo() {
    switch (this.volumeLevel) {
      case 'high': return { level: 'high', icon: 'fa-volume-high text-emerald-400', label: 'Volume: Tinggi' };
      case 'med': return { level: 'med', icon: 'fa-volume-low text-teal-400', label: 'Volume: Sedang' };
      case 'low': return { level: 'low', icon: 'fa-volume-off text-amber-400', label: 'Volume: Pelan' };
      case 'muted': return { level: 'muted', icon: 'fa-volume-xmark text-rose-400', label: 'Volume: Senyap' };
      default: return { level: 'high', icon: 'fa-volume-high text-emerald-400', label: 'Volume: Tinggi' };
    }
  }

  cycleVolume() {
    const sequence = ['high', 'med', 'low', 'muted'];
    const nextIdx = (sequence.indexOf(this.volumeLevel) + 1) % sequence.length;
    this.volumeLevel = sequence[nextIdx];
    localStorage.setItem('kkg_game_sfx_volume', this.volumeLevel);
    return this.getVolumeInfo();
  }

  isMuted() {
    return this.volumeLevel === 'muted';
  }

  // Nada Benar: Melodi ceria C5 -> E5 -> G5
  playCorrect() {
    const vol = this.getVolumeMultiplier();
    if (vol <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2 * vol, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.26);
      });
    } catch (_) {}
  }

  // Nada Salah: Buzzer lembut
  playWrong() {
    const vol = this.getVolumeMultiplier();
    if (vol <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);

      gain.gain.setValueAtTime(0.15 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (_) {}
  }

  // Nada Sentuhan / Tombol
  playClick() {
    const vol = this.getVolumeMultiplier();
    if (vol <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

      gain.gain.setValueAtTime(0.1 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (_) {}
  }

  // Nada Kocok Dadu: Suara derik beruntun
  playDice() {
    const vol = this.getVolumeMultiplier();
    if (vol <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300 + Math.random() * 200, now);

          gain.gain.setValueAtTime(0.1 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.04);
        }, i * 45);
      }
    } catch (_) {}
  }

  // Nada Tarik Tambang: Whoosh kuat
  playTug() {
    const vol = this.getVolumeMultiplier();
    if (vol <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.12);

      gain.gain.setValueAtTime(0.2 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (_) {}
  }

  // Fanfare Kemenangan
  playVictory() {
    const vol = this.getVolumeMultiplier();
    if (vol <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.35 }, // E5
        { f: 783.99, d: 0.20 }, // G5
        { f: 1046.5, d: 0.50 }  // C6
      ];

      let t = this.ctx.currentTime + 0.05;
      notes.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25 * vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + note.d + 0.01);

        t += note.d + 0.05;
      });
    } catch (_) {}
  }

  // Alias methods for safety & backward compatibility
  playSuccess() {
    this.playCorrect();
  }

  playBuzzer() {
    this.playWrong();
  }

  playFanfare() {
    this.playVictory();
  }
}

export const sfx = new SoundEngine();

// Lightweight confetti trigger
export function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'fixed inset-0 pointer-events-none z-[9999] overflow-hidden';
  document.body.appendChild(container);

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const particleCount = 80;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 8 + Math.random() * 12;
    const startX = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 200;
    const duration = 2 + Math.random() * 2;
    const delay = Math.random() * 0.5;

    p.style.cssText = `
      position: absolute;
      top: -20px;
      left: ${startX}vw;
      width: ${size}px;
      height: ${size * (Math.random() > 0.5 ? 1.5 : 1)}px;
      background-color: ${color};
      border-radius: ${Math.random() > 0.4 ? '4px' : '50%'};
      opacity: 0.9;
      transform: rotate(${Math.random() * 360}deg);
      transition: transform ${duration}s ease-out, top ${duration}s ease-in, opacity ${duration}s ease-out;
      transition-delay: ${delay}s;
    `;
    container.appendChild(p);

    setTimeout(() => {
      p.style.top = '105vh';
      p.style.opacity = '0';
      p.style.transform = `translate(${drift}px, 0) rotate(${Math.random() * 720}deg)`;
    }, 20);
  }

  setTimeout(() => {
    container.remove();
  }, 4500);
}
