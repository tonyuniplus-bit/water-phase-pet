import { useEffect, useState } from "react";
import type { Region } from "../physics/curve";

interface CreatureProps {
  region: Region;
  reactKey: number;
  feeding: "eat" | "release" | null;
  looping: boolean;
  biteLabel: string | null;
  label: string;
}

function Face({ x, y, mood }: { x: number; y: number; mood: "chilly" | "soft" | "happy" | "wow" }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="eyes">
        <ellipse cx={-22} cy={0} rx={12} ry={14} fill="#fff" />
        <ellipse cx={22} cy={0} rx={12} ry={14} fill="#fff" />
        <ellipse cx={-20} cy={2} rx={6} ry={7.2} fill="#16324a" />
        <ellipse cx={24} cy={2} rx={6} ry={7.2} fill="#16324a" />
        <circle cx={-18} cy={-1.5} r={2.3} fill="#fff" />
        <circle cx={26} cy={-1.5} r={2.3} fill="#fff" />
      </g>
      <g className="mouth-shut">
        {mood === "wow" ? (
          <ellipse cx={0} cy={24} rx={7} ry={8} fill="#16324a" />
        ) : (
          <path
            d={
              mood === "chilly"
                ? "M-8 22 Q0 16 8 22"
                : mood === "soft"
                  ? "M-11 20 Q0 28 11 20"
                  : "M-13 18 Q0 32 13 18"
            }
            fill="none"
            stroke="#16324a"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
        )}
      </g>
      <g className="mouth-open">
        <ellipse cx={0} cy={26} rx={16} ry={15} fill="#16324a" />
        <ellipse cx={0} cy={31} rx={9} ry={6} fill="#ff8a7a" />
      </g>
      <ellipse cx={-38} cy={16} rx={8} ry={4.6} fill="#ff8aa0" opacity={0.75} />
      <ellipse cx={38} cy={16} rx={8} ry={4.6} fill="#ff8aa0" opacity={0.75} />
    </g>
  );
}

function Arms({ y, color }: { y: number; color: string }) {
  return (
    <g>
      <ellipse className="arm arm-l" cx={46} cy={y} rx={16} ry={11} fill={color} />
      <ellipse className="arm arm-r" cx={194} cy={y} rx={16} ry={11} fill={color} />
    </g>
  );
}

function Ice() {
  return (
    <g>
      <polygon className="spark" points="28,58 34,42 40,58 34,74" fill="#fff" />
      <polygon className="spark delay" points="198,48 204,34 210,48 204,62" fill="#fff" />
      <polygon className="spark delay-2" points="24,150 29,138 34,150 29,162" fill="#dff6ff" />
      <path
        d="M120 18 L178 68 L192 132 L158 214 L82 214 L48 132 L62 68 Z"
        fill="url(#iceGrad)"
        stroke="#f7fdff"
        strokeWidth={4}
      />
      <path d="M120 18 L120 132 L178 68 Z" fill="rgba(255,255,255,.38)" />
      <path d="M62 68 L178 68" stroke="rgba(255,255,255,.7)" strokeWidth={3} />
      <path d="M92 214 L120 132 L148 214" stroke="rgba(255,255,255,.45)" strokeWidth={3} fill="none" />
      <Arms y={156} color="#b7e7fb" />
      <Face x={120} y={126} mood="chilly" />
    </g>
  );
}

function Slush() {
  return (
    <g>
      <ellipse cx={120} cy={158} rx={74} ry={66} fill="url(#slushGrad)" />
      <path
        d="M52 146 C70 86 104 78 120 104 C138 76 176 88 190 146 C166 122 146 136 120 116 C96 136 74 122 52 146 Z"
        fill="url(#capGrad)"
        stroke="#fff"
        strokeWidth={3}
      />
      <ellipse className="drip" cx={176} cy={154} rx={7} ry={9} fill="#8fd4ff" />
      <ellipse cx={86} cy={118} rx={10} ry={6} fill="rgba(255,255,255,.7)" />
      <Arms y={168} color="#9fd7f8" />
      <Face x={120} y={156} mood="soft" />
    </g>
  );
}

