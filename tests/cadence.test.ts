import { CadenceDetector } from '@/domain/cadence';

describe('CadenceDetector', () => {
  it('detects and smooths a stable 170 SPM step pattern', () => {
    const detector = new CadenceDetector({ minimumPeak: 0.08 });
    detector.process({ x: 0, y: 0, z: 1, timestampMs: 0 });
    let sample = detector.sample(0);
    for (let index = 0; index < 8; index += 1) {
      const timestampMs = 500 + index * 353;
      detector.process({ x: 0, y: 0, z: 1, timestampMs: timestampMs - 50 });
      sample = detector.process({ x: 0, y: 0, z: 1.55, timestampMs });
    }
    expect(sample.smoothedSpm).toBeGreaterThanOrEqual(168);
    expect(sample.smoothedSpm).toBeLessThanOrEqual(172);
    expect(sample.confidence).toBeGreaterThanOrEqual(0.65);
  });

  it('expires cadence after three seconds without a valid step', () => {
    const detector = new CadenceDetector({ minimumPeak: 0.08 });
    detector.process({ x: 0, y: 0, z: 1, timestampMs: 0 });
    for (let index = 0; index < 5; index += 1) {
      const timestampMs = 500 + index * 400;
      detector.process({ x: 0, y: 0, z: 1, timestampMs: timestampMs - 50 });
      detector.process({ x: 0, y: 0, z: 1.6, timestampMs });
    }
    expect(detector.sample(6000).smoothedSpm).not.toBeNull();
    const stale = detector.process({ x: 0, y: 0, z: 1, timestampMs: 6000 });
    expect(stale.smoothedSpm).toBeNull();
    expect(stale.confidence).toBe(0);
  });
});
