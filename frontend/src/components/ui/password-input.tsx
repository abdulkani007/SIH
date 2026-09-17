import { useState, forwardRef, type InputHTMLAttributes } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative group w-full">
        {/* Left Lock Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
          <Lock className="w-4 h-4" />
        </div>

        {/* Input */}
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#F4F6FB] border text-slate-800 text-sm placeholder:text-slate-400",
            "outline-none transition-all duration-200",
            "hover:border-slate-300",
            "focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-200",
            className
          )}
          {...props}
        />

        {/* Show / Hide Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 transition-transform" />
          ) : (
            <Eye className="w-4 h-4 transition-transform" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
