import { estimateCadenceFromSpeed } from '@/domain/speedEstimate';

describe('estimateCadenceFromSpeed', () => {
  it('uses the documented height and speed heuristic', () => {
    expect(estimateCadenceFromSpeed(6, 175)).toBe(160);
  });

  it('clamps unrealistic inputs to the supported cadence range', () => {
    expect(estimateCadenceFromSpeed(-20, 220)).toBe(130);
    expect(estimateCadenceFromSpeed(30, 130)).toBe(190);
  });
});
