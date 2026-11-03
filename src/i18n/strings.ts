import type { PhaseEvent, Region } from "../physics/curve";

export type Locale = "en" | "zh-Hant";

export interface Dict {
  title: string;
  subtitle: string;
  sample: string;
  tempLabel: string;
  locked: string;
  stateLabel: string;
  regions: Record<Region, string>;
  process: Record<Region, string>;
  giveHeat: string;
  removeHeat: string;
  giveLatent: string;
  removeLatent: string;
  autoHeat: string;
  autoCool: string;
  stop: string;
  reset: string;
  latentFusion: string;
  latentVapor: string;
  mixIceWater: (ice: string, water: string) => string;
  mixWaterSteam: (water: string, steam: string) => string;
  nextIce: (kj: string) => string;
  nextMelt: (kj: string) => string;
  nextWater: (kj: string) => string;
  nextBoil: (kj: string) => string;
  nextSteam: (kj: string) => string;
  atMax: string;
  lastAction: string;
  lastNone: string;
  added: (kj: string) => string;
  removed: (kj: string) => string;
  sensible: (kj: string, name: string, from: string, to: string) => string;
  latentMelt: (kj: string, from: string, to: string) => string;
  latentBoil: (kj: string, from: string, to: string) => string;
  wastedHot: (kj: string) => string;
  wastedCold: (kj: string) => string;
  events: Record<PhaseEvent, string>;
  eventHint: Record<PhaseEvent, string>;
  evolve: string;
  devolve: string;
  ke: string;
  pe: string;
  energyUp: string;
  energyDown: string;
  energyChanges: string;
  energySteady: string;
  molTitle: string;
  molSensible: string;
  molLatent: string;
  chartTitle: string;
  chartEnergy: string;
  chartTemp: string;
  fusionMark: string;
  vaporMark: string;
  chartNote: string;
  valuesLabel: string;
  creatureLabel: string;
}

export const LOCALES: readonly Locale[] = ["en", "zh-Hant"];

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  "zh-Hant": "繁",
};

const en: Dict = {
  title: "Droplet",
  subtitle: "Change of state",
  sample: "1 kg of water",
  tempLabel: "Temperature",
  locked: "Locked",
  stateLabel: "State",
  regions: {
    ice: "Ice",
    melt: "Ice–water mixture",
    water: "Water",
    boil: "Water–steam mixture",
    steam: "Steam",
  },
  process: {
    ice: "Sensible heat. The ice stays solid while its temperature climbs toward 0°C.",
    melt: "Latent heat of fusion. Ice and water are both here, and the temperature stays at 0°C until the ice has melted.",
    water: "Sensible heat. Liquid water stays liquid while its temperature climbs toward 100°C.",
    boil: "Latent heat of vaporization. Water and steam are both here, and the temperature stays at 100°C until the water has boiled away.",
    steam: "Sensible heat. The steam stays a gas while its temperature climbs toward 120°C.",
  },
  giveHeat: "Feed heat",
  removeHeat: "Release heat",
  giveLatent: "Feed latent heat",
  removeLatent: "Release latent heat",
  autoHeat: "Auto heat",
  autoCool: "Auto cool",
  stop: "Stop",
  reset: "Reset",
  latentFusion: "Latent heat of fusion",
  latentVapor: "Latent heat of vaporization",
  mixIceWater: (ice, water) => `Ice ${ice} · Water ${water}`,
  mixWaterSteam: (water, steam) => `Water ${water} · Steam ${steam}`,
  nextIce: (kj) => `${kj} kJ more sensible heat reaches 0°C.`,
  nextMelt: (kj) => `${kj} kJ more latent heat finishes melting.`,
  nextWater: (kj) => `${kj} kJ more sensible heat reaches 100°C.`,
  nextBoil: (kj) => `${kj} kJ more latent heat finishes boiling.`,
  nextSteam: (kj) => `${kj} kJ more sensible heat reaches 120°C.`,
  atMax: "The steam is at 120°C. Remove energy to cool it.",
  lastAction: "Last energy packet",
  lastNone: "Feed heat and Droplet eats it. Take energy away and Droplet releases it.",
  added: (kj) => `Droplet ate ${kj} kJ of heat.`,
  removed: (kj) => `Droplet released ${kj} kJ.`,
  sensible: (kj, name, from, to) => `Sensible heat ${kj} kJ: ${name} went from ${from} to ${to}.`,
  latentMelt: (kj, from, to) =>
    `Latent heat ${kj} kJ at 0°C. Melted fraction went from ${from} to ${to}. Temperature stayed at 0°C.`,
  latentBoil: (kj, from, to) =>
    `Latent heat ${kj} kJ at 100°C. Steam fraction went from ${from} to ${to}. Temperature stayed at 100°C.`,
  wastedHot: (kj) => `${kj} kJ was not absorbed. The steam is already at 120°C.`,
  wastedCold: (kj) => `${kj} kJ could not be removed. The ice is already at −20°C.`,
  events: {
    melted: "Melted",
    boiled: "Boiled",
    frozen: "Frozen",
    condensed: "Condensed",
  },
  eventHint: {
    melted: "It ate the latent heat and evolved into liquid water.",
    boiled: "It ate the latent heat and evolved into steam.",
    frozen: "It released that energy and devolved into ice.",
    condensed: "It released that energy and devolved into liquid water.",
  },
  evolve: "Evolve",
  devolve: "Devolve",
  ke: "KE",
  pe: "PE",
  energyUp: "Increasing",
  energyDown: "Decreasing",
  energyChanges: "Changing",
  energySteady: "Unchanged",
  molTitle: "Molecules",
  molSensible: "They move faster. The spacing stays the same.",
  molLatent: "The speed stays the same. The spacing changes.",
  chartTitle: "Heating curve",
  chartEnergy: "Energy added (kJ)",
  chartTemp: "Temperature (°C)",
  fusionMark: "fusion",
  vaporMark: "vaporization",
  chartNote: "Flat lines are latent heat: the temperature waits. Boiling takes much more energy than melting.",
  valuesLabel: "Values used",
  creatureLabel: "Droplet, the water pet",
};

