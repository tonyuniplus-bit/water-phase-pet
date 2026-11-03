import type { PageId, SampleView } from "../physics/curve";

export type Locale = "en" | "zh-Hant";

export interface PageCopy {
  title: string;
  subtitle: string;
  tempLabel: string;
  locked: string;
  regions: Record<string, string>;
  giveHeat: string;
  removeHeat: string;
  giveLatent: string;
  removeLatent: string;
  autoHeat: string;
  autoCool: string;
  stop: string;
  reset: string;
  latentLabel: (region: string) => string;
  mixture: (view: SampleView, ice: string, water: string, steam: string) => string | null;
  next: (region: string, kj: string, atEnd: boolean) => string;
  added: (kj: string) => string;
  removed: (kj: string) => string;
  wastedHot: (kj: string) => string;
  wastedCold: (kj: string) => string;
  events: Record<string, string>;
  eventHint: Record<string, string>;
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
  molNote: string | null;
  chartTitle: string;
  chartEnergy: string;
  chartTemp: string;
  chartNote: string;
  marks: readonly { heat: string; cool: string }[];
  valuesLabel: string;
  creatureLabel: string;
  pageWater: string;
  pageIodine: string;
  formula: "water" | "iodine";
}

export const LOCALES: readonly Locale[] = ["en", "zh-Hant"];

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  "zh-Hant": "繁",
};

const sharedEn = {
  tempLabel: "Temperature",
  locked: "Locked",
  giveHeat: "Feed heat",
  removeHeat: "Release heat",
  giveLatent: "Feed latent heat",
  removeLatent: "Release latent heat",
  autoHeat: "Auto heat",
  autoCool: "Auto cool",
  stop: "Stop",
  reset: "Reset",
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
  chartTitle: "Heating and cooling curve",
  chartEnergy: "Energy from the cold start (kJ)",
  chartTemp: "Temperature (°C)",
  valuesLabel: "Values used",
  pageWater: "Water",
  pageIodine: "Iodine",
};

const sharedZh = {
  tempLabel: "溫度",
  locked: "溫度鎖定",
  giveHeat: "餵熱能",
  removeHeat: "放出熱能",
  giveLatent: "餵潛熱",
  removeLatent: "放出潛熱",
  autoHeat: "自動加熱",
  autoCool: "自動冷卻",
  stop: "停止",
  reset: "重置",
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
  chartTitle: "加熱及冷卻曲線",
  chartEnergy: "由最低溫計起的能量（kJ）",
  chartTemp: "溫度（°C）",
  valuesLabel: "採用數值",
  pageWater: "水",
  pageIodine: "碘",
};

const waterEn: PageCopy = {
  ...sharedEn,
  title: "Droplet",
  subtitle: "Change of state",
  formula: "water",
  regions: {
    ice: "Ice",
    melt: "Ice–water mixture",
    water: "Water",
    boil: "Water–steam mixture",
    steam: "Steam",
  },
  latentLabel: (region) => (region === "melt" ? "Latent heat of fusion" : "Latent heat of vaporization"),
  mixture: (view, ice, water, steam) =>
    view.region === "melt" ? `Ice ${ice} · Water ${water}` : view.region === "boil" ? `Water ${water} · Steam ${steam}` : null,
  next: (region, kj, atEnd) => {
    if (atEnd) return "The steam is at 120°C. Remove energy to cool it.";
    if (region === "ice") return `${kj} kJ more sensible heat reaches 0°C.`;
    if (region === "melt") return `${kj} kJ more latent heat finishes melting.`;
    if (region === "water") return `${kj} kJ more sensible heat reaches 100°C.`;
    if (region === "boil") return `${kj} kJ more latent heat finishes boiling.`;
    return `${kj} kJ more sensible heat reaches 120°C.`;
  },
  added: (kj) => `Droplet ate ${kj} kJ of heat.`,
  removed: (kj) => `Droplet released ${kj} kJ.`,
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
  molNote: "Ice has an open structure, unlike liquid water and most solids, so water expands when it freezes.",
  chartNote: "Flat lines are latent heat: the temperature waits. Boiling takes much more energy than melting.",
  marks: [
    { heat: "fusion", cool: "solidification" },
    { heat: "vaporization", cool: "condensation" },
  ],
  creatureLabel: "Droplet, the water pet",
};

