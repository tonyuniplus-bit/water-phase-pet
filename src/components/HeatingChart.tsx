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
  curvePoints,
  stateFromEnergy,
  type Substance,
} from "../physics/curve";
import { formatKJ, formatLatent, formatSpecificHeat } from "../format";
import { Molecules } from "./Molecules";

interface HeatingChartProps {
  energyJ: number;
  t: PageCopy;
  flow: "heat" | "cool" | null;
  substance: Substance;
}

const WIDTH = 720;
const HEIGHT = 400;
const PAD = { l: 58, r: 18, t: 36, b: 46 };

function xOf(energyJ: number, maxJ: number): number {
  return PAD.l + (energyJ / maxJ) * (WIDTH - PAD.l - PAD.r);
}

function yOf(tempC: number, tMin: number, tMax: number): number {
  return PAD.t + ((tMax - tempC) / (tMax - tMin)) * (HEIGHT - PAD.t - PAD.b);
}

function line(points: { energyJ: number; tempC: number }[], substance: Substance): string {
  return points
    .map((point) => `${xOf(point.energyJ, substance.maxJ).toFixed(1)},${yOf(point.tempC, substance.tMin, substance.tMax).toFixed(1)}`)
    .join(" ");
}

function markClass(role: "heat" | "cool", flow: "heat" | "cool" | null): string {
  if (flow === null) return "mark";
  return flow === role ? "mark" : "mark quiet";
}

function Values({ t, substance }: { t: PageCopy; substance: Substance }) {
  if (substance.id === "iodine") {
    return (
      <p className="footnote">
        {t.valuesLabel}: c<sub>solid</sub> {formatSpecificHeat(C_SOLID)} kJ/kg°C, ℓ<sub>s</sub> {formatLatent(L_SUB)} kJ/kg, c
        <sub>vapour</sub> {formatSpecificHeat(C_VAPOUR)} kJ/kg°C.
      </p>
    );
  }
  return (
    <p className="footnote">
      {t.valuesLabel}: c<sub>ice</sub> {formatSpecificHeat(C_ICE)} kJ/kg°C, ℓ<sub>f</sub> {formatLatent(LF)} kJ/kg, c
      <sub>water</sub> {formatSpecificHeat(C_WATER)} kJ/kg°C, ℓ<sub>v</sub> {formatLatent(LV)} kJ/kg, c<sub>steam</sub>{" "}
      {formatSpecificHeat(C_STEAM)} kJ/kg°C.
    </p>
  );
}

export function HeatingChart({ energyJ, t, flow, substance }: HeatingChartProps) {
  const full = curvePoints(substance.maxJ, substance);
  const traveled = curvePoints(energyJ, substance);
  const marker = traveled[traveled.length - 1];
  const plateaus = substance.segments.filter((segment) => segment.kind === "latent");
  const y = (tempC: number) => yOf(tempC, substance.tMin, substance.tMax);
  const x = (joules: number) => xOf(joules, substance.maxJ);

  return (
    <section className="card chart-card">
      <h2>{t.chartTitle}</h2>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t.chartTitle}>
        {plateaus.map((segment, index) => (
          <rect
            key={segment.region}
            x={x(segment.startJ)}
            y={PAD.t}
            width={x(segment.endJ) - x(segment.startJ)}
            height={HEIGHT - PAD.t - PAD.b}
            fill={
              substance.id === "iodine"
                ? "rgba(140, 80, 200, 0.14)"
                : index === 0
                  ? "rgba(90, 180, 230, 0.13)"
                  : "rgba(255, 150, 80, 0.12)"
            }
          />
        ))}
        {substance.yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.l}
              x2={WIDTH - PAD.r}
              y1={y(tick)}
              y2={y(tick)}
              stroke="rgba(40,70,90,0.16)"
            />
            <text x={PAD.l - 8} y={y(tick) + 4} textAnchor="end" className="tick">
              {tick}
            </text>
          </g>
        ))}
        <polyline points={line(full, substance)} className="curve-full" fill="none" />
        {traveled.length > 1 && <polyline points={line(traveled, substance)} className="curve-now" fill="none" />}
        <g data-testid="chart-marks" data-flow={flow ?? "idle"}>
          {plateaus.map((segment, index) => {
            const mark = t.marks[index];
            if (!mark) return null;
            const cx = (x(segment.startJ) + x(segment.endJ)) / 2;
            const base = y(segment.t0);
            return (
              <g key={segment.region}>
                <text x={cx} y={base - 18} textAnchor="middle" className={markClass("heat", flow)}>
                  {mark.heat}
                </text>
                <text x={cx} y={base - 4} textAnchor="middle" className={markClass("cool", flow)}>
                  {mark.cool}
                </text>
              </g>
            );
          })}
        </g>
        {marker && (
          <circle
            data-testid="chart-marker"
            cx={x(marker.energyJ)}
            cy={y(marker.tempC)}
            r={6}
            className="marker"
          />
        )}
        {substance.xTicks.map((tick) => (
          <text key={tick} x={x(tick)} y={HEIGHT - 22} textAnchor="middle" className="tick">
            {formatKJ(tick)}
          </text>
        ))}
        <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle" className="axis">
          {t.chartEnergy}
        </text>
        <text x={16} y={HEIGHT / 2} textAnchor="middle" className="axis" transform={`rotate(-90 16 ${HEIGHT / 2})`}>
          {t.chartTemp}
        </text>
      </svg>
      <div className="chart-foot">
        <div className="chart-copy">
          <p className="chart-note">{t.chartNote}</p>
          <Values t={t} substance={substance} />
        </div>
        <Molecules view={stateFromEnergy(energyJ, substance)} t={t} page={substance.id} />
      </div>
    </section>
  );
}
