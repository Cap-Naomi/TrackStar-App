import type { CadenceSample } from '@/types';

export interface CadenceProvider {
  requestPermission(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
  start(onSample: (sample: CadenceSample) => void): Promise<void>;
  stop(): Promise<void>;
}
