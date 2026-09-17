import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Cloud,
  Eye,
  Sun,
  Activity,
} from "lucide-react";
import type { CurrentWeather } from "@/data/mockWeather";

interface WeatherConditionsProps {
  weather: CurrentWeather;
}

export default function WeatherConditions({ weather }: WeatherConditionsProps) {
  const conditions = [
    {
      label: "Dew Point",
      value: `${weather.dewPoint}°C`,
      desc: "High moisture availability",
      icon: Sun,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pressure",
      value: `${weather.pressure} hPa`,
      desc: "Gradual barometric decrease",
      icon: Gauge,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Temperature",
      value: `${weather.temperature}°C`,
      desc: `Feels like ${weather.feelsLike}°C (High instability)`,
      icon: Thermometer,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Relative Humidity",
      value: `${weather.humidity}%`,
      desc: "High moisture saturation",
      icon: Droplets,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Wind Vector",
      value: `${weather.windSpeed} km/h ${weather.windDirection}`,
      desc: "Inflow shear toward storm cell",
      icon: Wind,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Cloud Cover",
      value: `${weather.cloudCover}%`,
      desc: "Cumulonimbus vertical growth",
      icon: Cloud,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Rainfall Rate",
      value: `${weather.rainfall} mm/h`,
      desc: "Convective precipitation core",
      icon: CloudRain,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Horizontal Visibility",
      value: `${weather.visibility} km`,
      desc: "Optical range clear",
      icon: Eye,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Atmospheric Monitoring &amp; Boundary Conditions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thermodynamic indices, moisture budget &amp; vertical instability
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 self-start sm:self-auto">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>AWS Telemetry: Synchronized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {conditions.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium truncate">{item.label}</span>
                <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                {item.value}
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                {item.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
