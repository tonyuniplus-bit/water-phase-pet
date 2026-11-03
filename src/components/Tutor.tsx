import type { Dict } from "../i18n/strings";
import {
  C_ICE,
  C_STEAM,
  C_WATER,
  LF,
  LV,
  remainingJ,
  type EnergyStep,
  type SampleView,
} from "../physics/curve";
import { formatKJ, formatLatent, formatPct, formatSpecificHeat } from "../format";

interface TutorProps {
  view: SampleView;
  step: EnergyStep | null;
  t: Dict;
}

function Formula({ view }: { view: SampleView }) {
  if (view.region === "melt") {
    return (
      <p className="formula" data-testid="formula">
        Q = ml<sub>f</sub> = 1 kg × {formatLatent(LF)} kJ/kg = {formatLatent(LF)} kJ
      </p>
    );
  }
  if (view.region === "boil") {
    return (
      <p className="formula" data-testid="formula">
        Q = ml<sub>v</sub> = 1 kg × {formatLatent(LV)} kJ/kg = {formatLatent(LV)} kJ
      </p>
    );
  }
  const heat = view.region === "ice" ? C_ICE : view.region === "water" ? C_WATER : C_STEAM;
  return (
    <p className="formula" data-testid="formula">
      Q = mcΔT = 1 kg × {formatSpecificHeat(heat)} kJ/kg°C × ΔT
    </p>
  );
}

function nextLine(view: SampleView, t: Dict): string {
  const left = remainingJ(view.energyJ);
  if (view.region === "steam" && left === 0) return t.atMax;
  const kj = formatKJ(left);
  if (view.region === "ice") return t.nextIce(kj);
  if (view.region === "melt") return t.nextMelt(kj);
  if (view.region === "water") return t.nextWater(kj);
  if (view.region === "boil") return t.nextBoil(kj);
  return t.nextSteam(kj);
}

export function Tutor({ view, step, t }: TutorProps) {
  const mixture =
    view.region === "melt"
      ? t.mixIceWater(formatPct(view.ice), formatPct(view.water))
      : view.region === "boil"
        ? t.mixWaterSteam(formatPct(view.water), formatPct(view.steam))
        : null;
  const last =
    step && step.absorbedJ > 0
      ? t.added(formatKJ(step.absorbedJ))
      : step && step.absorbedJ < 0
        ? t.removed(formatKJ(step.absorbedJ))
        : step && step.wastedJ > 0
          ? t.wastedHot(formatKJ(step.wastedJ))
          : step && step.wastedJ < 0
            ? t.wastedCold(formatKJ(step.wastedJ))
            : null;

  return (
    <section className="card tutor">
      <p className="region-line" data-testid="region">
        {t.regions[view.region]}
        {mixture ? <span data-testid="mixture"> · {mixture}</span> : null}
      </p>
      <Formula view={view} />
      <p className="next" data-testid="next">
        {nextLine(view, t)}
        {last ? <span className="ate"> {last}</span> : null}
      </p>
    </section>
  );
}
