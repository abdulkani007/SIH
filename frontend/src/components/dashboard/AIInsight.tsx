import { Sparkles, ShieldCheck, Cpu } from "lucide-react";

interface AIInsightProps {
  quote?: string;
}

export default function AIInsight({
  quote = "Atmospheric moisture and increasing convective activity indicate a rising thunderstorm risk during the next 2 hours.",
}: AIInsightProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200/80 p-5 sm:p-6 shadow-xs text-left relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                AI Weather Insight
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                GROQ LLM READY
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800 italic leading-relaxed">
              "{quote}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>87% Confidence</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Cpu className="w-3.5 h-3.5" />
            <span>FastAPI Ingest</span>
          </span>
        </div>
      </div>
    </div>
  );
}
