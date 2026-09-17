import { useMemo } from "react";
import {
  Compass,
  ArrowUpRight,
  CloudLightning,
  CloudRain,
  CloudHail,
  ShieldCheck,
  Activity,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NowcastStep, SeverityLevel, StormCell } from "@/data/mockWeather";
import type { GeoCoordinates } from "@/services/locationService";
import { locationService } from "@/services/locationService";

export interface StormJourneyTimelineProps {
  steps: NowcastStep[];
  selectedIdx: number;
  onSelectStep: (step: NowcastStep, index: number) => void;
  stormCell: StormCell;
  userCoords?: GeoCoordinates | null;
  userLocation?: string;
  className?: string;
}

export default function StormJourneyTimeline({
  steps,
  selectedIdx,
  onSelectStep,
  stormCell,
  userCoords,
  userLocation = "Local Perimeter",
  className,
}: StormJourneyTimelineProps) {
  // Compute realistic trajectory telemetry for each hour (0 to 6)
  const journeyNodes = useMemo(() => {
    // Base origin southwest of user location or default meteorological hub
    const baseLat = userCoords ? userCoords.latitude - 0.12 : 11.52;
    const baseLon = userCoords ? userCoords.longitude - 0.14 : 78.02;

    return steps.map((step, idx) => {
      // 45° Northeast movement vector
      const lat = Number((baseLat + idx * 0.052).toFixed(4));
      const lon = Number((baseLon + idx * 0.052).toFixed(4));

      // Real distance to user coordinates if available, or realistic convective approach distance
      const distanceKm = userCoords
        ? locationService.calculateDistanceKm(
            userCoords.latitude,
            userCoords.longitude,
            lat,
            lon
          )
        : Number((Math.abs(idx - 2) * 6.8 + 4.2).toFixed(1));

      // Speed progression along convective cycle
      const speedKmH = 26 + idx * 2;

      // Estimated arrival descriptor
      const arrivalEta =
        idx === 0
          ? "38 min"
          : idx === 1
          ? "1h 15m (Outer Bands)"
          : idx === 2
          ? "Overhead (T+2h)"
          : `Passing Northeast (+${idx}h)`;

      return {
        ...step,
        index: idx,
        coordinates: [lat, lon] as [number, number],
        distanceKm,
        speedKmH,
        direction: "NE",
        directionDegrees: 45,
        arrivalEta,
      };
    });
  }, [steps, userCoords]);

  const activeNode = journeyNodes[selectedIdx] || journeyNodes[0];

  const getSeverityBadgeClass = (severity: SeverityLevel) => {
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

  const getStormIcon = (severity: SeverityLevel, idx: number) => {
    if (idx === 2 || severity === "Severe") {
      return <CloudLightning className="w-4 h-4 text-rose-600" />;
    }
    if (severity === "High") {
      return <CloudRain className="w-4 h-4 text-orange-600" />;
    }
    if (severity === "Moderate") {
      return <Wind className="w-4 h-4 text-amber-600" />;
    }
    return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs text-left select-none relative transition-all",
        className
      )}
    >
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Storm Journey
            </h2>
            <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold flex items-center gap-1">
              <Compass className="w-3 h-3 text-blue-600" />
              <span>Convective Trajectory</span>
            </span>
            {activeNode.sourceLabel && (
              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-bold">
                {activeNode.sourceLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            6-hour storm movement and hazard evolution &bull; Relative to {userLocation}
          </p>
        </div>

        {/* Selected Forecast Horizon Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="text-slate-500">Selected Horizon:</span>
          <span className="font-bold text-slate-900">{activeNode.timeLabel}</span>
          <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {activeNode.distanceKm} km away
          </span>
        </div>
      </div>

      {/* 2. Compact Summary Bar (Current Storm & Hazard Overview) */}
      <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-slate-50/90 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        {/* Left: Active Storm Cell Telemetry */}
        <div className="md:col-span-6 flex flex-wrap items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
            <Activity className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{stormCell.name}</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide",
                  getSeverityBadgeClass(activeNode.overallSeverity)
                )}
              >
                {activeNode.overallSeverity} Risk
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 font-mono mt-0.5">
              <span className="flex items-center gap-1">
                <span>Movement:</span>
                <strong className="text-slate-800">{activeNode.speedKmH} km/h</strong>
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <span>Distance:</span>
                <strong className="text-blue-700">{activeNode.distanceKm} km</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <span>ETA:</span>
                <strong className="text-slate-800">{activeNode.arrivalEta}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Compact 3-Hazard Metrics */}
        <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-2 sm:gap-4 text-xs font-mono pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/70">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <CloudLightning className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-600">Storm:</span>
            <strong className="text-amber-700 font-bold text-xs sm:text-sm">
              {activeNode.thunderstormProb}%
            </strong>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <CloudRain className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-slate-600">Rain:</span>
            <strong className="text-rose-700 font-bold text-xs sm:text-sm">
              {activeNode.extremeRainfallProb}%
            </strong>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <CloudHail className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-600">Hail:</span>
            <strong className="text-blue-700 font-bold text-xs sm:text-sm">
              {activeNode.hailProb}%
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Main Horizontal Journey Timeline Visualization */}
      <div className="relative">
        {/* Animated Connecting Trajectory Path (Background) */}
        <div className="hidden lg:block absolute top-[46px] left-[5%] right-[5%] h-1 bg-slate-200 z-0 rounded-full">
          {/* Active progress trajectory line */}
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(selectedIdx / 6) * 100}%` }}
          />
        </div>

        {/* 7 Forecast Nodes / Cards */}
        <div className="flex lg:grid lg:grid-cols-7 gap-2.5 relative z-10 overflow-x-auto no-scrollbar pb-2">
          {journeyNodes.map((node) => {
            const isSelected = selectedIdx === node.index;
            const Icon = getStormIcon(node.overallSeverity, node.index);

            return (
              <button
                key={node.timeLabel}
                type="button"
                onClick={() => onSelectStep(steps[node.index], node.index)}
                className={cn(
                  "p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer min-w-[130px] flex-shrink-0 lg:min-w-0 lg:flex-shrink relative",
                  isSelected
                    ? "bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20 translate-y-[-2px]"
                    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                )}
              >
                {/* Node Top Header (Time + Icon) */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {node.index === 0 ? "0" : `+${node.index}`}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-black tracking-tight",
                          isSelected ? "text-blue-900" : "text-slate-800"
                        )}
                      >
                        {node.timeLabel}
                      </span>
                    </div>

                    <div className="p-1 rounded-md bg-slate-50 border border-slate-100">
                      {Icon}
                    </div>
                  </div>

                  {/* Distance from Location */}
                  <div className="mb-2">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Distance
                    </div>
                    <div
                      className={cn(
                        "text-xs font-extrabold font-mono",
                        node.distanceKm <= 5.0 ? "text-rose-600 font-black" : "text-slate-900"
                      )}
                    >
                      {node.distanceKm} km away
                    </div>
                  </div>

                  {/* Speed & Direction Vector */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-2 py-1 px-1.5 rounded bg-slate-50 border border-slate-100">
                    <span>{node.speedKmH} km/h</span>
                    <span className="flex items-center text-blue-600 font-bold">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{node.direction}</span>
                    </span>
                  </div>

                  {/* Severity Badge */}
                  <div className="mb-2.5">
                    <span
                      className={cn(
                        "inline-block w-full text-center py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                        getSeverityBadgeClass(node.overallSeverity)
                      )}
                    >
                      {node.overallSeverity}
                    </span>
                  </div>
                </div>

                {/* Bottom Hazard Probabilities Breakdown */}
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-amber-700 font-bold">TS:</span>
                    <span className="font-bold text-slate-900">{node.thunderstormProb}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${node.thunderstormProb}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-600 pt-0.5">
                    <span className="text-rose-700 font-bold">Rain:</span>
                    <span className="font-bold text-slate-900">{node.extremeRainfallProb}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${node.extremeRainfallProb}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-600 pt-0.5">
                    <span className="text-blue-700 font-bold">Hail:</span>
                    <span className="font-bold text-slate-900">{node.hailProb}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${node.hailProb}%` }}
                    />
                  </div>
                </div>

                {/* Selected Indicator Pin */}
                {isSelected && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45 rounded-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Trajectory Movement Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
          <span>
            Current Focus: <strong>{activeNode.timeLabel}</strong> &bull; Convective cell trajectory heading <strong>45° Northeast</strong> at <strong>{activeNode.speedKmH} km/h</strong>.
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Click any hour node to synchronize the GIS Map &amp; Storm Tracking
        </div>
      </div>
    </div>
  );
}
