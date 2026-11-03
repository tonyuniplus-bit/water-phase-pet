import type { CSSProperties } from "react";
import type { PageCopy } from "../i18n/strings";
import type { PageId, SampleView } from "../physics/curve";
import { isPlateau, SUBSTANCES } from "../physics/curve";

const LATTICE: readonly (readonly [number, number])[] = [
  [10, 16],
  [36, 10],
  [64, 16],
  [88, 28],
  [16, 48],
  [84, 52],
  [28, 82],
  [72, 86],
];

const LIQUID: readonly (readonly [number, number])[] = [
  [42, 40],
  [54, 36],
  [48, 50],
  [60, 48],
  [40, 60],
  [56, 62],
  [46, 72],
  [58, 74],
];

const GAS: readonly (readonly [number, number])[] = [
  [6, 10],
  [30, 6],
  [62, 8],
  [92, 16],
  [8, 46],
  [94, 50],
  [14, 88],
  [86, 90],
];

const CRYSTAL: readonly (readonly [number, number])[] = [
  [38, 36],
  [52, 32],
  [46, 48],
  [60, 44],
  [36, 58],
  [54, 60],
  [44, 72],
  [62, 70],
];

const VAPOUR: readonly (readonly [number, number])[] = [
  [8, 14],
  [34, 8],
  [66, 12],
  [90, 22],
  [12, 48],
  [88, 54],
  [18, 84],
  [78, 82],
];

function mix(
  bound: readonly (readonly [number, number])[],
  loose: readonly (readonly [number, number])[],
  progress: number,
): readonly (readonly [number, number])[] {
  const freed = Math.round(progress * bound.length);
  return bound.map((_, index) => (index < freed ? loose[index] : bound[index]));
}

function slotsFor(page: PageId, region: string, progress: number): readonly (readonly [number, number])[] {
  if (page === "iodine") {
    if (region === "crystal") return CRYSTAL;
    if (region === "vapour") return VAPOUR;
    return mix(CRYSTAL, VAPOUR, progress);
  }
  if (region === "ice") return LATTICE;
  if (region === "water") return LIQUID;
  if (region === "steam") return GAS;
  if (region === "melt") return mix(LATTICE, LIQUID, progress);
  return mix(LIQUID, GAS, progress);
}

function motionFor(page: PageId, region: string, tempC: number): { amp: number; dur: number } {
  if (page === "iodine") {
    if (region === "crystal") {
      const unit = Math.min(1, Math.max(0, (tempC - 25) / 89));
      return { amp: 0.8 + unit * 2.2, dur: 0.9 - unit * 0.3 };
    }
    if (region === "sublime") return { amp: 2.2, dur: 0.45 };
    const unit = Math.min(1, Math.max(0, (tempC - 114) / 26));
    return { amp: 3.2 + unit * 2, dur: 0.34 - unit * 0.1 };
  }
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

export function Molecules({ view, t, page }: { view: SampleView; t: PageCopy; page: PageId }) {
  const slots = slotsFor(page, view.region, view.progress);
  const motion = motionFor(page, view.region, view.tempC);
  const plateau = isPlateau(view.region, SUBSTANCES[page]);
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
              {page === "iodine" ? (
                <svg viewBox="0 0 36 28" aria-hidden="true">
                  <circle className="atom i" cx="12" cy="14" r="8" />
                  <circle className="atom i" cx="24" cy="14" r="8" />
                </svg>
              ) : (
                <svg viewBox="0 0 36 30" aria-hidden="true">
                  <circle className="atom h" cx="11" cy="18" r="6" />
                  <circle className="atom h" cx="25" cy="18" r="6" />
                  <circle className="atom o" cx="18" cy="12" r="8" />
                </svg>
              )}
            </span>
          );
        })}
      </div>
      <p className="mol-caption">{plateau ? t.molLatent : t.molSensible}</p>
      {t.molNote ? (
        <p className="mol-note" data-testid="ice-note">
          {t.molNote}
        </p>
      ) : null}
    </aside>
  );
}
