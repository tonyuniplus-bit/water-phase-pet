/** 1 kg samples, school values, stored as integer joules from the cold start. */

export const MASS_KG = 1;
export const C_ICE = 2_100;
export const C_WATER = 4_200;
export const C_STEAM = 2_000;
export const LF = 334_000;
export const LV = 2_260_000;
export const T_MIN = -20;
export const T_MELT = 0;
export const T_BOIL = 100;
export const T_MAX = 120;

export const ICE_END = C_ICE * (T_MELT - T_MIN);
export const MELT_END = ICE_END + LF * MASS_KG;
export const WATER_END = MELT_END + C_WATER * (T_BOIL - T_MELT);
export const BOIL_END = WATER_END + LV * MASS_KG;
export const MAX_J = BOIL_END + C_STEAM * (T_MAX - T_BOIL);

/** Classroom iodine model: solid 25°C to 114°C, one sublimation plateau, short vapour slope. */
export const C_SOLID = 210;
export const C_VAPOUR = 150;
export const L_SUB = 250_000;
export const T_ROOM = 25;
export const T_SUB = 114;
export const T_VAPOUR = 140;
export const SOLID_END = C_SOLID * (T_SUB - T_ROOM);
export const SUB_END = SOLID_END + L_SUB * MASS_KG;
export const IODINE_MAX_J = SUB_END + C_VAPOUR * (T_VAPOUR - T_SUB);

export const PACKETS_KJ = [10, 50, 200] as const;

export type Region = "ice" | "melt" | "water" | "boil" | "steam";
export type IodineRegion = "crystal" | "sublime" | "vapour";
export type PhaseEvent = "melted" | "boiled" | "frozen" | "condensed" | "sublimed" | "deposited";
export type HeatKind = "sensible" | "latent";
export type PageId = "water" | "iodine";

export interface Segment {
  region: string;
  kind: HeatKind;
  startJ: number;
  endJ: number;
  t0: number;
  t1: number;
}

interface PhaseRule {
  fromAtMost?: number;
  toAtLeast?: number;
  fromAtLeast?: number;
  toAtMost?: number;
  event: PhaseEvent;
}

export interface Substance {
  id: PageId;
  maxJ: number;
  tMin: number;
  tMax: number;
  segments: readonly Segment[];
  corners: readonly { energyJ: number; tempC: number }[];
  yTicks: readonly number[];
  xTicks: readonly number[];
  regions: readonly string[];
  up: readonly PhaseRule[];
  down: readonly PhaseRule[];
  fractions: (region: string, progress: number) => { ice: number; water: number; steam: number };
}

export interface SampleView {
  energyJ: number;
  region: string;
  tempC: number;
  progress: number;
  ice: number;
  water: number;
  steam: number;
}

export interface EnergyPart {
  region: string;
  kind: HeatKind;
  energyJ: number;
  tempBefore: number;
  tempAfter: number;
  progressBefore: number;
  progressAfter: number;
}

export interface EnergyStep {
  requestedJ: number;
  absorbedJ: number;
  wastedJ: number;
  parts: EnergyPart[];
  phaseChanges: PhaseEvent[];
  before: SampleView;
  after: SampleView;
}

function sensible(region: string, startJ: number, endJ: number, t0: number, t1: number): Segment {
  return { region, kind: "sensible", startJ, endJ, t0, t1 };
}

function latent(region: string, startJ: number, endJ: number, tempC: number): Segment {
  return { region, kind: "latent", startJ, endJ, t0: tempC, t1: tempC };
}

