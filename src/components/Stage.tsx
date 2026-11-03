import type { CSSProperties } from "react";
import type { Dict } from "../i18n/strings";
import type { PhaseEvent, Region } from "../physics/curve";
import { isPlateau, type SampleView } from "../physics/curve";
import { formatPct, formatTemp } from "../format";
import { Creature } from "./Creature";

interface StageProps {
  view: SampleView;
  t: Dict;
  banner: PhaseEvent | null;
  fromRegion: Region | null;
  revealed: boolean;
  reactKey: number;
  feeding: "eat" | "release" | null;
  looping: boolean;
  biteLabel: string | null;
  flow: "heat" | "cool" | null;
}

const DOWNWARD: ReadonlySet<PhaseEvent> = new Set(["frozen", "condensed"]);

type EnergyMotion = "up" | "down" | "changes" | "steady";

function energyMotion(latent: boolean, flow: "heat" | "cool" | null, banner: PhaseEvent | null): {
  ke: EnergyMotion;
  pe: EnergyMotion;
} {
  if (banner) return DOWNWARD.has(banner) ? { ke: "steady", pe: "down" } : { ke: "steady", pe: "up" };
  if (!flow) return latent ? { ke: "steady", pe: "changes" } : { ke: "changes", pe: "steady" };
  if (latent) return flow === "heat" ? { ke: "steady", pe: "up" } : { ke: "steady", pe: "down" };
  return flow === "heat" ? { ke: "up", pe: "steady" } : { ke: "down", pe: "steady" };
}

function EvolveFx({ upward }: { upward: boolean }) {
  return (
    <div className={`evo ${upward ? "evo-up" : "evo-down"}`} data-testid="evolve-fx" aria-hidden="true">
      <div className="evo-beam" />
      <div className="evo-ring r1" />
      <div className="evo-ring r2" />
      <div className="evo-ring r3" />
      <div className="evo-bits">
        {Array.from({ length: 10 }, (_, index) => (
          <span key={index} style={{ "--a": `${index * 36}deg` } as CSSProperties} />
        ))}
      </div>
      <div className="evo-flash" />
    </div>
  );
}

export function Stage({
  view,
  t,
  banner,
  fromRegion,
  revealed,
  reactKey,
  feeding,
  looping,
  biteLabel,
  flow,
}: StageProps) {
  const plateau = isPlateau(view.region);
  const showOld = Boolean(banner && fromRegion && !revealed);
  const displayRegion = showOld && fromRegion ? fromRegion : view.region;
  const upward = banner ? !DOWNWARD.has(banner) : true;
  const evoPhase = banner ? (revealed ? "reveal" : "charge") : "idle";
  const motion = energyMotion(plateau, flow, banner);
  const motionText: Record<EnergyMotion, string> = {
    up: t.energyUp,
    down: t.energyDown,
    changes: t.energyChanges,
    steady: t.energySteady,
  };

  return (
    <div
      className={`sky ${banner ? `evolving ${evoPhase} ${upward ? "evo-up" : "evo-down"}` : ""} ${plateau ? "is-locked" : ""}`}
      data-evo={evoPhase}
    >
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="badge" data-testid="temp" data-locked={plateau ? "true" : "false"}>
        <span>{plateau ? t.locked : t.tempLabel}</span>
        <strong>{formatTemp(view.tempC)}</strong>
      </div>
      <aside className="energy-box" data-testid="energy-box">
        <p className={`energy-row is-${motion.ke}`} data-testid="ke-row" data-motion={motion.ke}>
          <span>{t.ke}</span>
          <strong>{motionText[motion.ke]}</strong>
        </p>
        <p className={`energy-row is-${motion.pe}`} data-testid="pe-row" data-motion={motion.pe}>
          <span>{t.pe}</span>
          <strong>{motionText[motion.pe]}</strong>
        </p>
      </aside>
      <p className="form-name" data-testid="form-name">
        {t.regions[displayRegion]}
      </p>
      <div className="stage-body">
        <div className="platform" />
        {banner && <EvolveFx upward={upward} />}
        <Creature
          key={`${displayRegion}-${revealed ? "now" : "was"}`}
          region={displayRegion}
          reactKey={reactKey}
          feeding={banner ? null : feeding}
          looping={looping}
          biteLabel={biteLabel}
          label={t.creatureLabel}
        />
        {banner && (
          <div
            className={`banner ${upward ? "banner-up" : "banner-down"}`}
            data-testid="banner"
            data-event={banner}
            data-kind={upward ? "evolve" : "devolve"}
            role="status"
          >
            <span className="evo-kicker">{upward ? t.evolve : t.devolve}</span>
            <strong>{t.events[banner]}</strong>
            <span className="evo-hint">{t.eventHint[banner]}</span>
          </div>
        )}
      </div>
      {plateau && (
        <div className="latent" data-testid="latent">
          <div className="latent-top">
            <span>{view.region === "melt" ? t.latentFusion : t.latentVapor}</span>
            <span>{formatPct(view.progress)}</span>
          </div>
          <div
            className="track"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(view.progress * 100)}
            aria-label={view.region === "melt" ? t.latentFusion : t.latentVapor}
          >
            <div className="fill" style={{ width: `${Math.min(100, view.progress * 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
