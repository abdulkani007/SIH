import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurrentWeather, HazardThreat, StormCell, EarlyWarning } from "@/data/mockWeather";

export interface DemoStage {
  stageNumber: number;
  title: string;
  subtitle: string;
  description: string;
  weather: Partial<CurrentWeather>;
  threats: Partial<HazardThreat>[];
  stormCell: Partial<StormCell>;
  warning: Partial<EarlyWarning> | null;
  aiExplanation: string;
  statusBadge: string;
  severityColor: string;
}

export const STORM_SIMULATION_STAGES: DemoStage[] = [
  {
    stageNumber: 1,
    title: "1. Normal Baseline Conditions",
    subtitle: "T-120 min • Fair Weather",
    description: "Atmospheric boundary layer is stable. Surface pressure is steady at 1014 hPa with light southwesterly winds.",
    weather: {
      temperature: 28,
      condition: "Partly Cloudy",
      feelsLike: 30,
      humidity: 62,
      windSpeed: 12,
      pressure: 1014,
      rainfall: 0,
      cloudCover: 35,
    },
    threats: [
      { id: "threat-1", title: "Thunderstorm", probability: 14, severity: "Low", trend: "Steady" },
      { id: "threat-2", title: "Hail", probability: 5, severity: "Low", trend: "Steady" },
      { id: "threat-3", title: "Extreme Rainfall", probability: 8, severity: "Low", trend: "Steady" },
    ],
    stormCell: {
      name: "No Active Cell",
      currentLocation: "Boundary Layer Quiet",
      speedKmH: 0,
      intensity: "Low",
      direction: "None",
      expectedArrival: "No Threat",
      maxReflectivityDbz: 18,
    },
    warning: null,
    aiExplanation: "Atmospheric equilibrium is maintained. Convective available potential energy (CAPE) is below trigger thresholds.",
    statusBadge: "NORMAL BASELINE",
    severityColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    stageNumber: 2,
    title: "2. Convective Initiation Developing",
    subtitle: "T-90 min • Updraft Detected",
    description: "Doppler radar detects rapid vertical updrafts exceeding 15 m/s. Relative humidity climbs to 78% as moisture converges.",
    weather: {
      temperature: 30,
      condition: "Towering Cumulus",
      feelsLike: 33,
      humidity: 78,
      windSpeed: 18,
      pressure: 1011,
      rainfall: 2,
      cloudCover: 60,
    },
    threats: [
      { id: "threat-1", title: "Thunderstorm", probability: 48, severity: "Moderate", trend: "Increasing" },
      { id: "threat-2", title: "Hail", probability: 25, severity: "Moderate", trend: "Increasing" },
      { id: "threat-3", title: "Extreme Rainfall", probability: 36, severity: "Moderate", trend: "Increasing" },
    ],
    stormCell: {
      name: "Cell Inception #01",
      currentLocation: "Southwest Perimeter",
      speedKmH: 19,
      intensity: "Moderate",
      direction: "↗ Northeast",
      expectedArrival: "75 minutes",
      maxReflectivityDbz: 42,
    },
    warning: null,
    aiExplanation: "Surface heating and moisture convergence have triggered moderate convective instability. Echo tops rising toward 9 km.",
    statusBadge: "UPDRAFT FORMATION",
    severityColor: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    stageNumber: 3,
    title: "3. Rapid Risk Spike",
    subtitle: "T-60 min • Supercell Influx",
    description: "Echo tops pierce 13 km. Satellite IR brightness temperature plunges below -65°C, confirming deep tropospheric penetration.",
    weather: {
      temperature: 31,
      condition: "Cumulonimbus Incus",
      feelsLike: 35,
      humidity: 84,
      windSpeed: 24,
      pressure: 1008,
      rainfall: 8,
      cloudCover: 85,
    },
    threats: [
      { id: "threat-1", title: "Thunderstorm", probability: 76, severity: "High", trend: "Increasing" },
      { id: "threat-2", title: "Hail", probability: 52, severity: "High", trend: "Increasing" },
      { id: "threat-3", title: "Extreme Rainfall", probability: 68, severity: "High", trend: "Increasing" },
    ],
    stormCell: {
      name: "Storm Cell #01",
      currentLocation: "Advancing Southwest Ridge",
      speedKmH: 25,
      intensity: "High",
      direction: "↗ Northeast",
      expectedArrival: "55 minutes",
      maxReflectivityDbz: 56,
    },
    warning: null,
    aiExplanation: "Precipitation core loading is intense. Downdraft gust front is organizing with elevated hail core probability.",
    statusBadge: "HIGH CONVECTIVE RISK",
    severityColor: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    stageNumber: 4,
    title: "4. Cell Trajectory Advance",
    subtitle: "T-35 min • Fast Forward Motion",
    description: "Doppler radial velocity indicates 28 km/h forward propagation towards populated Salem & Dharmapuri civic corridors.",
    weather: {
      temperature: 31,
      condition: "Severe Convective Storm",
      feelsLike: 35,
      humidity: 88,
      windSpeed: 32,
      pressure: 1005,
      rainfall: 18,
      cloudCover: 95,
    },
    threats: [
      { id: "threat-1", title: "Thunderstorm", probability: 89, severity: "Severe", trend: "Increasing" },
      { id: "threat-2", title: "Hail", probability: 64, severity: "High", trend: "Steady" },
      { id: "threat-3", title: "Extreme Rainfall", probability: 78, severity: "Severe", trend: "Increasing" },
    ],
    stormCell: {
      name: "Storm Cell #01",
      currentLocation: "Salem Perimeter Sector",
      speedKmH: 28,
      intensity: "Severe",
      direction: "↗ Northeast (45°)",
      expectedArrival: "35 minutes",
      maxReflectivityDbz: 65,
    },
    warning: null,
    aiExplanation: "Steering winds at 500 hPa level are driving the storm cell along the Dharmapuri boundary at 28 km/h. Reflectivity exceeds 65 dBZ.",
    statusBadge: "VECTOR ACCELERATING",
    severityColor: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    stageNumber: 5,
    title: "5. Automated Red Early Warning Issued",
    subtitle: "T-15 min • Tactical Alert Dispatched",
    description: "Threshold algorithm triggers state disaster response early warning. Critical rain rate projected to exceed 55 mm/h.",
    weather: {
      temperature: 29,
      condition: "Severe Thunderstorm & Hail",
      feelsLike: 33,
      humidity: 92,
      windSpeed: 42,
      pressure: 1002,
      rainfall: 38,
      cloudCover: 100,
    },
    threats: [
      { id: "threat-1", title: "Thunderstorm", probability: 96, severity: "Severe", trend: "Increasing" },
      { id: "threat-2", title: "Hail", probability: 72, severity: "Severe", trend: "Increasing" },
      { id: "threat-3", title: "Extreme Rainfall", probability: 92, severity: "Severe", trend: "Increasing" },
    ],
    stormCell: {
      name: "Storm Cell #01",
      currentLocation: "Direct Overhead Impact Zone",
      speedKmH: 30,
      intensity: "Severe",
      direction: "↗ Northeast",
      expectedArrival: "15 minutes",
      maxReflectivityDbz: 68,
    },
    warning: {
      id: "warn-sih-01",
      title: "CRITICAL SEVERE CONVECTIVE WARNING",
      type: "Severe Thunderstorm, Hail & Cloudburst Alert",
      severity: "Severe",
      description: "Immediate threat of severe convective downbursts, hail accumulation (25mm), and extreme rainfall exceeding 55 mm/h.",
      location: "Salem & Surrounding Region",
      expectedWindow: "Immediate (0–45 mins)",
      thunderstormProb: 96,
      extremeRainProb: 92,
      confidencePercent: 94,
      issuedAt: "AUTOMATED BROADCAST",
    },
    aiExplanation: "RED SEVERE WARNING ACTIVATED: Convective rainfall rates are hazardous. Civil defense units must execute flash flood protocols.",
    statusBadge: "RED SEVERE ALERT DISPATCHED",
    severityColor: "text-rose-700 bg-rose-100 border-rose-300",
  },
  {
    stageNumber: 6,
    title: "6. Groq AI Explains Tactical Actions",
    subtitle: "T-00 min • Live Decision Support",
    description: "Groq LPU processes multi-source telemetry to deliver human-understandable mitigation directives for civic authorities.",
    weather: {
      temperature: 27,
      condition: "Torrential Downpour",
      feelsLike: 29,
      humidity: 96,
      windSpeed: 48,
      pressure: 999,
      rainfall: 65,
      cloudCover: 100,
    },
    threats: [
      { id: "threat-1", title: "Thunderstorm", probability: 98, severity: "Severe", trend: "Steady" },
      { id: "threat-2", title: "Hail", probability: 75, severity: "Severe", trend: "Steady" },
      { id: "threat-3", title: "Extreme Rainfall", probability: 95, severity: "Severe", trend: "Steady" },
    ],
    stormCell: {
      name: "Storm Cell #01",
      currentLocation: "Active Convective Core",
      speedKmH: 32,
      intensity: "Severe",
      direction: "↗ Northeast",
      expectedArrival: "Peak Nowcast Impact",
      maxReflectivityDbz: 70,
    },
    warning: {
      id: "warn-sih-02",
      title: "PEAK IMPACT NOWCASTING ACTIVE",
      type: "Hailstorm & Torrential Precipitation In-Progress",
      severity: "Severe",
      description: "Severe cell peak over target coordinates. Inundation of subway underpasses and power grid disruption probable.",
      location: "Salem Region Urban Core",
      expectedWindow: "Peak Horizon (Next 30 mins)",
      thunderstormProb: 98,
      extremeRainProb: 95,
      confidencePercent: 96,
      issuedAt: "PEAK CONVECTIVE DISPATCH",
    },
    aiExplanation: "GROQ DECISION PROTOCOL: Evacuate low-lying arterial corridors immediately. Instruct public transit to halt underpass crossings. Agricultural hail covers must remain secured.",
    statusBadge: "GROQ TACTICAL COPILOT ACTIVE",
    severityColor: "text-purple-700 bg-purple-100 border-purple-300",
  },
];

