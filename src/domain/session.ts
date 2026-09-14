import { createRunSummary, calculateInstantBeatMatch } from '@/domain/analytics';
import { calculateCoachingTempo } from '@/domain/coaching';
import { getActiveInterval, totalWorkoutDuration, type ActiveInterval } from '@/domain/intervals';
import { selectTrack, type ScoredTrack } from '@/domain/matching';
import type { CadenceSample, RunDataPoint, RunSummary, Track, WorkoutInterval, WorkoutPlan } from '@/types';

export type SessionStatus = 'ready' | 'running' | 'paused' | 'completed' | 'ended';

export interface RunSessionSnapshot {
  status: SessionStatus;
  elapsedSec: number;
  totalSec: number;
  active: ActiveInterval | null;
  nextInterval: WorkoutInterval | null;
  actualSpm: number | null;
  confidence: number;
  desiredTempo: number;
  trackMatch: ScoredTrack;
  beatMatchPercent: number | null;
  isAdjusting: boolean;
  points: RunDataPoint[];
}

export interface RunSessionConfig {
  sustainedDriftMs: number;
  switchCooldownMs: number;
  transitionGuardSec: number;
  minimumConfidence: number;
  minimumImprovementSpm: number;
}

export const DEMO_SESSION_CONFIG: RunSessionConfig = {
  sustainedDriftMs: 2500,
  switchCooldownMs: 7000,
  transitionGuardSec: 1.5,
  minimumConfidence: 0.65,
  minimumImprovementSpm: 4,
};

export const STANDARD_SESSION_CONFIG: RunSessionConfig = {
  sustainedDriftMs: 10000,
  switchCooldownMs: 45000,
  transitionGuardSec: 5,
  minimumConfidence: 0.65,
  minimumImprovementSpm: 4,
};

export class RunSessionEngine {
  private status: SessionStatus = 'ready';
  private startedAtMs = 0;
  private pausedAtMs: number | null = null;
  private pausedDurationMs = 0;
  private elapsedSec = 0;
  private activeIndex = 0;
  private actualSpm: number | null = null;
  private confidence = 0;
  private desiredTempo: number;
  private trackMatch: ScoredTrack;
  private recentlyPlayed: string[] = [];
  private lastSwitchAtMs = -Infinity;
  private driftStartedAtMs: number | null = null;
  private lastRecordedSecond = -1;
  private points: RunDataPoint[] = [];
  private adjustingUntilMs = 0;

  constructor(
    private readonly plan: WorkoutPlan,
    private readonly tracks: Track[],
    private readonly config: RunSessionConfig = DEMO_SESSION_CONFIG,
    private readonly random: () => number = Math.random,
  ) {
    const firstTarget = plan.intervals[0]?.targetSpm ?? 160;
    this.desiredTempo = firstTarget;
    this.trackMatch = this.pickTrack(firstTarget);
  }

  start(nowMs: number): RunSessionSnapshot {
    this.startedAtMs = nowMs;
    this.status = 'running';
    this.lastSwitchAtMs = nowMs;
    return this.snapshot(nowMs);
  }

  updateCadence(sample: CadenceSample, nowMs = sample.timestampMs): RunSessionSnapshot {
    this.actualSpm = sample.smoothedSpm;
    this.confidence = sample.confidence;
    const active = getActiveInterval(this.plan.intervals, this.elapsedSec);
    if (active) this.desiredTempo = calculateCoachingTempo(this.actualSpm, active.interval.targetSpm);
    this.maybeAdaptTrack(nowMs, active);
    return this.snapshot(nowMs);
  }

  tick(nowMs: number): RunSessionSnapshot {
    if (this.status !== 'running') return this.snapshot(nowMs);
    this.elapsedSec = Math.max(0, (nowMs - this.startedAtMs - this.pausedDurationMs) / 1000);
    const active = getActiveInterval(this.plan.intervals, this.elapsedSec);
    if (!active) {
      this.elapsedSec = totalWorkoutDuration(this.plan.intervals);
      this.status = 'completed';
      return this.snapshot(nowMs);
    }

    if (active.index !== this.activeIndex) {
      this.activeIndex = active.index;
      this.desiredTempo = calculateCoachingTempo(this.actualSpm, active.interval.targetSpm);
      this.switchTrack(this.desiredTempo, nowMs);
    }
    this.recordPoint(active);
    return this.snapshot(nowMs);
  }

  pause(nowMs: number): RunSessionSnapshot {
    if (this.status === 'running') {
      this.status = 'paused';
      this.pausedAtMs = nowMs;
    }
    return this.snapshot(nowMs);
  }

  resume(nowMs: number): RunSessionSnapshot {
    if (this.status === 'paused' && this.pausedAtMs != null) {
      this.pausedDurationMs += nowMs - this.pausedAtMs;
      this.pausedAtMs = null;
      this.status = 'running';
    }
    return this.snapshot(nowMs);
  }

