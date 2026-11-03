import { describe, expect, it } from "vitest";
import {
  BOIL_END,
  C_ICE,
  C_STEAM,
  C_WATER,
  ICE_END,
  LF,
  LV,
  MAX_J,
  MELT_END,
  T_MAX,
  T_MIN,
  WATER_END,
  applyEnergy,
  autoJoulesPerSecond,
  autoStepJ,
  curvePoints,
  remainingJ,
  stateFromEnergy,
} from "./curve";

describe("school values", () => {
  it("uses the 1 kg boundaries from the lesson", () => {
    expect(ICE_END).toBe(42_000);
    expect(MELT_END).toBe(42_000 + 334_000);
    expect(WATER_END).toBe(MELT_END + 420_000);
    expect(BOIL_END).toBe(WATER_END + 2_260_000);
    expect(MAX_J).toBe(BOIL_END + 40_000);
    expect(C_ICE).toBe(2_100);
    expect(C_WATER).toBe(4_200);
    expect(C_STEAM).toBe(2_000);
    expect(LF).toBe(334_000);
    expect(LV).toBe(2_260_000);
  });
});

describe("stateFromEnergy", () => {
  it("starts as ice at -20°C", () => {
    const state = stateFromEnergy(0);
    expect(state.region).toBe("ice");
    expect(state.tempC).toBe(T_MIN);
    expect(state.ice).toBe(1);
  });

  it("is an ice-water mixture the moment the sample reaches 0°C", () => {
    const state = stateFromEnergy(ICE_END);
    expect(state.region).toBe("melt");
    expect(state.tempC).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.ice).toBe(1);
    expect(state.water).toBe(0);
  });

  it("holds 0°C halfway through melting", () => {
    const state = stateFromEnergy(ICE_END + LF / 2);
    expect(state.region).toBe("melt");
    expect(state.tempC).toBe(0);
    expect(state.progress).toBeCloseTo(0.5);
    expect(state.ice + state.water).toBeCloseTo(1);
  });

  it("becomes liquid water at 0°C when fusion is exactly complete", () => {
    const state = stateFromEnergy(MELT_END);
    expect(state.region).toBe("water");
    expect(state.tempC).toBe(0);
  });

  it("is a water-steam mixture the moment the sample reaches 100°C", () => {
    const state = stateFromEnergy(WATER_END);
    expect(state.region).toBe("boil");
    expect(state.tempC).toBe(100);
    expect(state.progress).toBe(0);
    expect(state.steam).toBe(0);
  });

  it("becomes steam at 100°C when vaporization is exactly complete", () => {
    const state = stateFromEnergy(BOIL_END);
    expect(state.region).toBe("steam");
    expect(state.tempC).toBe(100);
  });

  it("caps steam at 120°C", () => {
    const state = stateFromEnergy(MAX_J + 50_000);
    expect(state.region).toBe("steam");
    expect(state.tempC).toBe(T_MAX);
    expect(state.energyJ).toBe(MAX_J);
  });
});

