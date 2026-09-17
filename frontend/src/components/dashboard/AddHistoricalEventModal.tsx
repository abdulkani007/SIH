import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  ShieldAlert,
  Zap,
  CloudRain,
  Radio,
  FileText,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  historyService,
  type HistoricalEvent,
  type HistoricalEventCreateData,
  type HistoricalTimelineStep,
  type SeverityLevel,
  type DataType,
  type EventType,
} from '@/services/historyService';

interface AddHistoricalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (event: HistoricalEvent) => void;
  initialData?: HistoricalEvent | null;
  defaultLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

const EVENT_TYPES: EventType[] = [
  'Thunderstorm',
  'Hailstorm',
  'Extreme Rainfall',
  'Cloudburst',
  'Squall Line',
  'Other',
];

const SEVERITY_LEVELS: SeverityLevel[] = ['Low', 'Moderate', 'High', 'Severe'];

const SOURCE_SUGGESTIONS = [
  'IMD DWR (Doppler Weather Radar)',
  'Micro-AWS Telemetry Station',
  'Tomorrow.io Weather Service',
  'Manual Ground Meteorological Observation',
  'State Disaster Management Authority (SDMA)',
  'Other Meteorological Archive',
];

export default function AddHistoricalEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultLocation,
}: AddHistoricalEventModalProps) {
  const isEditMode = Boolean(initialData);

  // Form State
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<EventType>('Thunderstorm');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('Moderate');
  const [dataType, setDataType] = useState<DataType>('Demonstration Dataset');
  const [maxRainfall, setMaxRainfall] = useState<string>('');
  const [maxRadarDbz, setMaxRadarDbz] = useState<string>('');
  const [hailOccurred, setHailOccurred] = useState<boolean>(false);
  const [hailSizeCm, setHailSizeCm] = useState<string>('');
  const [thunderstormOccurred, setThunderstormOccurred] = useState<boolean>(true);
  const [source, setSource] = useState<string>('IMD DWR (Doppler Weather Radar)');
  const [sourceReference, setSourceReference] = useState('');
  const [notes, setNotes] = useState('');

  // Hourly Timeline Steps (Optional T0 to T+6)
  const [showTimelineEditor, setShowTimelineEditor] = useState<boolean>(false);
  const [timelineSteps, setTimelineSteps] = useState<HistoricalTimelineStep[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form fields
  useEffect(() => {
    if (initialData) {
      setEventName(initialData.eventName || '');
      setEventType((initialData.eventType as EventType) || 'Thunderstorm');
      setLocationName(initialData.locationName || '');
      setLatitude(initialData.latitude?.toString() || '');
      setLongitude(initialData.longitude?.toString() || '');
      setEventDate(initialData.eventDate || '');
      setStartTime(initialData.startTime || '');
      setEndTime(initialData.endTime || '');
      setSeverity(initialData.severity || 'Moderate');
      setDataType(initialData.dataType || 'Demonstration Dataset');
      setMaxRainfall(initialData.maxRainfall != null ? initialData.maxRainfall.toString() : '');
      setMaxRadarDbz(initialData.maxRadarDbz != null ? initialData.maxRadarDbz.toString() : '');
      setHailOccurred(Boolean(initialData.hailOccurred));
      setHailSizeCm(initialData.hailSizeCm != null ? initialData.hailSizeCm.toString() : '');
      setThunderstormOccurred(Boolean(initialData.thunderstormOccurred));
      setSource(initialData.source || 'IMD DWR (Doppler Weather Radar)');
      setSourceReference(initialData.sourceReference || '');
      setNotes(initialData.notes || '');

      if (initialData.timelineSteps && initialData.timelineSteps.length > 0) {
        setTimelineSteps(initialData.timelineSteps);
        setShowTimelineEditor(true);
      } else {
        setTimelineSteps([]);
        setShowTimelineEditor(false);
      }
    } else {
      // Default / New Record
      setEventName('');
      setEventType('Thunderstorm');
      setLocationName(defaultLocation?.name || '');
      setLatitude(defaultLocation?.latitude != null ? defaultLocation.latitude.toString() : '');
      setLongitude(defaultLocation?.longitude != null ? defaultLocation.longitude.toString() : '');
      setEventDate(new Date().toISOString().split('T')[0]);
      setStartTime('14:00 IST');
      setEndTime('17:00 IST');
      setSeverity('Moderate');
      setDataType('Demonstration Dataset');
      setMaxRainfall('');
      setMaxRadarDbz('');
      setHailOccurred(false);
      setHailSizeCm('');
      setThunderstormOccurred(true);
      setSource('IMD DWR (Doppler Weather Radar)');
      setSourceReference('');
      setNotes('');
      setTimelineSteps([]);
      setShowTimelineEditor(false);
    }
    setErrorMessage(null);
  }, [initialData, defaultLocation, isOpen]);

  if (!isOpen) return null;

  // Add standard 7 steps (T0 - T+6) helper
  const handlePopulateDefaultSteps = () => {
    const baseRain = parseFloat(maxRainfall) || 35;
    const baseDbz = parseFloat(maxRadarDbz) || 45;

    const steps: HistoricalTimelineStep[] = [
      { step: 'T0', timeOffset: '00:00', radarDbz: Math.round(baseDbz * 0.4), rainRateMmH: Math.round(baseRain * 0.2), thunderstorm: 'Confirmed', hail: 'None', summary: 'Convective initiation recorded' },
      { step: 'T+1', timeOffset: '+01:00', radarDbz: Math.round(baseDbz * 0.65), rainRateMmH: Math.round(baseRain * 0.5), thunderstorm: 'Confirmed', hail: 'None', summary: 'Core updraft intensification' },
      { step: 'T+2', timeOffset: '+02:00', radarDbz: Math.round(baseDbz * 0.85), rainRateMmH: Math.round(baseRain * 0.8), thunderstorm: 'Confirmed', hail: hailOccurred ? 'Confirmed' : 'None', summary: 'Peak vertical development' },
      { step: 'T+3', timeOffset: '+03:00', radarDbz: baseDbz, rainRateMmH: baseRain, thunderstorm: 'Confirmed', hail: hailOccurred ? 'Confirmed' : 'None', summary: 'Maximum reflectivity and peak precipitation rate' },
      { step: 'T+4', timeOffset: '+04:00', radarDbz: Math.round(baseDbz * 0.8), rainRateMmH: Math.round(baseRain * 0.7), thunderstorm: 'Confirmed', hail: 'None', summary: 'Precipitation downdraft phase' },
      { step: 'T+5', timeOffset: '+05:00', radarDbz: Math.round(baseDbz * 0.5), rainRateMmH: Math.round(baseRain * 0.35), thunderstorm: 'Confirmed', hail: 'None', summary: 'Convective cell dissipation' },
      { step: 'T+6', timeOffset: '+06:00', radarDbz: Math.round(baseDbz * 0.3), rainRateMmH: Math.round(baseRain * 0.1), thunderstorm: 'None', hail: 'None', summary: 'System clearance and stratiform anvil' },
    ];
    setTimelineSteps(steps);
    setShowTimelineEditor(true);
  };

  const handleStepChange = (index: number, field: keyof HistoricalTimelineStep, val: any) => {
    setTimelineSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveStep = (index: number) => {
    setTimelineSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddEmptyStep = () => {
    const nextIdx = timelineSteps.length;
    const newStep: HistoricalTimelineStep = {
      step: nextIdx === 0 ? 'T0' : `T+${nextIdx}`,
      timeOffset: nextIdx === 0 ? '00:00' : `+0${nextIdx}:00`,
      radarDbz: null,
      rainRateMmH: null,
      thunderstorm: 'Confirmed',
      hail: 'None',
      summary: 'Observation recorded',
    };
    setTimelineSteps((prev) => [...prev, newStep]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!eventName.trim()) {
      setErrorMessage('Event Name is required.');
      return;
    }
    if (!locationName.trim()) {
      setErrorMessage('Location Name is required.');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMessage('Latitude must be a valid number between -90 and 90 degrees.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setErrorMessage('Longitude must be a valid number between -180 and 180 degrees.');
      return;
    }
    if (!eventDate.trim()) {
      setErrorMessage('Event Date is required.');
      return;
    }
    if (!startTime.trim()) {
      setErrorMessage('Start Time is required.');
      return;
    }
    if (!source.trim()) {
      setErrorMessage('Source / Agency is required.');
      return;
    }

    const payload: HistoricalEventCreateData = {
      eventName: eventName.trim(),
      eventType,
      locationName: locationName.trim(),
      latitude: lat,
      longitude: lon,
      eventDate: eventDate.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim() || undefined,
      severity,
      dataType,
      maxRainfall: maxRainfall.trim() ? parseFloat(maxRainfall) : undefined,
      maxRadarDbz: maxRadarDbz.trim() ? parseFloat(maxRadarDbz) : undefined,
      hailOccurred,
      hailSizeCm: hailOccurred && hailSizeCm.trim() ? parseFloat(hailSizeCm) : undefined,
      thunderstormOccurred,
      source: source.trim(),
      sourceReference: sourceReference.trim() || undefined,
      notes: notes.trim() || undefined,
      timelineSteps: showTimelineEditor && timelineSteps.length > 0 ? timelineSteps : undefined,
    };

    setIsSubmitting(true);
    try {
      let savedEvent: HistoricalEvent;
      if (isEditMode && initialData) {
        savedEvent = await historyService.updateHistoricalEvent(initialData.eventId, payload);
      } else {
        savedEvent = await historyService.createHistoricalEvent(payload);
      }
      onSuccess(savedEvent);
      onClose();
    } catch (err: any) {
      console.error('Error saving historical event:', err);
      setErrorMessage(err?.message || 'Failed to save historical event record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden text-left my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {isEditMode ? 'Edit Historical Record' : 'Add Historical Data'}
              </span>
              <span className="text-xs text-slate-400">• Archive Management</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
              {isEditMode ? 'Modify Calibrated Historical Event' : 'Record New Historical Event'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode
                ? 'Update archived storm parameters and time-series replay data.'
                : 'Add a verified historical event or demonstration dataset with full data provenance.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Unable to save: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Section 1: Dataset Provenance & Data Type Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              <span>Data Provenance & Classification *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={cn(
                  'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all',
                  dataType === 'Demonstration Dataset'
                    ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                )}
              >
                <input
                  type="radio"
                  name="dataType"
                  value="Demonstration Dataset"
                  checked={dataType === 'Demonstration Dataset'}
                  onChange={() => setDataType('Demonstration Dataset')}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">Demonstration Dataset</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      DEMO DATA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Intended for calibration testing, exercises, and UI replay demonstrations. Displayed with prominent DEMO label.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all',
                  dataType === 'Verified Historical Data'
                    ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                )}
              >
                <input
                  type="radio"
                  name="dataType"
                  value="Verified Historical Data"
                  checked={dataType === 'Verified Historical Data'}
                  onChange={() => setDataType('Verified Historical Data')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">Verified Historical Data</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Official event backed by verified radar scans, AWS telemetry, or meteorological agency logs.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Event Core Identification */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Event Identification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Pollachi Severe Convective Hailstorm"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-2xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Event Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-blue-500 outline-none transition-all shadow-2xs"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Geographic Coordinates */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Geographic Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Pollachi, Coimbatore"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Latitude (°N) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 10.6609"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Longitude (°E) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 77.0048"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Date & Timing */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Event Date & Timings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="e.g. 14:30 IST"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">End Time (Optional)</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="e.g. 17:45 IST"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Meteorological Parameters & Threat Metrics */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>Convective Threat & Physical Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Severity Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-blue-500 outline-none transition-all shadow-2xs"
                >
                  {SEVERITY_LEVELS.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-blue-500" />
                  <span>Max Rainfall (mm/h)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={maxRainfall}
                  onChange={(e) => setMaxRainfall(e.target.value)}
                  placeholder="e.g. 78.5"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Max Radar (dBZ)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={maxRadarDbz}
                  onChange={(e) => setMaxRadarDbz(e.target.value)}
                  placeholder="e.g. 62.0"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Specific Convective Hazard Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {/* Thunderstorm Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Thunderstorm Occurred</div>
                  <div className="text-[11px] text-slate-500">Electrical discharge / lightning detected</div>
                </div>
                <button
                  type="button"
                  onClick={() => setThunderstormOccurred(!thunderstormOccurred)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative cursor-pointer',
                    thunderstormOccurred ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                      thunderstormOccurred ? 'translate-x-6' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Hail Toggle & Size */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Hail Occurred</div>
                  <div className="text-[11px] text-slate-500">Solid ice precipitation recorded</div>
                </div>
                <button
                  type="button"
                  onClick={() => setHailOccurred(!hailOccurred)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative cursor-pointer',
                    hailOccurred ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                      hailOccurred ? 'translate-x-6' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {hailOccurred && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700">
                    Reported Hail Diameter (cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={hailSizeCm}
                    onChange={(e) => setHailSizeCm(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:border-blue-500 outline-none shadow-2xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Source & Provenance Attribution */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Source Attribution & Reference</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Source / Agency <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="source-suggestions"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. IMD DWR or Micro-AWS Station"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                  required
                />
                <datalist id="source-suggestions">
                  {SOURCE_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Source Reference / Station ID / Log
                </label>
                <input
                  type="text"
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  placeholder="e.g. DWR-KKL Volumetric Scan #42 or AWS-Pollachi"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Event Summary & Meteorological Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief description of atmospheric triggers, convective trajectory, or damage reports..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* Section 7: Optional Hourly Replay Data (T0 to T+6) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Hourly Time-Series Replay Data (Optional T0 to T+6)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {timelineSteps.length > 0
                      ? `${timelineSteps.length} hourly reconstruction steps defined.`
                      : 'If omitted, event will be recorded without animated step sequence.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {timelineSteps.length === 0 ? (
                  <button
                    type="button"
                    onClick={handlePopulateDefaultSteps}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    + Generate 7-Step Sequence
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleAddEmptyStep}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Step</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimelineSteps([]);
                        setShowTimelineEditor(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Clear Steps
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Steps Table / List */}
            {timelineSteps.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2">
                <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  <span className="col-span-2">Step</span>
                  <span className="col-span-2">Offset</span>
                  <span className="col-span-2">Radar (dBZ)</span>
                  <span className="col-span-2">Rain (mm/h)</span>
                  <span className="col-span-3">Summary</span>
                  <span className="col-span-1 text-right">Del</span>
                </div>

                {timelineSteps.map((st, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs">
                    <input
                      type="text"
                      value={st.step}
                      onChange={(e) => handleStepChange(idx, 'step', e.target.value)}
                      className="col-span-2 px-2 py-1 rounded border border-slate-200 font-bold font-mono text-[11px]"
                    />
                    <input
                      type="text"
                      value={st.timeOffset}
                      onChange={(e) => handleStepChange(idx, 'timeOffset', e.target.value)}
                      className="col-span-2 px-2 py-1 rounded border border-slate-200 font-mono text-[11px]"
                    />
                    <input
                      type="number"
                      value={st.radarDbz != null ? st.radarDbz : ''}
                      onChange={(e) =>
                        handleStepChange(idx, 'radarDbz', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder="dBZ"
                      className="col-span-2 px-2 py-1 rounded border border-slate-200 font-mono text-[11px]"
                    />
                    <input
                      type="number"
                      value={st.rainRateMmH != null ? st.rainRateMmH : ''}
                      onChange={(e) =>
                        handleStepChange(idx, 'rainRateMmH', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder="mm/h"
                      className="col-span-2 px-2 py-1 rounded border border-slate-200 font-mono text-[11px]"
                    />
                    <input
                      type="text"
                      value={st.summary || ''}
                      onChange={(e) => handleStepChange(idx, 'summary', e.target.value)}
                      placeholder="Step note"
                      className="col-span-3 px-2 py-1 rounded border border-slate-200 text-[11px]"
                    />
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Delete step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditMode ? 'Update Event Record' : 'Save Historical Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
