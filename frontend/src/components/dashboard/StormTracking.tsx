import { Compass, Clock, ShieldCheck, Gauge, Activity, ArrowUpRight } from "lucide-react";
import type { StormCell } from "@/data/mockWeather";

interface StormTrackingProps {
  cell: StormCell;
  distanceFromUserKm?: number;
}

export default function StormTracking({ cell, distanceFromUserKm = 18.4 }: StormTrackingProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs text-left flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shadow-2xs flex-shrink-0">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                {cell.name.toUpperCase()}
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Convective Kinematics &amp; Vector Core
              </span>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider flex-shrink-0">
            {cell.intensity}
          </span>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 my-3">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Distance</div>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
              {distanceFromUserKm.toFixed(1)} km
            </div>
            <div className="text-[10px] text-slate-400 truncate">From your GPS origin</div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Direction Vector</div>
            <div className="text-sm sm:text-base font-black text-blue-700 flex items-center gap-1 mt-0.5">
              <Compass className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span>{cell.direction}</span>
              <ArrowUpRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
            <div className="text-[10px] text-slate-400 truncate">Azimuth 45° bearing</div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Forward Speed</div>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
              {cell.speedKmH} km/h
            </div>
            <div className="text-[10px] text-slate-400 truncate">Steady steering flow</div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Expected Arrival</div>
            <div className="text-sm sm:text-base font-black text-rose-700 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-500" />
              <span className="truncate">{cell.expectedArrival}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">Impact window ETA</div>
          </div>
        </div>

        {/* Projected Corridor */}
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950">
          <div className="flex items-center justify-between font-bold text-[11px] mb-1">
            <span>Projected Inflow Corridor:</span>
            <span className="font-mono text-blue-700">NE Trajectory</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] text-slate-600 font-medium">
            <span className="truncate">Perimeter Inflow</span>
            <span className="text-blue-500 font-bold">──▶</span>
            <span className="truncate">Urban Core</span>
            <span className="text-blue-500 font-bold">──▶</span>
            <span className="truncate">Eastern Escarpment</span>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-slate-100 mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px]">
            Core Reflectivity: <strong className="text-slate-900">{cell.maxReflectivityDbz} dBZ</strong>
          </span>
        </span>
        <span className="flex items-center gap-1 text-blue-700 font-bold font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{cell.confidencePercent}% Confidence</span>
        </span>
      </div>
    </div>
  );
}