describe("applyEnergy", () => {
  it("warms ice without leaving the solid", () => {
    const result = applyEnergy(0, 21_000);
    expect(result.energyJ).toBe(21_000);
    expect(result.step.after.region).toBe("ice");
    expect(result.step.after.tempC).toBeCloseTo(-10);
    expect(result.step.parts).toHaveLength(1);
    expect(result.step.parts[0].tempBefore).toBe(-20);
    expect(result.step.parts[0].tempAfter).toBeCloseTo(-10);
    expect(result.step.phaseChanges).toEqual([]);
    expect(result.step.wastedJ).toBe(0);
  });

  it("splits a packet across 0°C into sensible heat and latent heat", () => {
    const result = applyEnergy(21_000, 50_000);
    expect(result.step.after.region).toBe("melt");
    expect(result.step.after.tempC).toBe(0);
    expect(result.step.parts.map((part) => part.region)).toEqual(["ice", "melt"]);
    expect(result.step.parts[0].energyJ).toBe(21_000);
    expect(result.step.parts[0].kind).toBe("sensible");
    expect(result.step.parts[0].tempAfter).toBe(0);
    expect(result.step.parts[1].energyJ).toBe(29_000);
    expect(result.step.parts[1].kind).toBe("latent");
    expect(result.step.parts[1].tempBefore).toBe(0);
    expect(result.step.parts[1].tempAfter).toBe(0);
    expect(result.step.phaseChanges).toEqual([]);
  });

  it("keeps temperature at 0°C while melting is underway", () => {
    const result = applyEnergy(ICE_END + 1_000, 50_000);
    expect(result.step.after.tempC).toBe(0);
    expect(result.step.after.region).toBe("melt");
    expect(result.step.parts.every((part) => part.tempBefore === 0 && part.tempAfter === 0)).toBe(true);
  });

  it("completes fusion and leaves liquid water at 0°C", () => {
    const result = applyEnergy(ICE_END, LF);
    expect(result.energyJ).toBe(MELT_END);
    expect(result.step.after.region).toBe("water");
    expect(result.step.after.tempC).toBe(0);
    expect(result.step.phaseChanges).toEqual(["melted"]);
  });

  it("uses leftover energy to warm water after melting finishes", () => {
    const result = applyEnergy(MELT_END - 1_000, 1_000 + 42_000);
    expect(result.step.after.region).toBe("water");
    expect(result.step.after.tempC).toBeCloseTo(10);
    expect(result.step.phaseChanges).toEqual(["melted"]);
    expect(result.step.parts.map((part) => part.region)).toEqual(["melt", "water"]);
  });

  it("splits a packet across 100°C", () => {
    const start = WATER_END - 42_000;
    const result = applyEnergy(start, 42_000 + 100_000);
    expect(result.step.before.tempC).toBeCloseTo(90);
    expect(result.step.after.region).toBe("boil");
    expect(result.step.after.tempC).toBe(100);
    expect(result.step.parts.map((part) => [part.region, part.energyJ])).toEqual([
      ["water", 42_000],
      ["boil", 100_000],
    ]);
    expect(result.step.phaseChanges).toEqual([]);
  });

  it("completes vaporization and warms the new steam with leftover energy", () => {
    const result = applyEnergy(BOIL_END - 1_000, 1_000 + 20_000);
    expect(result.step.after.region).toBe("steam");
    expect(result.step.after.tempC).toBeCloseTo(110);
    expect(result.step.phaseChanges).toEqual(["boiled"]);
  });

  it("returns to the start when the same energy is removed", () => {
    const up = applyEnergy(0, 500_000);
    const down = applyEnergy(up.energyJ, -500_000);
    expect(down.energyJ).toBe(0);
    expect(down.step.after.region).toBe("ice");
    expect(down.step.after.tempC).toBe(-20);
    expect(up.step.parts.reduce((sum, part) => sum + part.energyJ, 0)).toBe(500_000);
    expect(down.step.parts.reduce((sum, part) => sum + part.energyJ, 0)).toBe(-500_000);
  });

  it("clamps extra heat at 120°C", () => {
    const result = applyEnergy(MAX_J, 50_000);
    expect(result.energyJ).toBe(MAX_J);
    expect(result.step.absorbedJ).toBe(0);
    expect(result.step.wastedJ).toBe(50_000);
    expect(result.step.after.tempC).toBe(120);
  });

  it("clamps extra cooling at -20°C", () => {
    const result = applyEnergy(0, -50_000);
    expect(result.energyJ).toBe(0);
    expect(result.step.absorbedJ).toBe(0);
    expect(result.step.wastedJ).toBe(-50_000);
    expect(result.step.after.tempC).toBe(-20);
  });

  it("reports wasted heat when a packet runs past 120°C", () => {
    const result = applyEnergy(MAX_J - 1_000, 5_000);
    expect(result.step.absorbedJ).toBe(1_000);
    expect(result.step.wastedJ).toBe(4_000);
    expect(result.step.after.tempC).toBe(120);
    expect(result.step.parts.reduce((sum, part) => sum + part.energyJ, 0)).toBe(1_000);
  });

  it("freezes only once the sample cools below 0°C", () => {
    const stay = applyEnergy(ICE_END + 1_000, -1_000);
    expect(stay.step.after.region).toBe("melt");
    expect(stay.step.after.tempC).toBe(0);
    expect(stay.step.phaseChanges).toEqual([]);

    const freeze = applyEnergy(ICE_END + 1_000, -2_000);
    expect(freeze.step.after.region).toBe("ice");
    expect(freeze.step.after.tempC).toBeLessThan(0);
    expect(freeze.step.phaseChanges).toEqual(["frozen"]);
  });

  it("condenses only once the sample cools below 100°C", () => {
    const stay = applyEnergy(WATER_END + 1_000, -1_000);
    expect(stay.step.after.region).toBe("boil");
    expect(stay.step.phaseChanges).toEqual([]);

    const condense = applyEnergy(WATER_END + 1_000, -2_000);
    expect(condense.step.after.region).toBe("water");
    expect(condense.step.after.tempC).toBeLessThan(100);
    expect(condense.step.phaseChanges).toEqual(["condensed"]);
  });

  it("names both completions when one packet crosses the whole curve", () => {
    const up = applyEnergy(0, MAX_J);
    expect(up.step.after.region).toBe("steam");
    expect(up.step.after.tempC).toBe(120);
    expect(up.step.phaseChanges).toEqual(["melted", "boiled"]);
    expect(up.step.parts.map((part) => part.region)).toEqual(["ice", "melt", "water", "boil", "steam"]);
    expect(up.step.parts.reduce((sum, part) => sum + part.energyJ, 0)).toBe(MAX_J);

    const down = applyEnergy(MAX_J, -MAX_J);
    expect(down.step.after.region).toBe("ice");
    expect(down.step.phaseChanges).toEqual(["condensed", "frozen"]);
    expect(down.step.parts.reduce((sum, part) => sum + part.energyJ, 0)).toBe(-MAX_J);
  });
});

