import { useState } from "react";
import { Clock, ShieldCheck, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertLog, SeverityLevel } from "@/data/mockWeather";
import AlertNotificationModal from "./AlertNotificationModal";

interface RecentAlertsProps {
  alerts: AlertLog[];
}

export default function RecentAlerts({ alerts }: RecentAlertsProps) {
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertLog | null>(null);
  const hasAlerts = Boolean(alerts && alerts.length > 0);

  const getSeverityChip = (severity: SeverityLevel) => {
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

  const getSeverityDot = (severity: SeverityLevel) => {
    switch (severity) {
      case "Severe":
        return "bg-rose-600";
      case "High":
        return "bg-orange-500";
      case "Moderate":
        return "bg-amber-500";
      case "Low":
      default:
        return "bg-emerald-500";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">Recent Alerts</h2>
          {hasAlerts ? (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {hasAlerts ? `Real-time Dispatch Log (${alerts.length})` : "Monitoring Active"}
        </span>
      </div>

      {!hasAlerts ? (
        <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mb-2.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-slate-800">No active alerts</div>
          <div className="text-xs text-slate-500 mt-1 max-w-sm">
            Recent weather conditions do not currently meet the configured warning thresholds.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between transition-colors gap-3"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1 sm:mt-1.5 flex-shrink-0",
                    getSeverityDot(alert.severity)
                  )}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {alert.title}
                    </span>
                    {alert.type && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {alert.type}
                      </span>
                    )}
                    {/* Provenance Badge for Historical Event Generated Alert */}
                    {(alert.isHistorical || alert.historicalEventId || alert.title.includes("Historical")) && (
                      <>
                        {alert.dataType === "Demonstration Alert" || alert.dataType === "Demonstration Dataset" ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            DEMO DATA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            VERIFIED
                          </span>
                        )}
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Historical Alert
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700">{alert.location}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{alert.timestamp}</span>
                    </span>
                    {alert.source && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {alert.source}
                        </span>
                      </>
                    )}
                  </div>

                  {alert.description && (
                    <div className="text-[11px] text-slate-600 pt-0.5">
                      {alert.description}
                    </div>
                  )}

                  {(alert.triggerValue || alert.threshold) && (
                    <div className="text-[11px] text-slate-600 pt-0.5 flex items-center gap-2 flex-wrap">
                      {alert.triggerValue && (
                        <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {alert.triggerValue}
                        </span>
                      )}
                      {alert.threshold && (
                        <span className="text-slate-500 font-mono text-[10px]">
                          ({alert.threshold})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-center justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 sm:border-transparent flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForModal(alert)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Generate AI Alert Explanation & Send Email"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Send Email</span>
                </button>

                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    getSeverityChip(alert.severity)
                  )}
                >
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Alert & Email Dispatch Modal */}
      <AlertNotificationModal
        isOpen={Boolean(selectedAlertForModal)}
        onClose={() => setSelectedAlertForModal(null)}
        alert={selectedAlertForModal}
      />
    </div>
  );
}
