import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronDown,
  Menu,
  Zap,
  MapPin,
  RefreshCw,
  Bell,
  LogOut,
  Radio,
  Clock,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LocationSearchBar from "./LocationSearchBar";
import {
  locationService,
  type GeolocationStatus,
  type NearestStation,
  type GeoCoordinates,
  type ActiveLocation,
  type GeocodedLocationResult,
} from "@/services/locationService";
import { authService } from "@/services/authService";
import type { AlertLog } from "@/data/mockWeather";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  locationName?: string;
  activeLocation?: ActiveLocation | null;
  onSelectSearchedLocation?: (loc: GeocodedLocationResult) => void;
  onBackToLiveGps?: () => void;
  onRefresh?: () => void;
  onOpenDemoMode?: () => void;
  onLocationResolved?: (station: NearestStation) => void;
  onCoordinatesResolved?: (coords: GeoCoordinates) => void;
  alerts?: AlertLog[];
  onLogout?: () => void;
}

const NAV_TABS = [
  { id: "Overview", label: "Overview" },
  { id: "Nowcasting", label: "Nowcasting" },
  { id: "Live Weather", label: "Live Weather" },
  { id: "Risk Map", label: "Risk Map" },
  { id: "Storm Tracking", label: "Tracking" },
  { id: "Alerts", label: "Alerts" },
];

