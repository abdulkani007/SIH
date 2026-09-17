import {
  CloudLightning,
  CloudHail,
  CloudRain,
  TrendingUp,
  MoveRight,
  TrendingDown,
  Activity,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HazardThreat, SeverityLevel } from "@/data/mockWeather";

interface ThreatOverviewProps {
  threats: HazardThreat[];
}

// Generate smooth cubic bezier sparkline path from points
function generateSparkline(data: number[], width: number, height: number) {
  if (!data || data.length < 2) return { lineD: "", areaD: "", points: [] };

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const paddingY = 6;
  const innerH = height - paddingY * 2;

  const points = data.map((val, idx) => ({
    x: (idx / (data.length - 1)) * width,
    y: range === 0 ? height - paddingY : paddingY + (1 - (val - min) / range) * innerH,
  }));

  let lineD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    lineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;
  return { lineD, areaD, points };
}

export default function ThreatOverview({ threats }: ThreatOverviewProps) {
  const getSeverityBadge = (severity: SeverityLevel, isAvailable: boolean) => {
    if (!isAvailable) {
      return "bg-slate-100 text-slate-500 border-slate-200";
    }
    switch (severity) {
      case "Severe":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Moderate":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getThemeColors = (id: string, isAvailable: boolean) => {
    if (!isAvailable) {
      return {
        stroke: "#94a3b8",
        glow: "rgba(148, 163, 184, 0.2)",
        gradientStart: "#94a3b8",
        gradientEnd: "#64748b",
        bg: "bg-slate-50",
        text: "text-slate-600",
        border: "border-slate-200",
      };
    }
    if (id.includes("thunder") || id.includes("storm")) {
      return {
        stroke: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.35)",
        gradientStart: "#f59e0b",
        gradientEnd: "#d97706",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      };
    }
    if (id.includes("hail")) {
      return {
        stroke: "#0284c7",
        glow: "rgba(2, 132, 199, 0.35)",
        gradientStart: "#38bdf8",
        gradientEnd: "#0284c7",
        bg: "bg-sky-50",
        text: "text-sky-700",
        border: "border-sky-200",
      };
    }
    return {
      stroke: "#e11d48",
      glow: "rgba(225, 29, 72, 0.35)",
      gradientStart: "#fb7185",
      gradientEnd: "#e11d48",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    };
  };

  const getHazardIcon = (iconName: string) => {
    switch (iconName) {
      case "thunderstorm":
        return <CloudLightning className="w-4 h-4 text-amber-600" />;
      case "hail":
        return <CloudHail className="w-4 h-4 text-slate-500" />;
      case "rain":
      default:
        return <CloudRain className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-3 text-left select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Convective Threat Monitor
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Radial probability gauges, 6-hour forecast sparklines &amp; verified atmospheric telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            0–6h Convective Horizon
          </span>
        </div>
      </div>

      {/* Grid of 3 Threat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {threats.map((threat) => {
          const isAvailable = threat.isAvailable !== false && threat.probability !== null;
          const colors = getThemeColors(threat.id, isAvailable);
          const trendData = threat.trendValues && threat.trendValues.length > 0 ? threat.trendValues : [];
          const peakVal = threat.peakValue ?? (trendData.length > 0 ? Math.max(...trendData) : null);

          // Radial gauge calculations (Circle R=30, Circumference = 2*PI*30 ≈ 188.5)
          const radius = 30;
          const circumference = 2 * Math.PI * radius;
          const probVal = threat.probability ?? 0;
          const strokeDashoffset = isAvailable
            ? circumference - (Math.min(100, Math.max(0, probVal)) / 100) * circumference
            : circumference;

          // Sparkline calculations (170 x 44)
          const sparkline = isAvailable && trendData.length >= 2
            ? generateSparkline(trendData, 170, 44)
            : null;

          return (
            <div
              key={threat.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between"
            >
              {/* Subtle top severity accent line */}
              <div
                className="absolute top-0 inset-x-0 h-1"
                style={{ backgroundColor: colors.stroke }}
              />

              {/* Card Upper Half */}
              <div>
                {/* Top Header: Icon + Title + Source & Severity Badge */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5", colors.bg, colors.border)}>
                      {getHazardIcon(threat.iconName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans truncate">
                        {threat.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-slate-500 font-mono font-medium truncate">
                          {threat.subtitle || threat.sourceLabel || "Tomorrow.io Live"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex-shrink-0 whitespace-nowrap",
                      getSeverityBadge(threat.severity, isAvailable)
                    )}
                  >
                    {isAvailable ? threat.severity : "Unavailable"}
                  </span>
                </div>

                {/* Main Body: Circular Donut Gauge + Key Metrics */}
                <div className="flex items-center justify-between gap-3 py-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 mb-3">
                  {/* Circular Donut Meter */}
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <svg width="72" height="72" viewBox="0 0 72 72" className="transform -rotate-90">
                      <defs>
                        <linearGradient id={`grad-${threat.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={colors.gradientStart} />
                          <stop offset="100%" stopColor={colors.gradientEnd} />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        fill="transparent"
                        stroke="#e2e8f0"
                        strokeWidth="6.5"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        fill="transparent"
                        stroke={isAvailable ? `url(#grad-${threat.id})` : "#94a3b8"}
                        strokeWidth="6.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      {isAvailable ? (
                        <>
                          <span className="text-lg font-black text-slate-900 tracking-tight leading-none">
                            {threat.probability}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">%</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-black text-slate-400 tracking-tight leading-none">
                            N/A
                          </span>
                          <span className="text-[9px] font-medium text-slate-400 leading-none mt-0.5">No Sensor</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Readout Details */}
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {isAvailable && threat.trend !== "Unavailable" ? (
                        <span
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono",
                            threat.trend === "Increasing"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                              : threat.trend === "Decreasing"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-slate-100 text-slate-600 border border-slate-200/80"
                          )}
                        >
                          {threat.trend === "Increasing" && <TrendingUp className="w-3 h-3 text-rose-600" />}
                          {threat.trend === "Steady" && <MoveRight className="w-3 h-3 text-slate-500" />}
                          {threat.trend === "Decreasing" && <TrendingDown className="w-3 h-3 text-emerald-600" />}
                          <span>{threat.trend}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/80 text-[10px] font-medium font-mono">
                          <AlertCircle className="w-3 h-3 text-slate-400" />
                          <span>Unavailable</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-sans truncate">
                      <span className="text-slate-400">Window:</span>{" "}
                      <strong className="text-slate-800 font-semibold font-mono text-[11px]">
                        {threat.expectedWindow || "Unavailable"}
                      </strong>
                    </div>

                    <div className="text-[11px] text-slate-500 font-sans truncate mt-0.5">
                      <span className="text-slate-400">Confidence:</span>{" "}
                      <span className="text-slate-600 font-mono font-medium text-[10px]">
                        Not Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6-Hour Forecast Trend Sparkline */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold">6H Trend Horizon</span>
                    <span className="text-slate-700 font-bold font-mono">
                      {isAvailable && peakVal !== null ? `Peak: ${peakVal}%` : "Peak: N/A"}
                    </span>
                  </div>

                  {isAvailable && sparkline ? (
                    <div className="w-full h-11 relative">
                      <svg viewBox="0 0 170 44" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`areaGrad-${threat.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        <path d={sparkline.areaD} fill={`url(#areaGrad-${threat.id})`} />
                        <path
                          d={sparkline.lineD}
                          fill="none"
                          stroke={colors.stroke}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        {sparkline.points.map((pt, i) => {
                          if (i === 0 || i === sparkline.points.length - 1) {
                            return (
                              <circle
                                key={`dot-${i}`}
                                cx={pt.x}
                                cy={pt.y}
                                r={2.5}
                                fill="#ffffff"
                                stroke={colors.stroke}
                                strokeWidth="1.5"
                              />
                            );
                          }
                          return null;
                        })}
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200/90 px-3 text-center">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {threat.unavailableReason || "Prediction unavailable — requires Doppler radar echo top & soundings"}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                    <span>NOW</span>
                    <span>+2H</span>
                    <span>+4H</span>
                    <span>+6H</span>
                  </div>
                </div>

                {/* Verified Input Factors Micro-Grid */}
                {threat.inputFactors && Object.keys(threat.inputFactors).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Verified Input Factors
                      </span>
                      <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold">
                        {threat.sourceLabel || "Tomorrow.io Live"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(threat.inputFactors).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px]"
                        >
                          <span className="text-slate-500 font-medium truncate mr-1">{key}:</span>
                          <span className="font-mono font-bold text-slate-800 flex-shrink-0">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Threat Technical Description */}
              <p className="text-[11px] text-slate-500 leading-relaxed mt-3 pt-2 border-t border-slate-100 font-sans">
                {threat.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
