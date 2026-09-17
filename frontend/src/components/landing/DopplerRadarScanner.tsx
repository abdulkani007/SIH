import { useState, useEffect, useRef } from "react";
import {
  Radio,
  Crosshair,
  Play,
  Pause,
  AlertTriangle,
} from "lucide-react";

interface DopplerRadarScannerProps {
  className?: string;
  onSelectCell?: (cellId: string) => void;
}

interface StormTarget {
  id: string;
  name: string;
  angle: number; // in degrees (0 = North, 90 = East, etc.)
  distanceRatio: number; // 0 to 1 (distance from center)
  dbz: number;
  severity: "extreme" | "severe" | "moderate" | "light";
  velocity: string;
  eta: string;
  rainfallRate: string;
  hailProb: number;
}

const STORM_TARGETS: StormTarget[] = [
  {
    id: "CELL-07",
    name: "Cell #07 Supercell Core",
    angle: 220, // Southwest
    distanceRatio: 0.52,
    dbz: 68,
    severity: "extreme",
    velocity: "+28 km/h NE",
    eta: "34 min to urban center",
    rainfallRate: "52 mm/h",
    hailProb: 84,
  },
  {
    id: "CELL-12",
    name: "Cell #12 Squall Line",
    angle: 315, // Northwest
    distanceRatio: 0.68,
    dbz: 54,
    severity: "severe",
    velocity: "+22 km/h E",
    eta: "58 min to perimeter",
    rainfallRate: "28 mm/h",
    hailProb: 46,
  },
  {
    id: "CELL-03",
    name: "Cell #03 Convective Updraft",
    angle: 55, // Northeast
    distanceRatio: 0.38,
    dbz: 42,
    severity: "moderate",
    velocity: "+18 km/h ENE",
    eta: "Holding over foothills",
    rainfallRate: "14 mm/h",
    hailProb: 12,
  },
  {
    id: "CELL-19",
    name: "Cell #19 Flank Showers",
    angle: 135, // Southeast
    distanceRatio: 0.76,
    dbz: 32,
    severity: "light",
    velocity: "+15 km/h E",
    eta: "Dissipating basin",
    rainfallRate: "6 mm/h",
    hailProb: 0,
  },
];

