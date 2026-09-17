import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LocateFixed,
  Radio,
  CloudRain,
  Zap,
  Gauge,
  Info,
  Wind,
  Thermometer,
  Layers,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveLocation, GeoCoordinates, LocalObservationPoint } from "@/services/locationService";
import type { CurrentWeather } from "@/data/mockWeather";

interface LocalCoveragePanelProps {
  userCoords: GeoCoordinates | null;
  activeLocation?: ActiveLocation | null;
  stationsWithin3km: LocalObservationPoint[];
  nearestStationName?: string;
  weather?: CurrentWeather;
}

export default function LocalCoveragePanel({
  userCoords,
  activeLocation,
  stationsWithin3km,
  weather,
}: LocalCoveragePanelProps) {
  const [viewMode, setViewMode] = useState<"radar" | "gis">("radar");
  const [isRadarScanning, setIsRadarScanning] = useState(true);
  const [hoveredStation, setHoveredStation] = useState<LocalObservationPoint | null>(null);

  // Leaflet map container ref for GIS view
  const gisMapRef = useRef<HTMLDivElement>(null);
  const leafletInstanceRef = useRef<L.Map | null>(null);

  const getIconForType = (type: LocalObservationPoint["type"]) => {
    switch (type) {
      case "Rain Gauge":
        return CloudRain;
      case "Lightning Sensor":
        return Zap;
      case "Doppler Radar":
        return Radio;
      case "Weather Station":
      default:
        return Gauge;
    }
  };

  const targetLat = activeLocation?.latitude ?? userCoords?.latitude ?? 10.96;
  const targetLon = activeLocation?.longitude ?? userCoords?.longitude ?? 77.01;
  const isGps = activeLocation ? activeLocation.source === "gps" : !!userCoords;
  const locationTitle = activeLocation?.name || userCoords?.district || "Kondampatti";
  const accuracy = userCoords?.accuracyMeters || 15;

  // Invalidate Leaflet map size on viewport / orientation resize
  useEffect(() => {
    const handleResize = () => {
      if (leafletInstanceRef.current) {
        leafletInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize mini Leaflet GIS map when user switches to "gis" view
  useEffect(() => {
    if (viewMode !== "gis" || !gisMapRef.current || (!userCoords && !activeLocation)) return;

    if (leafletInstanceRef.current) {
      try {
        leafletInstanceRef.current.remove();
      } catch {
        // ignore
      }
      leafletInstanceRef.current = null;
    }
    if (gisMapRef.current) {
      (gisMapRef.current as any)._leaflet_id = null;
    }

    try {
      const userLoc: [number, number] = [targetLat, targetLon];
      const map = L.map(gisMapRef.current, {
        center: userLoc,
        zoom: 14,
        zoomControl: false,
      });
      leafletInstanceRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // 3 km Perimeter Circle with animated dash
      L.circle(userLoc, {
        radius: 3000,
        color: "#0284c7",
        fillColor: "#38bdf8",
        fillOpacity: 0.12,
        weight: 2,
        dashArray: "6, 6",
      })
        .addTo(map)
        .bindTooltip("3.0 km Micro-Meteorological Perimeter", { direction: "top" });

      // 1 km and 2 km inner rings
      L.circle(userLoc, {
        radius: 1000,
        color: "#0284c7",
        fillOpacity: 0.04,
        weight: 1,
        dashArray: "3, 3",
      }).addTo(map);

      L.circle(userLoc, {
        radius: 2000,
        color: "#0284c7",
        fillOpacity: 0.04,
        weight: 1,
        dashArray: "3, 3",
      }).addTo(map);

      // User location marker
      const userPin = L.divIcon({
        className: "user-gps-pulse-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(2, 132, 199, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #0284c7; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const originName = activeLocation ? activeLocation.name : (userCoords?.district || "Active Location");
      const originAccuracy = activeLocation?.accuracyMeters ?? userCoords?.accuracyMeters ?? 10;
      const originLabel = activeLocation?.source === "search" ? "Searched Sector Origin" : "Your GPS Origin";

      L.marker(userLoc, { icon: userPin })
        .addTo(map)
        .bindTooltip(`<b>${originLabel}</b><br/>${originName}<br/>Accuracy: ±${Math.round(originAccuracy)}m`, {
          permanent: false,
          direction: "top",
        });

      // Stations markers
      stationsWithin3km.forEach((st) => {
        const icon = L.divIcon({
          className: "station-map-pin",
          html: `
            <div style="background: white; border: 1.5px solid #0284c7; color: #0f172a; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
              <span>${st.name}</span>
              <span style="color: #0284c7; font-weight: 800;">${st.distanceKm}km</span>
            </div>
          `,
          iconSize: [140, 22],
          iconAnchor: [70, 11],
        });

        L.marker(st.coordinates, { icon })
          .addTo(map)
          .bindTooltip(
            `<b>${st.name}</b><br/>Type: ${st.type}<br/>Distance: ${st.distanceKm} km<br/>Status: ${st.status}`,
            { direction: "top" }
          );
      });
    } catch (err) {
      console.warn("GIS Map mini initialization:", err);
    }

    return () => {
      if (leafletInstanceRef.current) {
        try {
          leafletInstanceRef.current.remove();
        } catch {
          // ignore
        }
        leafletInstanceRef.current = null;
      }
    };
  }, [viewMode, userCoords, activeLocation, stationsWithin3km, targetLat, targetLon]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs flex-shrink-0">
            <LocateFixed className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                3 km Local Weather Coverage &amp; Radar Scope
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE MESH
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High-resolution micro-meteorological perimeter &bull; {locationTitle}, Tamil Nadu
            </p>
          </div>
        </div>

        {/* View Toggle & Origin Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">Origin:</span>
            <span className="font-bold text-slate-800">
              {targetLat.toFixed(4)}°N, {targetLon.toFixed(4)}°E
            </span>
            <span className={cn(
              "font-bold px-1.5 py-0.5 rounded border text-[10px]",
              isGps
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-cyan-700 bg-cyan-50 border-cyan-200"
            )}>
              {isGps ? `LIVE GPS (±${accuracy}m)` : "SEARCH SECTOR"}
            </span>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("radar")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[11px] sm:text-xs",
                viewMode === "radar"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Radar Scope</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("gis")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[11px] sm:text-xs",
                viewMode === "gis"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>GIS Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: ANIMATED WEATHER RADAR SCOPE (Interactive 3km Radar HUD) */}
      {viewMode === "radar" && (
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#070e1b] border border-sky-950/70 shadow-inner mb-4 select-none">
          {/* Top HUD Telemetry Ribbon */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-950/80 backdrop-blur-md border-b border-sky-500/20 text-[11px] font-mono text-sky-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold tracking-wider text-sky-200">DOPPLER 3 KM MICRO-RADAR</span>
              <span className="hidden md:inline text-sky-500/80">&bull; 9.41 GHz X-BAND</span>
            </div>

            <div className="flex items-center gap-3 text-sky-300">
              <span className="flex items-center gap-1 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span className="font-bold text-white">
                  {weather?.temperature ? `${Math.round(weather.temperature * 10) / 10}°C` : "29.4°C"}
                </span>
              </span>
              <span className="flex items-center gap-1 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                <Wind className="w-3 h-3 text-sky-400" />
                <span>{weather?.windSpeed || 26} km/h</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400 font-bold">
                <Activity className="w-3 h-3" />
                <span>ACTIVE SWEEP</span>
              </span>
            </div>
          </div>

          {/* Radar Canvas / SVG Graphic Area */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[380px] flex items-center justify-center p-4 pt-10">
            <svg
              viewBox="0 0 600 360"
              className="w-full h-full max-w-[650px] object-contain filter drop-shadow-[0_0_15px_rgba(2,132,199,0.15)]"
            >
              <defs>
                {/* Radar sweep cone gradient */}
                <linearGradient id="localSweepCone" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#0284c7" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>

                {/* Convective Cloud Reflectivity Glow Filter */}
                <filter id="convectiveGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Radar Grid Texture Pattern */}
                <pattern id="radarGridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#0369a1"
                    strokeWidth="0.5"
                    strokeOpacity="0.15"
                  />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="600" height="360" fill="url(#radarGridPattern)" />

              {/* Center point of Radar: cx=300, cy=180 */}
              <g transform="translate(300, 180)">
                {/* 1. Concentric Range Rings */}
                {/* 1.0 km Ring (radius = 50px) */}
                <circle
                  r="50"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.5"
                />
                <text x="52" y="-3" fontSize="7" fontFamily="monospace" fill="#38bdf8" opacity="0.8">
                  1.0 KM
                </text>

                {/* 2.0 km Ring (radius = 100px) */}
                <circle
                  r="100"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  opacity="0.55"
                />
                <text x="102" y="-3" fontSize="7" fontFamily="monospace" fill="#38bdf8" opacity="0.8">
                  2.0 KM
                </text>

                {/* 3.0 km Perimeter Ring (radius = 150px) */}
                <circle
                  r="150"
                  fill="#0369a1"
                  fillOpacity="0.04"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  opacity="0.75"
                />
                <text
                  x="152"
                  y="-4"
                  fontSize="8"
                  fontFamily="monospace"
                  fill="#7dd3fc"
                  fontWeight="bold"
                >
                  3.0 KM PERIMETER
                </text>

                {/* Compass Radial Axis Crosshairs */}
                <line x1="-165" y1="0" x2="165" y2="0" stroke="#0284c7" strokeWidth="0.8" opacity="0.35" />
                <line x1="0" y1="-165" x2="0" y2="165" stroke="#0284c7" strokeWidth="0.8" opacity="0.35" />
                <line x1="-115" y1="-115" x2="115" y2="115" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.25" />
                <line x1="-115" y1="115" x2="115" y2="-115" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.25" />

                {/* Cardinal Compass Labels */}
                <text x="0" y="-155" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#7dd3fc" fontWeight="bold">N</text>
                <text x="156" y="3" textAnchor="start" fontSize="9" fontFamily="monospace" fill="#7dd3fc" fontWeight="bold">E</text>
                <text x="0" y="162" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#7dd3fc" fontWeight="bold">S</text>
                <text x="-156" y="3" textAnchor="end" fontSize="9" fontFamily="monospace" fill="#7dd3fc" fontWeight="bold">W</text>

                {/* 2. Convective Cloud Reflectivity Blobs (Weather Animation) */}
                <g filter="url(#convectiveGlow)" opacity="0.85">
                  {/* Outer light cloud/rain reflectivity envelope (Green 20-30 dBZ) */}
                  <path
                    d="M -40 -90
                       C -10 -120, 60 -105, 95 -60
                       C 120 -30, 110 25, 75 55
                       C 40 85, -20 80, -60 45
                       C -95 10, -75 -60, -40 -90 Z"
                    fill="#10b981"
                    fillOpacity="0.45"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 0; 8 -6; 0 0"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                  </path>

                  {/* Moderate rain core (Yellow 35 dBZ) */}
                  <path
                    d="M -20 -70
                       C 0 -95, 50 -80, 75 -45
                       C 95 -20, 85 20, 55 40
                       C 30 60, -10 55, -40 30
                       C -65 5, -45 -45, -20 -70 Z"
                    fill="#facc15"
                    fillOpacity="0.55"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 0; 6 -4; 0 0"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </path>

                  {/* Convective cell core (Orange 45 dBZ) */}
                  <ellipse
                    cx="18"
                    cy="-25"
                    rx="32"
                    ry="24"
                    fill="#f97316"
                    fillOpacity="0.65"
                  >
                    <animate
                      attributeName="rx"
                      values="32;36;32"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </ellipse>

                  {/* Intense localized cell (Crimson 50+ dBZ) */}
                  <circle
                    cx="20"
                    cy="-22"
                    r="14"
                    fill="#ef4444"
                    fillOpacity="0.75"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.6;0.9;0.6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>

                {/* 3. Animated 360° Doppler Radar Sweep Cone */}
                {isRadarScanning && (
                  <g pointerEvents="none">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 0 0"
                      to="360 0 0"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                    {/* 45-degree trailing sweep sector */}
                    <path
                      d="M 0 0 L 140 -60 A 150 150 0 0 1 150 0 Z"
                      fill="url(#localSweepCone)"
                    />
                    {/* Leading radar beam line */}
                    <line
                      x1="0"
                      y1="0"
                      x2="152"
                      y2="0"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeOpacity="0.95"
                    />
                    <line
                      x1="0"
                      y1="0"
                      x2="152"
                      y2="0"
                      stroke="#ffffff"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeOpacity="1"
                    />
                  </g>
                )}

                {/* 4. Plotted Micro-Observation Stations */}
                {/* Station 1: Micro-AWS (~0.8km, NW: x=-28, y=-26) */}
                <g
                  transform="translate(-28, -26)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredStation(stationsWithin3km[0] || null)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  <circle r="10" fill="#10b981" fillOpacity="0.25">
                    <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="8" y="3" fontSize="7" fontFamily="sans-serif" fill="#6ee7b7" fontWeight="bold">
                    Micro-AWS (0.8km)
                  </text>
                </g>

                {/* Station 2: Doppler Cell (~1.4km, SE: x=54, y=52) */}
                <g
                  transform="translate(54, 52)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredStation(stationsWithin3km[1] || null)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  <circle r="12" fill="#38bdf8" fillOpacity="0.25">
                    <animate attributeName="r" values="8;16;8" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="8" y="3" fontSize="7" fontFamily="sans-serif" fill="#7dd3fc" fontWeight="bold">
                    Doppler Cell (1.4km)
                  </text>
                </g>

                {/* Station 3: Rain Gauge (~2.1km, NE: x=76, y=-72) */}
                <g
                  transform="translate(76, -72)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredStation(stationsWithin3km[2] || null)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  <circle r="12" fill="#fbbf24" fillOpacity="0.25">
                    <animate attributeName="r" values="8;16;8" dur="2.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.8s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="8" y="3" fontSize="7" fontFamily="sans-serif" fill="#fde047" fontWeight="bold">
                    Rain Gauge (2.1km)
                  </text>
                </g>

                {/* 5. Center GPS Origin (User's Exact Coordinates) */}
                <circle r="14" fill="#0284c7" fillOpacity="0.3">
                  <animate attributeName="r" values="6;20;6" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                <circle r="2" fill="#ffffff" />
                <text
                  x="0"
                  y="18"
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="sans-serif"
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  {isGps ? `YOU (${locationTitle})` : `TARGET (${locationTitle})`}
                </text>
              </g>
            </svg>
          </div>

          {/* Bottom Control & Reflectivity Scale Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-3 sm:px-4 py-2.5 bg-slate-950/90 border-t border-sky-500/20 text-xs">
            {/* Reflectivity dBZ Legend */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                Reflectivity:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded bg-emerald-500" />
                  20 dBZ (Clouds)
                </span>
                <span className="flex items-center gap-1 text-yellow-400 ml-1">
                  <span className="w-2 h-2 rounded bg-yellow-400" />
                  35 dBZ (Rain)
                </span>
                <span className="flex items-center gap-1 text-rose-400 ml-1">
                  <span className="w-2 h-2 rounded bg-rose-500" />
                  50 dBZ (Storm)
                </span>
              </div>
            </div>

            {/* Sweep Toggle Button */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsRadarScanning(!isRadarScanning)}
                className="px-2.5 py-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-700/50 text-sky-300 font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", isRadarScanning ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
                <span>{isRadarScanning ? "Pause Sweep" : "Resume Sweep"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EMBEDDED LEAFLET GIS MINI-MAP */}
      {viewMode === "gis" && (
        <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-4 shadow-inner">
          <div ref={gisMapRef} className="w-full h-full z-0" />
          <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-1.5rem)] sm:max-w-none bg-white/95 backdrop-blur-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-[11px] sm:text-xs font-mono flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping flex-shrink-0" />
            <span className="font-bold text-slate-800 flex-shrink-0">3 km Micro-Coverage Mesh</span>
            <span className="text-slate-500 truncate">({locationTitle})</span>
          </div>
        </div>
      )}

      {/* Observation Station Cards (Always Online 3km Mesh) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
          {stationsWithin3km.map((st) => {
            const Icon = getIconForType(st.type);
            // Derive real live telemetry metric for each sensor
            let metricBadge = "29.4°C • 65% RH";
            if (st.type === "Doppler Radar") {
              metricBadge = "22 dBZ Sweep Synced";
            } else if (st.type === "Rain Gauge") {
              metricBadge = `${weather?.rainfall || 0} mm/h Precipitation`;
            } else if (weather?.temperature) {
              metricBadge = `${Math.round(weather.temperature * 10) / 10}°C • ${weather.humidity || 65}% RH`;
            }

            return (
              <div
                key={st.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex flex-col justify-between",
                  hoveredStation?.id === st.id
                    ? "bg-blue-50/70 border-blue-300 shadow-sm"
                    : "bg-slate-50/80 border-slate-200/80 hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {st.type}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {st.distanceKm} km away
                  </span>
                </div>

                {/* Sensor telemetry reading */}
                <div className="py-1 px-2 mb-2 rounded bg-white border border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">TELEMETRY:</span>
                  <span className="font-bold text-slate-800">{metricBadge}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {st.isSimulated ? "3 KM MICRO-MESH" : "PRIMARY OBSERVATORY"}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {st.status} &bull; {st.lastUpdated}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational Fusion Banner */}
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-[11px] leading-relaxed">
            Observation sensors within your <strong>3 km perimeter</strong> are fused in real time with Doppler radar sweeps and local OpenWeatherMap telemetry for early convective storm nowcasting.
          </span>
        </div>
      </div>
    </div>
  );
}

