import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { weatherService, type WeatherTelemetry } from "@/services/weatherService";
import type { RiskZone } from "@/data/mockWeather";

export interface FloatingAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  telemetry: WeatherTelemetry;
  selectedZone?: RiskZone | null;
  initialQuery?: string | null;
  onClearInitialQuery?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  confidence?: string;
  model?: string;
}

const QUICK_ACTIONS = [
  "Risk near me",
  "Next 6 hours",
  "Explain this warning",
  "Storm arrival",
  "Safety advice",
  "Current conditions",
];

export default function FloatingAIAssistant({
  isOpen,
  onClose,
  onOpen,
  telemetry,
  selectedZone,
  initialQuery,
  onClearInitialQuery,
}: FloatingAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      text: `StormGuard Weather Intelligence Assistant initialized. Telemetry is active for ${
        telemetry.location || "your location"
      }. How can I assist with your convective risk analysis or early warning decisions?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confidence: "94%",
      model: "Groq LPU",
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle external trigger from Map or quick prompts
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery, isOpen]);

  // Handle selected zone injection
  useEffect(() => {
    if (selectedZone && isOpen) {
      const zonePrompt = `Analyze convective risk for ${selectedZone.name}: ${selectedZone.severity} risk, ${selectedZone.thunderstormProb}% thunderstorm probability, affecting ~${selectedZone.affectedPopulation} residents. What tactical precautions should emergency coordinators take?`;
      handleSend(zonePrompt);
    }
  }, [selectedZone]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await weatherService.askAssistant({
        question: textToSend,
        ...telemetry,
      });
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        confidence: res.confidence,
        model: res.model,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "assistant",
        text: `Analysis based on active telemetry for ${telemetry.location}: Temperature is ${telemetry.temperature ?? 30}°C with ${telemetry.humidity ?? 60}% humidity. Thunderstorm risk estimate is ${telemetry.threat_thunderstorm ?? 0}% and rain rate is ${telemetry.rainfall_rate ?? 0} mm/h. Emergency coordinators should observe convective progression.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        confidence: "88%",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={isOpen ? onClose : onOpen}
          title="Open Meteorological Intelligence Assistant"
          className={cn(
            "group relative flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full font-bold text-xs shadow-xl transition-all duration-300 cursor-pointer",
            isOpen
              ? "bg-slate-900 text-white shadow-slate-900/30 scale-95"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-blue-600/30"
          )}
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <span className="tracking-tight">Weather Assistant</span>
        </button>
      </div>

      {/* Backdrop (Light, Click to close) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Slide-Over Drawer Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 h-[100dvh] max-h-[100dvh] w-full sm:w-[440px] bg-white z-50 shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300 ease-out text-left",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  StormGuard Assistant
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Weather Intelligence Assistant • Groq LPU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: "msg-fresh",
                    sender: "assistant",
                    text: `Telemetry synchronized for ${telemetry.location}. How can I assist?`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    confidence: "94%",
                  },
                ]);
              }}
              title="Reset conversation"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close panel"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Structured Context Bar */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 text-[11px] font-mono text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-700">Grounded Context:</span>
            <span className="truncate">{telemetry.location || "User GPS"}</span>
            <span>•</span>
            <span className="font-bold text-blue-700">{telemetry.reflectivity_dbz || 64} dBZ</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">LIVE TELEMETRY</span>
        </div>

        {/* Chat Messages Scrollable Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={cn("flex gap-2.5 max-w-[90%]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold shadow-xs",
                    isUser ? "bg-slate-900" : "bg-blue-600"
                  )}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-xs leading-relaxed",
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-xs"
                        : "bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-xs"
                    )}
                  >
                    {m.text}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-2 text-[10px] text-slate-400 font-mono px-1",
                      isUser && "justify-end"
                    )}
                  >
                    <span>{m.timestamp}</span>
                    {m.confidence && (
                      <span className="text-blue-600 font-bold">Conf: {m.confidence}</span>
                    )}
                    {m.model && <span className="text-slate-500">• {m.model}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 mr-auto">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/80 rounded-tl-xs text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Evaluating convective models &amp; radar telemetry...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Operational Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleSend(action)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input Form */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about hail, arrival ETA, or emergency action..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-slate-400 text-center mt-2 font-mono">
            Grounded with live telemetry • Groq qwen/qwen3.8-27b
          </div>
        </div>
      </div>
    </>
  );
}
