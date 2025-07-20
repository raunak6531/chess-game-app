// Simple sound system using Web Audio API
class SoundSystem {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported');
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playMove(): void {
    this.createTone(440, 0.1, 'sine');
  }

  playCapture(): void {
    this.createTone(330, 0.15, 'square');
    setTimeout(() => this.createTone(220, 0.1, 'square'), 50);
  }

  playCheck(): void {
    this.createTone(660, 0.2, 'triangle');
    setTimeout(() => this.createTone(880, 0.15, 'triangle'), 100);
  }

  playCheckmate(): void {
    const notes = [440, 330, 220, 165];
    notes.forEach((note, index) => {
      setTimeout(() => this.createTone(note, 0.3, 'sawtooth'), index * 150);
    });
  }

  playCastling(): void {
    this.createTone(523, 0.1, 'sine'); // C5
    setTimeout(() => this.createTone(659, 0.1, 'sine'), 100); // E5
    setTimeout(() => this.createTone(784, 0.15, 'sine'), 200); // G5
  }

  playPromotion(): void {
    const melody = [523, 587, 659, 698, 784]; // C5, D5, E5, F5, G5
    melody.forEach((note, index) => {
      setTimeout(() => this.createTone(note, 0.1, 'sine'), index * 80);
    });
  }

  playGameStart(): void {
    this.createTone(523, 0.2, 'sine'); // C5
    setTimeout(() => this.createTone(659, 0.2, 'sine'), 200); // E5
    setTimeout(() => this.createTone(784, 0.3, 'sine'), 400); // G5
  }

  playIllegalMove(): void {
    this.createTone(200, 0.2, 'sawtooth');
  }
}

export const soundSystem = new SoundSystem();
