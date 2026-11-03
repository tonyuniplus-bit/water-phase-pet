import type { Dict } from "../i18n/strings";
import {
  BOIL_END,
  C_ICE,
  C_STEAM,
  C_WATER,
  ICE_END,
  LF,
  LV,
  MAX_J,
  MELT_END,
  T_MAX,
  T_MIN,
  WATER_END,
  curvePoints,
  stateFromEnergy,
} from "../physics/curve";
import { formatKJ, formatLatent, formatSpecificHeat } from "../format";
import { Molecules } from "./Molecules";

interface HeatingChartProps {
  energyJ: number;
  t: Dict;
}

const WIDTH = 720;
const HEIGHT = 400;
const PAD = { l: 58, r: 18, t: 22, b: 46 };

function xOf(energyJ: number): number {
  return PAD.l + (energyJ / MAX_J) * (WIDTH - PAD.l - PAD.r);
}

function yOf(tempC: number): number {
  return PAD.t + ((T_MAX - tempC) / (T_MAX - T_MIN)) * (HEIGHT - PAD.t - PAD.b);
}

function line(points: { energyJ: number; tempC: number }[]): string {
  return points.map((point) => `${xOf(point.energyJ).toFixed(1)},${yOf(point.tempC).toFixed(1)}`).join(" ");
}

export function HeatingChart({ energyJ, t }: HeatingChartProps) {
  const full = curvePoints(MAX_J);
  const traveled = curvePoints(energyJ);
  const marker = traveled[traveled.length - 1];
  const yTicks = [T_MIN, 0, 100, T_MAX];
  const xTicks = [0, MELT_END, WATER_END, BOIL_END];

  return (
    <section className="card chart-card">
      <h2>{t.chartTitle}</h2>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t.chartTitle}>
        <rect
          x={xOf(ICE_END)}
          y={PAD.t}
          width={xOf(MELT_END) - xOf(ICE_END)}
          height={HEIGHT - PAD.t - PAD.b}
          fill="rgba(90, 180, 230, 0.13)"
        />
        <rect
          x={xOf(WATER_END)}
          y={PAD.t}
          width={xOf(BOIL_END) - xOf(WATER_END)}
          height={HEIGHT - PAD.t - PAD.b}
          fill="rgba(255, 150, 80, 0.12)"
        />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.l}
              x2={WIDTH - PAD.r}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke={tick === 0 || tick === 100 ? "rgba(40,70,90,0.18)" : "rgba(40,70,90,0.08)"}
            />
            <text x={PAD.l - 8} y={yOf(tick) + 4} textAnchor="end" className="tick">
              {tick}
            </text>
          </g>
        ))}
        <polyline points={line(full)} className="curve-full" fill="none" />
        {traveled.length > 1 && <polyline points={line(traveled)} className="curve-now" fill="none" />}
        <text x={(xOf(ICE_END) + xOf(MELT_END)) / 2} y={yOf(0) - 8} textAnchor="middle" className="mark">
          {t.fusionMark}
        </text>
        <text x={(xOf(WATER_END) + xOf(BOIL_END)) / 2} y={yOf(100) - 8} textAnchor="middle" className="mark">
          {t.vaporMark}
        </text>
        {marker && (
          <circle
            data-testid="chart-marker"
            cx={xOf(marker.energyJ)}
            cy={yOf(marker.tempC)}
            r={6}
            className="marker"
          />
        )}
        {xTicks.map((tick) => (
          <text key={tick} x={xOf(tick)} y={HEIGHT - 16} textAnchor="middle" className="tick">
            {formatKJ(tick)}
          </text>
        ))}
        <text x={WIDTH / 2} y={HEIGHT - 8} textAnchor="middle" className="axis">
          {t.chartEnergy}
        </text>
        <text x={16} y={HEIGHT / 2} textAnchor="middle" className="axis" transform={`rotate(-90 16 ${HEIGHT / 2})`}>
          {t.chartTemp}
        </text>
      </svg>
      <div className="chart-foot">
        <div className="chart-copy">
          <p className="chart-note">{t.chartNote}</p>
          <p className="footnote">
            {t.valuesLabel}: c<sub>ice</sub> {formatSpecificHeat(C_ICE)} kJ/kg°C, ℓ<sub>f</sub> {formatLatent(LF)} kJ/kg,
            c<sub>water</sub> {formatSpecificHeat(C_WATER)} kJ/kg°C, ℓ<sub>v</sub> {formatLatent(LV)} kJ/kg, c
            <sub>steam</sub> {formatSpecificHeat(C_STEAM)} kJ/kg°C.
          </p>
        </div>
        <Molecules view={stateFromEnergy(energyJ)} t={t} />
      </div>
    </section>
  );
}
