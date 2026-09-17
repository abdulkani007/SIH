import { useState, useEffect } from "react";
import { Radio, MapPin, Navigation, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import WeatherOverview from "@/components/dashboard/WeatherOverview";
import ThreatOverview from "@/components/dashboard/ThreatOverview";
import NowcastTimeline from "@/components/dashboard/NowcastTimeline";
import RiskMap from "@/components/dashboard/RiskMap";
import StormTracking from "@/components/dashboard/StormTracking";
import WarningPanel from "@/components/dashboard/WarningPanel";
import WeatherConditions from "@/components/dashboard/WeatherConditions";
import StormJourneyTimeline from "@/components/dashboard/StormJourneyTimeline";
import LiveInformationWaveGraph from "@/components/dashboard/LiveInformationWaveGraph";
import RecentAlerts from "@/components/dashboard/RecentAlerts";
import DataStatus from "@/components/dashboard/DataStatus";
import LocalCoveragePanel from "@/components/dashboard/LocalCoveragePanel";
import FloatingAIAssistant from "@/components/dashboard/FloatingAIAssistant";
import LocationSearchBar from "@/components/dashboard/LocationSearchBar";
import DemoSimulator, { type DemoStage } from "@/components/dashboard/DemoSimulator";
import HistoricalReplay from "@/components/dashboard/HistoricalReplay";

import {
  mockCurrentWeather,
  mockThreats,
  mockNowcastTimeline,
  mockStormCell,
  mockEarlyWarning,
  mockRiskZones,
  mockDataSources,
  type CurrentWeather,
  type HazardThreat,
  type NowcastStep,
  type StormCell,
  type EarlyWarning,
  type RiskZone,
  type AlertLog,
  type DataSourceStatus,
} from "@/data/mockWeather";

import { weatherService } from "@/services/weatherService";
import { authService, type UserProfile } from "@/services/authService";
import {
  locationService,
  type NearestStation,
  type GeoCoordinates,
  type LocalObservationPoint,
  type ActiveLocation,
  type GeocodedLocationResult,
} from "@/services/locationService";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());

  useEffect(() => {
    // If not authenticated or profile cannot be verified, trigger logout
    if (!authService.isAuthenticated()) {
      onLogout();
      return;
    }

    authService.getProfile().then((profile) => {
      if (!profile) {
        onLogout();
      } else {
        setCurrentUser(profile);
      }
    });
  }, [onLogout]);

  const [currentTab, setCurrentTab] = useState("Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Floating AI Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [selectedZoneForAI, setSelectedZoneForAI] = useState<RiskZone | null>(null);
  const [initialQueryForAI, setInitialQueryForAI] = useState<string | null>(null);

  // Master Location State (Single Source of Truth)
  const [activeLocation, setActiveLocation] = useState<ActiveLocation | null>(null);
  // Stored real browser GPS coordinates (for instantaneous "Back to Live Location")
  const [savedUserGpsCoords, setSavedUserGpsCoords] = useState<GeoCoordinates | null>(null);

  // GPS & Local 3km Coverage State
  const [userCoords, setUserCoords] = useState<GeoCoordinates | null>(null);
  const [stationsWithin3km, setStationsWithin3km] = useState<LocalObservationPoint[]>([]);
  const [nearestStation, setNearestStation] = useState<NearestStation | null>(null);

  // Meteorological Telemetry States
  const [weather, setWeather] = useState<CurrentWeather>(mockCurrentWeather);
  const [threats, setThreats] = useState<HazardThreat[]>(mockThreats);
  const [timeline, setTimeline] = useState<NowcastStep[]>(mockNowcastTimeline);
  const [selectedTimelineIdx, setSelectedTimelineIdx] = useState<number>(0);
  const [stormCell, setStormCell] = useState<StormCell>(mockStormCell);
  const [warning, setWarning] = useState<EarlyWarning>(mockEarlyWarning);
  const [riskZones, setRiskZones] = useState<RiskZone[]>(mockRiskZones);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>(mockDataSources);

  const loadDashboardDataForLocation = async (
    targetLat?: number,
    targetLon?: number,
    targetName?: string
  ) => {
    const effLat = targetLat !== undefined ? targetLat : (activeLocation?.latitude ?? userCoords?.latitude);
    const effLon = targetLon !== undefined ? targetLon : (activeLocation?.longitude ?? userCoords?.longitude);
    const coordParam =
      effLat !== undefined && effLon !== undefined
        ? { lat: effLat, lon: effLon }
        : undefined;
    const locationParam = targetName || activeLocation?.name || userCoords?.district || userCoords?.formattedLocation;

    // Reset timeline horizon selection index so it starts at initial state for the new location
    setSelectedTimelineIdx(0);

    // Fetch all location telemetry concurrently for rapid, atomic UI state transition
    const [wRes, tRes, tlRes, cRes, warnRes, zRes, aRes, dsRes] = await Promise.allSettled([
      weatherService.getCurrentWeather(coordParam, locationParam),
      weatherService.getThreatOverview(coordParam, locationParam),
      weatherService.getNowcastTimeline(coordParam, locationParam),
      weatherService.getStormCell(coordParam, locationParam),
      weatherService.getEarlyWarning(locationParam, coordParam),
      weatherService.getRiskZones(coordParam, locationParam),
      weatherService.getRecentAlerts(coordParam, locationParam),
      weatherService.getDataSources(),
    ]);

    if (wRes.status === "fulfilled" && wRes.value) {
      setWeather(wRes.value);
    }
    if (tRes.status === "fulfilled" && tRes.value?.length) {
      setThreats(tRes.value);
    }
    if (tlRes.status === "fulfilled" && tlRes.value?.length) {
      setTimeline(tlRes.value);
    }
    if (cRes.status === "fulfilled" && cRes.value) {
      setStormCell(cRes.value);
    }
    if (warnRes.status === "fulfilled" && warnRes.value) {
      setWarning(warnRes.value);
    }
    if (zRes.status === "fulfilled" && zRes.value?.length) {
      setRiskZones(zRes.value);
    }
    if (aRes.status === "fulfilled") {
      setAlerts(aRes.value || []);
    } else {
      setAlerts([]);
    }
    if (dsRes.status === "fulfilled" && dsRes.value?.length) {
      setDataSources(dsRes.value);
    }
  };

  const loadDashboardData = () => {
    if (activeLocation) {
      loadDashboardDataForLocation(activeLocation.latitude, activeLocation.longitude, activeLocation.name);
    } else if (userCoords) {
      loadDashboardDataForLocation(userCoords.latitude, userCoords.longitude, userCoords.district);
    } else {
      loadDashboardDataForLocation();
    }
  };

  // Real-time refresh when user opens the Alerts tab
  useEffect(() => {
    if (currentTab === "Alerts") {
      loadDashboardData();
    }
  }, [currentTab]);

  useEffect(() => {
    loadDashboardDataForLocation();
  }, []);

  // Handle GPS resolution from Header: immediately fetch real live weather for user's GPS
  const handleCoordinatesResolved = (coords: GeoCoordinates) => {
    setSavedUserGpsCoords(coords);
    setUserCoords(coords);

    const resolvedLocation = coords.district || coords.formattedLocation || "Local Weather Sector";
    const loc3km = `${resolvedLocation} (3 km Radius)`;

    const newActiveLoc: ActiveLocation = {
      name: resolvedLocation,
      formatted: coords.formattedLocation || `${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`,
      latitude: coords.latitude,
      longitude: coords.longitude,
      source: "gps",
      accuracyMeters: coords.accuracyMeters,
    };
    setActiveLocation(newActiveLoc);

    const nearby = locationService.getStationsWithin3km(
      coords.latitude,
      coords.longitude,
      resolvedLocation
    );
    setStationsWithin3km(nearby);

    const nearest = locationService.findNearestStation(coords.latitude, coords.longitude);
    setNearestStation(nearest);

    setWeather((prev) => ({ ...prev, location: resolvedLocation }));
    setWarning((prev) => ({
      ...prev,
      location: loc3km,
      description: `Atmospheric surveillance active within 3 km of ${resolvedLocation}.`,
    }));
    setStormCell((prev) => ({
      ...prev,
      currentLocation: `${resolvedLocation} Perimeter`,
    }));

    // Trigger full dashboard reload using the resolved GPS coordinates
    loadDashboardDataForLocation(coords.latitude, coords.longitude, resolvedLocation);
  };

  // Handle Searched Location Selection
  const handleSelectSearchedLocation = (result: GeocodedLocationResult) => {
    const newLoc: ActiveLocation = {
      name: result.name,
      formatted: result.displayName,
      latitude: result.latitude,
      longitude: result.longitude,
      source: "search",
    };
    setActiveLocation(newLoc);

    const nearby = locationService.getStationsWithin3km(
      result.latitude,
      result.longitude,
      result.name
    );
    setStationsWithin3km(nearby);

    const nearest = locationService.findNearestStation(result.latitude, result.longitude);
    setNearestStation(nearest);

    const loc3km = `${result.name} (3 km Radius)`;
    setWeather((prev) => ({ ...prev, location: result.name }));
    setWarning((prev) => ({
      ...prev,
      location: loc3km,
      description: `Atmospheric surveillance active within 3 km of ${result.name}.`,
    }));
    setStormCell((prev) => ({
      ...prev,
      currentLocation: `${result.name} Perimeter`,
    }));

    // Trigger full dashboard reload using the searched coordinates
    loadDashboardDataForLocation(result.latitude, result.longitude, result.name);
  };

  // Handle "Back to Live Location" button
  const handleBackToLiveLocation = async () => {
    if (savedUserGpsCoords) {
      handleCoordinatesResolved(savedUserGpsCoords);
    } else {
      const res = await locationService.getCurrentLocation();
      if (res.status === "granted" && res.coords) {
        handleCoordinatesResolved(res.coords);
      }
    }
  };

  const handleLocationResolved = (station: NearestStation) => {
    setNearestStation(station);
    if (!userCoords?.district && !activeLocation) {
      setWeather((prev) => ({
        ...prev,
        location: station.region,
      }));
      setWarning((prev) => ({
        ...prev,
        location: `${station.region} (3 km Radius)`,
      }));
    }
  };

  // Handle Nowcasting Timeline Step click to mutate dashboard state smoothly
  const handleTimelineStepSelect = (step: NowcastStep, idx: number) => {
    setSelectedTimelineIdx(idx);

    setThreats((prev) => [
      prev[0] ? { ...prev[0], probability: step.thunderstormProb } : prev[0],
      prev[1] ? { ...prev[1], probability: null, isAvailable: false } : prev[1],
      prev[2] ? { ...prev[2], probability: step.extremeRainfallProb } : prev[2],
    ]);

    // Calculate forecast storm position along 45° Northeast trajectory
    const baseLat = userCoords ? userCoords.latitude - 0.12 : 11.52;
    const baseLon = userCoords ? userCoords.longitude - 0.14 : 78.02;
    const forecastLat = Number((baseLat + idx * 0.052).toFixed(4));
    const forecastLon = Number((baseLon + idx * 0.052).toFixed(4));

    const etaText =
      idx === 0
        ? "38 min"
        : idx === 1
        ? "1h 15m (Outer Bands)"
        : idx === 2
        ? "Overhead (T+2h)"
        : `Passing Northeast (+${idx}h)`;

    setStormCell((prev) => ({
      ...prev,
      coordinates: [forecastLat, forecastLon],
      speedKmH: 26 + idx * 2,
      intensity: step.overallSeverity,
      expectedArrival: etaText,
    }));
  };

  // Handle Ask AI about this area from RiskMap
  const handleAnalyzeZoneWithAI = (zone: RiskZone) => {
    setSelectedZoneForAI(zone);
    setIsAssistantOpen(true);
  };

  const handleApplyDemoStage = (stage: DemoStage) => {
    if (stage.weather) {
      setWeather((prev) => ({ ...prev, ...stage.weather }));
    }
    if (stage.threats && stage.threats.length > 0) {
      setThreats(stage.threats as HazardThreat[]);
    }
    if (stage.stormCell) {
      setStormCell((prev) => ({ ...prev, ...stage.stormCell }));
    }
    if (stage.warning) {
      setWarning(stage.warning as EarlyWarning);
    }
  };

  // Switch tab with intelligent assistant behavior
  const handleSelectTab = (tab: string) => {
    if (tab === "AI Assistant") {
      setIsAssistantOpen(true);
    } else {
      setCurrentTab(tab);
      if (tab === "Alerts") {
        loadDashboardData();
      }
    }
  };

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] w-full bg-[#F1F5F9] text-slate-900 flex font-sans selection:bg-blue-500/20 selection:text-blue-700 relative overflow-hidden">
      {/* Background Geospatial Ambient Radar Orbs & Tech Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[650px] h-[650px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-indigo-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      {/* Sidebar - Remains static on the left */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        currentUser={currentUser}
      />

      {/* Main Column - Right side only scrolls */}
      <div className="flex-1 h-full min-w-0 flex flex-col overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          locationName={activeLocation?.name || weather.location}
          activeLocation={activeLocation}
          onSelectSearchedLocation={handleSelectSearchedLocation}
          onBackToLiveGps={handleBackToLiveLocation}
          onRefresh={loadDashboardData}
          onOpenDemoMode={() => setIsDemoModalOpen(true)}
          onLocationResolved={handleLocationResolved}
          onCoordinatesResolved={handleCoordinatesResolved}
          alerts={alerts}
          onLogout={onLogout}
          currentUser={currentUser}
        />

        {/* Operations Storm Simulation Modal */}
        <DemoSimulator
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
          onApplyStage={handleApplyDemoStage}
        />

        {/* Global Floating AI Assistant */}
        <FloatingAIAssistant
          isOpen={isAssistantOpen}
          onOpen={() => setIsAssistantOpen(true)}
          onClose={() => setIsAssistantOpen(false)}
          telemetry={{
            location: activeLocation ? activeLocation.name : weather.location,
            latitude: activeLocation ? activeLocation.latitude : userCoords?.latitude,
            longitude: activeLocation ? activeLocation.longitude : userCoords?.longitude,
            location_source: activeLocation?.source || (userCoords ? "gps" : "search"),
            source_label: activeLocation?.source === "search"
              ? `Searched Target: ${activeLocation.formatted}`
              : `Browser GPS (${activeLocation?.accuracyMeters ? `±${Math.round(activeLocation.accuracyMeters)}m` : 'Live Satellite'})`,
            temperature: weather.temperature,
            humidity: weather.humidity,
            pressure: weather.pressure,
            rainfall_rate: weather.rainfall,
            reflectivity_dbz: stormCell.maxReflectivityDbz,
            storm_cell_name: stormCell.name,
            storm_cell_speed: stormCell.speedKmH,
            storm_cell_direction: stormCell.direction,
            expected_arrival: stormCell.expectedArrival,
            threat_thunderstorm: threats[0]?.probability ?? 0,
            threat_hail: threats[1]?.probability ?? 0,
            threat_rain: threats[2]?.probability ?? 0,
          }}
          selectedZone={selectedZoneForAI}
          initialQuery={initialQueryForAI}
          onClearInitialQuery={() => setInitialQueryForAI(null)}
        />

        {/* Dashboard Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5 sm:space-y-6 pb-24">
          {/* Active Sector & Location Switcher Bar */}
          <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 sm:p-4 shadow-xl shadow-black/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div
              className={cn(
                "absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all",
                activeLocation?.source === "search" ? "bg-cyan-500/10" : "bg-emerald-500/10"
              )}
            />

            {/* Status & Current Location Display */}
            <div className="flex items-center gap-3 min-w-0 z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all",
                  activeLocation?.source === "search"
                    ? "bg-cyan-500/15 border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "bg-emerald-500/15 border-emerald-400/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                )}
              >
                {activeLocation?.source === "search" ? (
                  <MapPin className="w-5 h-5 animate-pulse" />
                ) : (
                  <Navigation className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                    {activeLocation ? activeLocation.name : weather.location}
                  </span>
                  {activeLocation?.source === "search" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                      SEARCHED LOCATION
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                      LIVE BROWSER GPS
                    </span>
                  )}
                  {activeLocation?.source === "search" && (
                    <button
                      type="button"
                      onClick={handleBackToLiveLocation}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm cursor-pointer whitespace-nowrap"
                      title="Return to your actual live GPS location"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Back to Live Location</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                  {activeLocation
                    ? `${activeLocation.formatted} • [${activeLocation.latitude.toFixed(4)}°N, ${activeLocation.longitude.toFixed(4)}°E]`
                    : userCoords
                    ? `${userCoords.formattedLocation || userCoords.district || "GPS Lock"} • [${userCoords.latitude.toFixed(4)}°N, ${userCoords.longitude.toFixed(4)}°E]`
                    : "Calibrating GPS coordinates & spatial telemetry..."}
                </p>
              </div>
            </div>

            {/* Quick Search Box directly on page */}
            <div className="w-full md:w-80 lg:w-96 flex-shrink-0 z-10">
              <LocationSearchBar
                activeLocation={activeLocation}
                onSelectLocation={handleSelectSearchedLocation}
                onUseLiveGps={handleBackToLiveLocation}
                placeholder="Search any place (e.g. Cuddalore)..."
              />
            </div>
          </div>

          {/* Operations Command Bar: Live Meteorological Intelligence Feed */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#0B1528] to-slate-900 text-white p-4 shadow-xl shadow-blue-950/10 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
            {/* Ambient Radial Accent */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 z-10">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 shadow-inner">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                    IMD Doppler Radar Convective Gateway
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    9.41 GHz X-BAND
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5 font-mono">
                  <span>Sector: <strong className="text-slate-200">{activeLocation?.name || weather.location}</strong></span>
                  <span>•</span>
                  <span>Spatial Grid: 1 km²</span>
                  <span>•</span>
                  <span>Lead Time: 0–6 Hours</span>
                  <span>•</span>
                  <span>3 km Precision Observation</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono z-10">
              <div className="hidden lg:flex flex-col items-end text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Volumetric Sweep Cycle</span>
                <span className="text-xs font-bold text-blue-300">T-34s • 14 Elevation Scans</span>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden lg:block" />
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span className="text-slate-200 text-xs font-bold">AI Convective Model Active</span>
              </div>
            </div>
          </div>
          {/* TAB: OVERVIEW (Full Operations Workstation) */}
          {currentTab === "Overview" && (
            <>
              {/* 1. Early Warning Alert Banner */}
              <WarningPanel warning={warning} userLocation={activeLocation?.name || weather.location} />

              {/* 2. Convective Threat Monitor */}
              <ThreatOverview threats={threats} />

              {/* 3. 3 km Local Weather Coverage (Based on True Browser GPS or Searched Target) */}
              <LocalCoveragePanel
                userCoords={userCoords}
                activeLocation={activeLocation}
                stationsWithin3km={stationsWithin3km}
                nearestStationName={nearestStation?.name}
                weather={weather}
              />

              {/* 4. Current Meteorological Conditions */}
              <WeatherOverview
                weather={weather}
                nearestStationName={nearestStation?.name}
                nearestStationDistance={nearestStation?.distanceKm}
              />

              {/* 5. 0–6 Hour Nowcast Timeline */}
              <NowcastTimeline
                steps={timeline}
                selectedIdx={selectedTimelineIdx}
                onSelectStep={handleTimelineStepSelect}
              />

              {/* 6. GIS Convective Risk Map + Storm Kinematics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-8 flex flex-col">
                  <RiskMap
                    riskZones={riskZones}
                    stormCell={stormCell}
                    userCoords={userCoords}
                    activeLocation={activeLocation}
                    stationsWithin3km={stationsWithin3km}
                    onAnalyzeZoneWithAI={handleAnalyzeZoneWithAI}
                  />
                </div>
                <div className="lg:col-span-4 flex flex-col justify-between">
                  <StormTracking
                    cell={stormCell}
                    distanceFromUserKm={
                      activeLocation
                        ? locationService.calculateDistanceKm(
                            activeLocation.latitude,
                            activeLocation.longitude,
                            stormCell.coordinates[0],
                            stormCell.coordinates[1]
                          )
                        : (userCoords
                          ? locationService.calculateDistanceKm(
                              userCoords.latitude,
                              userCoords.longitude,
                              stormCell.coordinates[0],
                              stormCell.coordinates[1]
                            )
                          : (nearestStation?.distanceKm || 18.4))
                    }
                  />
                </div>
              </div>

              {/* 7. Storm Journey & 6-Hour Threat Timeline */}
              <StormJourneyTimeline
                steps={timeline}
                selectedIdx={selectedTimelineIdx}
                onSelectStep={handleTimelineStepSelect}
                stormCell={stormCell}
                userCoords={
                  activeLocation
                    ? {
                        latitude: activeLocation.latitude,
                        longitude: activeLocation.longitude,
                        accuracyMeters: activeLocation.accuracyMeters || 10,
                        district: activeLocation.name,
                        formattedLocation: activeLocation.formatted,
                        timestamp: Date.now(),
                      }
                    : userCoords
                }
                userLocation={activeLocation?.name || weather.location}
              />

              {/* 8. Active Alerts & Data Status */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-6 flex flex-col">
                  <RecentAlerts alerts={alerts} />
                </div>
                <div className="lg:col-span-6 flex flex-col">
                  <DataStatus sources={dataSources} />
                </div>
              </div>
            </>
          )}

          {/* TAB: LIVE WEATHER */}
          {currentTab === "Live Weather" && (
            <div className="space-y-6">
              <LocalCoveragePanel
                userCoords={userCoords}
                activeLocation={activeLocation}
                stationsWithin3km={stationsWithin3km}
                nearestStationName={nearestStation?.name}
                weather={weather}
              />
              <WeatherOverview
                weather={weather}
                nearestStationName={nearestStation?.name}
                nearestStationDistance={nearestStation?.distanceKm}
              />
              <WeatherConditions weather={weather} />
              <DataStatus sources={dataSources} />
            </div>
          )}

          {/* TAB: NOWCASTING */}
          {currentTab === "Nowcasting" && (
            <div className="space-y-6">
              <ThreatOverview threats={threats} />
              <LiveInformationWaveGraph
                steps={timeline}
                selectedIdx={selectedTimelineIdx}
                onSelectStep={handleTimelineStepSelect}
              />
              <StormJourneyTimeline
                steps={timeline}
                selectedIdx={selectedTimelineIdx}
                onSelectStep={handleTimelineStepSelect}
                stormCell={stormCell}
                userCoords={
                  activeLocation
                    ? {
                        latitude: activeLocation.latitude,
                        longitude: activeLocation.longitude,
                        accuracyMeters: activeLocation.accuracyMeters || 10,
                        district: activeLocation.name,
                        formattedLocation: activeLocation.formatted,
                        timestamp: Date.now(),
                      }
                    : userCoords
                }
                userLocation={activeLocation?.name || weather.location}
              />
              <NowcastTimeline
                steps={timeline}
                selectedIdx={selectedTimelineIdx}
                onSelectStep={handleTimelineStepSelect}
              />
            </div>
          )}

          {/* TAB: RISK MAP */}
          {currentTab === "Risk Map" && (
            <div className="space-y-6">
              <RiskMap
                riskZones={riskZones}
                stormCell={stormCell}
                userCoords={userCoords}
                activeLocation={activeLocation}
                stationsWithin3km={stationsWithin3km}
                onAnalyzeZoneWithAI={handleAnalyzeZoneWithAI}
              />
              <ThreatOverview threats={threats} />
            </div>
          )}

          {/* TAB: STORM TRACKING */}
          {currentTab === "Storm Tracking" && (
            <div className="space-y-6">
              {/* Full-width Convective Threat Monitor */}
              <ThreatOverview threats={threats} />

              {/* Kinematics (4 cols) & Geospatial Vector Map (8 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-4 flex flex-col">
                  <StormTracking
                    cell={stormCell}
                    distanceFromUserKm={
                      activeLocation
                        ? locationService.calculateDistanceKm(
                            activeLocation.latitude,
                            activeLocation.longitude,
                            stormCell.coordinates[0],
                            stormCell.coordinates[1]
                          )
                        : (userCoords
                          ? locationService.calculateDistanceKm(
                              userCoords.latitude,
                              userCoords.longitude,
                              stormCell.coordinates[0],
                              stormCell.coordinates[1]
                            )
                          : (nearestStation?.distanceKm || 18.4))
                    }
                  />
                </div>
                <div className="lg:col-span-8 flex flex-col">
                  <RiskMap
                    riskZones={riskZones}
                    stormCell={stormCell}
                    userCoords={userCoords}
                    activeLocation={activeLocation}
                    stationsWithin3km={stationsWithin3km}
                    onAnalyzeZoneWithAI={handleAnalyzeZoneWithAI}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALERTS */}
          {currentTab === "Alerts" && (
            <div className="space-y-6">
              <WarningPanel warning={warning} userLocation={activeLocation?.name || weather.location} />
              <RecentAlerts alerts={alerts} />
            </div>
          )}

          {/* TAB: HISTORICAL EVENTS */}
          {currentTab === "Historical Events" && (
            <div className="space-y-6">
              <HistoricalReplay
                activeLocation={activeLocation}
                userCoords={userCoords}
                onEventChange={loadDashboardData}
              />
            </div>
          )}
        </main>

        {/* Operational Footer */}
        <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200 text-xs text-slate-500 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">StormGuard AI</span>
              <span>• Convective-Scale Severe Weather Monitoring Workstation</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Station ID: {nearestStation ? nearestStation.id : "SLM-DWR-01"} • Convective-Scale Severe Weather Monitoring
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
