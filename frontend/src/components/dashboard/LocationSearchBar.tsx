import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Loader2, X, Compass, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  locationService,
  type GeocodedLocationResult,
  type ActiveLocation,
} from "@/services/locationService";

interface LocationSearchBarProps {
  activeLocation?: ActiveLocation | null;
  onSelectLocation: (loc: GeocodedLocationResult) => void;
  onUseLiveGps: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function LocationSearchBar({
  activeLocation,
  onSelectLocation,
  onUseLiveGps,
  className,
  placeholder = "Search city, district, or place (e.g. Pollachi, Cuddalore)...",
  autoFocus = false,
}: LocationSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedLocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for typing suggestions
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await locationService.searchLocations(trimmed);
        setResults(res);
        setHasSearched(true);
      } catch (err: any) {
        console.error("Geocoding search failed:", err);
        setSearchError("Unable to fetch location suggestions. Please verify your connection.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Execute immediate search on Enter or search button click
  const executeImmediateSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean || clean.length < 2) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setIsLoading(true);
    setSearchError(null);
    setIsOpen(true);
    setHasSearched(true);

    try {
      const fetched = await locationService.searchLocations(clean);
      setResults(fetched);
      if (fetched.length > 0) {
        // Automatically select best matching real location
        handleSelectResult(fetched[0]);
      } else {
        setIsOpen(true);
        setSelectedIndex(-1);
      }
    } catch (err: any) {
      console.error("Immediate geocoding search failed:", err);
      setSearchError("Geocoding service unavailable. Please check your network connection.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation and Enter key
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    const totalItems = results.length + 1; // +1 for "Use Current Live Location"

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev + 1 >= totalItems ? 0 : prev + 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev - 1 < 0 ? totalItems - 1 : prev - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      // Case 1: User explicitly navigated to "Use Current Live GPS"
      if (selectedIndex === 0) {
        handleSelectLiveGps();
        return;
      }

      // Case 2: User explicitly navigated to a specific suggestion from list
      if (selectedIndex > 0 && results[selectedIndex - 1]) {
        handleSelectResult(results[selectedIndex - 1]);
        return;
      }

      // Case 3: User typed a location name and hit Enter directly!
      const trimmed = query.trim();
      if (!trimmed) return;

      // If matching results already loaded in dropdown, select top match immediately
      if (results.length > 0) {
        handleSelectResult(results[0]);
        return;
      }

      // Otherwise execute immediate search and select top match
      await executeImmediateSearch(trimmed);
      return;
    }
  };

  const handleSelectResult = (item: GeocodedLocationResult) => {
    onSelectLocation(item);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setSearchError(null);
    setHasSearched(false);
  };

  const handleSelectLiveGps = () => {
    onUseLiveGps();
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setSearchError(null);
    setHasSearched(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Bar Input */}
      <div className="relative flex items-center w-full">
        <button
          type="button"
          onClick={() => executeImmediateSearch(query)}
          disabled={isLoading || query.trim().length < 2}
          title="Search this location (Press Enter)"
          className="absolute left-3 flex items-center text-slate-400 hover:text-cyan-400 disabled:hover:text-slate-400 cursor-pointer transition-colors p-1"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
            setSearchError(null);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-[#12141c] hover:bg-[#161922] focus:bg-[#161922] text-white text-xs sm:text-sm pl-10 pr-9 py-2 sm:py-2.5 rounded-xl sm:rounded-full border border-slate-700/80 focus:border-cyan-500/70 shadow-inner outline-none transition-all placeholder:text-slate-500 font-sans"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setSearchError(null);
              setHasSearched(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-[#0f1118] border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Option: Live GPS Location */}
          <div className="p-1 border-b border-slate-800">
            <button
              type="button"
              onClick={handleSelectLiveGps}
              className={cn(
                "w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-colors group cursor-pointer",
                selectedIndex === 0 || activeLocation?.source === "gps"
                  ? "bg-cyan-950/40 border border-cyan-500/30 text-cyan-300"
                  : "hover:bg-white/5 text-slate-300"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Use Current Live GPS Location</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Device GPS &bull; High Precision Satellite Telemetry
                  </div>
                </div>
              </div>

              {activeLocation?.source === "gps" && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ACTIVE
                </span>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {searchError && (
            <div className="p-3 bg-rose-950/40 border-b border-rose-900/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Search Results List */}
          <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
            {isLoading && results.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Searching meteorological sectors via OpenStreetMap...</span>
              </div>
            )}

            {!isLoading && query.trim().length >= 2 && results.length === 0 && hasSearched && !searchError && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                <Compass className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <div className="font-semibold text-slate-300">No sectors found for "{query}"</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Try typing a city or district name (e.g. Pollachi, Cuddalore, Salem)
                </div>
              </div>
            )}

            {results.map((item, idx) => {
              const isSelected = selectedIndex === idx + 1;
              const isCurrentActive =
                activeLocation?.source === "search" &&
                activeLocation.name.toLowerCase() === item.name.toLowerCase();

              return (
                <button
                  key={`${item.latitude}-${item.longitude}-${idx}`}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className={cn(
                    "w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer",
                    isSelected
                      ? "bg-cyan-950/60 border border-cyan-500/40 text-white"
                      : isCurrentActive
                      ? "bg-blue-950/40 border border-blue-500/30 text-white"
                      : "hover:bg-white/5 text-slate-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span className="truncate">{item.name}</span>
                        {item.type && (
                          <span className="text-[9px] uppercase tracking-wider font-mono font-medium text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/40">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[170px] sm:max-w-[280px]">
                        {item.displayName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <div className="text-[10px] font-mono text-slate-400">
                      {item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E
                    </div>
                    {isCurrentActive && (
                      <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        VIEWING
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Hint Ribbon */}
          <div className="px-3 py-1.5 bg-[#090a0f] border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Press Enter to select top result</span>
            <span className="hidden sm:inline">Press Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