interface DemoSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStage: (stage: DemoStage) => void;
}

export default function DemoSimulator({
  isOpen,
  onClose,
  onApplyStage,
}: DemoSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeStage = STORM_SIMULATION_STAGES[currentStep];

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % STORM_SIMULATION_STAGES.length;
          onApplyStage(STORM_SIMULATION_STAGES[next]);
          return next;
        });
      }, 5000); // 5 seconds per stage in autoplay
    }
    return () => clearInterval(interval);
  }, [isPlaying, onApplyStage]);

  if (!isOpen) return null;

  const handleStepSelect = (idx: number) => {
    setCurrentStep(idx);
    setIsPlaying(false);
    onApplyStage(STORM_SIMULATION_STAGES[idx]);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    onApplyStage(STORM_SIMULATION_STAGES[0]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-left font-sans select-none"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp max-h-[90dvh] flex flex-col">
        {/* Header Strip */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold tracking-tight">
                  Storm Evolution Simulation
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40">
                  SIMULATION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Controlled 6-stage convective storm lifecycle for operational analysis and training
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Step Timeline Indicator */}
          <div className="flex sm:grid sm:grid-cols-6 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            {STORM_SIMULATION_STAGES.map((s, idx) => {
              const isActive = currentStep === idx;
              const isPast = currentStep > idx;
              return (
                <button
                  key={s.stageNumber}
                  type="button"
                  onClick={() => handleStepSelect(idx)}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer min-w-[85px] sm:min-w-0 flex-shrink-0 sm:flex-shrink",
                    isActive
                      ? "bg-blue-50 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                      : isPast
                      ? "bg-slate-50 border-slate-300 text-slate-700"
                      : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                  )}
                >
                  <div className="text-[11px] font-black">{idx + 1}</div>
                  <div className="text-[9px] font-bold truncate mt-0.5">
                    {s.title.split(".")[1] || s.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider",
                    activeStage.severityColor
                  )}
                >
                  {activeStage.statusBadge}
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-2">
                  {activeStage.title}
                </h4>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  {activeStage.subtitle}
                </div>
              </div>

              {/* Reflectivity gauge */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-right font-mono">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Radar Core</div>
                <div className="text-sm font-black text-blue-600">
                  {activeStage.stormCell.maxReflectivityDbz} dBZ
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {activeStage.description}
            </p>

            {/* AI Explanation Box */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-blue-900 block mb-0.5">
                  AI Explainability Diagnostic:
                </strong>
                <span>{activeStage.aiExplanation}</span>
              </div>
            </div>
          </div>

          {/* Controls & Progress */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause Simulation" : "Auto-Play 30s Lifecycle"}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset to Normal Conditions"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onApplyStage(activeStage);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
              >
                Apply to Live Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
