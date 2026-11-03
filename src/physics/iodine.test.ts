import { describe, expect, it } from "vitest";
import {
  C_SOLID,
  C_VAPOUR,
  IODINE,
  IODINE_MAX_J,
  L_SUB,
  SOLID_END,
  SUB_END,
  T_ROOM,
  T_SUB,
  T_VAPOUR,
  applyEnergy,
  stateFromEnergy,
} from "./curve";

describe("iodine classroom model", () => {
  it("uses one sublimation plateau and whole joules", () => {
    expect(C_SOLID * (T_SUB - T_ROOM)).toBe(SOLID_END);
    expect(SOLID_END).toBe(18_690);
    expect(SUB_END).toBe(SOLID_END + L_SUB);
    expect(IODINE_MAX_J).toBe(SUB_END + C_VAPOUR * (T_VAPOUR - T_SUB));
    expect(IODINE.regions).toEqual(["crystal", "sublime", "vapour"]);
  });

  it("starts as a crystal at 25°C and never becomes a liquid", () => {
    const start = stateFromEnergy(0, IODINE);
    expect(start.region).toBe("crystal");
    expect(start.tempC).toBe(25);
    expect(start.water).toBe(0);
    for (const q of [0, SOLID_END, SOLID_END + 1, SUB_END - 1, SUB_END, IODINE_MAX_J]) {
      const state = stateFromEnergy(q, IODINE);
      expect(["crystal", "sublime", "vapour"]).toContain(state.region);
      expect(state.water).toBe(0);
    }
  });

  it("is a crystal-vapour mixture the moment it reaches 114°C", () => {
    const state = stateFromEnergy(SOLID_END, IODINE);
    expect(state.region).toBe("sublime");
    expect(state.tempC).toBe(114);
    expect(state.progress).toBe(0);
    expect(state.ice).toBe(1);
    expect(state.steam).toBe(0);
  });

  it("becomes vapour at 114°C when sublimation is exactly complete", () => {
    const state = stateFromEnergy(SUB_END, IODINE);
    expect(state.region).toBe("vapour");
    expect(state.tempC).toBe(114);
    expect(state.steam).toBe(1);
  });

  it("caps the vapour at 140°C", () => {
    const state = stateFromEnergy(IODINE_MAX_J + 50_000, IODINE);
    expect(state.region).toBe("vapour");
    expect(state.tempC).toBe(140);
    expect(state.energyJ).toBe(IODINE_MAX_J);
  });

  it("splits a 10 kJ packet across 114°C", () => {
    const result = applyEnergy(SOLID_END - 4_000, 10_000, IODINE);
    expect(result.step.after.region).toBe("sublime");
    expect(result.step.after.tempC).toBe(114);
    expect(result.step.parts.map((part) => [part.region, part.kind])).toEqual([
      ["crystal", "sensible"],
      ["sublime", "latent"],
    ]);
    expect(result.step.phaseChanges).toEqual([]);
    expect(result.step.parts[0].energyJ).toBe(4_000);
    expect(result.step.parts[1].energyJ).toBe(6_000);
  });

  it("completes sublimation and names that as the only change", () => {
    const result = applyEnergy(SOLID_END, L_SUB, IODINE);
    expect(result.energyJ).toBe(SUB_END);
    expect(result.step.after.region).toBe("vapour");
    expect(result.step.after.tempC).toBe(114);
    expect(result.step.phaseChanges).toEqual(["sublimed"]);
  });

  it("deposits only once the sample cools back into a crystal", () => {
    const stay = applyEnergy(SOLID_END + 1_000, -1_000, IODINE);
    expect(stay.step.after.region).toBe("sublime");
    expect(stay.step.phaseChanges).toEqual([]);

    const intoMixture = applyEnergy(SUB_END + 1_000, -2_000, IODINE);
    expect(intoMixture.step.after.region).toBe("sublime");
    expect(intoMixture.step.phaseChanges).toEqual([]);

    const deposit = applyEnergy(SOLID_END + 1_000, -2_000, IODINE);
    expect(deposit.step.after.region).toBe("crystal");
    expect(deposit.step.after.tempC).toBeLessThan(114);
    expect(deposit.step.phaseChanges).toEqual(["deposited"]);
  });

  it("clamps extra heat and extra cooling", () => {
    const hot = applyEnergy(IODINE_MAX_J, 10_000, IODINE);
    expect(hot.step.absorbedJ).toBe(0);
    expect(hot.step.wastedJ).toBe(10_000);
    expect(hot.step.after.tempC).toBe(140);

    const cold = applyEnergy(0, -10_000, IODINE);
    expect(cold.step.absorbedJ).toBe(0);
    expect(cold.step.wastedJ).toBe(-10_000);
    expect(cold.step.after.tempC).toBe(25);
  });
});