function Droplet({ boiling }: { boiling: boolean }) {
  return (
    <g>
      <path
        d="M120 36 C120 36 190 112 190 160 C190 208 160 232 120 232 C80 232 50 208 50 160 C50 112 120 36 120 36 Z"
        fill={boiling ? "url(#boilGrad)" : "url(#waterGrad)"}
      />
      <ellipse cx={92} cy={112} rx={14} ry={22} fill="rgba(255,255,255,.4)" transform="rotate(-18 92 112)" />
      {boiling && (
        <g>
          <g className="wisp w1">
            <ellipse cx={70} cy={28} rx={26} ry={14} fill="#f7fcff" stroke="#d7ebf6" />
            <ellipse cx={92} cy={16} rx={16} ry={11} fill="#fff" stroke="#d7ebf6" />
          </g>
          <g className="wisp w2">
            <ellipse cx={172} cy={26} rx={28} ry={14} fill="#f7fcff" stroke="#d7ebf6" />
            <ellipse cx={150} cy={14} rx={16} ry={11} fill="#fff" stroke="#d7ebf6" />
          </g>
          <circle cx={98} cy={186} r={12} fill="rgba(255,255,255,.28)" stroke="#fff" strokeWidth={3} />
          <circle cx={138} cy={198} r={8} fill="rgba(255,255,255,.28)" stroke="#fff" strokeWidth={2.5} />
          <circle cx={156} cy={172} r={7} fill="rgba(255,255,255,.28)" stroke="#fff" strokeWidth={2.5} />
          <circle className="bubble b1" cx={116} cy={176} r={7} fill="#fff" />
          <circle className="bubble b2" cx={148} cy={188} r={5} fill="#fff" />
          <circle className="bubble b3" cx={124} cy={204} r={4} fill="#fff" />
        </g>
      )}
      <Arms y={176} color={boiling ? "#6eb6e6" : "#7ec8fb"} />
      <Face x={120} y={148} mood={boiling ? "wow" : "happy"} />
    </g>
  );
}

function Steam() {
  return (
    <g className="cloud">
      <g className="wisp w1">
        <ellipse cx={46} cy={78} rx={18} ry={12} fill="rgba(255,255,255,.75)" />
      </g>
      <g className="wisp w2">
        <ellipse cx={196} cy={70} rx={20} ry={12} fill="rgba(255,255,255,.7)" />
      </g>
      <ellipse cx={78} cy={156} rx={48} ry={36} fill="url(#steamGrad)" />
      <ellipse cx={166} cy={152} rx={50} ry={38} fill="url(#steamGrad)" />
      <ellipse cx={120} cy={176} rx={74} ry={42} fill="url(#steamGrad)" />
      <ellipse cx={120} cy={132} rx={62} ry={48} fill="#f7fbfe" />
      <ellipse cx={96} cy={118} rx={16} ry={10} fill="rgba(255,255,255,.65)" />
      <Face x={120} y={142} mood="happy" />
    </g>
  );
}

export function Creature({ region, reactKey, feeding, looping, biteLabel, label }: CreatureProps) {
  const [action, setAction] = useState(false);
  const [once, setOnce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    let timer = 0;
    let alive = true;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!alive) return;
        setAction(true);
        timer = window.setTimeout(() => {
          if (!alive) return;
          setAction(false);
          schedule();
        }, 900);
      }, 4500 + Math.random() * 2500);
    };
    schedule();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [region]);

  useEffect(() => {
    if (reactKey === 0 || looping) return;
    setOnce(true);
    const id = window.setTimeout(() => setOnce(false), 1600);
    return () => window.clearTimeout(id);
  }, [looping, reactKey]);

  const acting = Boolean(feeding) && (looping || once);
  const modeClass = acting && feeding === "eat" ? "eating" : acting && feeding === "release" ? "releasing" : "";

  return (
    <div
      className={`creature form-${region} ${modeClass} ${modeClass && !looping ? "once" : ""} ${action && !modeClass ? "action" : ""}`}
      data-testid="creature"
      data-form={region}
      data-feeding={acting ? feeding : "idle"}
    >
      <div className="bob">
        <svg viewBox="0 0 240 260" role="img" aria-label={label}>
          <defs>
            <linearGradient id="iceGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4fcff" />
              <stop offset="0.45" stopColor="#b7ecff" />
              <stop offset="1" stopColor="#7fd0f5" />
            </linearGradient>
            <linearGradient id="slushGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e7f7ff" />
              <stop offset="0.45" stopColor="#9ad8fb" />
              <stop offset="1" stopColor="#4aa8e8" />
            </linearGradient>
            <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#c5ecff" />
            </linearGradient>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d7f3ff" />
              <stop offset="0.4" stopColor="#46b7f5" />
              <stop offset="1" stopColor="#1b7ed4" />
            </linearGradient>
            <linearGradient id="boilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e8f7ff" />
              <stop offset="0.5" stopColor="#2f8fd0" />
              <stop offset="1" stopColor="#155e9c" />
            </linearGradient>
            <linearGradient id="steamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#d5e7f4" />
            </linearGradient>
          </defs>
          {region === "ice" && <Ice />}
          {region === "melt" && <Slush />}
          {region === "water" && <Droplet boiling={false} />}
          {region === "boil" && <Droplet boiling />}
          {region === "steam" && <Steam />}
        </svg>
      </div>
      <div className="morsels" key={looping ? "loop" : reactKey} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <i key={index} />
        ))}
        {biteLabel && !looping && <span className="bite-label">{biteLabel}</span>}
      </div>
    </div>
  );
}