  skip(nowMs: number): RunSessionSnapshot {
    this.recentlyPlayed.push(this.trackMatch.track.id);
    this.trackMatch = this.pickTrack(this.desiredTempo, [this.trackMatch.track.id]);
    this.lastSwitchAtMs = nowMs;
    this.adjustingUntilMs = nowMs + 1800;
    return this.snapshot(nowMs);
  }

  end(nowMs: number): RunSessionSnapshot {
    if (this.status === 'running') this.tick(nowMs);
    this.status = 'ended';
    return this.snapshot(nowMs);
  }

  getSummary(now = new Date()): RunSummary {
    return createRunSummary({
      points: this.points,
      durationSec: this.elapsedSec,
      completedIntervals: Math.min(this.plan.intervals.length, this.activeIndex + (this.status === 'completed' ? 1 : 0)),
      totalIntervals: this.plan.intervals.length,
      now,
    });
  }

  private maybeAdaptTrack(nowMs: number, active: ActiveInterval | null): void {
    if (this.status !== 'running' || !active || this.confidence < this.config.minimumConfidence) {
      this.driftStartedAtMs = null;
      return;
    }
    const currentDifference = Math.abs(this.trackMatch.effectiveTempo - this.desiredTempo);
    const nearTransition = active.remainingSec <= this.config.transitionGuardSec;
    if (currentDifference < 5 || nearTransition) {
      this.driftStartedAtMs = null;
      return;
    }
    this.driftStartedAtMs ??= nowMs;
    if (
      nowMs - this.driftStartedAtMs >= this.config.sustainedDriftMs &&
      nowMs - this.lastSwitchAtMs >= this.config.switchCooldownMs
    ) {
      const candidate = this.pickTrack(this.desiredTempo, [this.trackMatch.track.id]);
      const improvement = currentDifference - Math.abs(candidate.effectiveTempo - this.desiredTempo);
      if (improvement >= this.config.minimumImprovementSpm) {
        this.trackMatch = candidate;
        this.recentlyPlayed.push(candidate.track.id);
        this.lastSwitchAtMs = nowMs;
        this.adjustingUntilMs = nowMs + 2200;
      }
      this.driftStartedAtMs = null;
    }
  }

  private switchTrack(tempo: number, nowMs: number): void {
    this.recentlyPlayed.push(this.trackMatch.track.id);
    this.trackMatch = this.pickTrack(tempo, [this.trackMatch.track.id]);
    this.lastSwitchAtMs = nowMs;
    this.adjustingUntilMs = nowMs + 2200;
    this.driftStartedAtMs = null;
  }

  private pickTrack(tempo: number, extraExcluded: string[] = []): ScoredTrack {
    const excluded = new Set(extraExcluded);
    const candidates = this.tracks.filter((track) => !excluded.has(track.id));
    return selectTrack(
      {
        tracks: candidates.length > 0 ? candidates : this.tracks,
        desiredTempo: tempo,
        selectedGenres: this.plan.genres,
        recentlyPlayed: this.recentlyPlayed.slice(-4),
      },
      this.random,
    );
  }

  private recordPoint(active: ActiveInterval): void {
    const second = Math.floor(this.elapsedSec);
    if (second === this.lastRecordedSecond) return;
    this.lastRecordedSecond = second;
    this.points.push({
      timestampMs: second * 1000,
      actualSpm: this.actualSpm,
      targetSpm: active.interval.targetSpm,
      songBpm: this.trackMatch.track.bpm,
      effectiveSongSpm: this.trackMatch.mode === 'unknown' ? null : this.trackMatch.effectiveTempo,
      confidence: this.confidence,
      intervalId: active.interval.id,
    });
  }

  private snapshot(nowMs: number): RunSessionSnapshot {
    const active = getActiveInterval(this.plan.intervals, this.elapsedSec);
    const nextInterval = active ? this.plan.intervals[active.index + 1] ?? null : null;
    const beatMatch =
      this.actualSpm == null || this.trackMatch.mode === 'unknown'
        ? null
        : calculateInstantBeatMatch(this.actualSpm, this.trackMatch.effectiveTempo) * 100;
    return {
      status: this.status,
      elapsedSec: this.elapsedSec,
      totalSec: totalWorkoutDuration(this.plan.intervals),
      active,
      nextInterval,
      actualSpm: this.actualSpm,
      confidence: this.confidence,
      desiredTempo: this.desiredTempo,
      trackMatch: this.trackMatch,
      beatMatchPercent: beatMatch == null ? null : Math.round(beatMatch),
      isAdjusting: nowMs < this.adjustingUntilMs,
      points: [...this.points],
    };
  }
}
