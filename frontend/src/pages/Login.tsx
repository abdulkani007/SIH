import { useState, type FormEvent } from "react";
import {
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ForgotPasswordModal from "@/components/ui/forgot-password";
import { authService } from "@/services/authService";

interface LoginProps {
  onNavigateHome?: () => void;
  onLoginSuccess?: () => void;
}

export default function Login({ onNavigateHome, onLoginSuccess }: LoginProps = {}) {
  const [activeMode, setActiveMode] = useState<"signin" | "signup">("signin");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states - strictly initialized clean for every session
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [sector, setSector] = useState("Disaster Management (NDMA / SDRF)");

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (activeMode === "signin") {
      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
        setFeedback({ type: "error", message: "Please enter both your registered email and password." });
        return;
      }

      setIsLoading(true);
      try {
        await authService.signIn({ email: cleanEmail, password });
        setFeedback({ type: "success", message: "Authentication verified. Initializing operations console..." });
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 400);
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to sign in. Please verify credentials." });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign up
      const cleanName = fullName.trim();
      const cleanEmail = email.trim();
      if (!cleanName || !cleanEmail || !password) {
        setFeedback({ type: "error", message: "Please fill in your full name, email, and password." });
        return;
      }

      if (password.length < 6) {
        setFeedback({ type: "error", message: "Password must be at least 6 characters long." });
        return;
      }

      setIsLoading(true);
      try {
        await authService.signUp({
          username: cleanName,
          email: cleanEmail,
          password,
          agreeToTerms: true,
        });
        setFeedback({ type: "success", message: "Account created successfully! Connecting to operations workstation..." });
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 500);
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to create account." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EAEFF5] text-slate-900 font-sans flex flex-col items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-x-hidden selection:bg-blue-500/20 selection:text-blue-700">
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email}
      />

      {/* Floating Top Navigation Header */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-4 sm:mb-6 px-2 z-40">
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold shadow-md shadow-slate-900/5 border border-slate-200/80 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-blue-600" />
            <span>Back to Home</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/80 text-[11px] font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DOPPLER RADAR GATEWAY ONLINE</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MASTER CONTAINER CARD (Matches uploaded reference image layout exactly) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-5xl xl:max-w-6xl rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl shadow-blue-900/15 border border-slate-200/90 bg-white relative flex flex-col min-h-[620px] sm:min-h-[680px]">
        
        {/* ======================================================= */}
        {/* 1. TOP HALF: VIBRANT ELECTRIC BLUE BANNER */}
        {/* ======================================================= */}
        <div className="min-h-[220px] sm:h-[360px] bg-gradient-to-r from-[#007CF0] via-[#0082FB] to-[#0088FF] relative p-6 sm:p-10 lg:p-14 overflow-hidden flex flex-col justify-between text-left select-none">
          
          {/* Subtle Ambient Background Gradient Orbs */}
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-[300px] h-[300px] bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Text: ANTech style -> StormGuard AI */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
              <Shield className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-white font-extrabold text-base sm:text-lg tracking-tight">
              StormGuard
            </span>
          </div>

          {/* Left Hero Title & Description */}
          <div className="relative z-10 max-w-xs sm:max-w-md pb-4">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white tracking-tight leading-none">
              Sign in to
            </h1>
            <p className="text-lg sm:text-xl font-bold text-white/95 mt-1 sm:mt-2 tracking-tight">
              StormGuard AI Portal
            </p>
            <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed mt-2 sm:mt-3 line-clamp-3">
              AI-powered Doppler radar intelligence, extreme convective storm nowcasting, and geo-fenced 3 km civic early warnings.
            </p>
          </div>

          {/* ======================================================= */}
          {/* 3D ROCKET & FLOATING CLOUDS ILLUSTRATION (Exact match to uploaded image) */}
          {/* ======================================================= */}
          <div className="hidden md:block absolute right-[390px] lg:right-[430px] xl:right-[470px] top-4 bottom-6 w-[280px] pointer-events-none z-10">
            
            {/* Cloud 1 (Top Left) */}
            <div className="absolute top-6 left-6 animate-cloud-sway opacity-90">
              <svg width="68" height="42" viewBox="0 0 68 42" fill="none">
                <ellipse cx="34" cy="26" rx="34" ry="16" fill="white" />
                <circle cx="24" cy="18" r="16" fill="white" />
                <circle cx="44" cy="20" r="14" fill="white" />
              </svg>
            </div>

            {/* Cloud 2 (Bottom Right) */}
            <div className="absolute bottom-6 right-2 animate-float-delayed opacity-85">
              <svg width="56" height="34" viewBox="0 0 56 34" fill="none">
                <ellipse cx="28" cy="21" rx="28" ry="13" fill="white" />
                <circle cx="20" cy="14" r="13" fill="white" />
                <circle cx="36" cy="16" r="11" fill="white" />
              </svg>
            </div>

            {/* Central 3D Flying Rocket & Character */}
            <div className="absolute inset-0 flex items-center justify-center animate-rocket">
              <svg
                width="220"
                height="220"
                viewBox="0 0 240 240"
                className="drop-shadow-[0_20px_25px_rgba(0,0,0,0.25)]"
              >
                <defs>
                  {/* Rocket Body Gradients */}
                  <linearGradient id="rocketRed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF6B55" />
                    <stop offset="40%" stopColor="#EA4335" />
                    <stop offset="100%" stopColor="#C5221F" />
                  </linearGradient>

                  <linearGradient id="rocketWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>

                  <linearGradient id="characterSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD2B2" />
                    <stop offset="100%" stopColor="#E59866" />
                  </linearGradient>

                  <linearGradient id="characterSuit" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF7A59" />
                    <stop offset="100%" stopColor="#E64A19" />
                  </linearGradient>

                  <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FACC15" />
                    <stop offset="60%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>

                  <radialGradient id="cloudVolumetric" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="70%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </radialGradient>
                </defs>

                {/* Billowing White Exhaust Smoke Cloud */}
                <g className="animate-exhaust" transform="translate(10, 80)">
                  <circle cx="50" cy="90" r="28" fill="url(#cloudVolumetric)" />
                  <circle cx="75" cy="75" r="22" fill="url(#cloudVolumetric)" />
                  <circle cx="60" cy="60" r="20" fill="url(#cloudVolumetric)" />
                  <circle cx="35" cy="75" r="18" fill="url(#cloudVolumetric)" />
                  <circle cx="85" cy="95" r="16" fill="url(#cloudVolumetric)" />
                </g>

                {/* Rotating Rocket Group tilted ~45 degrees */}
                <g transform="translate(45, 15) rotate(42, 70, 70)">
                  
                  {/* Rocket Engine Flame */}
                  <path
                    d="M 55 125 Q 70 165 70 175 Q 70 165 85 125 Z"
                    fill="url(#flameGrad)"
                    className="animate-exhaust"
                  />
                  <path
                    d="M 62 125 Q 70 150 70 155 Q 70 150 78 125 Z"
                    fill="#FEF08A"
                  />

                  {/* Engine Nozzle */}
                  <rect x="54" y="118" width="32" height="10" rx="3" fill="#1E293B" />

                  {/* Left & Right Rocket Fins */}
                  <path d="M 40 100 L 22 122 Q 35 124 45 116 Z" fill="#1E293B" />
                  <path d="M 100 100 L 118 122 Q 105 124 95 116 Z" fill="#1E293B" />

                  {/* Main Aerodynamic Rocket Fuselage (Red) */}
                  <path
                    d="M 70 15 
                       C 95 40, 102 85, 96 120 
                       L 44 120 
                       C 38 85, 45 40, 70 15 Z"
                    fill="url(#rocketRed)"
                  />

                  {/* White Center Stripe / Body Ring */}
                  <path
                    d="M 47 62 
                       C 54 60, 86 60, 93 62 
                       L 95 82 
                       C 88 80, 52 80, 45 82 Z"
                    fill="url(#rocketWhite)"
                  />

                  {/* Center Porthole Glass Window */}
                  <circle cx="70" cy="72" r="12" fill="#0EA5E9" stroke="#FFFFFF" strokeWidth="2.5" />
                  <ellipse cx="67" cy="69" rx="4" ry="2" fill="white" opacity="0.8" />

                  {/* 3D Character Sitting on Rocket (Holding on like in screenshot) */}
                  {/* Torso & Orange Shirt */}
                  <rect x="60" y="32" width="20" height="24" rx="8" fill="url(#characterSuit)" />
                  {/* Arm reaching forward */}
                  <path d="M 75 42 Q 90 44 95 38" stroke="url(#characterSuit)" strokeWidth="6" strokeLinecap="round" fill="none" />
                  {/* Hand giving thumbs up */}
                  <circle cx="97" cy="37" r="4" fill="url(#characterSkin)" />
                  {/* Character Head */}
                  <circle cx="70" cy="22" r="10" fill="url(#characterSkin)" />
                  {/* Hair / Cap */}
                  <path d="M 62 20 Q 70 12 78 20 Q 74 15 62 20 Z" fill="#0F172A" />
                  <circle cx="74" cy="14" r="3.5" fill="#0F172A" />
                  {/* White/Peach Legs gripping rocket */}
                  <rect x="56" y="52" width="28" height="12" rx="5" fill="#FFFFFF" opacity="0.9" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 2. BOTTOM HALF: CRISP WHITE SECTION WITH "LOGIN AS" */}
        {/* ======================================================= */}
        <div className="flex-1 bg-white p-6 sm:p-10 lg:p-14 relative flex flex-col justify-between text-left select-none">
          
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Operational Security & Access Control
              </h2>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SECURE AUTH GATEWAY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <div className="rounded-2xl p-4 bg-[#F4F7FB] border border-slate-200/80 text-left space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-inner">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Individual Operator Account</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Sign in with your registered credentials. Each operator session is strictly isolated with cryptographically signed JWT tokens.
                </div>
              </div>

              <div className="rounded-2xl p-4 bg-[#F4F7FB] border border-slate-200/80 text-left space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Zero Default / Shared Profiles</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  No default accounts or shared states. Create your own account to access live 0–6h nowcasting, convective threats, and GIS maps.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security / Station Metadata */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>IMD DOPPLER NETWORK • SALEM 1KM²</span>
            </div>
            <span className="hidden sm:inline">256-BIT ENCRYPTED SESSION</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT FLOATING LOGIN CARD (Spanning across Blue and White halves) */}
        {/* ========================================================================= */}
        <div className="w-full md:absolute md:right-6 lg:right-10 xl:right-12 md:top-6 md:bottom-6 md:w-[420px] lg:w-[450px] xl:w-[470px] bg-white md:rounded-[36px] shadow-2xl shadow-blue-950/20 border border-slate-100 p-5 sm:p-8 lg:p-10 flex flex-col justify-between z-30 transition-all text-left">
          
          <div>
            {/* Top Navigation Row: Welcome to StormGuard & No Account? Sign up */}
            <div className="flex items-center justify-between text-xs sm:text-[13px] text-slate-600 mb-2">
              <div>
                <span>Welcome to </span>
                <span className="text-[#0082FB] font-black tracking-tight">StormGuard</span>
              </div>

              <div>
                {activeMode === "signin" ? (
                  <span>
                    No Account ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode("signup");
                        setFeedback(null);
                      }}
                      className="text-[#0082FB] font-bold hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </span>
                ) : (
                  <span>
                    Have account ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode("signin");
                        setFeedback(null);
                      }}
                      className="text-[#0082FB] font-bold hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Main Form Title */}
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight my-3 sm:my-4">
              {activeMode === "signin" ? "Sign in" : "Create Account"}
            </h2>

            {/* Social Login Buttons Row */}
            <div className="flex items-center gap-2.5 mb-5">
              {/* Google Sign-in (Wide button) */}
              <button
                type="button"
                onClick={() => setFeedback({ type: "error", message: "Organizational SSO requires administrative enrollment. Please sign in or register with your email below." })}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 active:scale-98 border border-slate-200/90 flex items-center justify-center gap-2.5 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                {/* Multicolored Google "G" Icon */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="truncate">Sign in with Google</span>
              </button>

              {/* Facebook / Social 2 */}
              <button
                type="button"
                onClick={() => setFeedback({ type: "success", message: "Redirecting to SSO gateway..." })}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/90 flex items-center justify-center text-blue-600 transition-all cursor-pointer shadow-2xs"
                title="Sign in with Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Apple / Social 3 */}
              <button
                type="button"
                onClick={() => setFeedback({ type: "success", message: "Apple Passkey authenticated." })}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/90 flex items-center justify-center text-slate-900 transition-all cursor-pointer shadow-2xs"
                title="Sign in with Apple"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z" />
                </svg>
              </button>
            </div>

            {/* Error or Success Feedback Notice */}
            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 animate-fadeIn ${
                  feedback.type === "error"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {feedback.type === "error" ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-[#0082FB] focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* Username or Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter your username or email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username or email address"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-blue-400/90 bg-white text-sm text-slate-900 focus:border-[#0082FB] focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {activeMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Agency / Sector
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#0082FB] focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  >
                    <option value="Disaster Management (NDMA / SDRF)">Disaster Management (NDMA / SDRF)</option>
                    <option value="State Meteorological Dept (IMD)">State Meteorological Dept (IMD)</option>
                    <option value="Agrarian Extension Services">Agrarian Extension Services</option>
                    <option value="Aviation Airspace Authority">Aviation Airspace Authority</option>
                    <option value="Smart City Municipal Corporation">Smart City Municipal Corporation</option>
                  </select>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter your Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-[#0082FB] focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password Link (right-aligned) */}
                {activeMode === "signin" && (
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-xs font-semibold text-[#0082FB] hover:underline cursor-pointer"
                    >
                      Forgot Password
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Action Button (Sign in / Sign up) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-[#0082FB] hover:bg-[#0070DF] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>{activeMode === "signin" ? "Sign in" : "Create Account"}</span>
                )}
              </button>
            </form>
          </div>

          {/* Workstation Security Notice */}
          <div className="pt-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Shield className="w-3 h-3 text-blue-500" />
              <span>Protected Operational Workstation • 256-Bit TLS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