const waterZh: PageCopy = {
  ...sharedZh,
  title: "小水滴",
  subtitle: "物態變化",
  formula: "water",
  regions: {
    ice: "冰",
    melt: "冰水混合物",
    water: "水",
    boil: "水與水蒸氣",
    steam: "水蒸氣",
  },
  latentLabel: (region) => (region === "melt" ? "熔解潛熱" : "汽化潛熱"),
  mixture: (view, ice, water, steam) =>
    view.region === "melt" ? `冰 ${ice} · 水 ${water}` : view.region === "boil" ? `水 ${water} · 水蒸氣 ${steam}` : null,
  next: (region, kj, atEnd) => {
    if (atEnd) return "水蒸氣已到 120°C。移除能量就可以冷卻。";
    if (region === "ice") return `再給 ${kj} kJ 顯熱就會到達 0°C。`;
    if (region === "melt") return `再給 ${kj} kJ 潛熱就會融化完成。`;
    if (region === "water") return `再給 ${kj} kJ 顯熱就會到達 100°C。`;
    if (region === "boil") return `再給 ${kj} kJ 潛熱就會汽化完成。`;
    return `再給 ${kj} kJ 顯熱就會到達 120°C。`;
  },
  added: (kj) => `小水滴吃下了 ${kj} kJ 熱能。`,
  removed: (kj) => `小水滴放出了 ${kj} kJ。`,
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
  molNote: "冰的結構較疏，和水以及其他大多數固體不同，所以水凝固時體積會膨脹。",
  chartNote: "水平線是潛熱：溫度會停住。汽化需要的能量遠多於熔解。",
  marks: [
    { heat: "熔解", cool: "凝固" },
    { heat: "汽化", cool: "凝結" },
  ],
  creatureLabel: "小水滴",
};

const iodineEn: PageCopy = {
  ...sharedEn,
  title: "Speck",
  subtitle: "Sublimation",
  formula: "iodine",
  regions: {
    crystal: "Iodine crystal",
    sublime: "Crystal and vapour",
    vapour: "Iodine vapour",
  },
  latentLabel: () => "Latent heat of sublimation",
  mixture: (view, ice, _water, steam) => (view.region === "sublime" ? `Crystal ${ice} · Vapour ${steam}` : null),
  next: (region, kj, atEnd) => {
    if (atEnd) return "The vapour is at 140°C. Remove energy to cool it.";
    if (region === "crystal") return `${kj} kJ more sensible heat reaches 114°C.`;
    if (region === "sublime") return `${kj} kJ more latent heat finishes sublimation.`;
    return `${kj} kJ more sensible heat reaches 140°C.`;
  },
  added: (kj) => `Speck ate ${kj} kJ of heat.`,
  removed: (kj) => `Speck released ${kj} kJ.`,
  wastedHot: (kj) => `${kj} kJ was not absorbed. The vapour is already at 140°C.`,
  wastedCold: (kj) => `${kj} kJ could not be removed. The crystal is already at 25°C.`,
  events: {
    sublimed: "Sublimated",
    deposited: "Deposited",
  },
  eventHint: {
    sublimed: "It ate the latent heat and evolved into iodine vapour.",
    deposited: "It released that energy and devolved into an iodine crystal.",
  },
  molNote: null,
  chartNote:
    "The flat line is latent heat of sublimation: the temperature stays at 114°C until the crystal has become vapour. Cooling deposits that vapour back into a crystal.",
  marks: [{ heat: "sublimation", cool: "deposition" }],
  creatureLabel: "Speck, the iodine pet",
};

const iodineZh: PageCopy = {
  ...sharedZh,
  title: "小碘",
  subtitle: "昇華",
  formula: "iodine",
  regions: {
    crystal: "碘晶體",
    sublime: "晶體與蒸氣",
    vapour: "碘蒸氣",
  },
  latentLabel: () => "昇華潛熱",
  mixture: (view, ice, _water, steam) => (view.region === "sublime" ? `晶體 ${ice} · 蒸氣 ${steam}` : null),
  next: (region, kj, atEnd) => {
    if (atEnd) return "碘蒸氣已到 140°C。移除能量就可以冷卻。";
    if (region === "crystal") return `再給 ${kj} kJ 顯熱就會到達 114°C。`;
    if (region === "sublime") return `再給 ${kj} kJ 潛熱就會昇華完成。`;
    return `再給 ${kj} kJ 顯熱就會到達 140°C。`;
  },
  added: (kj) => `小碘吃下了 ${kj} kJ 熱能。`,
  removed: (kj) => `小碘放出了 ${kj} kJ。`,
  wastedHot: (kj) => `${kj} kJ 沒有被吸收。碘蒸氣已經是 140°C。`,
  wastedCold: (kj) => `${kj} kJ 無法再移除。碘晶體已經是 25°C。`,
  events: {
    sublimed: "昇華了",
    deposited: "凝華了",
  },
  eventHint: {
    sublimed: "牠吃下了昇華潛熱，進化成碘蒸氣。",
    deposited: "牠放出能量，退化成碘晶體。",
  },
  molNote: null,
  chartNote: "水平線是昇華潛熱：溫度維持在 114°C，直到晶體全部變成蒸氣。冷卻時蒸氣會凝華成晶體。",
  marks: [{ heat: "昇華", cool: "凝華" }],
  creatureLabel: "小碘",
};

const PAGES: Record<Locale, Record<PageId, PageCopy>> = {
  en: { water: waterEn, iodine: iodineEn },
  "zh-Hant": { water: waterZh, iodine: iodineZh },
};

export function pageCopy(locale: Locale, page: PageId): PageCopy {
  return PAGES[locale][page];
}

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("zh")) return "zh-Hant";
  return "en";
}
