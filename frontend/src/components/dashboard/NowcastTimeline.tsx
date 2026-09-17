import { useState } from "react";
import {
  CloudLightning,
  CloudHail,
  CloudRain,
  Clock,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NowcastStep, SeverityLevel } from "@/data/mockWeather";

interface NowcastTimelineProps {
  steps: NowcastStep[];
  selectedIdx?: number;
  onSelectStep?: (step: NowcastStep, index: number) => void;
}

export default function NowcastTimeline({
  steps,
  selectedIdx: controlledIdx,
  onSelectStep,
}: NowcastTimelineProps) {
  const [internalIdx, setInternalIdx] = useState(0);
  const selectedIdx = controlledIdx !== undefined ? controlledIdx : internalIdx;
  const activeStep = steps[selectedIdx] || steps[0];

  const handleStepClick = (idx: number) => {
    if (controlledIdx === undefined) {
      setInternalIdx(idx);
    }
    onSelectStep?.(steps[idx], idx);
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              0–6 Hour Nowcasting Timeline
            </h2>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                getSeverityBadge(activeStep.overallSeverity)
              )}
            >
              {activeStep.overallSeverity} Threat
            </span>
            {activeStep.sourceLabel && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight bg-slate-100 text-slate-700 border border-slate-200">
                {activeStep.sourceLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hourly multi-hazard trajectory extrapolation &amp; micro-scale precipitation rate
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Selected Horizon: {activeStep.timeLabel}</span>
        </div>
      </div>

      {/* Timeline Step Button Strip */}
      <div className="flex sm:grid sm:grid-cols-7 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mb-5 select-none overflow-x-auto no-scrollbar">
        {steps.map((step, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={step.timeLabel}
              type="button"
              onClick={() => handleStepClick(idx)}
              className={cn(
                "py-2 sm:py-2.5 px-2 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center min-w-[66px] sm:min-w-0 flex-1 flex-shrink-0 sm:flex-shrink",
                isSelected
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200 scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              )}
            >
              <div className="text-[11px] sm:text-xs font-black whitespace-nowrap">{step.timeLabel}</div>
              <div
                className={cn(
                  "text-[10px] hidden sm:block font-medium mt-0.5",
                  step.overallSeverity === "Severe"
                    ? "text-rose-600 font-bold"
                    : step.overallSeverity === "High"
                    ? "text-orange-600 font-bold"
                    : step.overallSeverity === "Moderate"
                    ? "text-amber-600 font-bold"
                    : "text-emerald-600"
                )}
              >
                {step.thunderstormProb}% TS
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left: 3 Hazard Meters */}
        <div className="md:col-span-7 grid grid-cols-3 gap-2 sm:gap-3">
          {/* Thunderstorm Meter */}
          <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-700 truncate">
              <CloudLightning className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span className="truncate">Storm</span>
            </div>
            <div className="my-1.5 sm:my-2">
              <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeStep.thunderstormProb}%
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${activeStep.thunderstormProb}%` }}
              />
            </div>
          </div>

          {/* Hail Meter */}
          <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-700 truncate">
              <CloudHail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
              <span className="truncate">Hail</span>
            </div>
            <div className="my-1.5 sm:my-2">
              <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeStep.hailProb}%
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${activeStep.hailProb}%` }}
              />
            </div>
          </div>

          {/* Extreme Rainfall Meter */}
          <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-700 truncate">
              <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
              <span className="truncate">Rain</span>
            </div>
            <div className="my-1.5 sm:my-2">
              <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeStep.extremeRainfallProb}%
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${activeStep.extremeRainfallProb}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Meteorological Narrative & Rate */}
        <div className="md:col-span-5 p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Nowcast Intelligence
              </span>
              <span className="text-[10px] font-mono text-blue-700 font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                {activeStep.sourceLabel ? `${activeStep.sourceLabel} • ${activeStep.timeLabel}` : `${activeStep.timeLabel} Window`}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed pt-1">
              {activeStep.summary}
            </p>
          </div>

          <div className="pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              <span>Peak Rain Rate:</span>
            </span>
            <span className="font-bold text-slate-900 font-mono">
              {activeStep.expectedPrecipRate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
