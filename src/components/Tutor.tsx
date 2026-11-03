import type { PageCopy } from "../i18n/strings";
import {
  C_ICE,
  C_SOLID,
  C_STEAM,
  C_VAPOUR,
  C_WATER,
  LF,
  L_SUB,
  LV,
  remainingJ,
  type EnergyStep,
  type SampleView,
  type Substance,
} from "../physics/curve";
import { formatKJ, formatLatent, formatPct, formatSpecificHeat } from "../format";

interface TutorProps {
  view: SampleView;
  step: EnergyStep | null;
  t: PageCopy;
  substance: Substance;
}

function Formula({ view, formula }: { view: SampleView; formula: PageCopy["formula"] }) {
  if (formula === "iodine") {
    if (view.region === "sublime") {
      return (
        <p className="formula" data-testid="formula">
          Q = ml<sub>s</sub> = 1 kg × {formatLatent(L_SUB)} kJ/kg = {formatLatent(L_SUB)} kJ
        </p>
      );
    }
    const heat = view.region === "crystal" ? C_SOLID : C_VAPOUR;
    return (
      <p className="formula" data-testid="formula">
        Q = mcΔT = 1 kg × {formatSpecificHeat(heat)} kJ/kg°C × ΔT
      </p>
    );
  }
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

export function Tutor({ view, step, t, substance }: TutorProps) {
  const mixture = t.mixture(view, formatPct(view.ice), formatPct(view.water), formatPct(view.steam));
  const left = remainingJ(view.energyJ, substance);
  const atEnd = left === 0 && view.region === substance.regions[substance.regions.length - 1];
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
      <Formula view={view} formula={t.formula} />
      <p className="next" data-testid="next">
        {t.next(view.region, formatKJ(left), atEnd)}
        {last ? <span className="ate"> {last}</span> : null}
      </p>
    </section>
  );
}
