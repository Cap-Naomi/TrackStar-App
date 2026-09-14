import { Accelerometer } from 'expo-sensors';
import { CadenceDetector } from '@/domain/cadence';
import type { CadenceProvider } from './CadenceProvider';
import type { CadenceSample } from '@/types';

export class AccelerometerCadenceProvider implements CadenceProvider {
  private subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  private staleTimer: ReturnType<typeof setInterval> | null = null;
  private readonly detector = new CadenceDetector();

  async requestPermission(): Promise<boolean> {
    const result = await Accelerometer.requestPermissionsAsync();
    return result.granted;
  }

  async isAvailable(): Promise<boolean> {
    return Accelerometer.isAvailableAsync();
  }

  async start(onSample: (sample: CadenceSample) => void): Promise<void> {
    await this.stop();
    this.detector.reset();
    Accelerometer.setUpdateInterval(50);
    this.subscription = Accelerometer.addListener(({ x, y, z }) => {
      onSample(this.detector.process({ x, y, z, timestampMs: Date.now() }));
    });
    this.staleTimer = setInterval(() => onSample(this.detector.sample(Date.now())), 1000);
  }

  async stop(): Promise<void> {
    this.subscription?.remove();
    this.subscription = null;
    if (this.staleTimer) clearInterval(this.staleTimer);
    this.staleTimer = null;
  }
}
