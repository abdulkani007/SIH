import { useState, useEffect } from "react";
import {
  Shield,
  CloudLightning,
  Play,
  ArrowRight,
  BrainCircuit,
  Bell,
  ShieldAlert,
  CloudRain,
  CloudHail,
  Radio,
  Satellite,
  Menu,
  X,
  Zap,
  Database,
  Truck,
  Plane,
  Building2,
  Wheat,
  Activity,
  Sparkles,
  Clock,
} from "lucide-react";
import RadarMapPreview from "@/components/landing/RadarMapPreview";
import DopplerRadarScanner from "@/components/landing/DopplerRadarScanner";
import HeroRadarAnimation from "@/components/landing/HeroRadarAnimation";
import StrokeText from "@/components/reactbits/StrokeText";
import FoldText from "@/components/reactbits/FoldText";
import SplitText from "@/components/reactbits/SplitText";
import Shuffle from "@/components/reactbits/Shuffle";

interface LandingProps {
  onNavigateLogin: () => void;
  onNavigateDashboard?: () => void;
}

export default function Landing({ onNavigateLogin, onNavigateDashboard }: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workstationMode, setWorkstationMode] = useState<"gis" | "scope">("gis");
  const [activeTimelineStep, setActiveTimelineStep] = useState(1); // default +1 HR
  const [activeSectorIndex, setActiveSectorIndex] = useState(0);
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());

  // Keep live time updated continuously
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const getStepTime = (hourOffset: number) => {
    const target = new Date(liveNow.getTime() + hourOffset * 3600000);
    return target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";
  };

  // Interactive 0-6h nowcast demo steps
  const nowcastStepsData = [
    {
      hour: "NOW",
      time: getStepTime(0),
      location: "Salem Western Slopes",
      dbz: 56,
      thunderstormProb: 72,
      hailProb: 44,
      rainRate: "22 mm/h",
      severity: "High",
      severityColor: "text-orange-600 bg-orange-50 border-orange-200",
      summary: "Rapid convective uplift initiated. Storm Cell #07 propagating towards the urban perimeter.",
    },
    {
      hour: "+1 HR",
      time: getStepTime(1),
      location: "Central Salem & Omalur",
      dbz: 68,
      thunderstormProb: 89,
      hailProb: 64,
      rainRate: "48 mm/h",
      severity: "Severe",
      severityColor: "text-rose-600 bg-rose-50 border-rose-200",
      summary: "PEAK INTENSITY: 25mm hail cores detected aloft. Extreme rainfall and localized waterlogging expected.",
    },
    {
      hour: "+2 HR",
      time: getStepTime(2),
      location: "Dharmapuri District Border",
      dbz: 62,
      thunderstormProb: 84,
      hailProb: 52,
      rainRate: "36 mm/h",
      severity: "Severe",
      severityColor: "text-rose-600 bg-rose-50 border-rose-200",
      summary: "Severe convective core propagates northeast along NH-44 highway transport corridor.",
    },
    {
      hour: "+3 HR",
      time: getStepTime(3),
      location: "Pennagaram & Harur Belt",
      dbz: 52,
      thunderstormProb: 65,
      hailProb: 32,
      rainRate: "20 mm/h",
      severity: "High",
      severityColor: "text-orange-600 bg-orange-50 border-orange-200",
      summary: "Cell transitions into multi-cell cluster. Hail threat diminishes, steady convective rainfall continues.",
    },
    {
      hour: "+4 HR",
      time: getStepTime(4),
      location: "Krishnagiri Foothills",
      dbz: 44,
      thunderstormProb: 48,
      hailProb: 15,
      rainRate: "12 mm/h",
      severity: "Moderate",
      severityColor: "text-amber-600 bg-amber-50 border-amber-200",
      summary: "Weakening convective updrafts. Trailing stratiform precipitation deck spreads over plains.",
    },
    {
      hour: "+5 HR",
      time: getStepTime(5),
      location: "Eastern Ghats Flank",
      dbz: 34,
      thunderstormProb: 28,
      hailProb: 5,
      rainRate: "6 mm/h",
      severity: "Low",
      severityColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      summary: "Isolated light showers. Boundary layer temperatures stabilizing and pressure climbing.",
    },
    {
      hour: "+6 HR",
      time: getStepTime(6),
      location: "Regional Basin Exit",
      dbz: 22,
      thunderstormProb: 12,
      hailProb: 0,
      rainRate: "2 mm/h",
      severity: "Low",
      severityColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      summary: "Convective event fully dissipated. Normal meteorological baseline conditions restored.",
    },
  ];

  const currentStep = nowcastStepsData[activeTimelineStep];

  const sectorPills = [
    { title: "disaster response + SDRF", icon: ShieldAlert, color: "text-rose-600 bg-rose-50 border-rose-200" },
    { title: "agriculture + crop protection", icon: Wheat, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { title: "aviation + airport safety", icon: Plane, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
    { title: "urban transit + highways", icon: Truck, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { title: "power grids + renewables", icon: Zap, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { title: "smart cities + municipal drainage", icon: Building2, color: "text-purple-600 bg-purple-50 border-purple-200" },
  ];

  const sectorDetails = [
    {
      title: "Disaster Management & Emergency Response (NDMA / SDRF)",
      desc: "Pre-position emergency rescue personnel, high-capacity drainage pumps, and execute localized evacuations before torrential rain triggers flash street inundation.",
      metric: "45 min early lead",
      highlight: "Geo-fenced 3 km CAP broadcast protocol",
      icon: ShieldAlert,
    },
    {
      title: "Agrarian Ecosystems & Horticultural Crop Insurance",
      desc: "Safeguard high-value banana plantations, mango orchards, and ripe paddy crops from devastating hail impact with 2 to 4 hour advance notice.",
      metric: "$2.4M saved per cluster",
      highlight: "Direct farmer SMS notifications",
      icon: Wheat,
    },
    {
      title: "Terminal Airspace & Commercial Aviation Safety",
      desc: "Detect low-level microburst wind shear, gust fronts, and convective cloud tops exceeding 14 km to avoid dangerous terminal approaches and go-arounds.",
      metric: "14.2 km echo-top tracking",
      highlight: "Aviation Sigmet boundary generation",
      icon: Plane,
    },
    {
      title: "Highway Freight, Logistics & State Transport",
      desc: "Identify highway hydroplaning corridors, warn ghat-road freight against landslides, and route state express buses around severe thunderstorm swaths.",
      metric: "28 km/h cell advection",
      highlight: "Automated route danger alerts",
      icon: Truck,
    },
    {
      title: "Power Distribution Utilities & Solar Farms",
      desc: "Shield substation transformers from intense cloud-to-ground lightning surges and anticipate sharp drop-offs in solar irradiance during rapid convective cloud buildup.",
      metric: "95 flashes/min detection",
      highlight: "Substation lightning surge warnings",
      icon: Zap,
    },
    {
      title: "Smart Cities & Urban Drainage Infrastructure",
      desc: "Pre-activate stormwater sluice gates and municipal pumping stations 60 minutes prior to cloudburst arrival, preventing catastrophic metro waterlogging.",
      metric: ">45 mm/h downburst alerts",
      highlight: "Automatic sluice gate trigger feeds",
      icon: Building2,
    },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLaunchApp = () => {
    if (onNavigateDashboard) {
      onNavigateDashboard();
    } else {
      onNavigateLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-700 relative overflow-x-hidden">
      {/* Light Blueprint Grid Background (Matches uploaded image 2) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
      />

      {/* Soft Ambient Radial Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-indigo-100/50 via-purple-50/25 to-transparent blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-[700px] right-0 w-[500px] h-[500px] bg-blue-100/35 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-[1500px] left-0 w-[500px] h-[500px] bg-purple-100/30 blur-3xl -z-10" />

      {/* 1. FLOATING CAPSULE NAVIGATION (Exact match to uploaded Crackit image 2) */}
      <div className="sticky top-3 sm:top-6 z-50 px-2 sm:px-6 w-full pointer-events-none">
        <header className="max-w-5xl mx-auto rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-slate-900/5 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between pointer-events-auto transition-all">
          {/* Logo Pill */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 select-none cursor-pointer group"
            onClick={() => scrollToSection("hero")}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs p-1.5 ring-2 ring-indigo-50/80 group-hover:scale-105 transition-transform">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                StormGuard
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                AI
              </span>
            </div>
          </div>

          {/* Desktop Nav Items with Home Active Dot • (Matching Crackit menu exactly) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => scrollToSection("hero")}
              className="flex flex-col items-center font-semibold text-blue-600 transition-colors cursor-pointer"
            >
              <span>Home</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("live-preview")}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Live Radar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("built-for-sectors")}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              AI Assistant
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("benchmarks")}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Action Buttons: Login (Ghost pill) & Register (Gradient pill) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleLaunchApp}
              className="hidden xs:inline-flex px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
            >
              Register
            </button>
            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Pill */}
        {mobileMenuOpen && (
          <div className="md:hidden max-w-sm mx-auto mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl p-4 space-y-2.5 text-left pointer-events-auto animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                scrollToSection("hero");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1.5 font-bold text-blue-600 text-xs"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                scrollToSection("live-preview");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1.5 font-semibold text-slate-700 hover:text-blue-600 text-xs"
            >
              Live Radar
            </button>
            <button
              type="button"
              onClick={() => {
                scrollToSection("how-it-works");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1.5 font-semibold text-slate-700 hover:text-blue-600 text-xs"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => {
                scrollToSection("built-for-sectors");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1.5 font-semibold text-slate-700 hover:text-blue-600 text-xs"
            >
              AI Assistant
            </button>
            <button
              type="button"
              onClick={() => {
                scrollToSection("benchmarks");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1.5 font-semibold text-slate-700 hover:text-blue-600 text-xs"
            >
              About
            </button>
          </div>
        )}
      </div>

      {/* 2. HERO SECTION — CLEAN, BOLD & UNIQUE */}
      <section id="hero" className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 text-center overflow-hidden">
        {/* Ambient 360 Radar Sweep Animation in Hero Background */}
        <HeroRadarAnimation className="top-8 sm:top-12" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Centered Brand Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Next-Generation Convective Meteorological Intelligence</span>
          </div>

          {/* Hero Main Heading: "Your AI Weather Guardian" + Distinctive Animated Brand */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Your AI Weather Guardian.
            </h1>

            {/* UNIQUE & CRISP BRAND WORDMARK WITH ANIMATED STROKE */}
            <div className="relative inline-flex flex-col items-center justify-center py-2">
              <div className="relative flex items-center justify-center select-none">
                {/* Background ambient radial glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/20 blur-3xl rounded-full -z-10 scale-125" />
                
                {/* SVG Stroke animated drawing for "StormGuard" */}
                <div className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[480px] md:max-w-[620px]">
                  <StrokeText
                    text="StormGuard"
                    strokeColor="#4F46E5"
                    fillColor="gradient"
                    gradient={{
                      from: "#0F172A",
                      via: "#1E293B",
                      to: "#3730A3",
                    }}
                    strokeWidth={1.8}
                    drawDuration={1.5}
                    fillDelay={0.15}
                    trigger="mount"
                    fillMode="wipe"
                    fontSize={108}
                    fontWeight={950}
                    letterSpacing={-3}
                  />
                </div>
              </div>

              {/* Unique Sub-Badge */}
              <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/80 text-indigo-700 text-xs font-mono font-black tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span>AI Convective Intelligence • Zero Warning Lag</span>
              </div>
            </div>

            {/* Smooth 3D Folding Text */}
            <div className="pt-2 flex items-center justify-center">
              <FoldText
                text="Always on. Always warning."
                splitBy="char"
                hinge="top"
                trigger="mount"
                duration={0.7}
                stagger={0.035}
                fontSize="clamp(1.4rem, 3.2vw, 2.4rem)"
                fontWeight={800}
                color="#1E293B"
              />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-normal">
            Low latency, zero bloat, built for rapid convective storms.
            StormGuard is the AI-native platform to track Doppler radar cores, predict flash cloudbursts, and dispatch 3 km civic early warnings.
          </p>

          {/* Centered Action Pill Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={handleLaunchApp}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Operations Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("interactive-nowcast")}
              className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-sm border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Explore 0–6H Nowcast</span>
            </button>
          </div>

          {/* 3. CENTRAL SHOWCASE WORKSTATION WITH FLOATING CALLOUT BUBBLES (Matches Mani phone mockup & floating messages) */}
          <div className="relative pt-8 sm:pt-12 max-w-5xl mx-auto">
            
            {/* FLOATING CALLOUT BUBBLE 1 (Left side, drifting smoothly) */}
            <div className="hidden md:flex absolute -left-6 lg:-left-12 top-24 z-30 max-w-[270px] p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-indigo-100/90 shadow-2xl shadow-indigo-500/15 text-left animate-float-left transition-all">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    SG
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 leading-tight">
                      Cell #07 Core Locked
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Doppler DWR • 2 mins ago
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  68 dBZ hail core aloft over southwest perimeter. Moving NE at 28 km/h. Urban arrival ETA: 38 min.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>EXTREME RAIN PROB 89%</span>
                </div>
              </div>
            </div>

            {/* FLOATING CALLOUT BUBBLE 2 (Right side, drifting smoothly) */}
            <div className="hidden md:flex absolute -right-6 lg:-right-12 bottom-20 z-30 max-w-[280px] p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-500/15 text-left animate-float-right transition-all">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 leading-tight">
                      CAP Automated Dispatch
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold font-mono">
                      Priority 1 Civic Broadcast
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Early storm advisories routed to 14,200 citizens inside the active 3 km danger polygon.
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono border-t border-slate-100">
                  <span>Latency: 0.42s</span>
                  <span className="text-emerald-700 font-bold">100% Delivered</span>
                </div>
              </div>
            </div>

            {/* Central Radar Workstation Container */}
            <div
              id="live-preview"
              className="relative rounded-3xl p-3 sm:p-5 bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/10 transition-all scroll-mt-24"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-xs border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-slate-800">
                    Live Convective Radar Operations (dBZ)
                  </span>
                </div>
                
                {/* View Mode Switcher: GIS Map vs 360 Doppler PPI Scope */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setWorkstationMode("gis")}
                      className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        workstationMode === "gis"
                          ? "bg-white text-indigo-700 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 font-medium"
                      }`}
                    >
                      Regional GIS Map
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkstationMode("scope")}
                      className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        workstationMode === "scope"
                          ? "bg-slate-900 text-cyan-300 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
                      <span>360° Doppler Scope</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Workstation Display: GIS Map or 360 Doppler Radar Scope */}
              {workstationMode === "gis" ? (
                <RadarMapPreview className="w-full h-[380px] sm:h-[460px] rounded-2xl" />
              ) : (
                <DopplerRadarScanner className="w-full min-h-[440px] sm:min-h-[480px] rounded-2xl" />
              )}
            </div>

            {/* Ingestion Trust Strip Under Mockup */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 text-xs text-slate-400 font-medium">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Telemetry Ingestion:
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono shadow-2xs">
                IMD Doppler X/S-Band
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono shadow-2xs">
                ISRO INSAT-3DR Satellite
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono shadow-2xs">
                Groq LPU Acceleration
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. LIVE CONVECTIVE TELEMETRY STRIP */}
      <section id="live-preview" className="py-8 bg-white border-y border-slate-200/80 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Live Sensor Observation Feed
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">
                Latest Radar Sweep: {liveNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} IST • Continuous
              </span>
            </div>
          </div>

          {/* Metric Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200 font-mono text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-sans">Observation Node</div>
              <div className="text-sm font-black text-slate-900 mt-1 truncate">SLM-DWR-01</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-sans">Storm Cell Track</div>
              <div className="text-sm font-black text-indigo-600 mt-1">Cell #01 Core</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-sans">Peak Reflectivity</div>
              <div className="text-sm font-black text-rose-600 mt-1">68 dBZ (Severe)</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-sans">Propagation Vector</div>
              <div className="text-sm font-black text-slate-900 mt-1">↗ NE 45° at 28 km/h</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-sans">Max Echo Tops</div>
              <div className="text-sm font-black text-slate-900 mt-1">14.2 km MSL</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-sans">Arrival ETA</div>
              <div className="text-sm font-black text-amber-600 mt-1">42 Minutes</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-sans">Nowcast Confidence</div>
              <div className="text-sm font-black text-emerald-600 mt-1">91.4% Physical</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "BUILT FOR CRITICAL SECTORS" (Inspired by Mani's Built For These Creators in image 3) */}
      <section id="built-for-sectors" className="relative py-24 sm:py-32 bg-[#F8FAFC] border-b border-slate-200 text-center overflow-hidden">
        
        {/* Floating Ambient Meteorological Particles/Icons (like the floating emojis in screenshot 3) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-0">
          <div className="absolute top-12 left-[10%] text-2xl animate-drift">⚡</div>
          <div className="absolute top-24 right-[12%] text-2xl animate-drift" style={{ animationDelay: "1.5s" }}>🛰️</div>
          <div className="absolute bottom-16 left-[15%] text-2xl animate-drift" style={{ animationDelay: "2.5s" }}>🌧️</div>
          <div className="absolute top-1/2 left-[5%] text-2xl animate-drift" style={{ animationDelay: "4s" }}>📡</div>
          <div className="absolute bottom-20 right-[18%] text-2xl animate-drift" style={{ animationDelay: "3s" }}>🚨</div>
          <div className="absolute top-1/3 right-[8%] text-2xl animate-drift" style={{ animationDelay: "5s" }}>🌾</div>
          <div className="absolute bottom-1/3 right-[28%] text-2xl animate-drift" style={{ animationDelay: "2s" }}>✈️</div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* FoldText Section Title */}
          <div className="flex flex-col items-center justify-center">
            <FoldText
              text="Built For Critical Sectors"
              splitBy="word"
              hinge="top"
              trigger="scroll"
              duration={0.65}
              stagger={0.06}
              fontSize="clamp(2.2rem, 5vw, 3.8rem)"
              fontWeight={900}
              color="#0F172A"
            />
            <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-xl">
              From district emergency response to agricultural crop protection, StormGuard AI eliminates blind spots during rapid severe storms.
            </p>
          </div>

          {/* Category Pills (Identical aesthetic to Mani's category tags) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {sectorPills.map((pill, idx) => (
              <button
                key={pill.title}
                type="button"
                onClick={() => setActiveSectorIndex(idx)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                  activeSectorIndex === idx
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                    : "bg-white text-slate-600 hover:text-slate-900 border-slate-200/80 shadow-2xs hover:border-slate-300"
                }`}
              >
                <pill.icon className="w-3.5 h-3.5" />
                <span>{pill.title}</span>
              </button>
            ))}
          </div>

          {/* Active Sector Showcase Card */}
          <div className="max-w-3xl mx-auto mt-8 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-left space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  {(() => {
                    const Icon = sectorDetails[activeSectorIndex].icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {sectorDetails[activeSectorIndex].title}
                  </h3>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {sectorDetails[activeSectorIndex].highlight}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block text-right font-mono">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {sectorDetails[activeSectorIndex].metric}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {sectorDetails[activeSectorIndex].desc}
            </p>
          </div>

        </div>
      </section>

      {/* 6. "HOW STORMGUARD WORKS" (Matches Mani image 4) */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-white border-b border-slate-200 text-left">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Section Header with StrokeText drawing animation */}
          <div className="max-w-3xl space-y-3">
            <div className="w-full max-w-xl">
              <StrokeText
                text="How It Works"
                strokeColor="#4F46E5"
                fillColor="#0F172A"
                strokeWidth={1.4}
                drawDuration={1.4}
                fillDelay={0.2}
                trigger="scroll"
                fillMode="wipe"
                fontSize={64}
                fontWeight={900}
                letterSpacing={-2}
              />
            </div>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Visual flow showing how StormGuard AI bridges Doppler radar ingestion, deep learning nowcasting, and automated civic dispatches.
            </p>
          </div>

          {/* Step Cards with Visual Mockup Panes (Matching Mani's Step 1 / Step 2 layout) */}
          <div className="space-y-8">
            
            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 rounded-3xl bg-[#F8FAFC] border border-slate-200 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold font-mono border border-indigo-200">
                  STEP 01
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Multi-Source Radar &amp; Satellite Ingestion
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ingests Doppler Weather Radar (DWR) reflectivity cubes, INSAT-3DR rapid infrared sweeps, and automated IoT surface rain gauges every 3 minutes.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs font-mono text-slate-500">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                    ✓ IMD 250 km Radar Arc
                  </span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                    ✓ 3-Min Refresh Rate
                  </span>
                </div>
              </div>

              {/* Visual Card Mockup Pane */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800">Observation Pipeline Telemetry</span>
                  <span className="text-emerald-600 font-bold">STREAM LIVE</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Active Station:</span>
                    <span className="font-bold text-slate-800">SLM-DWR-01 (Salem)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doppler Echo Top:</span>
                    <span className="font-bold text-indigo-600">14.2 km MSL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Radial Velocity:</span>
                    <span className="font-bold text-slate-800">28 km/h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 rounded-3xl bg-[#F8FAFC] border border-slate-200 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono border border-blue-200">
                  STEP 02
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ConvLSTM Spatio-Temporal Nowcasting
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Deep learning recurrent convolutional layers predict cell advection, hail core formation, and flash rain intensity up to 6 hours ahead on a 1.0 km² grid.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs font-mono text-slate-500">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                    ✓ 91.4% Convective Precision
                  </span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                    ✓ 45 Min Early Lead
                  </span>
                </div>
              </div>

              {/* Visual Card Mockup Pane */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800">Neural Convective Prediction</span>
                  <span className="text-indigo-600 font-bold">120 Hz INFERENCE</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                    <span className="text-rose-800 font-bold">Thunderstorm Probability</span>
                    <span className="font-black text-rose-600">89% SEVERE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                    <span className="text-amber-800 font-bold">Hail Core Probability</span>
                    <span className="font-black text-amber-600">64% HIGH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 rounded-3xl bg-[#F8FAFC] border border-slate-200 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold font-mono border border-emerald-200">
                  STEP 03
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Groq LPU Sub-Second Tactical Synthesis
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Groq Language Processing Units synthesize complex meteorological tensors into natural language incident briefings in under 400 milliseconds.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs font-mono text-slate-500">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                    ✓ Sub-Second Latency
                  </span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                    ✓ Incident Action Guides
                  </span>
                </div>
              </div>

              {/* Visual Card Mockup Pane */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold text-slate-800">AI Chief Meteorologist Briefing</span>
                </div>
                <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-medium leading-relaxed italic">
                  "Rapid vertical convective uplift detected. Advise immediate pre-activation of drainage pumps in low-lying civic sectors before 11:30 AM arrival."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE 0–6 HOUR NOWCASTING TIMELINE DEMO */}
      <section id="interactive-nowcast" className="py-24 sm:py-32 bg-[#F8FAFC] border-b border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
              INTERACTIVE PREDICTION LAB
            </span>
            <SplitText
              tag="h2"
              text="Interactive 0–6 Hour Convective Timeline"
              className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"
              delay={35}
              duration={0.8}
              ease="power3.out"
              splitType="words, chars"
              textAlign="center"
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.15}
            />
            <p className="text-slate-600 text-sm sm:text-base">
              Step through the predicted evolution of a convective supercell. Observe how spatial coordinates, radar reflectivity, and threat probabilities evolve hour-by-hour.
            </p>
          </div>

          {/* Interactive Timeline Stepper Buttons */}
          <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
            {nowcastStepsData.map((step, idx) => {
              const isActive = activeTimelineStep === idx;
              return (
                <button
                  key={step.hour}
                  type="button"
                  onClick={() => setActiveTimelineStep(idx)}
                  className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl text-center transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-102 font-bold"
                      : "bg-transparent text-slate-600 hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <div className="text-xs sm:text-sm font-black tracking-tight">{step.hour}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                    {step.time}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Detailed Radar Telemetry Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Detail Card */}
            <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    PROJECTION HORIZON: {currentStep.hour} ({currentStep.time})
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentStep.severityColor}`}>
                    {currentStep.severity} Severity
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentStep.location}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {currentStep.summary}
                  </p>
                </div>
              </div>

              {/* Metric Matrix */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 font-mono text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Radar Core</div>
                  <div className="text-base font-black text-indigo-600 mt-1">{currentStep.dbz} dBZ</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Thunderstorm</div>
                  <div className="text-base font-black text-rose-600 mt-1">{currentStep.thunderstormProb}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Rain Rate</div>
                  <div className="text-base font-black text-blue-600 mt-1">{currentStep.rainRate}</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Radar Preview Sync */}
            <div className="lg:col-span-7 p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-slate-800">
                    Projected Convective Swath at T+{activeTimelineStep}h
                  </span>
                </div>
                <span className="font-mono text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  SW TO NE STEERING FLOW
                </span>
              </div>
              <RadarMapPreview className="w-full h-[360px] sm:h-[400px] rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. DATA INTELLIGENCE & ARCHITECTURE FUSION */}
      <section id="data-fusion" className="py-20 bg-slate-900 text-white border-b border-slate-800 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider font-mono">
              MULTI-MODAL DATA FUSION
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Data Intelligence Architecture
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              No single sensor provides complete convective situational awareness. StormGuard AI fuses 6 diverse observation streams into a unified spatio-temporal feature tensor.
            </p>
          </div>

          {/* Fusion Visual Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Input Feeds */}
            <div className="lg:col-span-4 space-y-2.5">
              {[
                { label: "Automatic Weather Stations (AWS)", detail: "Surface temp, humidity, pressure, wind", icon: Activity },
                { label: "Doppler Weather Radar (DWR)", detail: "Reflectivity (dBZ), radial velocity, spectral width", icon: Radio },
                { label: "INSAT-3DR Geostationary Satellite", detail: "Thermal IR, Water Vapor brightness temp", icon: Satellite },
                { label: "Automated Rain Gauges (ARG)", detail: "Calibrated 15-minute tip precipitation rates", icon: CloudRain },
                { label: "Lightning Detection Arrays", detail: "Cloud-to-ground flash density & polarity", icon: Zap },
                { label: "High-Resolution Terrain Elevation", detail: "Orographic slope uplift & barrier channeling", icon: Database },
              ].map((src) => (
                <div
                  key={src.label}
                  className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3 hover:border-indigo-400 transition-colors"
                >
                  <src.icon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{src.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{src.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Central Neural Engine Node */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-slate-800 border-2 border-indigo-500/40 shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <BrainCircuit className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  StormGuard Physics Engine
                </h3>
                <p className="text-xs text-indigo-200 mt-1">
                  ConvLSTM Deep Learning + Atmospheric Thermodynamic Constraints
                </p>
              </div>

              <div className="w-full p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300 space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tensor Fusion Rate:</span>
                  <span className="text-indigo-400 font-bold">120 Hz Continuous</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Acceleration Core:</span>
                  <span className="text-emerald-400 font-bold">Groq LPU (Sub-Second)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="text-amber-400 font-bold">1.0 km² Micro-Grid</span>
                </div>
              </div>
            </div>

            {/* Output Hazard Vectors */}
            <div className="lg:col-span-4 space-y-3">
              <div className="p-4 rounded-xl bg-slate-800/90 border border-blue-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <CloudLightning className="w-4 h-4 text-blue-400" />
                    <span>Thunderstorm Nowcast</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">89% SEVERE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Track vector, lightning density, gust front velocity
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/90 border border-amber-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <CloudHail className="w-4 h-4 text-amber-400" />
                    <span>Hail Hazard Probability</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">64% HIGH</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hailstone diameter sizing &amp; swath boundary polygon
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/90 border border-rose-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-rose-400" />
                    <span>Extreme Rainfall Risk</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">78% SEVERE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Flash cloudburst threshold &amp; urban inundation zone
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. BENCHMARKS: STORMGUARD AI VS TRADITIONAL NWP */}
      <section id="benchmarks" className="py-20 bg-white border-b border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono inline-flex items-center">
              <Shuffle
                text="METEOROLOGICAL PERFORMANCE"
                tag="span"
                duration={0.35}
                shuffleTimes={2}
                stagger={0.02}
                scrambleCharset="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                colorFrom="#6366F1"
                colorTo="#4338CA"
              />
            </span>
            <SplitText
              tag="h2"
              text="Why Nowcasting Outperforms Traditional Models"
              className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"
              delay={30}
              duration={0.85}
              ease="power3.out"
              splitType="words, chars"
              textAlign="center"
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.15}
            />
            <p className="text-slate-600 text-sm sm:text-base">
              Numerical Weather Prediction (NWP) models struggle with the rapid life cycle of sudden convective cells. StormGuard AI fills the critical 0–6 hour operational gap.
            </p>
          </div>

          {/* Benchmark Table */}
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">Capability Metric</th>
                  <th className="py-4 px-6 text-indigo-700 bg-indigo-50/60 font-black">StormGuard AI Nowcasting</th>
                  <th className="py-4 px-6 text-slate-500">Traditional NWP Models</th>
                  <th className="py-4 px-6 text-slate-500">Standard Weather Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Update Cycle</td>
                  <td className="py-4 px-6 text-indigo-700 font-bold bg-indigo-50/30">Every 3–5 Minutes (Continuous)</td>
                  <td className="py-4 px-6 text-slate-600">Every 3 to 6 Hours</td>
                  <td className="py-4 px-6 text-slate-500">Hourly / Static</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Spatial Resolution</td>
                  <td className="py-4 px-6 text-indigo-700 font-bold bg-indigo-50/30">1.0 km² Micro-Grid</td>
                  <td className="py-4 px-6 text-slate-600">12 km – 25 km Broad Grid</td>
                  <td className="py-4 px-6 text-slate-500">District / City-Wide</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Hail Swath Prediction</td>
                  <td className="py-4 px-6 text-indigo-700 font-bold bg-indigo-50/30">Explicit (Size, Path &amp; Swath)</td>
                  <td className="py-4 px-6 text-slate-600">Not Modeled</td>
                  <td className="py-4 px-6 text-slate-500">General Icon Only</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Convective Lead Time</td>
                  <td className="py-4 px-6 text-indigo-700 font-bold bg-indigo-50/30">45–60 Minutes Before Impact</td>
                  <td className="py-4 px-6 text-slate-600">Often misses local initiation</td>
                  <td className="py-4 px-6 text-slate-500">Zero lead time</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Warning Format</td>
                  <td className="py-4 px-6 text-indigo-700 font-bold bg-indigo-50/30">CAP GIS GeoJSON Polygon</td>
                  <td className="py-4 px-6 text-slate-600">District text bulletin</td>
                  <td className="py-4 px-6 text-slate-500">Simple push notification</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 10. FINAL OPERATIONS CALL TO ACTION (Clean & Elegant) */}
      <section className="py-24 bg-gradient-to-b from-white via-indigo-50/20 to-purple-50/30 border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
            <Shield className="w-7 h-7 stroke-[2.2]" />
          </div>
          <SplitText
            tag="h2"
            text="Deploy High-Resolution Meteorological Intelligence"
            className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight"
            delay={30}
            duration={0.9}
            ease="power3.out"
            splitType="words, chars"
            textAlign="center"
            from={{ opacity: 0, y: 35 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.15}
          />
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            Experience the real-time GIS convective monitoring dashboard with browser GPS integration, 3 km local coverage perimeters, and Groq tactical assistance.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunchApp}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Access Operations Control Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 11. ENTERPRISE FOOTER */}
      <footer className="py-14 bg-slate-900 text-white text-left font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Branding */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  SG
                </div>
                <span className="font-black text-base tracking-tight">STORMGUARD AI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI-Based Convective-Scale Meteorological Intelligence &amp; Early Warning System (0–6 Hours).
              </p>
              <div className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                WMO &amp; IMD BENCHMARKED ARCHITECTURE
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">System Navigation</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button type="button" onClick={() => scrollToSection("live-preview")} className="hover:text-white transition-colors cursor-pointer">Live Telemetry</button></li>
                <li><button type="button" onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors cursor-pointer">How It Works</button></li>
                <li><button type="button" onClick={() => scrollToSection("built-for-sectors")} className="hover:text-white transition-colors cursor-pointer">Built For Sectors</button></li>
                <li><button type="button" onClick={() => scrollToSection("interactive-nowcast")} className="hover:text-white transition-colors cursor-pointer">0–6 Hour Timeline</button></li>
                <li><button type="button" onClick={() => scrollToSection("data-fusion")} className="hover:text-white transition-colors cursor-pointer">Data Intelligence</button></li>
                <li><button type="button" onClick={() => scrollToSection("benchmarks")} className="hover:text-white transition-colors cursor-pointer">Model Benchmarks</button></li>
              </ul>
            </div>

            {/* Col 3: Research & Datasets */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Citations &amp; Data Standards</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>India Meteorological Department (IMD) DWR Specifications</li>
                <li>ISRO INSAT-3DR Multispectral Optical Imager</li>
                <li>WMO Common Alerting Protocol (CAP v1.2)</li>
                <li>High-Resolution Rapid Refresh (HRRR) Physics</li>
                <li>Groq LPU Sub-Second Neural Acceleration</li>
              </ul>
            </div>

            {/* Col 4: Operations Access */}
            <div className="space-y-3 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Operations Access</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Authorized meteorological personnel and emergency disaster officers can sign in to view the live multi-hazard dashboard.
              </p>
              <button
                type="button"
                onClick={handleLaunchApp}
                className="w-full py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Sign In to Operations
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div>
              &copy; {new Date().getFullYear()} StormGuard AI. Precision Meteorological Operations Platform.
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Operational Convective Nowcasting &amp; Early Warning System.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
