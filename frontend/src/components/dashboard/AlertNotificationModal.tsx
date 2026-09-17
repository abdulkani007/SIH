import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FastForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertLog, EarlyWarning } from "@/data/mockWeather";
import { alertService } from "@/services/alertService";

interface AlertNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: (Partial<AlertLog | EarlyWarning> & Record<string, any>) | null;
  locationName?: string;
}

export default function AlertNotificationModal({
  isOpen,
  onClose,
  alert,
  locationName,
}: AlertNotificationModalProps) {
  // Recipient email state
  const [toEmail, setToEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // AI Generation & Typing animation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [fullMessage, setFullMessage] = useState("");
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset & trigger AI generation when modal opens with an alert
  useEffect(() => {
    if (!isOpen || !alert) {
      setToEmail("");
      setValidationError(null);
      setFullMessage("");
      setDisplayedMessage("");
      setIsTyping(false);
      setIsSending(false);
      setSendSuccessMessage(null);
      setSendErrorMessage(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setGenerationError(null);
    setDisplayedMessage("");
    setFullMessage("");
    setIsTyping(false);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    // Call Groq API endpoint
    alertService
      .generateAlertExplanation(alert, alert.id)
      .then((res) => {
        if (!isMounted) return;
        const msg = res.explanation || "";
        setFullMessage(msg);
        setIsGenerating(false);
        // Start typing animation
        startTypingAnimation(msg);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("AI generation failed:", err);
        setGenerationError("Failed to generate AI explanation. Please try again.");
        setIsGenerating(false);
      });

    return () => {
      isMounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isOpen, alert]);

  // Character-by-character typing animation
  const startTypingAnimation = (text: string) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(true);
    let currentIdx = 0;
    setDisplayedMessage("");

    const typeNextChar = () => {
      if (currentIdx < text.length) {
        currentIdx += 1;
        setDisplayedMessage(text.slice(0, currentIdx));
        // Natural typing jitter between 10ms and 25ms
        const delay = text[currentIdx - 1] === "\n" ? 40 : 12;
        typingTimeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
      }
    };

    typeNextChar();
  };

  // Instant skip animation
  const handleSkipAnimation = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setDisplayedMessage(fullMessage);
    setIsTyping(false);
  };

  // Handle Email Submission
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    const email = toEmail.trim();

    // 1. Client-side validation matching backend requirements
    if (!email) {
      setValidationError("Please enter a recipient email address.");
      return;
    }

    const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailPattern.test(email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    if (!fullMessage && !displayedMessage) {
      setValidationError("AI explanation is not yet generated. Please wait.");
      return;
    }

    setIsSending(true);
    try {
      const response = await alertService.sendAlertEmail({
        to: email,
        message: fullMessage || displayedMessage,
        alertId: alert?.id,
        subject: `[StormGuard Alert] ${alert?.type || "Severe Weather"} - ${(alert?.severity || "High").toUpperCase()}`,
        alertData: alert || {},
      });

      if (response.success) {
        setSendSuccessMessage(response.message || `Alert email sent successfully to ${email}.`);
      } else {
        setSendErrorMessage(response.detail || "Failed to send alert email. Please try again.");
      }
    } catch (err: any) {
      setSendErrorMessage("Failed to send alert email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !alert) return null;

  // Derive alert details
  const alertType = alert.type || "Severe Weather";
  const severity = alert.severity || "Moderate";
  const loc = alert.location || locationName || "Active Sector";
  const horizon = alert.expectedWindow || alert.expected_window || "0–6 Hours";
  const source = alert.source || "Tomorrow.io Weather Data";
  const triggerVal = alert.triggerValue || alert.trigger_value;
  const isHistorical = Boolean(alert.isHistorical || alert.historicalEventId);
  const dataType = alert.dataType || alert.data_type || (isHistorical ? "Demonstration Alert" : "Live Telemetry");
  const isDemo = dataType.includes("Demonstration") || dataType.includes("Demo");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 text-left"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900">
                  Risk Alert Email Dispatch
                </h2>
                {isDemo ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    DEMO DATA
                  </span>
                ) : isHistorical ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    VERIFIED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    LIVE RISK ALERT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Groq AI natural-language meteorological explanation & SMTP notification
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Section 1: Structured Telemetry Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">{loc}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                  {alertType}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                    severity === "Severe"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : severity === "High"
                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  )}
                >
                  {severity} RISK
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-400">Horizon: </span>
                <strong className="text-slate-800">{horizon}</strong>
              </div>
              <div>
                <span className="text-slate-400">Trigger: </span>
                <strong className="text-slate-800">{triggerVal || "Threshold exceeded"}</strong>
              </div>
              <div className="sm:col-span-2 text-[11px] text-slate-500 truncate">
                <span className="text-slate-400">Attribution: </span>
                <span>{source}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Groq AI Alert Explanation with Typing Animation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Meteorological Advisory (Groq LPU)</span>
              </div>

              {isTyping && (
                <button
                  type="button"
                  onClick={handleSkipAnimation}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FastForward className="w-3 h-3" />
                  <span>Skip animation</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#0B1120] text-slate-200 border border-slate-800 min-h-[120px] relative font-sans text-xs leading-relaxed">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400 space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <p className="text-xs font-mono">
                    Generating AI alert explanation from verified telemetry...
                  </p>
                </div>
              ) : generationError ? (
                <div className="text-rose-400 p-2 text-xs font-medium">
                  {generationError}
                </div>
              ) : (
                <div className="whitespace-pre-line">
                  {displayedMessage}
                  {isTyping && (
                    <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 animate-pulse" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Email Notification Form */}
          <form onSubmit={handleSendEmail} className="space-y-3 pt-2 border-t border-slate-100">
            {/* Feedback Banners */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {sendSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sendSuccessMessage}</span>
              </div>
            )}

            {sendErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{sendErrorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>To:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (Recipient email address — email goes ONLY to this address)
                </span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => {
                    setToEmail(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="recipient@example.com"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Alert Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <span>SMTP Secure Dispatch Relay • Confidential Telemetry</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
