import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  MapPin,
  History,
  ShieldAlert,
  CloudRain,
  Zap,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  historyService,
  type HistoricalEvent,
} from "@/services/historyService";
import type { ActiveLocation, GeoCoordinates } from "@/services/locationService";
import AddHistoricalEventModal from "./AddHistoricalEventModal";

interface HistoricalReplayProps {
  activeLocation?: ActiveLocation | null;
  userCoords?: GeoCoordinates | null;
  onEventChange?: () => void;
}

export default function HistoricalReplay({
  activeLocation,
  userCoords,
  onEventChange,
}: HistoricalReplayProps) {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [filterDataType, setFilterDataType] = useState<string>("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInitialData, setModalInitialData] = useState<HistoricalEvent | null>(null);

  // Delete Confirmation State
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<HistoricalEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch real historical events from backend API
  const fetchEvents = () => {
    setIsLoading(true);
    historyService
      .getHistoricalEvents()
      .then((data) => {
        setEvents(data);
        if (data.length > 0) {
          // If previous selection exists in new data, preserve it; otherwise pick first
          setSelectedEventId((prev) => {
            if (prev && data.some((e) => e.eventId === prev)) {
              return prev;
            }
            return data[0].eventId;
          });
          setCurrentStepIdx(0);
        } else {
          setSelectedEventId(null);
        }
      })
      .catch((err) => {
        console.warn("Failed to load historical events:", err);
        setEvents([]);
        setSelectedEventId(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, [activeLocation, userCoords]);

  // Client-side filtering
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType !== "All" && ev.eventType !== filterType) return false;
      if (filterSeverity !== "All" && ev.severity !== filterSeverity) return false;
      if (filterDataType !== "All" && ev.dataType !== filterDataType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (ev.eventName || "").toLowerCase().includes(q);
        const matchesLoc = (ev.locationName || "").toLowerCase().includes(q);
        const matchesType = (ev.eventType || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesType) return false;
      }
      return true;
    });
  }, [events, filterType, filterSeverity, filterDataType, searchQuery]);

  // Ensure selected event is valid among filtered
  useEffect(() => {
    if (filteredEvents.length > 0) {
      if (!selectedEventId || !filteredEvents.some((e) => e.eventId === selectedEventId)) {
        setSelectedEventId(filteredEvents[0].eventId);
        setCurrentStepIdx(0);
      }
    } else {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  const currentEvent = events.find((e) => e.eventId === selectedEventId) || null;
  const timelineSteps = currentEvent?.timelineSteps || [];
  const activeStep =
    timelineSteps.length > 0 && currentStepIdx < timelineSteps.length
      ? timelineSteps[currentStepIdx]
      : null;

  const handleNext = () => {
    if (timelineSteps.length === 0) return;
    setCurrentStepIdx((prev) => (prev + 1) % timelineSteps.length);
  };

  const handlePrev = () => {
    if (timelineSteps.length === 0) return;
    setCurrentStepIdx(
      (prev) => (prev - 1 + timelineSteps.length) % timelineSteps.length
    );
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (event: HistoricalEvent) => {
    setModalInitialData(event);
    setIsModalOpen(true);
  };

  // Delete Action Handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmEvent) return;
    setIsDeleting(true);
    try {
      await historyService.deleteHistoricalEvent(deleteConfirmEvent.eventId);
      setDeleteConfirmEvent(null);
      fetchEvents();
      onEventChange?.();
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete historical event record.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Success callback from modal
  const handleModalSuccess = (savedEvent: HistoricalEvent) => {
    fetchEvents();
    setSelectedEventId(savedEvent.eventId);
    setCurrentStepIdx(0);
    onEventChange?.();
  };

  // Location prefill for modal
  const modalDefaultLocation = {
    name: activeLocation?.name || userCoords?.district || "Pollachi, Coimbatore",
    latitude: activeLocation?.latitude ?? userCoords?.latitude ?? 10.6609,
    longitude: activeLocation?.longitude ?? userCoords?.longitude ?? 77.0048,
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs text-left space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200">
              Historical Event Replay
            </span>
            <span className="text-xs text-slate-400">• Historical Event Analysis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2.5">
            <History className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
            <span>Replay Historical Convective Storm</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simulate 0–6 hour radar and multi-hazard evolution of calibrated severe weather events
          </p>
        </div>

        {/* Action Button: + Add Historical Data */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Historical Data</span>
          </button>
        </div>
      </div>

      {/* Filter and Event Selector Bar */}
      {!isLoading && events.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Event Selection Dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-700 shrink-0">Event:</span>
            <select
              value={selectedEventId || ""}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setCurrentStepIdx(0);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white hover:border-slate-300 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-2xs w-full max-w-md truncate"
            >
              {filteredEvents.map((ev) => (
                <option key={ev.eventId} value={ev.eventId}>
                  [{ev.dataType === "Demonstration Dataset" ? "DEMO" : "VERIFIED"}] {ev.eventName || ev.eventType} — {ev.locationName} ({ev.eventDate || ev.startTime})
                </option>
              ))}
            </select>
          </div>

          {/* Right: Quick Search and Type Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-blue-500 outline-none transition-all shadow-2xs w-full sm:w-44"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:border-slate-300 outline-none shadow-2xs cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Thunderstorm">Thunderstorm</option>
                <option value="Hailstorm">Hailstorm</option>
                <option value="Extreme Rainfall">Extreme Rainfall</option>
                <option value="Cloudburst">Cloudburst</option>
                <option value="Squall Line">Squall Line</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Severity Filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:border-slate-300 outline-none shadow-2xs cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Severe">Severe</option>
            </select>

            {/* Classification Filter */}
            <select
              value={filterDataType}
              onChange={(e) => setFilterDataType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:border-slate-300 outline-none shadow-2xs cursor-pointer"
            >
              <option value="All">All Provenance</option>
              <option value="Verified Historical Data">Verified Only</option>
              <option value="Demonstration Dataset">Demo Data Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs text-slate-500 font-mono">
            Querying verified historical archive...
          </p>
        </div>
      )}

      {/* Empty State: Shown when no historical records exist or filters return 0 */}
      {!isLoading && filteredEvents.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-3 shadow-2xs">
            <History className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {events.length === 0 ? "No historical events available" : "No matching historical records"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            {events.length === 0
              ? "Verified historical event data has not been loaded for this location."
              : "Try adjusting your filter or search query to view archived events."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Historical Data</span>
          </button>
        </div>
      )}

      {/* Active Historical Event View */}
      {!isLoading && currentEvent && (
        <>
          {/* Selected Event Details Banner */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-wrap">
                {/* Visual Classification Badge */}
                {currentEvent.dataType === "Demonstration Dataset" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    DEMO DATA
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    VERIFIED
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentEvent.locationName}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    [{currentEvent.latitude.toFixed(4)}°N, {currentEvent.longitude.toFixed(4)}°E]
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentEvent.eventDate || currentEvent.startTime}</span>
                </span>
                {currentEvent.source && (
                  <>
                    <span>•</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Source: {currentEvent.source}
                      {currentEvent.sourceReference ? ` (${currentEvent.sourceReference})` : ""}
                    </span>
                  </>
                )}
              </div>

              {/* Event Name & Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  {currentEvent.eventName || currentEvent.eventType}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-slate-200/80 text-slate-700">
                  {currentEvent.eventType}
                </span>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(currentEvent)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Edit Record"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmEvent(currentEvent)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-2xl">
                {currentEvent.notes ||
                  (currentEvent as any).description ||
                  "Calibrated meteorological event record stored in historical archive."}
              </p>
            </div>

            {/* Telemetry Metric Badges */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center font-mono min-w-[100px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  {currentEvent.maxRadarDbz != null || (currentEvent as any).radar ? "Peak Core" : "Radar Data"}
                </div>
                <div
                  className={cn(
                    "text-sm font-black mt-0.5",
                    currentEvent.maxRadarDbz != null || (currentEvent as any).radar
                      ? "text-rose-600"
                      : "text-slate-400 text-xs font-sans font-medium"
                  )}
                >
                  {currentEvent.maxRadarDbz != null
                    ? `${currentEvent.maxRadarDbz} dBZ`
                    : (currentEvent as any).radar || "Radar unavailable"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center font-mono min-w-[100px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  {currentEvent.maxRainfall != null || (currentEvent as any).rainfall ? "Max Precip" : "Precipitation"}
                </div>
                <div
                  className={cn(
                    "text-sm font-black mt-0.5",
                    currentEvent.maxRainfall != null || (currentEvent as any).rainfall
                      ? "text-blue-600"
                      : "text-slate-400 text-xs font-sans font-medium"
                  )}
                >
                  {currentEvent.maxRainfall != null
                    ? `${currentEvent.maxRainfall} mm/h`
                    : (currentEvent as any).rainfall || "Precip unavailable"}
                </div>
              </div>
            </div>
          </div>

          {/* Time-Series Replay or Unavailable State */}
          {timelineSteps.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-1">
                <History className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">
                Hourly replay data unavailable for this event.
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hourly T+0 to T+6 sequence observations have not been recorded for this event.
              </p>
              <button
                type="button"
                onClick={() => handleOpenEditModal(currentEvent)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                + Add Hourly Sequence Data
              </button>
            </div>
          ) : activeStep ? (
            <>
              {/* 0–6 Hour Timeline Step Selector (T0 to T+6) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Nowcast Reconstruction Steps (0–6 Hours)
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    Current: {activeStep.step} ({activeStep.timeOffset})
                  </span>
                </div>

                <div className="flex sm:grid sm:grid-cols-7 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
                  {timelineSteps.map((step, idx) => {
                    const isCurrent = currentStepIdx === idx;
                    const isPeak = idx === 3;
                    return (
                      <button
                        key={step.step}
                        type="button"
                        onClick={() => setCurrentStepIdx(idx)}
                        className={cn(
                          "p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer relative min-w-[62px] sm:min-w-0 flex-shrink-0 sm:flex-shrink",
                          isCurrent
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        {isPeak && !isCurrent && (
                          <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-rose-500 text-white">
                            PEAK
                          </span>
                        )}
                        <div className="text-xs font-black">{step.step}</div>
                        <div
                          className={cn(
                            "text-[10px] font-mono mt-0.5",
                            isCurrent ? "text-blue-100" : "text-slate-400"
                          )}
                        >
                          {step.radarDbz != null
                            ? `${step.radarDbz} dBZ`
                            : step.rainRateMmH != null
                            ? `${step.rainRateMmH} mm/h`
                            : step.timeOffset}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Step Radar Snapshot Card */}
              <div className="p-6 rounded-2xl bg-[#0B1120] text-white border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-black text-sm">
                      {activeStep.step}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">
                        Reconstructed Convective State at {activeStep.timeOffset}
                      </div>
                      <div className="text-xs text-slate-400">
                        {activeStep.summary || "Historical station observation recorded."}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Hazard Truthful Attribution */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                      ⚡ {activeStep.thunderstorm === "Confirmed"
                        ? "Thunderstorm: Confirmed"
                        : activeStep.thunderstorm != null
                        ? `Thunderstorm: ${activeStep.thunderstorm}`
                        : currentEvent.thunderstormOccurred
                        ? "Thunderstorm: Confirmed"
                        : "Thunderstorm data unavailable"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-900/50 text-amber-300 border border-amber-700/50">
                      ❄️ {activeStep.hail === "Confirmed"
                        ? "Hail: Confirmed"
                        : activeStep.hail != null
                        ? `Hail: ${activeStep.hail}`
                        : currentEvent.hailOccurred
                        ? `Hail: Confirmed ${currentEvent.hailSizeCm ? `(${currentEvent.hailSizeCm} cm)` : ""}`
                        : "Hail data unavailable"}
                    </span>
                  </div>
                </div>

                {/* 3 Telemetry Gauges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Radar Reflectivity */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeStep.radarDbz != null ? "Radar Reflectivity" : "Radar Observation"}</span>
                    </div>
                    {activeStep.radarDbz != null ? (
                      <>
                        <div className="text-2xl font-black font-mono text-amber-400 mt-2">
                          {activeStep.radarDbz}{" "}
                          <span className="text-xs font-normal text-slate-400">dBZ</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (activeStep.radarDbz / 70) * 100)}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm font-medium text-slate-400 mt-2">
                        Radar data unavailable
                      </div>
                    )}
                  </div>

                  {/* Precipitation Rate */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                      <span>Precipitation Rate</span>
                    </div>
                    {activeStep.rainRateMmH != null ? (
                      <>
                        <div className="text-2xl font-black font-mono text-blue-400 mt-2">
                          {activeStep.rainRateMmH}{" "}
                          <span className="text-xs font-normal text-slate-400">mm/h</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-blue-400 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (activeStep.rainRateMmH / 120) * 100)}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm font-medium text-slate-400 mt-2">
                        Precipitation data unavailable
                      </div>
                    )}
                  </div>

                  {/* Convective Threat Level & Source */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Convective Threat Level</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-rose-400 mt-2">
                      {currentEvent.severity.toUpperCase()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      Source: {activeStep.source || currentEvent.source}
                    </div>
                  </div>
                </div>

                {/* Step Navigation Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStepIdx === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ← Previous Step
                  </button>

                  <span className="font-mono text-slate-400 text-[11px]">
                    Step {currentStepIdx + 1} of {timelineSteps.length}
                  </span>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentStepIdx === timelineSteps.length - 1}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Add / Edit Historical Event Modal */}
      <AddHistoricalEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialData(null);
        }}
        onSuccess={handleModalSuccess}
        initialData={modalInitialData}
        defaultLocation={modalDefaultLocation}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full text-left space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Historical Event?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">
                {deleteConfirmEvent.eventName || deleteConfirmEvent.eventType}
              </div>
              <div className="text-slate-500">
                {deleteConfirmEvent.locationName} • {deleteConfirmEvent.eventDate} ({deleteConfirmEvent.startTime})
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Classification: {deleteConfirmEvent.dataType}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmEvent(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
