import { useState, type FormEvent } from "react";
import { User, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import PasswordInput from "@/components/ui/password-input";
import PasswordStrength from "@/components/ui/password-strength";
import SocialLogin from "@/components/ui/social-login";
import { authService } from "@/services/authService";

interface SignUpFormProps {
  onToggleSignIn: () => void;
}

export default function SignUpForm({ onToggleSignIn }: SignUpFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): boolean => {
    setError(null);
    setSuccess(null);

    if (!username.trim()) {
      setError("Please choose a username or enter your full name.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Please enter a password.");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (!agreeToTerms) {
      setError("You must agree to the Terms & Conditions and Privacy Policy.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.signUp({
        username: username.trim(),
        email: email.trim(),
        password,
        agreeToTerms,
      });
      setSuccess(res.message);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-left">
      {/* Header */}
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold tracking-wider uppercase mb-2 border border-indigo-100">
          <User className="w-3.5 h-3.5" />
          <span>New Registration</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Create Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
          Join StormGuard AI and stay ahead of severe weather.
        </p>
      </div>

      {/* Error / Success Feedback */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Username / Full Name */}
        <div className="space-y-1">
          <label htmlFor="signup-username" className="text-xs font-semibold text-slate-700 ml-1">
            Full Name / Username
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <User className="w-4 h-4" />
            </div>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. alex_rivera"
              autoComplete="name"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F6FB] border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 hover:border-slate-300 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="signup-email" className="text-xs font-semibold text-slate-700 ml-1">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F6FB] border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 hover:border-slate-300 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="signup-password" className="text-xs font-semibold text-slate-700 ml-1">
            Password
          </label>
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Create password"
            autoComplete="new-password"
            disabled={isLoading}
            error={!!error && !password}
          />
          {/* Dynamic Password Strength Indicator */}
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="signup-confirm-password" className="text-xs font-semibold text-slate-700 ml-1">
            Confirm Password
          </label>
          <PasswordInput
            id="signup-confirm-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Re-enter password"
            autoComplete="new-password"
            disabled={isLoading}
            error={!!error && password !== confirmPassword}
          />
        </div>

        {/* Terms & Conditions Checkbox */}
        <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-600">
          <input
            type="checkbox"
            id="agree-terms"
            checked={agreeToTerms}
            onChange={(e) => {
              setAgreeToTerms(e.target.checked);
              if (error) setError(null);
            }}
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
          />
          <label htmlFor="agree-terms" className="cursor-pointer select-none leading-relaxed">
            I agree to the{" "}
            <span className="text-blue-600 font-semibold hover:underline">Terms &amp; Conditions</span>{" "}
            and{" "}
            <span className="text-blue-600 font-semibold hover:underline">Privacy Policy</span>.
          </label>
        </div>

        {/* Sign Up Button (Disabled if Terms are not agreed) */}
        <button
          type="submit"
          disabled={isLoading || !agreeToTerms}
          className="w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wide text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.985] shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering Account...</span>
            </>
          ) : (
            <>
              <span>SIGN UP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Social Login */}
      <div className="mt-5">
        <SocialLogin label="or sign up with" />
      </div>

      {/* Footer Switch */}
      <div className="text-center text-xs text-slate-500 pt-4">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={onToggleSignIn}
          className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
