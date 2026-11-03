import { useCallback, useEffect, useRef, useState } from "react";
import { Controls } from "./components/Controls";
import { HeatingChart } from "./components/HeatingChart";
import { Stage } from "./components/Stage";
import { Tutor } from "./components/Tutor";
import { formatKJ } from "./format";
import { LOCALES, LOCALE_SHORT, detectLocale, pageCopy, type Locale } from "./i18n/strings";
import {
  IODINE,
  SUBSTANCES,
  WATER,
  applyEnergy,
  autoStepJ,
  isPlateau,
  stateFromEnergy,
  type PageId,
  type PhaseEvent,
  type Substance,
} from "./physics/curve";

const WATER_KEY = "water-phase-pet";
const IODINE_KEY = "water-phase-pet-iodine";

interface Banner {
  id: number;
  event: PhaseEvent;
  from: string;
  to: string;
}

function savedLocale(value: unknown, fallback: Locale): Locale {
  if (value === "en") return "en";
  if (value === "zh-Hant" || value === "zh-Hans") return "zh-Hant";
  return fallback;
}

function readEnergy(value: unknown, maxJ: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(maxJ, Math.max(0, Math.round(value))) : 0;
}

function pageFromHash(): PageId {
  return window.location.hash.replace(/^#/, "") === "iodine" ? "iodine" : "water";
}

function loadSaved(): { waterJ: number; iodineJ: number; locale: Locale } {
  const fallbackLocale = detectLocale();
  let waterJ = 0;
  let locale = fallbackLocale;
  let iodineJ = 0;
  try {
    const raw = localStorage.getItem(WATER_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { energyJ?: unknown; locale?: unknown };
      waterJ = readEnergy(data.energyJ, WATER.maxJ);
      locale = savedLocale(data.locale, fallbackLocale);
    }
  } catch {
    waterJ = 0;
  }
  try {
    const raw = localStorage.getItem(IODINE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { energyJ?: unknown };
      iodineJ = readEnergy(data.energyJ, IODINE.maxJ);
    }
  } catch {
    iodineJ = 0;
  }
  return { waterJ, iodineJ, locale };
}

export default function App() {
  const saved = useRef(loadSaved());
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [locale, setLocale] = useState<Locale>(saved.current.locale);
  const [energies, setEnergies] = useState({ water: saved.current.waterJ, iodine: saved.current.iodineJ });
  const [step, setStep] = useState<ReturnType<typeof applyEnergy>["step"] | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reactKey, setReactKey] = useState(0);
  const [pulse, setPulse] = useState<"heat" | "cool" | null>(null);
  const [biteLabel, setBiteLabel] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(true);
  const [auto, setAuto] = useState<"heat" | "cool" | null>(null);
  const energyJ = energies[page];
  const substance: Substance = SUBSTANCES[page];
  const energyRef = useRef(energyJ);
  const pageRef = useRef(page);
  const substanceRef = useRef(substance);
  const bannerSeq = useRef(0);
  const evolvingRef = useRef(false);
  energyRef.current = energyJ;
  pageRef.current = page;
  substanceRef.current = substance;

  const t = pageCopy(locale, page);
  const view = stateFromEnergy(energyJ, substance);
  const banner = banners[0] ?? null;
  evolvingRef.current = banner !== null;

  const apply = useCallback((deltaJ: number, options?: { quiet?: boolean }) => {
    const spec = substanceRef.current;
    const result = applyEnergy(energyRef.current, deltaJ, spec);
    energyRef.current = result.energyJ;
    const active = pageRef.current;
    setEnergies((prev) => ({ ...prev, [active]: result.energyJ }));
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
    localStorage.setItem(WATER_KEY, JSON.stringify({ energyJ: energies.water, locale }));
    localStorage.setItem(IODINE_KEY, JSON.stringify({ energyJ: energies.iodine }));
  }, [energies, locale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh-Hant" ? "zh-Hant" : "en";
    document.title = `${t.title} — ${t.subtitle}`;
  }, [locale, t.subtitle, t.title]);

  useEffect(() => {
    const sync = () => {
      const next = pageFromHash();
      setPage((current) => {
        if (current === next) return current;
        setAuto(null);
        setBanners([]);
        setStep(null);
        setPulse(null);
        setBiteLabel(null);
        setRevealed(true);
        return next;
      });
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

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
      const joules = autoStepJ(energyRef.current, dt / 1000, direction, substanceRef.current);
      if (joules <= 0) return;
      const moved = apply(direction * joules, { quiet: true });
      if (!moved) setAuto(null);
    }, 100);
    return () => window.clearInterval(id);
  }, [apply, auto]);

  function reset() {
    setAuto(null);
    energyRef.current = 0;
    const active = pageRef.current;
    setEnergies((prev) => ({ ...prev, [active]: 0 }));
    setStep(null);
    setBanners([]);
    setPulse(null);
    setBiteLabel(null);
    setRevealed(true);
  }

  const flow = auto ?? pulse;
  const feeding = flow === "heat" ? "eat" : flow === "cool" ? "release" : null;

  return (
    <div className={`app page-${page}`} data-page={page}>
      <header className="top">
        <div className="brand">
          <span className={`logo ${page === "iodine" ? "logo-iodine" : ""}`} aria-hidden="true" />
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <nav className="pages" aria-label="Example">
          <a href="#water" data-testid="page-water" aria-current={page === "water" ? "page" : undefined}>
            {t.pageWater}
          </a>
          <a href="#iodine" data-testid="page-iodine" aria-current={page === "iodine" ? "page" : undefined}>
            {t.pageIodine}
          </a>
        </nav>
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
              substance={substance}
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
              plateau={isPlateau(view.region, substance)}
              atMin={energyJ <= 0}
              atMax={energyJ >= substance.maxJ}
              auto={auto}
              onEnergy={apply}
              onAuto={setAuto}
              onReset={reset}
            />
          </section>
          <Tutor view={view} step={step} t={t} substance={substance} />
        </div>
        <HeatingChart energyJ={energyJ} t={t} flow={flow} substance={substance} />
      </main>
    </div>
  );
}
