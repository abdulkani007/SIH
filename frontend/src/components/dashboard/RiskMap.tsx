import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CloudLightning,
  CloudHail,
  CloudRain,
  X,
  Sparkles,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskZone, StormCell } from "@/data/mockWeather";
import type { ActiveLocation, GeoCoordinates, LocalObservationPoint } from "@/services/locationService";

interface RiskMapProps {
  riskZones: RiskZone[];
  stormCell: StormCell;
  userCoords?: GeoCoordinates | null;
  activeLocation?: ActiveLocation | null;
  stationsWithin3km?: LocalObservationPoint[];
  onAnalyzeZoneWithAI?: (zone: RiskZone) => void;
}

export default function RiskMap({
  riskZones,
  stormCell,
  userCoords,
  activeLocation,
  stationsWithin3km = [],
  onAnalyzeZoneWithAI,
}: RiskMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);
  const [activeLayer, setActiveLayer] = useState<"zones" | "radar" | "3km">("zones");

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "Severe":
        return "#dc2626"; // Crimson
      case "High":
        return "#ea580c"; // Orange
      case "Moderate":
        return "#d97706"; // Amber
      case "Low":
      default:
        return "#16a34a"; // Green
    }
  };

  // Handle window resize / device orientation change for Leaflet
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup map strictly on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Determine center: prioritize activeLocation (whether search or GPS)
      const targetLat = activeLocation
        ? activeLocation.latitude
        : userCoords
        ? userCoords.latitude
        : 11.6643;
      const targetLon = activeLocation
        ? activeLocation.longitude
        : userCoords
        ? userCoords.longitude
        : 78.146;
      const isGps = activeLocation ? activeLocation.source === "gps" : !!userCoords;
      const locationName = activeLocation
        ? activeLocation.name
        : userCoords?.district || "Active Sector";

      const defaultCenter: [number, number] = [targetLat, targetLon];

      let map = mapInstanceRef.current;

      // 1. Initialize Map instance once
      if (!map) {
        map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: activeLocation || userCoords ? 11 : 8,
          zoomControl: false,
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        layersGroupRef.current = L.layerGroup().addTo(map);
      } else {
        // 2. Smoothly fly camera to the target coordinates!
        map.flyTo(defaultCenter, 11, {
          duration: 1.4,
          easeLinearity: 0.25,
        });
      }

      const layersGroup = layersGroupRef.current;
      if (!layersGroup) return;

      // Clear previous overlay layers
      layersGroup.clearLayers();

      // 1. Render Location Pin & 3 km Local Radius Circle
      const activeLocCoords = [targetLat, targetLon] as [number, number];

      if (isGps) {
        // Live GPS radius circle (Blue)
        L.circle(activeLocCoords, {
          radius: 3000,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "4, 4",
        })
          .addTo(layersGroup)
          .bindTooltip(`3 km Live GPS Coverage Radius (${locationName})`, { direction: "top" });

        // Pulsing User GPS Marker
        const userPinIcon = L.divIcon({
          className: "custom-user-gps-pin",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(37, 99, 235, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker(activeLocCoords, { icon: userPinIcon })
          .addTo(layersGroup)
          .bindTooltip(
            `<b>Live GPS Location</b><br/>${locationName}<br/><span style="font-size: 10px; color: #64748b;">Accuracy: ±${userCoords?.accuracyMeters || 15}m</span>`,
            { permanent: false, direction: "top" }
          );
      } else {
        // Searched Location radius circle (Cyan)
        L.circle(activeLocCoords, {
          radius: 3000,
          color: "#0891b2",
          fillColor: "#06b6d4",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "6, 6",
        })
          .addTo(layersGroup)
          .bindTooltip(`3 km Meteorological Surveillance Radius (${locationName})`, { direction: "top" });

        // Pinned Search Target Marker
        const searchPinIcon = L.divIcon({
          className: "custom-searched-location-pin",
          html: `
            <div style="background: #0e7490; border: 2px solid white; color: white; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(6,182,212,0.4); display: flex; align-items: center; gap: 5px; white-space: nowrap;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; animation: pulse 1.5s infinite;"></span>
              <span>📍 ${locationName}</span>
            </div>
          `,
          iconSize: [140, 26],
          iconAnchor: [70, 13],
        });

        L.marker(activeLocCoords, { icon: searchPinIcon })
          .addTo(layersGroup)
          .bindTooltip(
            `<b>Searched Location:</b> ${locationName}<br/><span style="font-size: 10px; color: #64748b;">Coordinates: ${targetLat.toFixed(4)}°N, ${targetLon.toFixed(4)}°E</span>`,
            { permanent: false, direction: "top" }
          );
      }

      // 2. Render Nearby Observation Stations strictly within 3 km
      stationsWithin3km.forEach((station) => {
        const stationIcon = L.divIcon({
          className: "custom-nearby-station",
          html: `
            <div style="background: white; border: 1.5px solid #0284c7; color: #0284c7; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
              <span>${station.name} (${station.distanceKm} km)</span>
            </div>
          `,
          iconSize: [160, 22],
          iconAnchor: [80, 11],
        });

        L.marker(station.coordinates, { icon: stationIcon })
          .addTo(layersGroup)
          .bindTooltip(
            `<b>${station.name}</b><br/>Type: ${station.type}<br/>Distance: ${station.distanceKm} km<br/>Status: ${station.status}`,
            { direction: "top" }
          );
      });

      // 3. Add Risk Zones Polygons
      riskZones.forEach((zone) => {
        const color = getSeverityColor(zone.severity);

        const polygon = L.polygon(zone.coordinates as [number, number][], {
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 2,
          dashArray: zone.severity === "Severe" ? undefined : "4, 4",
        }).addTo(layersGroup);

        polygon.on("click", () => {
          setSelectedZone(zone);
        });

        // Label Marker at center
        const labelIcon = L.divIcon({
          className: "custom-zone-label",
          html: `<div style="background: white; border: 1.5px solid ${color}; color: ${color}; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); white-space: nowrap; cursor: pointer;">${zone.name}</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        });
        const labelMarker = L.marker(zone.center as [number, number], { icon: labelIcon }).addTo(layersGroup);
        labelMarker.on("click", () => setSelectedZone(zone));
      });

      // 4. Storm Cell Trajectory Vector Arrow
      const stormPath = [
        [targetLat - 0.12, targetLon - 0.15],
        [stormCell.coordinates[0], stormCell.coordinates[1]],
        [stormCell.coordinates[0] + 0.35, stormCell.coordinates[1] + 0.4],
      ];

      L.polyline(stormPath as [number, number][], {
        color: "#dc2626",
        weight: 3,
        dashArray: "6, 6",
      }).addTo(layersGroup);

      // Storm Cell Marker
      const stormCellIcon = L.divIcon({
        className: "custom-stormcell-marker",
        html: `
          <div style="background: #dc2626; color: white; font-weight: 800; font-size: 10px; padding: 2px 8px; border-radius: 4px; box-shadow: 0 2px 6px rgba(220,38,38,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span>⚡ ${stormCell.name}</span>
            <span style="opacity: 0.9;">(${stormCell.speedKmH} km/h ↗)</span>
          </div>
        `,
        iconSize: [150, 24],
        iconAnchor: [75, 12],
      });

      L.marker(stormCell.coordinates as [number, number], { icon: stormCellIcon })
        .addTo(layersGroup)
        .bindTooltip(`${stormCell.name} • ${stormCell.intensity} Convective Intensity`, {
          permanent: false,
          direction: "bottom",
        });
    } catch (mapErr) {
      console.warn("Leaflet initialization warning:", mapErr);
    }
  }, [riskZones, stormCell, userCoords, activeLocation, stationsWithin3km]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              GIS Convective Risk &amp; Local Coverage Map
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              LEAFLET GIS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive multi-hazard spatial polygons, 3 km local radius &amp; storm vectors
          </p>
        </div>

        {/* Layer Selector */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveLayer("zones")}
            className={cn(
              "px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px] sm:text-xs",
              activeLayer === "zones"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Risk Polygons
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer("radar")}
            className={cn(
              "px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-[11px] sm:text-xs",
              activeLayer === "radar"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Doppler Radar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer("3km")}
            className={cn(
              "px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px] sm:text-xs",
              activeLayer === "3km"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            3 km Local Grid
          </button>
        </div>
      </div>

      {/* Map Surface Viewport */}
      <div className="relative w-full h-[340px] sm:h-[420px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Animated Doppler Radar Layer Overlay */}
        {activeLayer === "radar" && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex items-center justify-center">
            {/* Top-Right Radar Active Badge */}
            <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl border border-sky-500/30 text-[10px] sm:text-[11px] font-mono text-sky-400 flex items-center gap-1.5 sm:gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-sky-200">DOPPLER SWEEP ACTIVE</span>
              <span className="text-sky-500 hidden xs:inline">&bull; 1 km² GRID</span>
            </div>

            {/* Rotating 360° Radar Sweep Sector */}
            <svg
              className="w-[800px] h-[800px] absolute opacity-70"
              viewBox="0 0 600 600"
            >
              <defs>
                <linearGradient id="gisRadarCone" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#0284c7" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>
              </defs>

              <g transform="translate(300, 300)">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 0 0"
                  to="360 0 0"
                  dur="4.5s"
                  repeatCount="indefinite"
                />
                <path
                  d="M 0 0 L 260 -110 A 280 280 0 0 1 280 0 Z"
                  fill="url(#gisRadarCone)"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="280"
                  y2="0"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>
        )}

        {/* 3 km Coverage Status Pill (Top-Left) */}
        <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-1.5rem)] sm:max-w-none bg-white/95 backdrop-blur-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-[11px] sm:text-xs font-mono flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
          <span className="font-sans font-bold text-slate-800 flex-shrink-0">3 km Radius:</span>
          {stationsWithin3km.length > 0 ? (
            <span className="text-emerald-700 font-bold truncate">
              {stationsWithin3km.length} Node{stationsWithin3km.length > 1 ? "s" : ""} Active
            </span>
          ) : (
            <span className="text-slate-500 truncate">Monitoring</span>
          )}
        </div>

        {/* Selected Zone Inspector Modal Overlay (Anchors to Bottom on mobile to avoid blocking top pill) */}
        {selectedZone && (
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-auto sm:top-3 sm:right-3 sm:left-auto sm:max-w-xs z-20 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-200 text-xs animate-fadeIn max-h-[220px] sm:max-h-none overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getSeverityColor(selectedZone.severity) }}
                />
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{selectedZone.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex-shrink-0">
                  {selectedZone.severity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CloudLightning className="w-3.5 h-3.5 text-amber-500" />
                  <span>Thunderstorm:</span>
                </span>
                <span className="font-bold text-slate-900">{selectedZone.thunderstormProb}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CloudHail className="w-3.5 h-3.5 text-blue-500" />
                  <span>Hail:</span>
                </span>
                <span className="font-bold text-slate-900">{selectedZone.hailProb}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-rose-500" />
                  <span>Extreme Rainfall:</span>
                </span>
                <span className="font-bold text-slate-900">{selectedZone.extremeRainProb}%</span>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
                <span>
                  ETA: <strong>{selectedZone.expectedTime}</strong>
                </span>
                <span>
                  Confidence: <strong className="text-blue-600">{selectedZone.confidencePercent}%</strong>
                </span>
              </div>

              {/* Ask AI About This Area Button */}
              {onAnalyzeZoneWithAI && (
                <button
                  type="button"
                  onClick={() => {
                    onAnalyzeZoneWithAI(selectedZone);
                    setSelectedZone(null);
                  }}
                  className="w-full mt-2 py-1.5 sm:py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ask AI About This Area</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Clean Map Legend (Bottom-Left - Hidden on mobile if zone inspector is open) */}
        <div className={cn(
          "absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl shadow-md border border-slate-200 text-[10px] space-y-1",
          selectedZone ? "hidden sm:block" : "block"
        )}>
          <div className="font-bold text-slate-700 uppercase tracking-wider mb-0.5 sm:mb-1">
            Convective Risk
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-slate-700 font-medium">Severe Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-700 font-medium">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-medium">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-slate-700 font-medium">Low / Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}
