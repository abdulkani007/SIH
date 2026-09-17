import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Layers,
  Cloud,
  Crosshair,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarMapPreviewProps {
  className?: string;
}

export default function RadarMapPreview({ className }: RadarMapPreviewProps) {
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<"reflectivity" | "velocity">("reflectivity");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Time labels for the 0-6h nowcast range
  const timeLabels = ["Now", "+1 hr", "+2 hr", "+3 hr", "+4 hr", "+5 hr", "+6 hr"];

  const [liveBaseTime, setLiveBaseTime] = useState<Date>(() => new Date());

  // Keep the clock actively updating in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveBaseTime(new Date());
    }, 15000); // refresh every 15 seconds
    return () => clearInterval(timer);
  }, []);

  // Compute forecast timestamp based on the current live time + selected nowcast hour
  const forecastTime = new Date(liveBaseTime.getTime() + selectedHour * 60 * 60 * 1000);
  const formattedDate = forecastTime.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = forecastTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Auto-play interval for nowcasting loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHour((prev) => (prev >= 6 ? 0 : prev + 1));
      }, 1600);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Storm cell simulation translation based on forecast hour (0 to 6)
  // Steering flow from SW to NE towards coastal Tamil Nadu
  const stormOffsetX = selectedHour * 14;
  const stormOffsetY = -selectedHour * 8;
  const stormIntensity = Math.max(0.7, 1 - selectedHour * 0.05);

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xl",
        className
      )}
    >
      {/* Map Graphic Canvas */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-[#eef4f8] overflow-hidden select-none">
        <svg
          viewBox="0 0 800 560"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Water gradient */}
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.85" />
            </linearGradient>

            {/* Land pattern / hill texture */}
            <pattern id="topoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(148, 163, 184, 0.15)"
                strokeWidth="0.75"
              />
            </pattern>

            {/* Radar reflectivity filter blur */}
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Radial radar gradients for storm cells */}
            <radialGradient id="severeStormCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#581c87" stopOpacity="0.95" /> {/* Purple extreme core */}
              <stop offset="30%" stopColor="#b91c1c" stopOpacity="0.9" /> {/* Crimson red */}
              <stop offset="55%" stopColor="#f97316" stopOpacity="0.85" /> {/* Orange */}
              <stop offset="78%" stopColor="#facc15" stopOpacity="0.8" /> {/* Yellow */}
              <stop offset="95%" stopColor="#22c55e" stopOpacity="0.7" /> {/* Green fringe */}
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="moderateStorm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#facc15" stopOpacity="0.85" />
              <stop offset="80%" stopColor="#22c55e" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>

            {/* Radar sweep beam gradient */}
            <linearGradient id="sweepConeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(2, 132, 199, 0)" />
              <stop offset="50%" stopColor="rgba(56, 189, 248, 0.15)" />
              <stop offset="100%" stopColor="rgba(2, 132, 199, 0.45)" />
            </linearGradient>
          </defs>

          {/* Ocean Background (Bay of Bengal & Indian Ocean) */}
          <rect width="800" height="560" fill="url(#oceanGrad)" />

          {/* Ocean Waves subtle lines */}
          <path
            d="M 680 80 Q 720 90 760 80 T 800 85 M 650 180 Q 700 190 750 180 M 670 280 Q 710 290 780 270 M 640 400 Q 700 420 780 390"
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />

          {/* South India Landmass Path */}
          <path
            d="M 0 0 
               L 420 0 
               Q 480 30 520 60 
               Q 560 90 600 120 
               Q 630 140 640 180 
               Q 650 220 620 280 
               Q 600 320 580 360 
               Q 560 410 540 460 
               Q 510 520 480 560 
               L 0 560 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Topographic grid on land */}
          <path
            d="M 0 0 
               L 420 0 
               Q 480 30 520 60 
               Q 560 90 600 120 
               Q 630 140 640 180 
               Q 650 220 620 280 
               Q 600 320 580 360 
               Q 560 410 540 460 
               Q 510 520 480 560 
               L 0 560 Z"
            fill="url(#topoGrid)"
          />

          {/* State / Region Boundary lines */}
          <path
            d="M 220 0 Q 250 100 230 180 T 260 300 M 340 0 Q 380 90 440 130 T 480 220"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Highways / Rivers */}
          <path
            d="M 330 110 Q 420 120 590 125"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2.5"
          />
          <path
            d="M 330 110 Q 370 220 450 300 Q 480 400 460 520"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* Concentric Radar Range Rings & Azimuth Crosshairs */}
          <g transform="translate(530, 200)" pointerEvents="none" opacity="0.65">
            <circle r="70" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle r="140" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle r="210" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle r="280" fill="none" stroke="#0284c7" strokeWidth="1.2" opacity="0.5" />
            
            {/* Range annotations */}
            <text x="72" y="-3" fontSize="8" fontFamily="monospace" fill="#0284c7" fontWeight="bold">50 KM</text>
            <text x="142" y="-3" fontSize="8" fontFamily="monospace" fill="#0284c7" fontWeight="bold">100 KM</text>
            <text x="212" y="-3" fontSize="8" fontFamily="monospace" fill="#0284c7" fontWeight="bold">150 KM</text>
            <text x="250" y="-3" fontSize="8" fontFamily="monospace" fill="#0369a1" fontWeight="bold">200 KM</text>

            {/* Radar Center Station Emitter */}
            <circle r="16" fill="#0284c7" fillOpacity="0.2">
              <animate attributeName="r" values="5;24;5" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
            <circle r="1.5" fill="#ffffff" />
          </g>

          {/* Animated Radar Sweep Beam (Powered by native SVG animateTransform) */}
          <g transform="translate(530, 200)" pointerEvents="none">
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="5s"
                repeatCount="indefinite"
              />
              <path
                d="M 0 0 L 260 -65 A 280 280 0 0 1 280 0 Z"
                fill="url(#sweepConeGrad)"
              />
              <line
                x1="0"
                y1="0"
                x2="280"
                y2="0"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.9"
              />
              <line
                x1="0"
                y1="0"
                x2="280"
                y2="0"
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinecap="round"
                strokeOpacity="0.95"
              />
            </g>
          </g>

          {/* Dynamic Convective Radar Reflectivity Layer */}
          <g
            id="radar-reflectivity-layer"
            filter="url(#radarGlow)"
            className="transition-transform duration-700 ease-out"
            style={{
              transform: `translate(${stormOffsetX}px, ${stormOffsetY}px) scale(${stormIntensity})`,
              transformOrigin: "530px 200px",
            }}
          >
            {/* Primary Severe Supercell (Near Salem / Tiruchirappalli moving to Vellore/Chennai) */}
            {/* Outer Green envelope */}
            <path
              d="M 440 120 
                 C 480 80, 580 70, 630 110 
                 C 670 140, 660 210, 620 260 
                 C 580 310, 500 320, 460 280 
                 C 420 240, 410 160, 440 120 Z"
              fill="#22c55e"
              opacity="0.8"
            />
            {/* Yellow moderate ring */}
            <path
              d="M 465 135 
                 C 495 100, 570 95, 610 130 
                 C 645 155, 635 210, 600 245 
                 C 565 285, 505 290, 480 255 
                 C 445 220, 440 165, 465 135 Z"
              fill="#facc15"
              opacity="0.85"
            />
            {/* Orange heavy ring */}
            <path
              d="M 490 150 
                 C 515 120, 565 115, 595 145 
                 C 620 170, 615 205, 585 230 
                 C 555 260, 515 260, 495 235 
                 C 470 205, 470 175, 490 150 Z"
              fill="#f97316"
              opacity="0.9"
            />
            {/* Red severe ring */}
            <path
              d="M 515 165 
                 C 530 140, 560 135, 580 160 
                 C 600 180, 595 205, 575 220 
                 C 550 240, 525 240, 510 220 
                 C 495 200, 495 180, 515 165 Z"
              fill="#dc2626"
              opacity="0.92"
            />
            {/* Purple Extreme Hail Core with pulsing effect */}
            <ellipse
              cx="545"
              cy="185"
              rx="28"
              ry="24"
              fill="#7e22ce"
              opacity="0.95"
              className="animate-pulse"
            />
            <ellipse
              cx="542"
              cy="183"
              rx="15"
              ry="12"
              fill="#4c1d95"
              opacity="0.98"
            />
            {/* Core Radar Ping */}
            <circle
              cx="542"
              cy="183"
              r="32"
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
              className="animate-radar-ping"
            />

            {/* Secondary Convective Cell near Coimbatore */}
            <path
              d="M 280 290 
                 C 300 270, 330 270, 345 285 
                 C 360 300, 350 325, 330 335 
                 C 310 345, 285 340, 275 325 
                 C 265 310, 270 295, 280 290 Z"
              fill="url(#moderateStorm)"
            />

            {/* Cell near Madurai */}
            <path
              d="M 370 380 
                 C 390 360, 420 365, 430 385 
                 C 440 405, 425 425, 405 430 
                 C 385 435, 365 420, 360 405 
                 C 355 390, 360 380, 370 380 Z"
              fill="url(#moderateStorm)"
            />

            {/* Small scattered squall lines */}
            <circle cx="280" cy="180" r="14" fill="#22c55e" opacity="0.7" />
            <circle cx="282" cy="181" r="7" fill="#facc15" opacity="0.8" />
            <circle cx="430" cy="440" r="16" fill="#22c55e" opacity="0.75" />
            <circle cx="432" cy="441" r="9" fill="#f97316" opacity="0.85" />
          </g>

          {/* Cities and Geographical Labels */}
          {/* Bengaluru */}
          <g transform="translate(310, 120)">
            <circle cx="0" cy="0" r="3.5" fill="#334155" />
            <circle cx="0" cy="0" r="6" fill="none" stroke="#334155" strokeWidth="1" opacity="0.4" />
            <text x="8" y="4" fontSize="12" fontWeight="600" fill="#1e293b">
              Bengaluru
            </text>
          </g>

          {/* Vellore */}
          <g transform="translate(490, 105)">
            <circle cx="0" cy="0" r="3" fill="#334155" />
            <text x="8" y="4" fontSize="11" fontWeight="500" fill="#334155">
              Vellore
            </text>
          </g>

          {/* Chennai */}
          <g transform="translate(605, 125)">
            <circle cx="0" cy="0" r="3.5" fill="#334155" />
            <circle cx="0" cy="0" r="6" fill="none" stroke="#334155" strokeWidth="1" opacity="0.4" />
            <text x="8" y="4" fontSize="12" fontWeight="600" fill="#1e293b">
              Chennai
            </text>
          </g>

          {/* Salem */}
          <g transform="translate(420, 225)">
            <circle cx="0" cy="0" r="3" fill="#334155" />
            <text x="8" y="4" fontSize="11" fontWeight="500" fill="#334155">
              Salem
            </text>
          </g>

          {/* Puducherry */}
          <g transform="translate(585, 220)">
            <circle cx="0" cy="0" r="3" fill="#334155" />
            <text x="8" y="4" fontSize="11" fontWeight="500" fill="#334155">
              Puducherry
            </text>
          </g>

          {/* Tiruchirappalli */}
          <g transform="translate(470, 295)">
            <circle cx="0" cy="0" r="3" fill="#334155" />
            <text x="8" y="4" fontSize="11" fontWeight="500" fill="#334155">
              Tiruchirappalli
            </text>
          </g>

          {/* Coimbatore */}
          <g transform="translate(250, 295)">
            <circle cx="0" cy="0" r="3" fill="#334155" />
            <text x="8" y="4" fontSize="11" fontWeight="500" fill="#334155">
              Coimbatore
            </text>
          </g>

          {/* Madurai */}
          <g transform="translate(435, 365)">
            <circle cx="0" cy="0" r="3" fill="#334155" />
            <text x="8" y="4" fontSize="11" fontWeight="500" fill="#334155">
              Madurai
            </text>
          </g>

          {/* Thoothukudi */}
          <g transform="translate(485, 475)">
            <circle cx="0" cy="0" r="3" fill="#334155" />
            <text x="8" y="4" fontSize="11" fontWeight="500" fill="#334155">
              Thoothukudi
            </text>
          </g>
        </svg>

        {/* Top-Left Live Status Badge */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-0.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200/80 text-left">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
            <span className="text-[11px] font-black tracking-wider text-slate-900 uppercase">
              LIVE NOWCAST
            </span>
            {selectedHour === 0 ? (
              <span className="text-[9px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                LIVE
              </span>
            ) : (
              <span className="text-[9px] font-mono font-black text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                +{selectedHour}H
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-600 font-semibold pl-4.5">
            {selectedHour === 0 ? `Today, ${formattedTime}` : `${formattedDate}, ${formattedTime}`}
          </span>
        </div>

        {/* Top-Right Risk Level Legend */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200/80 text-[10px] sm:text-[11px]">
          <div className="font-semibold text-slate-800 mb-1">Risk Level</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
              <span>Very High</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-purple-700 flex-shrink-0" />
              <span>Extreme</span>
            </div>
          </div>
        </div>

        {/* Floating Right Map Toolbar */}
        <div className="absolute right-3 sm:right-4 bottom-24 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 text-slate-600">
          <button
            type="button"
            onClick={() => setActiveLayer(activeLayer === "reflectivity" ? "velocity" : "reflectivity")}
            title="Toggle Radar Layer"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4 text-slate-700" />
          </button>
          <button
            type="button"
            title="Weather Clouds"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Cloud className="w-4 h-4 text-slate-700" />
          </button>
          <button
            type="button"
            title="Recenter Radar"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Crosshair className="w-4 h-4 text-slate-700" />
          </button>
          <div className="h-px bg-slate-200 my-0.5" />
          <button
            type="button"
            title="Zoom In"
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-700" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => setZoomLevel((z) => Math.max(0.9, z - 0.1))}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Minus className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Bottom Nowcasting Time Slider Controller */}
      <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-800">
            Nowcasting (0–6 Hours)
          </span>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            {timeLabels[selectedHour]} ({formattedTime})
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause Nowcast Loop" : "Play Nowcast Loop"}
            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-blue-600" />
            ) : (
              <Play className="w-4 h-4 fill-blue-600 ml-0.5" />
            )}
          </button>

          {/* Interactive Scrub Slider */}
          <div className="relative flex-1 flex flex-col justify-center">
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={selectedHour}
              onChange={(e) => {
                setSelectedHour(parseInt(e.target.value, 10));
                setIsPlaying(false);
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />

            {/* Time Marker Labels */}
            <div className="flex justify-between items-center mt-2 text-[10px] sm:text-xs text-slate-500 font-medium select-none">
              {timeLabels.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setSelectedHour(idx);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    "transition-colors hover:text-blue-600",
                    selectedHour === idx ? "text-blue-600 font-bold" : "text-slate-400"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