const zhHant: Dict = {
  title: "小水滴",
  subtitle: "物態變化",
  sample: "1 kg 水",
  tempLabel: "溫度",
  locked: "溫度鎖定",
  stateLabel: "狀態",
  regions: {
    ice: "冰",
    melt: "冰水混合物",
    water: "水",
    boil: "水與水蒸氣",
    steam: "水蒸氣",
  },
  process: {
    ice: "顯熱。冰仍是固態，溫度會上升，直到 0°C。",
    melt: "熔解潛熱。冰和水同時存在，在冰全部融化之前，溫度維持在 0°C。",
    water: "顯熱。水仍是液態，溫度會上升，直到 100°C。",
    boil: "汽化潛熱。水和水蒸氣同時存在，在水全部汽化之前，溫度維持在 100°C。",
    steam: "顯熱。水蒸氣仍是氣態，溫度會上升，直到 120°C。",
  },
  giveHeat: "餵熱能",
  removeHeat: "放出熱能",
  giveLatent: "餵潛熱",
  removeLatent: "放出潛熱",
  autoHeat: "自動加熱",
  autoCool: "自動冷卻",
  stop: "停止",
  reset: "重置",
  latentFusion: "熔解潛熱",
  latentVapor: "汽化潛熱",
  mixIceWater: (ice, water) => `冰 ${ice} · 水 ${water}`,
  mixWaterSteam: (water, steam) => `水 ${water} · 水蒸氣 ${steam}`,
  nextIce: (kj) => `再給 ${kj} kJ 顯熱就會到達 0°C。`,
  nextMelt: (kj) => `再給 ${kj} kJ 潛熱就會融化完成。`,
  nextWater: (kj) => `再給 ${kj} kJ 顯熱就會到達 100°C。`,
  nextBoil: (kj) => `再給 ${kj} kJ 潛熱就會汽化完成。`,
  nextSteam: (kj) => `再給 ${kj} kJ 顯熱就會到達 120°C。`,
  atMax: "水蒸氣已到 120°C。移除能量就可以冷卻。",
  lastAction: "上一份能量",
  lastNone: "餵熱能，小水滴會吃下去。放出能量時，熱會從牠身上出來。",
  added: (kj) => `小水滴吃下了 ${kj} kJ 熱能。`,
  removed: (kj) => `小水滴放出了 ${kj} kJ。`,
  sensible: (kj, name, from, to) => `顯熱 ${kj} kJ：${name}由 ${from} 到 ${to}。`,
  latentMelt: (kj, from, to) => `潛熱 ${kj} kJ，溫度維持 0°C。已融化的比例由 ${from} 到 ${to}。`,
  latentBoil: (kj, from, to) => `潛熱 ${kj} kJ，溫度維持 100°C。水蒸氣的比例由 ${from} 到 ${to}。`,
  wastedHot: (kj) => `${kj} kJ 沒有被吸收。水蒸氣已經是 120°C。`,
  wastedCold: (kj) => `${kj} kJ 無法再移除。冰已經是 −20°C。`,
  events: {
    melted: "融化了",
    boiled: "沸騰了",
    frozen: "凝固了",
    condensed: "凝結了",
  },
  eventHint: {
    melted: "牠吃下了熔解潛熱，進化成液態的水。",
    boiled: "牠吃下了汽化潛熱，進化成水蒸氣。",
    frozen: "牠放出能量，退化成冰。",
    condensed: "牠放出能量，退化成液態的水。",
  },
  evolve: "進化",
  devolve: "退化",
  ke: "動能",
  pe: "勢能",
  energyUp: "上升",
  energyDown: "下降",
  energyChanges: "改變",
  energySteady: "不變",
  molTitle: "分子",
  molSensible: "運動變快，間距不變。",
  molLatent: "速率不變，間距改變。",
  chartTitle: "加熱曲線",
  chartEnergy: "已供應能量（kJ）",
  chartTemp: "溫度（°C）",
  fusionMark: "熔解",
  vaporMark: "汽化",
  chartNote: "水平線是潛熱：溫度會停住。汽化需要的能量遠多於熔解。",
  valuesLabel: "採用數值",
  creatureLabel: "小水滴",
};

export const STRINGS: Record<Locale, Dict> = {
  en,
  "zh-Hant": zhHant,
};

export function detectLocale(): Locale {
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-Hant" : "en";
}
