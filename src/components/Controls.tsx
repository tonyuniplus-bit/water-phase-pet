import type { PageCopy } from "../i18n/strings";
import { PACKETS_KJ } from "../physics/curve";

interface ControlsProps {
  t: PageCopy;
  plateau: boolean;
  atMin: boolean;
  atMax: boolean;
  auto: "heat" | "cool" | null;
  onEnergy: (deltaJ: number) => void;
  onAuto: (mode: "heat" | "cool" | null) => void;
  onReset: () => void;
}

export function Controls({ t, plateau, atMin, atMax, auto, onEnergy, onAuto, onReset }: ControlsProps) {
  const busy = auto !== null;
  const heatLabel = plateau ? t.giveLatent : t.giveHeat;
  const coolLabel = plateau ? t.removeLatent : t.removeHeat;

  return (
    <div className="controls">
      <div className="action-block heat">
        <p>{heatLabel}</p>
        <div className="packet-row">
          {PACKETS_KJ.map((kj) => (
            <button
              key={kj}
              type="button"
              data-testid={`heat-${kj}`}
              disabled={atMax || busy}
              aria-label={`${heatLabel} ${kj} kJ`}
              onClick={() => onEnergy(kj * 1000)}
            >
              +{kj}
              <small>kJ</small>
            </button>
          ))}
        </div>
      </div>
      <div className="action-block cool">
        <p>{coolLabel}</p>
        <div className="packet-row">
          {PACKETS_KJ.map((kj) => (
            <button
              key={kj}
              type="button"
              data-testid={`cool-${kj}`}
              disabled={atMin || busy}
              aria-label={`${coolLabel} ${kj} kJ`}
              onClick={() => onEnergy(-kj * 1000)}
            >
              −{kj}
              <small>kJ</small>
            </button>
          ))}
        </div>
      </div>
      <div className="auto-row">
        <button
          type="button"
          data-testid="auto-heat"
          aria-pressed={auto === "heat"}
          disabled={atMax && auto !== "heat"}
          onClick={() => onAuto(auto === "heat" ? null : "heat")}
        >
          {auto === "heat" ? t.stop : t.autoHeat}
        </button>
        <button
          type="button"
          data-testid="auto-cool"
          aria-pressed={auto === "cool"}
          disabled={atMin && auto !== "cool"}
          onClick={() => onAuto(auto === "cool" ? null : "cool")}
        >
          {auto === "cool" ? t.stop : t.autoCool}
        </button>
        <button type="button" data-testid="reset" onClick={onReset}>
          {t.reset}
        </button>
      </div>
    </div>
  );
}