describe("curvePoints", () => {
  it("draws plateaus as flat stretches and stops at the current energy", () => {
    const full = curvePoints(MAX_J);
    expect(full).toEqual([
      { energyJ: 0, tempC: -20 },
      { energyJ: ICE_END, tempC: 0 },
      { energyJ: MELT_END, tempC: 0 },
      { energyJ: WATER_END, tempC: 100 },
      { energyJ: BOIL_END, tempC: 100 },
      { energyJ: MAX_J, tempC: 120 },
    ]);

    const midMelt = curvePoints(ICE_END + 10_000);
    expect(midMelt.at(-1)).toEqual({ energyJ: ICE_END + 10_000, tempC: 0 });
    expect(remainingJ(ICE_END)).toBe(LF);
    expect(remainingJ(MAX_J)).toBe(0);
  });
});

function crossSeconds(from: number, to: number, direction: 1 | -1): number {
  let energy = from;
  let seconds = 0;
  while ((direction > 0 ? energy < to : energy > to) && seconds < 180) {
    const step = autoStepJ(energy, 0.1, direction);
    if (step <= 0) break;
    energy += direction * step;
    seconds += 0.1;
  }
  return seconds;
}

describe("auto pace", () => {
  it("cruises through the middle of a state and slows at both ends", () => {
    const meltStart = autoJoulesPerSecond(ICE_END);
    const meltMiddle = autoJoulesPerSecond(ICE_END + LF / 2);
    const meltEnd = autoJoulesPerSecond(MELT_END - 1);
    expect(meltMiddle).toBeGreaterThan(meltStart * 3);
    expect(meltMiddle).toBeGreaterThan(meltEnd * 3);
    expect(meltStart).toBeLessThan(40_000);
    expect(meltEnd).toBeLessThan(40_000);

    const boilMiddle = autoJoulesPerSecond(WATER_END + LV / 2);
    expect(boilMiddle).toBeGreaterThan(meltMiddle);
    expect(autoJoulesPerSecond(WATER_END)).toBeLessThan(40_000);
    expect(autoJoulesPerSecond(BOIL_END - 1)).toBeLessThan(40_000);
  });

  it("keeps the short ice and steam stretches easy to watch", () => {
    const iceMiddle = autoJoulesPerSecond(ICE_END / 2);
    const boilMiddle = autoJoulesPerSecond(WATER_END + LV / 2);
    expect(iceMiddle).toBeLessThan(40_000);
    expect(boilMiddle).toBeGreaterThan(iceMiddle * 8);
    expect(crossSeconds(0, ICE_END, 1)).toBeGreaterThan(1.2);
    expect(crossSeconds(BOIL_END, MAX_J, 1)).toBeGreaterThan(1.2);
  });

  it("finishes a long plateau sooner than a constant slow pace, still lingering before it ends", () => {
    const boil = crossSeconds(WATER_END, BOIL_END, 1);
    expect(boil).toBeGreaterThan(8);
    expect(boil).toBeLessThan(18);
    const tail = crossSeconds(BOIL_END - 70_000, BOIL_END, 1);
    expect(tail).toBeGreaterThan(2);
  });

  it("stops a tick on the next boundary instead of skipping the change", () => {
    expect(MELT_END - 4_000 + autoStepJ(MELT_END - 4_000, 1, 1)).toBe(MELT_END);
    expect(ICE_END + 4_000 - autoStepJ(ICE_END + 4_000, 1, -1)).toBe(ICE_END);
  });

  it("matches heating and cooling at the same distance from an end", () => {
    const heating = crossSeconds(MELT_END, WATER_END, 1);
    const cooling = crossSeconds(WATER_END, MELT_END, -1);
    expect(Math.abs(heating - cooling)).toBeLessThan(0.3);
  });
});
