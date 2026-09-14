import type { CadenceSample } from '@/types';
import type { CadenceProvider } from './CadenceProvider';

export class SimulatedCadenceProvider implements CadenceProvider {
  private timer: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;
  private manualSpm: number | null = null;

  async requestPermission(): Promise<boolean> { return true; }
  async isAvailable(): Promise<boolean> { return true; }

  setCadence(spm: number | null): void {
    this.manualSpm = spm;
  }

  private automatedCadence(elapsedSec: number): number {
    if (elapsedSec < 8) return 145;
    if (elapsedSec < 18) return 158;
    if (elapsedSec < 30) return 174;
    return 146;
  }

  async start(onSample: (sample: CadenceSample) => void): Promise<void> {
    await this.stop();
    this.startedAt = Date.now();
    this.timer = setInterval(() => {
      const timestampMs = Date.now();
      const base = this.manualSpm ?? this.automatedCadence((timestampMs - this.startedAt) / 1000);
      const sway = Math.sin((timestampMs - this.startedAt) / 800) * 1.6;
      const spm = Math.round(base + sway);
      onSample({ timestampMs, rawSpm: spm, smoothedSpm: spm, confidence: 0.94, source: 'simulation' });
    }, 250);
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