export const WATER: Substance = {
  id: "water",
  maxJ: MAX_J,
  tMin: T_MIN,
  tMax: T_MAX,
  segments: [
    sensible("ice", 0, ICE_END, T_MIN, T_MELT),
    latent("melt", ICE_END, MELT_END, T_MELT),
    sensible("water", MELT_END, WATER_END, T_MELT, T_BOIL),
    latent("boil", WATER_END, BOIL_END, T_BOIL),
    sensible("steam", BOIL_END, MAX_J, T_BOIL, T_MAX),
  ],
  corners: [
    { energyJ: 0, tempC: T_MIN },
    { energyJ: ICE_END, tempC: T_MELT },
    { energyJ: MELT_END, tempC: T_MELT },
    { energyJ: WATER_END, tempC: T_BOIL },
    { energyJ: BOIL_END, tempC: T_BOIL },
    { energyJ: MAX_J, tempC: T_MAX },
  ],
  yTicks: [T_MIN, 0, 100, T_MAX],
  xTicks: [0, MELT_END, WATER_END, BOIL_END],
  regions: ["ice", "melt", "water", "boil", "steam"],
  up: [
    { fromAtMost: 1, toAtLeast: 2, event: "melted" },
    { fromAtMost: 3, toAtLeast: 4, event: "boiled" },
  ],
  down: [
    { fromAtLeast: 3, toAtMost: 2, event: "condensed" },
    { fromAtLeast: 1, toAtMost: 0, event: "frozen" },
  ],
  fractions(region, progress) {
    if (region === "ice") return { ice: 1, water: 0, steam: 0 };
    if (region === "melt") return { ice: 1 - progress, water: progress, steam: 0 };
    if (region === "water") return { ice: 0, water: 1, steam: 0 };
    if (region === "boil") return { ice: 0, water: 1 - progress, steam: progress };
    return { ice: 0, water: 0, steam: 1 };
  },
};

export const IODINE: Substance = {
  id: "iodine",
  maxJ: IODINE_MAX_J,
  tMin: T_ROOM,
  tMax: T_VAPOUR,
  segments: [
    sensible("crystal", 0, SOLID_END, T_ROOM, T_SUB),
    latent("sublime", SOLID_END, SUB_END, T_SUB),
    sensible("vapour", SUB_END, IODINE_MAX_J, T_SUB, T_VAPOUR),
  ],
  corners: [
    { energyJ: 0, tempC: T_ROOM },
    { energyJ: SOLID_END, tempC: T_SUB },
    { energyJ: SUB_END, tempC: T_SUB },
    { energyJ: IODINE_MAX_J, tempC: T_VAPOUR },
  ],
  yTicks: [T_ROOM, T_SUB, T_VAPOUR],
  xTicks: [0, SOLID_END, SUB_END],
  regions: ["crystal", "sublime", "vapour"],
  up: [{ fromAtMost: 1, toAtLeast: 2, event: "sublimed" }],
  down: [{ fromAtLeast: 1, toAtMost: 0, event: "deposited" }],
  fractions(region, progress) {
    if (region === "crystal") return { ice: 1, water: 0, steam: 0 };
    if (region === "sublime") return { ice: 1 - progress, water: 0, steam: progress };
    return { ice: 0, water: 0, steam: 1 };
  },
};

export const SUBSTANCES: Record<PageId, Substance> = {
  water: WATER,
  iodine: IODINE,
};

/** Water segments, kept for callers that read the lesson boundaries directly. */
export const SEGMENTS: readonly Segment[] = WATER.segments;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function segmentAt(energyJ: number, substance: Substance): Segment {
  const q = clamp(energyJ, 0, substance.maxJ);
  return substance.segments.find((segment) => q < segment.endJ) ?? substance.segments[substance.segments.length - 1];
}

function tempOn(segment: Segment, q: number): number {
  if (segment.kind === "latent") return segment.t0;
  const span = segment.endJ - segment.startJ;
  return segment.t0 + ((q - segment.startJ) * (segment.t1 - segment.t0)) / span;
}

function progressOn(segment: Segment, q: number): number {
  if (segment.kind !== "latent") return 0;
  return (q - segment.startJ) / (segment.endJ - segment.startJ);
}

function pack(substance: Substance, energyJ: number, segment: Segment, q: number): SampleView {
  const progress = progressOn(segment, q);
  const parts = substance.fractions(segment.region, progress);
  return { energyJ, region: segment.region, tempC: tempOn(segment, q), progress, ...parts };
}

export function stateFromEnergy(energyJ: number, substance: Substance = WATER): SampleView {
  const q = clamp(energyJ, 0, substance.maxJ);
  return pack(substance, q, segmentAt(q, substance), q);
}

export function phaseChangesBetween(before: SampleView, after: SampleView, substance: Substance = WATER): PhaseEvent[] {
  if (after.energyJ === before.energyJ) return [];
  const b = substance.regions.indexOf(before.region);
  const a = substance.regions.indexOf(after.region);
  const events: PhaseEvent[] = [];
  const rules = after.energyJ > before.energyJ ? substance.up : substance.down;
  for (const rule of rules) {
    const heating = after.energyJ > before.energyJ;
    const hit = heating
      ? b <= (rule.fromAtMost ?? -1) && a >= (rule.toAtLeast ?? 99)
      : b >= (rule.fromAtLeast ?? 99) && a <= (rule.toAtMost ?? -1);
    if (hit) events.push(rule.event);
  }
  return events;
}

