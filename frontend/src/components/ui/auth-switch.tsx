import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogIn, UserPlus } from "lucide-react";

interface AuthSwitchProps {
  currentMode?: "signin" | "signup";
  onSwitch?: (mode: "signin" | "signup") => void;
  className?: string;
}

export default function AuthSwitch({
  currentMode = "signin",
  onSwitch,
  className,
}: AuthSwitchProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(currentMode);

  const handleSelect = (mode: "signin" | "signup") => {
    setActiveTab(mode);
    onSwitch?.(mode);
  };

  return (
    <div
      className={cn(
        "relative flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-inner transition-all duration-300 w-full max-w-xs mx-auto",
        className
      )}
      role="tablist"
      aria-label="Authentication Switch"
    >
      {/* Sliding background pill indicator */}
      <div
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.25)] transition-all duration-300 ease-out pointer-events-none",
          activeTab === "signin" ? "left-1" : "left-[calc(50%+2px)]"
        )}
      />

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "signin"}
        onClick={() => handleSelect("signin")}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer select-none",
          activeTab === "signin"
            ? "text-cyan-300 font-semibold"
            : "text-slate-400 hover:text-slate-200"
        )}
      >
        <LogIn
          className={cn(
            "w-3.5 h-3.5 transition-all duration-200",
            activeTab === "signin" ? "scale-110 text-cyan-400" : "text-slate-400"
          )}
        />
        <span>Sign In</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "signup"}
        onClick={() => handleSelect("signup")}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer select-none",
          activeTab === "signup"
            ? "text-cyan-300 font-semibold"
            : "text-slate-400 hover:text-slate-200"
        )}
      >
        <UserPlus
          className={cn(
            "w-3.5 h-3.5 transition-all duration-200",
            activeTab === "signup" ? "scale-110 text-cyan-400" : "text-slate-400"
          )}
        />
        <span>Sign Up</span>
      </button>
    </div>
  );
}

export { AuthSwitch };