export default function Header({
  onOpenMobileMenu,
  currentTab = "Overview",
  onSelectTab,
  locationName = "Salem Doppler Radar Node",
  activeLocation,
  onSelectSearchedLocation,
  onBackToLiveGps,
  onRefresh,
  onOpenDemoMode,
  onLocationResolved,
  onCoordinatesResolved,
  alerts = [],
  onLogout,
}: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // GPS Geolocation state
  const [geoStatus, setGeoStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [detectedStation, setDetectedStation] = useState<NearestStation | null>(null);

  const requestGPS = async () => {
    setGeoStatus("detecting");
    const result = await locationService.getCurrentLocation();
    setGeoStatus(result.status);

    if (result.status === "granted" && result.coords) {
      setCoords(result.coords);
      onCoordinatesResolved?.(result.coords);
      if (result.nearestStation) {
        setDetectedStation(result.nearestStation);
        onLocationResolved?.(result.nearestStation);
      }
    }
  };

  useEffect(() => {
    requestGPS();
  }, []);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    requestGPS();
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.username || "Abdul";
  const userEmail = currentUser?.email || "abdul@stormguard.net";
  const initials = authService.getInitials(userName);

  const displayLocation = coords?.district
    ? coords.district
    : coords
    ? `${coords.latitude.toFixed(2)}°N, ${coords.longitude.toFixed(2)}°E`
    : locationName || "Detecting GPS...";

  return (
    <header className="sticky top-2.5 z-40 px-3 sm:px-6 select-none font-sans">
      <div className="w-full bg-[#0a0c10] text-white rounded-2xl sm:rounded-full border border-slate-800/90 shadow-2xl shadow-black/40 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 relative backdrop-blur-xl">
        {/* LEFT: Brand Wordmark (Faithfully matching fitonist styling) */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => onSelectTab?.("Overview")}
            className="flex items-center gap-1.5 tracking-tight hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <span className="text-lg sm:text-xl font-black text-white lowercase tracking-tight font-sans">
              stormguard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform shadow-[0_0_8px_#00d2ff]" />
          </button>
        </div>

        {/* CENTER: Segmented Capsule Navigation Tabs (Matching exact center pill) */}
        <nav className="hidden md:flex items-center bg-[#15171e] border border-white/10 rounded-full p-1 shadow-inner max-w-full overflow-x-auto no-scrollbar">
          {NAV_TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab?.(tab.id)}
                className={cn(
                  "px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-white text-slate-950 shadow-md shadow-black/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* RIGHT: Active Location Indicator + Search Button + User Profile Capsule */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Active Location Indicator Pill - Desktop */}
          {activeLocation?.source === "search" ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-xs font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold text-[10px] text-cyan-400 uppercase tracking-wider">SEARCHED LOCATION:</span>
              <span className="font-bold truncate max-w-[120px] text-white">{activeLocation.name}</span>
              <button
                type="button"
                onClick={onBackToLiveGps}
                className="ml-1 text-[10px] font-sans font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 px-2 py-0.5 rounded-full transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                title="Return to your actual GPS location"
              >
                Back to Live Location
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">LIVE BROWSER GPS:</span>
              <span className="font-bold truncate max-w-[140px] text-white">
                {activeLocation?.name || coords?.district || "Live GPS"}
              </span>
            </div>
          )}

          {/* Compact Location Indicator Pill - Mobile Only */}
          <div className="flex sm:hidden items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10 max-w-[105px] truncate">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse",
                activeLocation?.source === "search" ? "bg-cyan-400" : "bg-emerald-400"
              )}
            />
            <span className="truncate text-white font-bold">
              {activeLocation?.name || coords?.district || "GPS"}
            </span>
          </div>

          {/* Circular Search Button & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
              }}
              title="Search meteorological sector, city, or district"
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                isSearchOpen
                  ? "bg-white text-black border-white shadow-md"
                  : "bg-[#15171e] border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:bg-[#1c1e27]"
              )}
            >
              <Search className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Location Search Palette Popover */}
            {isSearchOpen && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 sm:max-w-none bg-[#12141c] border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Location &amp; Sector Search</span>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-slate-400 hover:text-white text-xs p-0.5 rounded hover:bg-white/10"
                  >
                    ✕
                  </button>
                </div>

                <LocationSearchBar
                  activeLocation={activeLocation}
                  autoFocus={true}
                  onSelectLocation={(loc) => {
                    onSelectSearchedLocation?.(loc);
                    setIsSearchOpen(false);
                  }}
                  onUseLiveGps={() => {
                    onBackToLiveGps?.();
                    setIsSearchOpen(false);
                  }}
                />

                <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="px-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Quick Navigation
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab?.("Overview");
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    📍 Active Sector: <strong className="text-cyan-400">{activeLocation?.name || displayLocation}</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab?.("Nowcasting");
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    ⚡ 0-6H Severe Convective Nowcast
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab?.("Risk Map");
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    🗺️ GIS Doppler Radar Map
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule (Faithfully matching right pill in Image 2) */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="bg-[#15171e] hover:bg-[#1a1d26] border border-white/10 hover:border-white/20 rounded-full pl-1 sm:pl-1.5 pr-3 sm:pr-4 py-1 flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer group"
            >
              {/* Circular Avatar (Initials or Clean User Icon) */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 flex-shrink-0 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {initials ? (
                  <span>{initials}</span>
                ) : (
                  <User className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Two-line User Name & Email */}
              <div className="text-left hidden sm:flex flex-col justify-center leading-tight">
                <span className="text-xs sm:text-[13px] font-bold text-white tracking-tight group-hover:text-slate-100 truncate max-w-[110px]">
                  {userName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]">
                  {userEmail}
                </span>
              </div>

              {/* Chevron Down Icon */}
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200",
                  isUserMenuOpen ? "transform rotate-180 text-white" : ""
                )}
              />
            </button>

            {/* Rich Operations User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] max-w-xs sm:w-72 bg-[#12141c] border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                {/* User Header Info */}
                <div className="pb-3 border-b border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-white/20 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-inner flex-shrink-0">
                    {initials ? (
                      <span>{initials}</span>
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">{userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</div>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Chief Meteorologist
                    </span>
                  </div>
                </div>

                {/* Operations & Location Status */}
                <div className="py-2.5 space-y-1.5 text-[11px] font-sans border-b border-white/10">
                  <div className="flex items-center justify-between text-slate-300 py-1 px-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      Station Position:
                    </span>
                    <strong className="text-white font-mono truncate max-w-[120px]">
                      {displayLocation} {geoStatus === "granted" ? "• Locked" : ""}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 py-1 px-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      Doppler Gateway:
                    </span>
                    <span className="text-emerald-400 font-semibold font-mono text-[10px]">
                      {detectedStation ? `${detectedStation.name} (${detectedStation.id})` : "Online (SLM-01)"}
                    </span>
                  </div>

                  {alerts && alerts.length > 0 && (
                    <div className="flex items-center justify-between text-rose-400 py-1 px-1">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <Bell className="w-3.5 h-3.5" />
                        Active Warnings:
                      </span>
                      <strong className="font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800 px-1.5 rounded text-[10px]">
                        {alerts.length} Active
                      </strong>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-300 py-1 px-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Current Time:
                    </span>
                    <span className="text-slate-300 font-mono text-[10px]">
                      {currentTime.toLocaleTimeString("en-IN", { hour12: true })} IST
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 space-y-1">
                  {onOpenDemoMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenDemoMode();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Trigger Storm Simulation
                      </span>
                      <span className="text-[10px] font-mono opacity-70">Demo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleManualRefresh();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-cyan-400")} />
                    Refresh Telemetry
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Tabs (shown below the header on small screens) */}
      <div className="md:hidden mt-2 px-1">
        <nav className="flex items-center bg-[#0a0c10] border border-slate-800 rounded-full p-1 shadow-lg overflow-x-auto no-scrollbar gap-1">
          {NAV_TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={`mobile-${tab.id}`}
                type="button"
                onClick={() => onSelectTab?.(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-white text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
