import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, MoreVertical, Play, Pause, RefreshCw, Check, Eye, EyeOff, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NowcastStep } from "@/data/mockWeather";

export interface LiveInformationWaveGraphProps {
  steps?: NowcastStep[];
  selectedIdx?: number;
  onSelectStep?: (step: NowcastStep, index: number) => void;
  className?: string;
}

// 12 baseline reference coordinates faithfully reconstructed from the design image
const BASE_LAYER_1 = [78, 60, 68, 48, 76, 58, 68, 46, 65, 52, 78, 55]; // Mint-Green / Cyan (Precipitation)
const BASE_LAYER_2 = [50, 36, 46, 55, 62, 48, 40, 50, 42, 60, 38, 56]; // Turquoise / Sky Blue (Convective Uplift)
const BASE_LAYER_3 = [28, 36, 32, 54, 42, 22, 44, 30, 58, 20, 46, 60]; // Royal / Cobalt Blue (Severe Hail & Gust)

// Cubic Catmull-Rom to Bézier curve generator for perfectly smooth organic waves
function generateCubicBezierPath(
  points: number[],
  width: number,
  height: number,
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number,
  paddingBottom: number
) {
  const innerW = width - paddingLeft - paddingRight;
  const innerH = height - paddingTop - paddingBottom;
  const n = points.length;

  const coords = points.map((val, idx) => ({
    x: paddingLeft + (idx / (n - 1)) * innerW,
    y: paddingTop + (1 - Math.max(0, Math.min(100, val)) / 100) * innerH,
  }));

  let lineD = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;

  for (let i = 0; i < n - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(n - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    lineD += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const bottomY = paddingTop + innerH;
  const areaD = `${lineD} L ${coords[n - 1].x.toFixed(2)} ${bottomY.toFixed(2)} L ${coords[0].x.toFixed(2)} ${bottomY.toFixed(2)} Z`;

  return { lineD, areaD, coords, bottomY };
}

export default function LiveInformationWaveGraph({
  steps,
  selectedIdx: controlledIdx,
  onSelectStep,
  className,
}: LiveInformationWaveGraphProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);
  const [surgeActive, setSurgeActive] = useState(false);
  const [showAllValues, setShowAllValues] = useState(true);
  const [showDataTable, setShowDataTable] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [visibleLayers, setVisibleLayers] = useState({
    layer1: true, // Mint / Green (Precipitation)
    layer2: true, // Cyan / Sky (Convective Uplift)
    layer3: true, // Royal Blue (Hail & Severe Gust)
  });

  const [animTime, setAnimTime] = useState(0);
  const animationRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smooth fluid animation loop
  useEffect(() => {
    if (!isAnimating) return;

    let startTime = performance.now();
    const animate = (currentTime: number) => {
      const delta = (currentTime - startTime) * 0.0015;
      setAnimTime(delta);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating]);

  // Dimensions
  const chartWidth = 940;
  const chartHeight = 310;
  const paddingLeft = 56;
  const paddingRight = 36;
  const paddingTop = 32;
  const paddingBottom = 44;

  // Compute live animated points based on baseline + subtle harmonic oscillation
  const animatedPoints = useMemo(() => {
    const surgeMultiplier = surgeActive ? 1.15 : 1.0;

    return {
      layer1: BASE_LAYER_1.map((val, idx) => {
        const liveProb = steps && steps[idx] ? steps[idx].extremeRainfallProb : val;
        const targetVal = (val * 0.6 + liveProb * 0.4) * surgeMultiplier;
        const oscillation = isAnimating ? Math.sin(animTime * 1.4 + idx * 0.8) * 3.6 : 0;
        return Math.max(10, Math.min(95, targetVal + oscillation));
      }),
      layer2: BASE_LAYER_2.map((val, idx) => {
        const liveProb = steps && steps[idx] ? steps[idx].thunderstormProb : val;
        const targetVal = (val * 0.6 + liveProb * 0.4) * surgeMultiplier;
        const oscillation = isAnimating ? Math.cos(animTime * 1.6 + idx * 0.9) * 3.0 : 0;
        return Math.max(10, Math.min(95, targetVal + oscillation));
      }),
      layer3: BASE_LAYER_3.map((val, idx) => {
        const liveProb = steps && steps[idx] ? steps[idx].hailProb : val;
        const targetVal = (val * 0.6 + liveProb * 0.4) * surgeMultiplier;
        const oscillation = isAnimating ? Math.sin(animTime * 1.8 + idx * 1.1) * 2.6 : 0;
        return Math.max(8, Math.min(92, targetVal + oscillation));
      }),
    };
  }, [animTime, isAnimating, surgeActive, steps]);

  // Compute SVG Bézier curves
  const curves = useMemo(() => {
    return {
      l1: generateCubicBezierPath(
        animatedPoints.layer1,
        chartWidth,
        chartHeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom
      ),
      l2: generateCubicBezierPath(
        animatedPoints.layer2,
        chartWidth,
        chartHeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom
      ),
      l3: generateCubicBezierPath(
        animatedPoints.layer3,
        chartWidth,
        chartHeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom
      ),
    };
  }, [animatedPoints]);

  // Y-axis ticks (100, 75, 50, 25, 0)
  const yTicks = [100, 75, 50, 25, 0];
  const innerH = chartHeight - paddingTop - paddingBottom;
  const innerW = chartWidth - paddingLeft - paddingRight;

  // X-axis columns (01 to 12)
  const xLabels = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  // Filter highlights from search
  const searchMatchStep = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const idx = xLabels.findIndex((lbl) => lbl === q || String(parseInt(lbl, 10)) === q);
    if (idx !== -1) return idx;
    if (q.includes("rain")) return "rain";
    if (q.includes("storm") || q.includes("light")) return "storm";
    if (q.includes("hail") || q.includes("gust")) return "hail";
    return null;
  }, [searchQuery, xLabels]);

  const handleStepClick = (idx: number) => {
    if (steps && steps[idx] && onSelectStep) {
      onSelectStep(steps[idx], idx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = chartWidth / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    if (mouseX >= paddingLeft - 18 && mouseX <= chartWidth - paddingRight + 18) {
      const relativeX = mouseX - paddingLeft;
      const stepWidth = innerW / (xLabels.length - 1);
      const nearestIdx = Math.max(0, Math.min(xLabels.length - 1, Math.round(relativeX / stepWidth)));
      setHoveredIndex(nearestIdx);
    } else {
      setHoveredIndex(null);
    }
  };

  const activeIdx = hoveredIndex !== null ? hoveredIndex : (controlledIdx !== undefined && controlledIdx < 12 ? controlledIdx : 0);

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-7 relative select-none", className)}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-100">
        {/* Title + Cyan Square + Live Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="w-3.5 h-3.5 rounded-[4px] bg-[#00d2ff] shadow-xs inline-block flex-shrink-0" />
          <h2 className="text-slate-800 font-bold text-base sm:text-lg tracking-tight font-sans">
            Live Information
          </h2>

          {/* Real-time Data Value Pills directly in header */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Precip: <strong className="font-bold">{Math.round(animatedPoints.layer1[activeIdx])}%</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              Uplift: <strong className="font-bold">{Math.round(animatedPoints.layer2[activeIdx])}%</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Hail/Gust: <strong className="font-bold">{Math.round(animatedPoints.layer3[activeIdx])}%</strong>
            </span>
          </div>

          {surgeActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse">
              Surge Active
            </span>
          )}
        </div>

        {/* Right Controls: Values Toggle, Search Pill, Plus Button, 3-Dots Menu */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 self-start sm:self-auto">
          {/* Toggle Values on Graph Button */}
          <button
            onClick={() => setShowAllValues(!showAllValues)}
            title={showAllValues ? "Hide on-graph value labels" : "Show all on-graph value labels"}
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border",
              showAllValues
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
            )}
          >
            {showAllValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Values</span>
          </button>

          {/* Toggle Data Grid Row */}
          <button
            onClick={() => setShowDataTable(!showDataTable)}
            title={showDataTable ? "Hide Data Table Row" : "Show Data Table Row"}
            className={cn(
              "flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border",
              showDataTable
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Data Grid</span>
          </button>

          {/* Search Pill */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f1f5f9] text-slate-700 placeholder-slate-400 text-xs px-3 sm:px-3.5 py-1.5 rounded-full border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/50 w-20 xs:w-28 sm:w-36 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cyan Plus Button */}
          <button
            onClick={() => setSurgeActive(!surgeActive)}
            title={surgeActive ? "Reset Convective Amplitude" : "Trigger Convective Surge Simulation"}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#00d2ff] hover:bg-[#00bee8] active:scale-95 text-white flex items-center justify-center font-bold text-base shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
          </button>

          {/* 3-Dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title="Graph Options"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5 text-slate-700" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                  Values & Display
                </div>
                <button
                  onClick={() => setShowAllValues(!showAllValues)}
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-cyan-600" />
                    Show All Curve Values
                  </span>
                  {showAllValues && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => setShowDataTable(!showDataTable)}
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                    Hourly Data Table Grid
                  </span>
                  {showDataTable && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <div className="h-px bg-slate-100 my-1" />
                <div className="px-3 py-1.5 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                  Convective Animation
                </div>
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {isAnimating ? <Pause className="w-3.5 h-3.5 text-cyan-600" /> : <Play className="w-3.5 h-3.5 text-cyan-600" />}
                    {isAnimating ? "Pause Wave Motion" : "Resume Wave Motion"}
                  </span>
                  {isAnimating && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />}
                </button>

                <div className="h-px bg-slate-100 my-1" />
                <div className="px-3 py-1.5 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                  Hazard Layers
                </div>
                <button
                  onClick={() => setVisibleLayers((prev) => ({ ...prev, layer1: !prev.layer1 }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    Precipitation Wave
                  </span>
                  {visibleLayers.layer1 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => setVisibleLayers((prev) => ({ ...prev, layer2: !prev.layer2 }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    Convective Uplift
                  </span>
                  {visibleLayers.layer2 && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                </button>
                <button
                  onClick={() => setVisibleLayers((prev) => ({ ...prev, layer3: !prev.layer3 }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Hail / Severe Gust
                  </span>
                  {visibleLayers.layer3 && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => {
                    setSurgeActive(false);
                    setSearchQuery("");
                    setShowAllValues(true);
                    setShowDataTable(true);
                    setVisibleLayers({ layer1: true, layer2: true, layer3: true });
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main SVG Area Chart */}
      <div className="relative w-full overflow-x-auto overflow-y-hidden pt-4 no-scrollbar">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[560px] sm:min-w-[700px] lg:min-w-full min-h-[220px] max-h-[360px] cursor-crosshair overflow-visible"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Layer 1: Mint-Green / Cyan Gradient */}
            <linearGradient id="waveGreenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.78" />
              <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.40" />
            </linearGradient>

            {/* Layer 2: Turquoise / Sky-Blue Gradient */}
            <linearGradient id="waveCyanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.45" />
            </linearGradient>

            {/* Layer 3: Royal / Cobalt Blue Gradient */}
            <linearGradient id="waveBlueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.88" />
              <stop offset="60%" stopColor="#2563eb" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {/* 1. Vertical Gridlines at 01..12 */}
          {xLabels.map((_, idx) => {
            const x = paddingLeft + (idx / (xLabels.length - 1)) * innerW;
            const isMatch = searchMatchStep === idx;
            const isActive = activeIdx === idx;

            return (
              <g key={`grid-line-${idx}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={curves.l1.bottomY}
                  stroke={isActive ? "#00d2ff" : isMatch ? "#38bdf8" : "#e2e8f0"}
                  strokeWidth={isActive ? 1.8 : isMatch ? 1.8 : 1}
                  strokeDasharray={isActive ? "4 4" : undefined}
                  className="transition-colors duration-150"
                />
              </g>
            );
          })}

          {/* 2. Horizontal Zero Baseline */}
          <line
            x1={paddingLeft}
            y1={curves.l1.bottomY}
            x2={chartWidth - paddingRight}
            y2={curves.l1.bottomY}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* 3. Layer 1 (Mint / Green to Cyan) */}
          {visibleLayers.layer1 && (
            <path
              d={curves.l1.areaD}
              fill="url(#waveGreenGradient)"
              className={cn(
                "transition-opacity duration-300",
                searchMatchStep === "rain" ? "opacity-100" : "opacity-90"
              )}
            />
          )}

          {/* 4. Layer 2 (Turquoise to Sky Blue) */}
          {visibleLayers.layer2 && (
            <path
              d={curves.l2.areaD}
              fill="url(#waveCyanGradient)"
              className={cn(
                "transition-opacity duration-300",
                searchMatchStep === "storm" ? "opacity-100" : "opacity-85"
              )}
            />
          )}

          {/* 5. Layer 3 (Royal Blue) */}
          {visibleLayers.layer3 && (
            <path
              d={curves.l3.areaD}
              fill="url(#waveBlueGradient)"
              className={cn(
                "transition-opacity duration-300",
                searchMatchStep === "hail" ? "opacity-100" : "opacity-95"
              )}
            />
          )}

          {/* 6. On-Curve Data Value Markers & Labels across all 12 points */}
          {showAllValues && xLabels.map((_, idx) => {
            const x = paddingLeft + (idx / (xLabels.length - 1)) * innerW;
            const isActive = activeIdx === idx;
            const pVal = Math.round(animatedPoints.layer1[idx]);
            const uVal = Math.round(animatedPoints.layer2[idx]);
            const hVal = Math.round(animatedPoints.layer3[idx]);

            // Subtle node dots
            return (
              <g key={`curve-nodes-${idx}`}>
                {/* Layer 3 node (Blue) */}
                {visibleLayers.layer3 && (
                  <circle
                    cx={x}
                    cy={curves.l3.coords[idx].y}
                    r={isActive ? 4.5 : 3}
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                )}

                {/* Layer 1 node (Green) */}
                {visibleLayers.layer1 && (
                  <circle
                    cx={x}
                    cy={curves.l1.coords[idx].y}
                    r={isActive ? 4 : 2.5}
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                )}

                {/* Direct on-graph numerical label for each milestone */}
                {!isActive && (
                  <g>
                    {/* Layer 3 Front Value Tag */}
                    {visibleLayers.layer3 && (
                      <text
                        x={x}
                        y={curves.l3.coords[idx].y - 8}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-blue-900 select-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
                      >
                        {hVal}%
                      </text>
                    )}
                    {/* Layer 2 Mid Value Tag */}
                    {visibleLayers.layer2 && (idx === 3 || idx === 8) && (
                      <text
                        x={x}
                        y={curves.l2.coords[idx].y - 8}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-cyan-800 select-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
                      >
                        {uVal}%
                      </text>
                    )}
                    {/* Layer 1 Top Value Tag on major peaks */}
                    {visibleLayers.layer1 && (idx === 0 || idx === 4 || idx === 6 || idx === 10) && (
                      <text
                        x={x}
                        y={curves.l1.coords[idx].y - 8}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-emerald-800 select-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
                      >
                        {pVal}%
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* 7. Active / Hover Step Indicator with Floating Data Value Badges */}
          {xLabels.map((_, idx) => {
            const x = paddingLeft + (idx / (xLabels.length - 1)) * innerW;
            const isActive = activeIdx === idx;
            const pVal = Math.round(animatedPoints.layer1[idx]);
            const uVal = Math.round(animatedPoints.layer2[idx]);
            const hVal = Math.round(animatedPoints.layer3[idx]);
            const badgeOnLeft = idx >= 10;

            return (
              <g
                key={`hit-${idx}`}
                onClick={() => handleStepClick(idx)}
                className="cursor-pointer"
              >
                {/* Invisible hit column */}
                <rect
                  x={x - innerW / (xLabels.length - 1) / 2}
                  y={paddingTop}
                  width={innerW / (xLabels.length - 1)}
                  height={innerH}
                  fill="transparent"
                />

                {isActive && (
                  <>
                    {/* Glowing highlight point on front wave (Royal Blue) */}
                    <circle
                      cx={x}
                      cy={curves.l3.coords[idx].y}
                      r="6"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      className="animate-pulse"
                    />

                    {/* Data Callout Badge for Layer 3 (Blue) */}
                    <g transform={`translate(${badgeOnLeft ? x - 54 : x + 8}, ${curves.l3.coords[idx].y - 12})`}>
                      <rect
                        width="46"
                        height="20"
                        rx="5"
                        fill="#1d4ed8"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="filter drop-shadow-md"
                      />
                      <text
                        x="23"
                        y="14"
                        textAnchor="middle"
                        className="text-[11px] font-mono font-bold fill-white select-none"
                      >
                        {hVal}%
                      </text>
                    </g>

                    {/* Glowing highlight point on middle wave (Cyan) */}
                    <circle
                      cx={x}
                      cy={curves.l2.coords[idx].y}
                      r="4.5"
                      fill="#ffffff"
                      stroke="#0ea5e9"
                      strokeWidth="2.5"
                    />

                    {/* Data Callout Badge for Layer 2 (Cyan) */}
                    <g transform={`translate(${badgeOnLeft ? x - 54 : x + 8}, ${curves.l2.coords[idx].y - 12})`}>
                      <rect
                        width="46"
                        height="20"
                        rx="5"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="filter drop-shadow-md"
                      />
                      <text
                        x="23"
                        y="14"
                        textAnchor="middle"
                        className="text-[11px] font-mono font-bold fill-white select-none"
                      >
                        {uVal}%
                      </text>
                    </g>

                    {/* Glowing highlight point on top wave (Mint Green) */}
                    <circle
                      cx={x}
                      cy={curves.l1.coords[idx].y}
                      r="5"
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth="3"
                    />

                    {/* Data Callout Badge for Layer 1 (Green) */}
                    <g transform={`translate(${badgeOnLeft ? x - 54 : x + 8}, ${curves.l1.coords[idx].y - 12})`}>
                      <rect
                        width="46"
                        height="20"
                        rx="5"
                        fill="#059669"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="filter drop-shadow-md"
                      />
                      <text
                        x="23"
                        y="14"
                        textAnchor="middle"
                        className="text-[11px] font-mono font-bold fill-white select-none"
                      >
                        {pVal}%
                      </text>
                    </g>
                  </>
                )}
              </g>
            );
          })}

          {/* 8. Y-Axis Numbers (100, 75, 50, 25, 0) */}
          {yTicks.map((tick) => {
            const y = paddingTop + (1 - tick / 100) * innerH;
            return (
              <text
                key={`ytick-${tick}`}
                x={paddingLeft - 16}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] font-sans font-medium fill-slate-400 select-none"
              >
                {tick}
              </text>
            );
          })}

          {/* 9. X-Axis Numbers (01 to 12) */}
          {xLabels.map((label, idx) => {
            const x = paddingLeft + (idx / (xLabels.length - 1)) * innerW;
            const isActive = activeIdx === idx;
            const isMatch = searchMatchStep === idx;

            return (
              <text
                key={`xtick-${label}`}
                x={x}
                y={curves.l1.bottomY + 24}
                textAnchor="middle"
                onClick={() => handleStepClick(idx)}
                className={cn(
                  "text-xs sm:text-[13px] font-bold select-none cursor-pointer transition-colors duration-150",
                  isActive
                    ? "fill-[#00d2ff] font-extrabold"
                    : isMatch
                    ? "fill-blue-600 font-extrabold"
                    : "fill-slate-800 hover:fill-cyan-600"
                )}
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Ambient Diffused Blue Shadow underneath the baseline */}
        <div
          className="h-5 -mt-6 mx-14 pointer-events-none rounded-full blur-md opacity-40 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-500"
          aria-hidden="true"
        />
      </div>

      {/* Synchronized Hourly Data Grid Strip (All 12 Data Points) */}
      {showDataTable && (
        <div className="mt-5 pt-3 border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="text-left py-1 pr-2 w-28 font-medium">Metric / Step</th>
                {xLabels.map((lbl, idx) => (
                  <th
                    key={`th-${lbl}`}
                    onClick={() => handleStepClick(idx)}
                    className={cn(
                      "py-1 px-1 cursor-pointer transition-colors font-mono",
                      activeIdx === idx ? "text-[#00d2ff] font-bold" : "hover:text-slate-700"
                    )}
                  >
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs font-mono">
              {/* Row 1: Precip % */}
              {visibleLayers.layer1 && (
                <tr className="hover:bg-emerald-50/40 transition-colors">
                  <td className="text-left py-1.5 pr-2 font-sans text-emerald-700 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Precipitation
                  </td>
                  {xLabels.map((_, idx) => (
                    <td
                      key={`td-p-${idx}`}
                      onClick={() => handleStepClick(idx)}
                      className={cn(
                        "py-1.5 px-1 cursor-pointer transition-colors",
                        activeIdx === idx
                          ? "bg-emerald-100/70 text-emerald-900 font-bold rounded"
                          : "text-slate-600 hover:text-emerald-700"
                      )}
                    >
                      {Math.round(animatedPoints.layer1[idx])}%
                    </td>
                  ))}
                </tr>
              )}

              {/* Row 2: Convective Uplift % */}
              {visibleLayers.layer2 && (
                <tr className="hover:bg-cyan-50/40 transition-colors">
                  <td className="text-left py-1.5 pr-2 font-sans text-cyan-700 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Convective Uplift
                  </td>
                  {xLabels.map((_, idx) => (
                    <td
                      key={`td-u-${idx}`}
                      onClick={() => handleStepClick(idx)}
                      className={cn(
                        "py-1.5 px-1 cursor-pointer transition-colors",
                        activeIdx === idx
                          ? "bg-cyan-100/70 text-cyan-900 font-bold rounded"
                          : "text-slate-600 hover:text-cyan-700"
                      )}
                    >
                      {Math.round(animatedPoints.layer2[idx])}%
                    </td>
                  ))}
                </tr>
              )}

              {/* Row 3: Hail & Severe Gust % */}
              {visibleLayers.layer3 && (
                <tr className="hover:bg-blue-50/40 transition-colors">
                  <td className="text-left py-1.5 pr-2 font-sans text-blue-700 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Hail / Gust
                  </td>
                  {xLabels.map((_, idx) => (
                    <td
                      key={`td-h-${idx}`}
                      onClick={() => handleStepClick(idx)}
                      className={cn(
                        "py-1.5 px-1 cursor-pointer transition-colors",
                        activeIdx === idx
                          ? "bg-blue-100/70 text-blue-900 font-bold rounded"
                          : "text-slate-600 hover:text-blue-700"
                      )}
                    >
                      {Math.round(animatedPoints.layer3[idx])}%
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive Tooltip Card for Active Step */}
      <div className="mt-4 p-3 bg-slate-50/90 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-ping" />
          <span className="font-bold text-slate-900">
            Horizon {xLabels[activeIdx]} {activeIdx < (steps?.length || 7) ? `• ${steps?.[activeIdx]?.timeLabel || `+${activeIdx}H`}` : `• +${activeIdx}H Outlook`}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            {steps && steps[activeIdx] ? steps[activeIdx].summary : "Atmospheric convective wave telemetry active"}
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-500">Precip:</span>
            <span className="font-bold text-emerald-700">
              {Math.round(animatedPoints.layer1[activeIdx])}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-500">Uplift:</span>
            <span className="font-bold text-cyan-700">
              {Math.round(animatedPoints.layer2[activeIdx])}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-slate-500">Hail/Gust:</span>
            <span className="font-bold text-blue-700">
              {Math.round(animatedPoints.layer3[activeIdx])}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
