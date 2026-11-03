import type { CSSProperties } from "react";
import type { Dict } from "../i18n/strings";
import type { Region, SampleView } from "../physics/curve";
import { isPlateau } from "../physics/curve";

const LATTICE: readonly (readonly [number, number])[] = [
  [18, 26],
  [46, 26],
  [74, 26],
  [32, 50],
  [60, 50],
  [18, 74],
  [46, 74],
  [74, 74],
];

const LIQUID: readonly (readonly [number, number])[] = [
  [30, 34],
  [48, 28],
  [66, 40],
  [28, 56],
  [50, 52],
  [68, 62],
  [40, 74],
  [58, 76],
];

const GAS: readonly (readonly [number, number])[] = [
  [8, 16],
  [32, 10],
  [64, 14],
  [90, 24],
  [12, 48],
  [88, 52],
  [20, 82],
  [78, 80],
];

function slotsFor(region: Region, progress: number): readonly (readonly [number, number])[] {
  if (region === "ice") return LATTICE;
  if (region === "water") return LIQUID;
  if (region === "steam") return GAS;
  const loose = region === "melt" ? LIQUID : GAS;
  const bound = region === "melt" ? LATTICE : LIQUID;
  const freed = Math.round(progress * LATTICE.length);
  return LATTICE.map((_, index) => (index < freed ? loose[index] : bound[index]));
}

function motionFor(region: Region, tempC: number): { amp: number; dur: number } {
  if (region === "ice") {
    const unit = Math.min(1, Math.max(0, (tempC + 20) / 20));
    return { amp: 1.1 + unit * 3.2, dur: 0.95 - unit * 0.45 };
  }
  if (region === "melt") return { amp: 2.4, dur: 0.5 };
  if (region === "water") {
    const unit = Math.min(1, Math.max(0, tempC / 100));
    return { amp: 2.2 + unit * 3.6, dur: 0.72 - unit * 0.38 };
  }
  if (region === "boil") return { amp: 3.2, dur: 0.34 };
  const unit = Math.min(1, Math.max(0, (tempC - 100) / 20));
  return { amp: 3.4 + unit * 2.4, dur: 0.36 - unit * 0.12 };
}

export function Molecules({ view, t }: { view: SampleView; t: Dict }) {
  const slots = slotsFor(view.region, view.progress);
  const motion = motionFor(view.region, view.tempC);
  return (
    <aside className="molecules" data-testid="molecules" aria-label={t.molTitle}>
      <p className="mol-title">{t.molTitle}</p>
      <div className={`mol-stage form-${view.region}`}>
        {slots.map((spot, index) => {
          const angle = (index / slots.length) * Math.PI * 2;
          const style = {
            left: `${spot[0]}%`,
            top: `${spot[1]}%`,
            "--dx": `${(Math.cos(angle) * motion.amp).toFixed(2)}px`,
            "--dy": `${(Math.sin(angle) * motion.amp).toFixed(2)}px`,
            "--dur": `${motion.dur.toFixed(2)}s`,
            "--delay": `${(index * 0.08).toFixed(2)}s`,
          } as CSSProperties;
          return (
            <span key={index} className="mol" style={style}>
              <svg viewBox="0 0 36 30" aria-hidden="true">
                <circle className="atom h" cx="11" cy="18" r="6" />
                <circle className="atom h" cx="25" cy="18" r="6" />
                <circle className="atom o" cx="18" cy="12" r="8" />
              </svg>
            </span>
          );
        })}
      </div>
      <p className="mol-caption">{isPlateau(view.region) ? t.molLatent : t.molSensible}</p>
    </aside>
  );
}