function sliceParts(from: number, to: number, substance: Substance): EnergyPart[] {
  if (from === to) return [];
  const sign = to > from ? 1 : -1;
  const segs = sign > 0 ? substance.segments : [...substance.segments].reverse();
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const parts: EnergyPart[] = [];
  for (const seg of segs) {
    const start = Math.max(lo, seg.startJ);
    const end = Math.min(hi, seg.endJ);
    const overlap = end - start;
    if (overlap <= 0) continue;
    const startQ = sign > 0 ? start : end;
    const endQ = sign > 0 ? end : start;
    parts.push({
      region: seg.region,
      kind: seg.kind,
      energyJ: sign * overlap,
      tempBefore: tempOn(seg, startQ),
      tempAfter: tempOn(seg, endQ),
      progressBefore: progressOn(seg, startQ),
      progressAfter: progressOn(seg, endQ),
    });
  }
  return parts;
}

export function applyEnergy(
  energyJ: number,
  deltaJ: number,
  substance: Substance = WATER,
): { energyJ: number; step: EnergyStep } {
  const before = stateFromEnergy(energyJ, substance);
  const raw = before.energyJ + deltaJ;
  const next = clamp(raw, 0, substance.maxJ);
  const after = stateFromEnergy(next, substance);
  const parts = sliceParts(before.energyJ, next, substance);
  return {
    energyJ: next,
    step: {
      requestedJ: deltaJ,
      absorbedJ: next - before.energyJ,
      wastedJ: raw - next,
      parts,
      phaseChanges: phaseChangesBetween(before, after, substance),
      before,
      after,
    },
  };
}

export function remainingJ(energyJ: number, substance: Substance = WATER): number {
  const q = clamp(energyJ, 0, substance.maxJ);
  const seg = segmentAt(q, substance);
  return seg.endJ - q;
}

function smoothstep(unit: number): number {
  const t = clamp(unit, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Auto heat lingers near the ends of a state, where the temperature locks
 * or a change of state is about to finish, and cruises through the middle.
 */
export function autoJoulesPerSecond(energyJ: number, substance: Substance = WATER): number {
  const q = clamp(energyJ, 0, substance.maxJ);
  const segment = segmentAt(q, substance);
  const span = segment.endJ - segment.startJ;
  const edge = Math.min(q - segment.startJ, segment.endJ - q);
  const short = span < 80_000;
  const slow = short ? 15_000 : 24_000;
  const fast = short ? 28_000 : span < 500_000 ? 220_000 : 360_000;
  const hold = short ? span / 2 : Math.min(70_000, span * 0.12);
  const ramp = short ? Math.max(span / 2, 1) : Math.min(80_000, span * 0.12);
  const boost = short ? smoothstep(edge / hold) : edge <= hold ? 0 : smoothstep((edge - hold) / ramp);
  return Math.round(slow + (fast - slow) * boost);
}

/** One auto tick, never leaping past the next change of state. */
export function autoStepJ(
  energyJ: number,
  dtSeconds: number,
  direction: 1 | -1,
  substance: Substance = WATER,
): number {
  const q = clamp(energyJ, 0, substance.maxJ);
  const dt = clamp(dtSeconds, 0, 0.5);
  const wanted = Math.round(autoJoulesPerSecond(q, substance) * dt);
  if (wanted <= 0) return 0;
  const segment = segmentAt(q, substance);
  const room = direction > 0 ? segment.endJ - q : q - segment.startJ;
  if (room <= 0) return wanted;
  return Math.min(wanted, room);
}

export function curvePoints(uptoJ: number, substance: Substance = WATER): { energyJ: number; tempC: number }[] {
  const q = clamp(uptoJ, 0, substance.maxJ);
  const points: { energyJ: number; tempC: number }[] = [];
  for (const corner of substance.corners) {
    if (corner.energyJ < q) points.push({ energyJ: corner.energyJ, tempC: corner.tempC });
    else {
      points.push({ energyJ: q, tempC: stateFromEnergy(q, substance).tempC });
      return points;
    }
  }
  return points;
}

export function isPlateau(region: string, substance: Substance = WATER): boolean {
  return substance.segments.some((segment) => segment.region === region && segment.kind === "latent");
}
