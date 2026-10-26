export class Synthesizer {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.volume = 0.065;
  }
  async unlock() {
    if (!this.enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio no está disponible.');
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') await this.context.resume();
  }
  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      await this.unlock();
      this.play('scan');
    }
    return this.enabled;
  }
  tone(frequency, duration = 0.2, type = 'sine', delay = 0, endFrequency = frequency) {
    if (!this.context || this.context.state !== 'running') return;
    const ctx = this.context,
      time = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), time + duration);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(this.volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  play(event) {
    if (!this.enabled || !this.context) return;
    if (event === 'scan') this.tone(1100, 0.23, 'sine', 0, 450);
    if (event === 'obstacle') {
      this.tone(240, 0.14, 'triangle');
      this.tone(180, 0.18, 'triangle', 0.16);
    }
    if (event === 'reverse') {
      this.tone(110, 0.5, 'sawtooth', 0, 65);
      this.tone(320, 0.12, 'sine', 0.1);
    }
    if (event === 'warp') {
      this.tone(55, 0.8, 'sawtooth', 0, 1300);
      this.tone(90, 0.65, 'sine', 0.15, 1800);
    }
    if (event === 'capture')
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.48, 'sine', i * 0.14));
    if (event === 'blocked')
      [0, 0.3, 0.6].forEach((delay) => this.tone(160, 0.25, 'triangle', delay, 105));
  }
}
