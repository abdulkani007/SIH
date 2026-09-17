import { useState } from "react";
import { AlertTriangle, ShieldCheck, CloudLightning, CloudRain, ArrowRight, X, Mail } from "lucide-react";
import type { EarlyWarning } from "@/data/mockWeather";
import AlertNotificationModal from "./AlertNotificationModal";

interface WarningPanelProps {
  warning: EarlyWarning;
  userLocation?: string;
}

export default function WarningPanel({ warning, userLocation }: WarningPanelProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Clean location formatting with explicit 3 km radius representation
  const rawLoc = (userLocation || warning.location || "Local Sector").replace(/ (Region|Sector|District)$/i, "");
  const effectiveLocation = rawLoc.includes("3 km") || rawLoc.includes("3km")
    ? rawLoc
    : `${rawLoc} (3 km Radius)`;

  const isSevere = warning.severity === "Severe" || warning.severity === "High";

  return (
    <>
      <div
        className={`relative rounded-2xl p-4 sm:p-6 shadow-xs text-left overflow-hidden border ${
          isSevere
            ? "bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30"
            : "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30"
        }`}
      >
        {/* Pulsing attention aura bar */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-1.5 ${
            isSevere ? "bg-rose-600 animate-pulse" : "bg-emerald-600"
          }`}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pl-2">
          {/* Left info */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-xs ${
                  isSevere ? "bg-rose-600" : "bg-emerald-600"
                }`}
              >
                {isSevere ? (
                  <AlertTriangle className="w-3.5 h-3.5 fill-white" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 fill-white" />
                )}
                <span>{warning.title}</span>
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  isSevere ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                Issued: {warning.issuedAt}
              </span>
              {warning.sourceLabel && (
                <span className="text-[10px] font-mono font-bold bg-white/90 px-2 py-0.5 rounded-full border border-slate-200 text-slate-700 shadow-2xs">
                  {warning.sourceLabel}
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-slate-900 pt-0.5">
              {warning.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
              <span>
                Live Coverage: <strong className="text-slate-900">{effectiveLocation}</strong>
              </span>
              <span>•</span>
              <span>
                Expected Horizon: <strong className="text-slate-900">{warning.expectedWindow}</strong>
              </span>
            </div>
          </div>

          {/* Right Metrics & Action */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 lg:gap-6 flex-shrink-0">
            {/* Thunderstorm % */}
            <div
              className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white border shadow-xs ${
                isSevere ? "border-rose-200" : "border-slate-200"
              }`}
            >
              <CloudLightning
                className={`w-4 h-4 ${isSevere ? "text-amber-500" : "text-slate-400"}`}
              />
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-medium">Thunderstorm</div>
                <div className="text-sm font-black text-slate-900">{warning.thunderstormProb}%</div>
              </div>
            </div>

            {/* Extreme Rain % */}
            <div
              className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white border shadow-xs ${
                isSevere ? "border-rose-200" : "border-slate-200"
              }`}
            >
              <CloudRain
                className={`w-4 h-4 ${isSevere ? "text-rose-600" : "text-slate-400"}`}
              />
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-medium">Extreme Rain</div>
                <div className="text-sm font-black text-slate-900">{warning.extremeRainProb}%</div>
              </div>
            </div>

            {/* Confidence */}
            <div className="hidden sm:flex items-center gap-2 p-2.5 rounded-xl bg-white border border-blue-200 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-medium">Confidence</div>
                <div className="text-sm font-black text-blue-700">{warning.confidencePercent}%</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white active:scale-95 shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                isSevere
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              }`}
            >
              <span>View Alert Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 text-left relative animate-scaleUp max-h-[90dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  isSevere
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-emerald-50 border-emerald-200 text-emerald-600"
                }`}
              >
                {isSevere ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{warning.title}</h3>
                <span
                  className={`text-xs font-semibold ${
                    isSevere ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {warning.type}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p
                className={`p-3 border rounded-xl font-medium ${
                  isSevere
                    ? "bg-rose-50/70 border-rose-100 text-rose-900"
                    : "bg-emerald-50/70 border-emerald-100 text-emerald-900"
                }`}
              >
                {warning.description}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Affected Zone</span>
                  <strong className="text-slate-900 text-sm">{effectiveLocation}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Time Horizon</span>
                  <strong className="text-slate-900 text-sm">{warning.expectedWindow}</strong>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 text-slate-700">
                <div className="font-semibold text-slate-900">Recommended Action Steps:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  {isSevere ? (
                    <>
                      <li>Issue early storm advisories to low-lying civic bodies within 3 km of {rawLoc}.</li>
                      <li>Alert disaster response units regarding localized convective water accumulation (&gt;45mm/h).</li>
                      <li>Suspend outdoor operations and secure telecommunication antennas.</li>
                    </>
                  ) : (
                    <>
                      <li>Maintain standard micro-meteorological surveillance within 3 km of {rawLoc}.</li>
                      <li>No storm evacuation or emergency road closures required for this sector.</li>
                      <li>Convective-scale atmospheric monitoring grid maintains active 3 km coverage.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowEmailModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Alert Email</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Alert & Email Dispatch Modal */}
      <AlertNotificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        alert={warning}
        locationName={effectiveLocation}
      />
    </>
  );
}
