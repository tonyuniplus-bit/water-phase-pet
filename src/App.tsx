import { useCallback, useEffect, useRef, useState } from "react";
import { Controls } from "./components/Controls";
import { HeatingChart } from "./components/HeatingChart";
import { Stage } from "./components/Stage";
import { Tutor } from "./components/Tutor";
import { formatKJ } from "./format";
import { LOCALES, LOCALE_SHORT, STRINGS, detectLocale, type Locale } from "./i18n/strings";
import {
  MAX_J,
  applyEnergy,
  autoStepJ,
  isPlateau,
  stateFromEnergy,
  type EnergyStep,
  type PhaseEvent,
  type Region,
} from "./physics/curve";

const STORAGE_KEY = "water-phase-pet";

interface Banner {
  id: number;
  event: PhaseEvent;
  from: Region;
  to: Region;
}

function savedLocale(value: unknown, fallback: Locale): Locale {
  if (value === "en") return "en";
  if (value === "zh-Hant" || value === "zh-Hans") return "zh-Hant";
  return fallback;
}

function loadSaved(): { energyJ: number; locale: Locale } {
  const fallbackLocale = detectLocale();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { energyJ: 0, locale: fallbackLocale };
    const data = JSON.parse(raw) as { energyJ?: unknown; locale?: unknown };
    const energyJ =
      typeof data.energyJ === "number" && Number.isFinite(data.energyJ)
        ? Math.min(MAX_J, Math.max(0, data.energyJ))
        : 0;
    const locale = savedLocale(data.locale, fallbackLocale);
    return { energyJ, locale };
  } catch {
    return { energyJ: 0, locale: fallbackLocale };
  }
}

export default function App() {
  const saved = useRef(loadSaved());
  const [locale, setLocale] = useState<Locale>(saved.current.locale);
  const [energyJ, setEnergyJ] = useState(saved.current.energyJ);
  const [step, setStep] = useState<EnergyStep | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reactKey, setReactKey] = useState(0);
  const [pulse, setPulse] = useState<"heat" | "cool" | null>(null);
  const [biteLabel, setBiteLabel] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(true);
  const [auto, setAuto] = useState<"heat" | "cool" | null>(null);
  const energyRef = useRef(energyJ);
  const bannerSeq = useRef(0);
  const evolvingRef = useRef(false);
  energyRef.current = energyJ;

  const t = STRINGS[locale];
  const view = stateFromEnergy(energyJ);
  const banner = banners[0] ?? null;
  evolvingRef.current = banner !== null;

  const apply = useCallback((deltaJ: number, options?: { quiet?: boolean }) => {
    const result = applyEnergy(energyRef.current, deltaJ);
    energyRef.current = result.energyJ;
    setEnergyJ(result.energyJ);
    setStep(result.step);
    const crossed = result.step.before.region !== result.step.after.region;
    if (result.step.absorbedJ !== 0 && (!options?.quiet || crossed)) {
      setPulse(deltaJ > 0 ? "heat" : "cool");
      setReactKey((key) => key + 1);
      if (!options?.quiet) {
        const sign = deltaJ > 0 ? "+" : "−";
        setBiteLabel(`${sign}${formatKJ(result.step.absorbedJ)} kJ`);
      }
    }
    if (result.step.phaseChanges.length > 0) {
      evolvingRef.current = true;
      const from = result.step.before.region;
      const to = result.step.after.region;
      setRevealed(false);
      setBanners((prev) => [
        ...prev,
        ...result.step.phaseChanges.map((event) => ({ id: ++bannerSeq.current, event, from, to })),
      ]);
    }
    return result.step.absorbedJ !== 0;
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ energyJ, locale }));
  }, [energyJ, locale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh-Hant" ? "zh-Hant" : "en";
    document.title = `${t.title} — ${t.subtitle}`;
  }, [locale, t.subtitle, t.title]);

  useEffect(() => {
    if (reactKey === 0) return;
    const id = window.setTimeout(() => setPulse(null), 1600);
    return () => window.clearTimeout(id);
  }, [reactKey]);

  useEffect(() => {
    if (!banner) return;
    setRevealed(false);
    const reveal = window.setTimeout(() => setRevealed(true), 2000);
    const done = window.setTimeout(() => setBanners((prev) => prev.slice(1)), 4600);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(done);
    };
  }, [banner]);

  useEffect(() => {
    if (!auto) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (evolvingRef.current) {
        last = now;
        return;
      }
      const dt = Math.min(500, now - last);
      last = now;
      const direction = auto === "heat" ? 1 : -1;
      const joules = autoStepJ(energyRef.current, dt / 1000, direction);
      if (joules <= 0) return;
      const moved = apply(direction * joules, { quiet: true });
      if (!moved) setAuto(null);
    }, 100);
    return () => window.clearInterval(id);
  }, [apply, auto]);

  function reset() {
    setAuto(null);
    energyRef.current = 0;
    setEnergyJ(0);
    setStep(null);
    setBanners([]);
    setPulse(null);
    setBiteLabel(null);
    setRevealed(true);
  }

  const flow = auto ?? pulse;
  const feeding = flow === "heat" ? "eat" : flow === "cool" ? "release" : null;

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <div className="langs" role="group" aria-label="Language">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              data-testid={`lang-${code}`}
              aria-pressed={locale === code}
              onClick={() => setLocale(code)}
            >
              {LOCALE_SHORT[code]}
            </button>
          ))}
        </div>
      </header>
      <main className="layout">
        <div className="pet-column">
          <section className="card pet-card">
            <Stage
              view={view}
              t={t}
              banner={banner?.event ?? null}
              fromRegion={banner?.from ?? null}
              revealed={revealed}
              reactKey={reactKey}
              feeding={feeding}
              looping={auto !== null}
              biteLabel={biteLabel}
              flow={banner ? null : flow}
            />
            <Controls
              t={t}
              plateau={isPlateau(view.region)}
              atMin={energyJ <= 0}
              atMax={energyJ >= MAX_J}
              auto={auto}
              onEnergy={apply}
              onAuto={setAuto}
              onReset={reset}
            />
          </section>
          <Tutor view={view} step={step} t={t} />
        </div>
        <HeatingChart energyJ={energyJ} t={t} />
      </main>
    </div>
  );
}
