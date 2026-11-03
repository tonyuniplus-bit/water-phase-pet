/** 1 kg of water, school values, stored as integer joules from ice at −20°C. */

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

export const PACKETS_KJ = [10, 50, 200] as const;

export type Region = "ice" | "melt" | "water" | "boil" | "steam";
export type PhaseEvent = "melted" | "boiled" | "frozen" | "condensed";
export type HeatKind = "sensible" | "latent";

export interface Segment {
  region: Region;
  kind: HeatKind;
  startJ: number;
  endJ: number;
}

export const SEGMENTS: readonly Segment[] = [
  { region: "ice", kind: "sensible", startJ: 0, endJ: ICE_END },
  { region: "melt", kind: "latent", startJ: ICE_END, endJ: MELT_END },
  { region: "water", kind: "sensible", startJ: MELT_END, endJ: WATER_END },
  { region: "boil", kind: "latent", startJ: WATER_END, endJ: BOIL_END },
  { region: "steam", kind: "sensible", startJ: BOIL_END, endJ: MAX_J },
];

/**
 * Corners of the heating curve. Plateau starts belong to the mixture.
 * Plateau ends belong to the next pure phase, still at the critical temperature.
 */
export const CORNERS: readonly { energyJ: number; tempC: number }[] = [
  { energyJ: 0, tempC: T_MIN },
  { energyJ: ICE_END, tempC: T_MELT },
  { energyJ: MELT_END, tempC: T_MELT },
  { energyJ: WATER_END, tempC: T_BOIL },
  { energyJ: BOIL_END, tempC: T_BOIL },
  { energyJ: MAX_J, tempC: T_MAX },
];

const REGION_ORDER: readonly Region[] = ["ice", "melt", "water", "boil", "steam"];

export interface SampleView {
  energyJ: number;
  region: Region;
  tempC: number;
  /** Melted fraction on the 0°C plateau, vapor fraction on the 100°C plateau, otherwise 0. */
  progress: number;
  ice: number;
  water: number;
  steam: number;
}

export interface EnergyPart {
  region: Region;
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pack(
  energyJ: number,
  region: Region,
  tempC: number,
  progress: number,
  ice: number,
  water: number,
  steam: number,
): SampleView {
  return { energyJ, region, tempC, progress, ice, water, steam };
}

export function stateFromEnergy(energyJ: number): SampleView {
  const q = clamp(energyJ, 0, MAX_J);
  if (q < ICE_END) {
    return pack(q, "ice", T_MIN + q / C_ICE, 0, 1, 0, 0);
  }
  if (q < MELT_END) {
    const melted = (q - ICE_END) / LF;
    return pack(q, "melt", T_MELT, melted, 1 - melted, melted, 0);
  }
  if (q < WATER_END) {
    return pack(q, "water", (q - MELT_END) / C_WATER, 0, 0, 1, 0);
  }
  if (q < BOIL_END) {
    const vapor = (q - WATER_END) / LV;
    return pack(q, "boil", T_BOIL, vapor, 0, 1 - vapor, vapor);
  }
  return pack(q, "steam", T_BOIL + (q - BOIL_END) / C_STEAM, 0, 0, 0, 1);
}

function tempOnSegment(region: Region, q: number): number {
  switch (region) {
    case "ice":
      return T_MIN + q / C_ICE;
    case "melt":
      return T_MELT;
    case "water":
      return (q - MELT_END) / C_WATER;
    case "boil":
      return T_BOIL;
    case "steam":
      return T_BOIL + (q - BOIL_END) / C_STEAM;
  }
}

function progressOnSegment(region: Region, q: number): number {
  if (region === "melt") return (q - ICE_END) / LF;
  if (region === "boil") return (q - WATER_END) / LV;
  return 0;
}

export function phaseChangesBetween(before: SampleView, after: SampleView): PhaseEvent[] {
  if (after.energyJ === before.energyJ) return [];
  const b = REGION_ORDER.indexOf(before.region);
  const a = REGION_ORDER.indexOf(after.region);
  const events: PhaseEvent[] = [];
  if (after.energyJ > before.energyJ) {
    if (b <= 1 && a >= 2) events.push("melted");
    if (b <= 3 && a >= 4) events.push("boiled");
  } else {
    if (b >= 3 && a <= 2) events.push("condensed");
    if (b >= 1 && a <= 0) events.push("frozen");
  }
  return events;
}

function sliceParts(from: number, to: number): EnergyPart[] {
  if (from === to) return [];
  const sign = to > from ? 1 : -1;
  const segs = sign > 0 ? SEGMENTS : [...SEGMENTS].reverse();
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
      tempBefore: tempOnSegment(seg.region, startQ),
      tempAfter: tempOnSegment(seg.region, endQ),
      progressBefore: progressOnSegment(seg.region, startQ),
      progressAfter: progressOnSegment(seg.region, endQ),
    });
  }
  return parts;
}

export function applyEnergy(energyJ: number, deltaJ: number): { energyJ: number; step: EnergyStep } {
  const before = stateFromEnergy(energyJ);
  const raw = before.energyJ + deltaJ;
  const next = clamp(raw, 0, MAX_J);
  const after = stateFromEnergy(next);
  const parts = sliceParts(before.energyJ, next);
  return {
    energyJ: next,
    step: {
      requestedJ: deltaJ,
      absorbedJ: next - before.energyJ,
      wastedJ: raw - next,
      parts,
      phaseChanges: phaseChangesBetween(before, after),
      before,
      after,
    },
  };
}

export function remainingJ(energyJ: number): number {
  const q = clamp(energyJ, 0, MAX_J);
  const seg = SEGMENTS.find((segment) => q < segment.endJ) ?? SEGMENTS[SEGMENTS.length - 1];
  return seg.endJ - q;
}

function segmentAt(energyJ: number): Segment {
  const q = clamp(energyJ, 0, MAX_J);
  return SEGMENTS.find((segment) => q < segment.endJ) ?? SEGMENTS[SEGMENTS.length - 1];
}

function smoothstep(unit: number): number {
  const t = clamp(unit, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Auto heat lingers near the ends of a state, where the temperature locks
 * or a change of state is about to finish, and cruises through the middle.
 */
export function autoJoulesPerSecond(energyJ: number): number {
  const q = clamp(energyJ, 0, MAX_J);
  const segment = segmentAt(q);
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
export function autoStepJ(energyJ: number, dtSeconds: number, direction: 1 | -1): number {
  const q = clamp(energyJ, 0, MAX_J);
  const dt = clamp(dtSeconds, 0, 0.5);
  const wanted = Math.round(autoJoulesPerSecond(q) * dt);
  if (wanted <= 0) return 0;
  const segment = segmentAt(q);
  const room = direction > 0 ? segment.endJ - q : q - segment.startJ;
  if (room <= 0) return wanted;
  return Math.min(wanted, room);
}

export function curvePoints(uptoJ: number): { energyJ: number; tempC: number }[] {
  const q = clamp(uptoJ, 0, MAX_J);
  const points: { energyJ: number; tempC: number }[] = [];
  for (const corner of CORNERS) {
    if (corner.energyJ < q) points.push({ energyJ: corner.energyJ, tempC: corner.tempC });
    else {
      points.push({ energyJ: q, tempC: stateFromEnergy(q).tempC });
      return points;
    }
  }
  return points;
}

export function isPlateau(region: Region): boolean {
  return region === "melt" || region === "boil";
}
