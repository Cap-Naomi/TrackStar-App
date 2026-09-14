import type { CadenceSample } from '@/types';
import { clamp, median, standardDeviation } from '@/utils/math';

export interface AccelerometerPoint {
  x: number;
  y: number;
  z: number;
  timestampMs: number;
}

export interface CadenceDetectorOptions {
  gravityAlpha?: number;
  minimumPeak?: number;
  refractoryPeriodMs?: number;
  minimumStepIntervalMs?: number;
  maximumStepIntervalMs?: number;
  staleAfterMs?: number;
}

const DEFAULTS: Required<CadenceDetectorOptions> = {
  gravityAlpha: 0.9,
  minimumPeak: 0.12,
  refractoryPeriodMs: 250,
  minimumStepIntervalMs: 280,
  maximumStepIntervalMs: 750,
  staleAfterMs: 3000,
};

export class CadenceDetector {
  private readonly options: Required<CadenceDetectorOptions>;
  private gravity: number | null = null;
  private previousMotion = 0;
  private lastStepMs: number | null = null;
  private stepTimestamps: number[] = [];
  private smoothedSpm: number | null = null;
  private noiseFloor = 0.03;

  constructor(options: CadenceDetectorOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  process(point: AccelerometerPoint): CadenceSample {
    const magnitude = Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2);
    this.gravity = this.gravity == null
      ? magnitude
      : this.options.gravityAlpha * this.gravity + (1 - this.options.gravityAlpha) * magnitude;
    const motion = Math.abs(magnitude - this.gravity);
    this.noiseFloor = 0.96 * this.noiseFloor + 0.04 * motion;
    const threshold = Math.max(this.options.minimumPeak, this.noiseFloor * 2.2);
    const crossesThreshold = motion >= threshold && this.previousMotion < threshold;
    this.previousMotion = motion;

    if (crossesThreshold) this.acceptPotentialStep(point.timestampMs);
    if (this.lastStepMs != null && point.timestampMs - this.lastStepMs > this.options.staleAfterMs) {
      this.smoothedSpm = null;
      this.stepTimestamps = [];
    }

    return this.sample(point.timestampMs);
  }

  private acceptPotentialStep(timestampMs: number): void {
    if (this.lastStepMs != null && timestampMs - this.lastStepMs < this.options.refractoryPeriodMs) return;
    if (this.lastStepMs != null) {
      const interval = timestampMs - this.lastStepMs;
      if (interval < this.options.minimumStepIntervalMs || interval > this.options.maximumStepIntervalMs) {
        this.lastStepMs = timestampMs;
        this.stepTimestamps = [timestampMs];
        return;
      }
    }

    this.lastStepMs = timestampMs;
    this.stepTimestamps.push(timestampMs);
    this.stepTimestamps = this.stepTimestamps.slice(-7);
    const intervals = this.stepTimestamps.slice(1).map((value, index) => value - this.stepTimestamps[index]!);
    if (intervals.length === 0) return;
    const rawSpm = 60000 / median(intervals);
    if (rawSpm < 80 || rawSpm > 215) return;
    this.smoothedSpm = this.smoothedSpm == null ? rawSpm : 0.7 * this.smoothedSpm + 0.3 * rawSpm;
  }

  sample(timestampMs: number): CadenceSample {
    const intervals = this.stepTimestamps.slice(1).map((value, index) => value - this.stepTimestamps[index]!);
    const medianInterval = median(intervals);
    const rawSpm = intervals.length > 0 && medianInterval > 0 ? 60000 / medianInterval : null;
    const sampleCoverage = clamp(intervals.length / 5, 0, 1);
    const intervalConsistency =
      intervals.length < 2 || medianInterval === 0
        ? 0
        : clamp(1 - standardDeviation(intervals) / medianInterval, 0, 1);
    const age = this.lastStepMs == null ? Infinity : timestampMs - this.lastStepMs;
    const recency = clamp(1 - age / this.options.staleAfterMs, 0, 1);
    const confidence = this.smoothedSpm == null
      ? 0
      : 0.4 * sampleCoverage + 0.4 * intervalConsistency + 0.2 * recency;

    return {
      timestampMs,
      rawSpm: rawSpm == null ? null : Math.round(rawSpm),
      smoothedSpm: this.smoothedSpm == null ? null : Math.round(this.smoothedSpm),
      confidence: Number(confidence.toFixed(2)),
      source: 'accelerometer',
    };
  }

  reset(): void {
    this.gravity = null;
    this.previousMotion = 0;
    this.lastStepMs = null;
    this.stepTimestamps = [];
    this.smoothedSpm = null;
    this.noiseFloor = 0.03;
  }
}
