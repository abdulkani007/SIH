import type { DataSourceStatus } from "@/data/mockWeather";

interface DataStatusProps {
  sources: DataSourceStatus[];
}

export default function DataStatus({ sources }: DataStatusProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">Data Source Pipeline</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ACTIVE FEED
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Telemetry Check: OK</span>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {sources.map((src) => (
          <div
            key={src.name}
            className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">{src.name}</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{src.protocol}</span>
              <span className="font-mono text-emerald-600 font-semibold">{src.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
