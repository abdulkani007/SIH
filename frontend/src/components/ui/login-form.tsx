import { useState, type FormEvent } from "react";
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, Radar } from "lucide-react";
import PasswordInput from "@/components/ui/password-input";
import SocialLogin from "@/components/ui/social-login";
import { authService } from "@/services/authService";

interface LoginFormProps {
  onToggleSignUp: () => void;
  onForgotPassword: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginForm({
  onToggleSignUp,
  onForgotPassword,
  onLoginSuccess,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): boolean => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Please enter your password.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
      const res = await authService.signIn({
        email: email.trim(),
        password,
        rememberMe,
      });
      setSuccess(res.message);
      setTimeout(() => {
        onLoginSuccess?.();
      }, 600);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-left">
      {/* Header */}
      <div className="mb-7 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold tracking-wider uppercase mb-2 border border-blue-100">
          <Radar className="w-3.5 h-3.5" />
          <span>Station Login</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
          Sign in to continue your journey with StormGuard AI.
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

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="signin-email" className="text-xs font-semibold text-slate-700 ml-1">
            Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your registered email"
              autoComplete="email"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F6FB] border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 hover:border-slate-300 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between ml-1">
            <label htmlFor="signin-password" className="text-xs font-semibold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <PasswordInput
            id="signin-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
            error={!!error && !password}
          />
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-600">
          <input
            type="checkbox"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
          />
          <label htmlFor="remember-me" className="cursor-pointer select-none">
            Remember me
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wide text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.985] shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Session...</span>
            </>
          ) : (
            <>
              <span>SIGN IN</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Social Login */}
      <div className="mt-6">
        <SocialLogin label="or sign in with" />
      </div>

      {/* Footer Switch */}
      <div className="text-center text-xs text-slate-500 pt-5">
        <span>Don't have an account? </span>
        <button
          type="button"
          onClick={onToggleSignUp}
          className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