export default function DopplerRadarScanner({
  className = "",
  onSelectCell,
}: DopplerRadarScannerProps) {
  const [azimuth, setAzimuth] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<StormTarget | null>(STORM_TARGETS[0]);
  const radarRangeKm = 120;

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Smooth continuous radar sweep (60 degrees per second = 6 seconds per full 360 scan)
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (time - lastTimeRef.current) / 1000;
        setAzimuth((prev) => (prev + delta * 60) % 360);
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying]);

  // Center coordinates in a 500x500 SVG canvas
  const cx = 250;
  const cy = 250;
  const maxRadius = 210;

  // Degrees to radians helper
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  // Compute position of targets
  const getTargetPos = (target: StormTarget) => {
    const rad = toRad(target.angle);
    const r = target.distanceRatio * maxRadius;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Check if radar sweep just passed a target (within 32 degrees)
  const isIlluminated = (targetAngle: number) => {
    const diff = (azimuth - targetAngle + 360) % 360;
    return diff >= 0 && diff <= 32;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "extreme":
        return {
          fill: "#9333ea",
          ring: "#c084fc",
          badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        };
      case "severe":
        return {
          fill: "#dc2626",
          ring: "#f87171",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        };
      case "moderate":
        return {
          fill: "#f97316",
          ring: "#fb923c",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        };
      default:
        return {
          fill: "#22c55e",
          ring: "#4ade80",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        };
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl flex flex-col ${className}`}
    >
      {/* Top Header HUD Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 text-xs backdrop-blur-md z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex items-center gap-1.5 font-mono font-bold tracking-wider text-slate-200">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>DWR PULSE-DOPPLER RADAR</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 hidden sm:inline-block">
            C-BAND 5.6 GHz
          </span>
        </div>

        {/* Live Azimuth Angle & Telemetry */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-slate-400">
            <span>AZ:</span>
            <span className="text-cyan-400 font-bold w-12 text-right">
              {azimuth.toFixed(1).padStart(5, "0")}°
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <span>ELEV:</span>
            <span className="text-slate-200 font-bold">+0.5°</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-slate-400">
            <span>PRF:</span>
            <span className="text-slate-200 font-bold">1200 Hz</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isPlaying ? "Pause sweep" : "Resume sweep"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Radar Scope Area */}
      <div className="relative w-full flex-1 flex flex-col md:flex-row items-center justify-center p-3 sm:p-5 gap-4 overflow-hidden">
        
        {/* Radar Circular Scope */}
        <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center select-none">
          
          {/* Subtle Ambient Radar Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

          {/* SVG Radar Graphics */}
          <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <defs>
              {/* Radar Conical Sweep Gradient */}
              <radialGradient id="sweepCenterAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>

              {/* Storm Echo Glow */}
              <filter id="echoGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer Circular Scope Border */}
            <circle
              cx={cx}
              cy={cy}
              r={maxRadius + 14}
              fill="#020617"
              stroke="#1e293b"
              strokeWidth="3"
            />
            <circle
              cx={cx}
              cy={cy}
              r={maxRadius + 4}
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* Compass Degree Ticks along the Outer Ring */}
            {Array.from({ length: 36 }).map((_, i) => {
              const deg = i * 10;
              const isMajor = deg % 30 === 0;
              const r1 = maxRadius + 4;
              const r2 = maxRadius + (isMajor ? 12 : 8);
              const rad = toRad(deg);
              const x1 = cx + r1 * Math.cos(rad);
              const y1 = cy + r1 * Math.sin(rad);
              const x2 = cx + r2 * Math.cos(rad);
              const y2 = cy + r2 * Math.sin(rad);
              return (
                <line
                  key={`tick-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? "#38bdf8" : "#475569"}
                  strokeWidth={isMajor ? 1.5 : 0.75}
                  strokeOpacity={isMajor ? 0.9 : 0.5}
                />
              );
            })}

            {/* Compass Cardinal Labels */}
            <text x={cx} y={cy - maxRadius - 16} fontSize="11" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
              000° N
            </text>
            <text x={cx + maxRadius + 24} y={cy + 4} fontSize="11" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
              090° E
            </text>
            <text x={cx} y={cy + maxRadius + 24} fontSize="11" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
              180° S
            </text>
            <text x={cx - maxRadius - 24} y={cy + 4} fontSize="11" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
              270° W
            </text>

            {/* Radial Azimuth Spokes (Every 30 degrees) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const deg = i * 30;
              const rad = toRad(deg);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={cx}
                  y1={cy}
                  x2={cx + maxRadius * Math.cos(rad)}
                  y2={cy + maxRadius * Math.sin(rad)}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
              );
            })}

            {/* Concentric Range Rings */}
            {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const r = ratio * maxRadius;
              const km = Math.round(ratio * radarRangeKm);
              return (
                <g key={`ring-${idx}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="1"
                    strokeDasharray={ratio === 1 ? undefined : "3 3"}
                    strokeOpacity={ratio === 1 ? 0.4 : 0.22}
                  />
                  <text
                    x={cx + 6}
                    y={cy - r + 12}
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#38bdf8"
                    opacity="0.6"
                  >
                    {km} km
                  </text>
                </g>
              );
            })}

            {/* Primary Crosshairs (North-South, East-West) */}
            <line x1={cx - maxRadius} y1={cy} x2={cx + maxRadius} y2={cy} stroke="#0284c7" strokeWidth="1" strokeOpacity="0.35" />
            <line x1={cx} y1={cy - maxRadius} x2={cx} y2={cy + maxRadius} stroke="#0284c7" strokeWidth="1" strokeOpacity="0.35" />

            {/* ROTATING RADAR SWEEP BEAM CONE & LINE */}
            <g transform={`rotate(${azimuth}, ${cx}, ${cy})`}>
              {/* Phosphor Conical Sweep Trail */}
              <path
                d={`M ${cx} ${cy} 
                    L ${cx + maxRadius * Math.cos(toRad(-35))} ${cy + maxRadius * Math.sin(toRad(-35))} 
                    A ${maxRadius} ${maxRadius} 0 0 1 ${cx} ${cy - maxRadius} 
                    Z`}
                fill="url(#sweepCenterAura)"
                opacity="0.85"
              />
              {/* Leading High-Tech Sweep Line */}
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - maxRadius}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#echoGlow)"
              />
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - maxRadius}
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>

            {/* STORM CELL TARGET BLIPS */}
            {STORM_TARGETS.map((target) => {
              const pos = getTargetPos(target);
              const illuminated = isIlluminated(target.angle);
              const isSelected = selectedCell?.id === target.id;
              const colors = getSeverityColor(target.severity);

              return (
                <g
                  key={target.id}
                  className="cursor-pointer transition-all duration-300 group"
                  onClick={() => {
                    setSelectedCell(target);
                    if (onSelectCell) onSelectCell(target.id);
                  }}
                >
                  {/* Radar Illuminated Ping Wave when beam strikes */}
                  {illuminated && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="26"
                      fill="none"
                      stroke={colors.ring}
                      strokeWidth="2"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        values="8;32"
                        dur="0.8s"
                        repeatCount="1"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.9;0"
                        dur="0.8s"
                        repeatCount="1"
                      />
                    </circle>
                  )}

                  {/* Storm Echo Core Blob */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 11 : 8}
                    fill={colors.fill}
                    filter="url(#echoGlow)"
                    opacity={illuminated ? 1 : 0.75}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 5 : 3.5}
                    fill="#ffffff"
                    opacity={illuminated ? 1 : 0.85}
                  />

                  {/* Target Label */}
                  <text
                    x={pos.x + 10}
                    y={pos.y + 4}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill={isSelected ? "#38bdf8" : "#94a3b8"}
                    className="select-none"
                  >
                    {target.id}
                  </text>

                  {/* Target Crosshair brackets when selected */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="16"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  )}
                </g>
              );
            })}

            {/* Radar Center Station Beacon */}
            <circle cx={cx} cy={cy} r="14" fill="#0284c7" fillOpacity="0.25">
              <animate attributeName="r" values="6;20;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={cx} cy={cy} r="5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="1.5" fill="#ffffff" />
          </svg>
        </div>

        {/* Live Target Telemetry Sidecard */}
        <div className="w-full md:w-64 bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between text-xs space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-mono text-[11px] text-slate-400 font-bold uppercase">
                TARGET TELEMETRY
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                ACTIVE
              </span>
            </div>

            {selectedCell ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">{selectedCell.name}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      getSeverityColor(selectedCell.severity).badge
                    }`}
                  >
                    {selectedCell.dbz} dBZ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[10px]">BEARING / DIST</span>
                    <span className="text-slate-200 font-bold">
                      {selectedCell.angle}° / {(selectedCell.distanceRatio * radarRangeKm).toFixed(0)} km
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">VECTOR</span>
                    <span className="text-cyan-300 font-bold">{selectedCell.velocity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">RAIN RATE</span>
                    <span className="text-slate-200 font-bold">{selectedCell.rainfallRate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">HAIL PROB</span>
                    <span className="text-rose-400 font-bold">{selectedCell.hailProb}%</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{selectedCell.eta}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500">
                <Crosshair className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <span>Click any radar blip to inspect convective core</span>
              </div>
            )}
          </div>

          {/* Quick Target Switcher Pills */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono block mb-1.5">DETECTED CELLS:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {STORM_TARGETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedCell(t);
                    if (onSelectCell) onSelectCell(t.id);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold text-left transition-all cursor-pointer truncate ${
                    selectedCell?.id === t.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  {t.id} ({t.dbz} dBZ)
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control & dBZ Scale Strip */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-500">REFLECTIVITY SCALE:</span>
          <div className="flex items-center gap-0.5">
            <span className="w-3.5 h-2 bg-emerald-500 rounded-2xs" title="15-30 dBZ Light" />
            <span className="w-3.5 h-2 bg-yellow-400 rounded-2xs" title="30-45 dBZ Moderate" />
            <span className="w-3.5 h-2 bg-orange-500 rounded-2xs" title="45-55 dBZ Heavy" />
            <span className="w-3.5 h-2 bg-red-600 rounded-2xs" title="55-65 dBZ Severe" />
            <span className="w-3.5 h-2 bg-purple-600 rounded-2xs" title=">65 dBZ Hail Core" />
          </div>
          <span className="font-mono text-[10px] text-slate-300">15 to 70+ dBZ</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-cyan-400">
            AUTO-SCAN: 6 RPM
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            LATENCY: 0.18s
          </span>
        </div>
      </div>
    </div>
  );
}
