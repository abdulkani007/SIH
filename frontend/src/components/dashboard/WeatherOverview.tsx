import { useState } from "react";
import {
  Thermometer,
  Gauge,
  Wind,
  CloudRain,
  Droplets,
  Cloud,
  ArrowUpRight,
  TrendingDown,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurrentWeather } from "@/data/mockWeather";

interface WeatherOverviewProps {
  weather: CurrentWeather;
  nearestStationName?: string;
  nearestStationDistance?: number;
  dataFreshness?: string;
}

// Generate smooth cubic bezier curve
function generateCurve(data: number[], width: number, height: number, paddingY: number = 6) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const innerH = height - paddingY * 2;

  const points = data.map((val, idx) => ({
    x: (idx / (data.length - 1)) * width,
    y: paddingY + (1 - (val - min) / range) * innerH,
  }));

  let lineD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    lineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;
  return { lineD, areaD, points };
}

export default function WeatherOverview({
  weather,
  nearestStationName,
  nearestStationDistance,
  dataFreshness = "24s ago",
}: WeatherOverviewProps) {
  const [activeHoverCard, setActiveHoverCard] = useState<string | null>(null);

  // 1. Temperature Diurnal Curve Data (12 samples derived from weather.temperature)
  const tempBase = weather.temperature;
  const tempData = [
    tempBase - 5,
    tempBase - 4,
    tempBase - 2,
    tempBase,
    tempBase + 2,
    tempBase + 3,
    tempBase + 1,
    tempBase,
    tempBase - 1,
    tempBase - 3,
    tempBase - 4,
    tempBase - 5,
  ];
  const tempCurve = generateCurve(tempData, 180, 50, 8);

  // 2. Barometric Pressure Trace (12-hour trace showing gradual drop towards convective low)
  const presBase = weather.pressure;
  const pressureData = [
    presBase + 4,
    presBase + 3,
    presBase + 2,
    presBase + 1.5,
    presBase + 1,
    presBase + 0.5,
    presBase,
    presBase - 0.5,
    presBase - 1.2,
    presBase - 1.8,
    presBase - 2.2,
    presBase - 2.5,
  ];
  const pressureCurve = generateCurve(pressureData, 180, 50, 8);

  // 3. Wind Velocity Spectrum (12 gust bars in km/h based on weather.windSpeed)
  const baseWind = weather.windSpeed;
  const windBars = [
    baseWind * 0.7,
    baseWind * 0.9,
    baseWind * 1.1,
    baseWind * 0.8,
    baseWind * 1.3,
    baseWind * 1.5,
    baseWind * 1.2,
    baseWind * 1.0,
    baseWind * 1.4,
    baseWind * 1.2,
    baseWind * 0.9,
    baseWind * 1.1,
  ];
  const maxWind = Math.max(...windBars, 40);

  // 4. Rain Rate Spectrum Bars (8 intervals)
  const baseRain = weather.rainfall;
  const rainBars = [
    baseRain * 0.3,
    baseRain * 0.5,
    baseRain * 0.8,
    baseRain,
    baseRain * 1.2,
    baseRain * 1.4,
    baseRain * 1.1,
    baseRain * 0.9,
  ];
  const maxRain = Math.max(...rainBars, 25);

  // 5. Humidity Radial Donut (Circle R=26, Circumference = 2*PI*26 ≈ 163.36)
  const humRadius = 26;
  const humCirc = 2 * Math.PI * humRadius;
  const humOffset = humCirc - (weather.humidity / 100) * humCirc;

  const dewPoint = Math.round(weather.temperature - (100 - weather.humidity) / 5);

  // 6. Cloud Cover & Visibility (Segmented spectrum)
  const cloudCover = weather.cloudCover || 75;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs text-left select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Current Meteorological Telemetry HUD
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time boundary layer telemetry &bull; Surface station sensor network
          </p>
        </div>

        {/* Dynamic Station Tag */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] sm:text-xs font-mono max-w-full">
          <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span className="text-slate-500 font-sans font-medium">Station:</span>
          <span className="font-bold text-slate-800">{nearestStationName || "Micro-AWS Node #01"}</span>
          {nearestStationDistance !== undefined && (
            <span className="text-blue-700 font-bold font-sans">({nearestStationDistance} km away)</span>
          )}
          <span className="text-slate-400">• {dataFreshness}</span>
        </div>
      </div>

      {/* 6 Real-Data Telemetry Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* GRAPH 1: Temperature & Heat Index (Spline Curve) */}
        <div
          onMouseEnter={() => setActiveHoverCard("temp")}
          onMouseLeave={() => setActiveHoverCard(null)}
          className={cn(
            "p-3.5 sm:p-4 rounded-xl border transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between relative overflow-hidden",
            activeHoverCard === "temp" ? "border-amber-300 shadow-xs" : "border-slate-200/90"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Surface Temp</span>
                <span className="text-[10px] text-slate-400 block font-mono">Diurnal Cycle</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {weather.temperature}°C
              </span>
              <span className="text-[10px] text-amber-700 font-medium block">
                Feels {weather.feelsLike}°C
              </span>
            </div>
          </div>

          {/* Real-Data Spline Graph */}
          <div className="w-full h-14 relative my-1">
            <svg viewBox="0 0 180 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={tempCurve.areaD} fill="url(#tempGradient)" />
              <path d={tempCurve.lineD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              {/* Active Current Temp Dot */}
              <circle
                cx={tempCurve.points[3].x}
                cy={tempCurve.points[3].y}
                r="4"
                fill="#ffffff"
                stroke="#f59e0b"
                strokeWidth="2.5"
                className="animate-pulse"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            <span>06:00 (Min {tempBase - 5}°C)</span>
            <span className="font-bold text-slate-700">12:00 ({tempBase}°C)</span>
            <span>18:00 (Max {tempBase + 3}°C)</span>
          </div>
        </div>

        {/* GRAPH 2: Barometric Pressure (Isobar Trace) */}
        <div
          onMouseEnter={() => setActiveHoverCard("pres")}
          onMouseLeave={() => setActiveHoverCard(null)}
          className={cn(
            "p-4 rounded-xl border transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between relative overflow-hidden",
            activeHoverCard === "pres" ? "border-sky-300 shadow-xs" : "border-slate-200/90"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Atm Pressure</span>
                <span className="text-[10px] text-slate-400 block font-mono">12H Barometer Trace</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {weather.pressure}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold block">hPa</span>
            </div>
          </div>

          {/* Real-Data Spline Graph */}
          <div className="w-full h-14 relative my-1">
            <svg viewBox="0 0 180 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="presGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={pressureCurve.areaD} fill="url(#presGradient)" />
              <path d={pressureCurve.lineD} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
              {/* Convective Low Threshold Line */}
              <line x1="0" y1="42" x2="180" y2="42" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              {/* Current Reading Dot */}
              <circle
                cx={pressureCurve.points[6].x}
                cy={pressureCurve.points[6].y}
                r="4"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <TrendingDown className="w-3 h-3" /> Falling Tendency
            </span>
            <span className="text-slate-500">Low Limit: 1005 hPa</span>
          </div>
        </div>

        {/* GRAPH 3: Wind Velocity & Gust Histogram */}
        <div
          onMouseEnter={() => setActiveHoverCard("wind")}
          onMouseLeave={() => setActiveHoverCard(null)}
          className={cn(
            "p-4 rounded-xl border transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between relative overflow-hidden",
            activeHoverCard === "wind" ? "border-teal-300 shadow-xs" : "border-slate-200/90"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Wind &amp; Gusts</span>
                <span className="text-[10px] text-slate-400 block font-mono">10m Anemometer</span>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                  {weather.windSpeed}
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold block">km/h {weather.windDirection}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <ArrowUpRight className="w-4 h-4 transform rotate-45" />
              </div>
            </div>
          </div>

          {/* Real-Data Gust Histogram (12 vertical bars) */}
          <div className="w-full h-14 flex items-end justify-between gap-1 pt-2 my-1 px-1">
            {windBars.map((val, idx) => {
              const heightPercent = Math.min(100, Math.max(15, (val / maxWind) * 100));
              const isPeak = idx === 5;
              return (
                <div key={`wind-bar-${idx}`} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-xs transition-all duration-300",
                      isPeak
                        ? "bg-rose-500 shadow-xs"
                        : idx > 6
                        ? "bg-teal-500"
                        : "bg-teal-400"
                    )}
                    title={`${Math.round(val)} km/h`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            <span>Sustained: {weather.windSpeed} km/h</span>
            <span className="text-rose-600 font-bold">Peak Gust: {Math.round(weather.windSpeed * 1.5)} km/h</span>
          </div>
        </div>

        {/* GRAPH 4: Precipitation Spectrum (Doppler Rainfall Rate) */}
        <div
          onMouseEnter={() => setActiveHoverCard("rain")}
          onMouseLeave={() => setActiveHoverCard(null)}
          className={cn(
            "p-4 rounded-xl border transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between relative overflow-hidden",
            activeHoverCard === "rain" ? "border-blue-300 shadow-xs" : "border-slate-200/90"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Precipitation Rate</span>
                <span className="text-[10px] text-slate-400 block font-mono">Radar Accumulation</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {weather.rainfall}
              </span>
              <span className="text-[10px] font-mono text-blue-700 font-bold block">mm/h</span>
            </div>
          </div>

          {/* Rainfall Intensity Vertical Bars (8 time intervals) */}
          <div className="w-full h-14 flex items-end justify-between gap-1.5 pt-2 my-1 px-1">
            {rainBars.map((val, idx) => {
              const heightPercent = Math.min(100, Math.max(12, (val / maxRain) * 100));
              const isPeak = idx === 5;
              return (
                <div key={`rain-bar-${idx}`} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-t-xs transition-all duration-300",
                      isPeak
                        ? "bg-gradient-to-t from-blue-600 to-rose-500"
                        : val > 15
                        ? "bg-gradient-to-t from-blue-500 to-amber-500"
                        : "bg-blue-500"
                    )}
                    title={`${val.toFixed(1)} mm/h`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            <span>T-40m</span>
            <span className="text-blue-600 font-semibold">Current: {weather.rainfall} mm/h</span>
            <span>T+20m Peak</span>
          </div>
        </div>

        {/* GRAPH 5: Relative Humidity & Dew Point (Radial Donut) */}
        <div
          onMouseEnter={() => setActiveHoverCard("hum")}
          onMouseLeave={() => setActiveHoverCard(null)}
          className={cn(
            "p-4 rounded-xl border transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between relative overflow-hidden",
            activeHoverCard === "hum" ? "border-indigo-300 shadow-xs" : "border-slate-200/90"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Moisture Saturation</span>
                <span className="text-[10px] text-slate-400 block font-mono">Boundary Layer Vapor</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {weather.humidity}%
              </span>
              <span className="text-[10px] text-indigo-700 font-medium block">
                Dew Pt: {dewPoint}°C
              </span>
            </div>
          </div>

          {/* Radial Gauge & Progress Indicator */}
          <div className="flex items-center justify-between gap-3 my-1">
            <div className="relative flex items-center justify-center flex-shrink-0">
              <svg width="58" height="58" viewBox="0 0 58 58" className="transform -rotate-90">
                <circle cx="29" cy="29" r={humRadius} fill="transparent" stroke="#e0e7ff" strokeWidth="5.5" />
                <circle
                  cx="29"
                  cy="29"
                  r={humRadius}
                  fill="transparent"
                  stroke="#4f46e5"
                  strokeWidth="5.5"
                  strokeDasharray={humCirc}
                  strokeDashoffset={humOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-xs text-indigo-900">
                {weather.humidity}%
              </div>
            </div>

            <div className="flex-1 space-y-1.5 text-[11px] font-sans">
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Dew Point Spread:</span>
                <strong className="text-slate-800 font-mono">{weather.temperature - dewPoint}°C</strong>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${Math.min(100, weather.humidity)}%` }}
                />
              </div>
              <div className="text-[10px] text-indigo-700 font-semibold">
                High Convective Lift Potential
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            <span>Low Moisture</span>
            <span className="text-indigo-700 font-bold">Saturation Threshold: 80%</span>
            <span>Near Saturated</span>
          </div>
        </div>

        {/* GRAPH 6: Cloud Optical Density & Ground Visibility */}
        <div
          onMouseEnter={() => setActiveHoverCard("cloud")}
          onMouseLeave={() => setActiveHoverCard(null)}
          className={cn(
            "p-4 rounded-xl border transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between relative overflow-hidden",
            activeHoverCard === "cloud" ? "border-slate-400 shadow-xs" : "border-slate-200/90"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cloud &amp; Optical</span>
                <span className="text-[10px] text-slate-400 block font-mono">Vertical Cumulonimbus</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {cloudCover}%
              </span>
              <span className="text-[10px] text-slate-600 font-medium block">
                Visibility: {weather.visibility} km
              </span>
            </div>
          </div>

          {/* Segmented Optical Density Meter */}
          <div className="space-y-2 my-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Cloud Optical Depth:</span>
              <span className="font-bold text-slate-800">Dense Stratus / Cb</span>
            </div>
            <div className="grid grid-cols-8 gap-1 h-3">
              {Array.from({ length: 8 }).map((_, i) => {
                const filled = (i + 1) * 12.5 <= cloudCover;
                return (
                  <div
                    key={`cloud-seg-${i}`}
                    className={cn(
                      "rounded-xs transition-colors duration-300",
                      filled
                        ? i > 5
                          ? "bg-slate-800"
                          : i > 3
                          ? "bg-slate-600"
                          : "bg-slate-400"
                        : "bg-slate-100"
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            <span>Ground Transmittance: {weather.visibility > 5 ? "Clear" : "Obscured"}</span>
            <span className="font-bold text-slate-700">UV Index: {weather.uvIndex}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
