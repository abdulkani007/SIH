import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export default function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const criteria = useMemo(() => {
    return [
      { id: "length", label: "Minimum 8 characters", met: password.length >= 8 },
      { id: "upper", label: "Uppercase letter", met: /[A-Z]/.test(password) },
      { id: "lower", label: "Lowercase letter", met: /[a-z]/.test(password) },
      { id: "number", label: "Number", met: /[0-9]/.test(password) },
      { id: "special", label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [password]);

  const score = criteria.filter((c) => c.met).length;

  const strength = useMemo(() => {
    if (!password) return { label: "", color: "bg-slate-200", textColor: "text-slate-400", width: "w-0" };
    if (score <= 2) return { label: "Weak", color: "bg-rose-500", textColor: "text-rose-600", width: "w-1/3" };
    if (score <= 4) return { label: "Medium", color: "bg-amber-500", textColor: "text-amber-600", width: "w-2/3" };
    return { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-600", width: "w-full" };
  }, [password, score]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2.5 pt-1 text-left animate-fadeIn", className)}>
      {/* Dynamic Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-slate-500">Password Strength</span>
          <span className={cn("transition-colors duration-200", strength.textColor)}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-400 ease-out",
              strength.color,
              strength.width
            )}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
        {criteria.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-1.5 transition-colors duration-150",
              item.met ? "text-emerald-600 font-medium" : "text-slate-400"
            )}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
