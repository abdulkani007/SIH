/**
 * StormGuard AI - Mock Weather & Nowcasting Data
 *
 * Designed to be completely decoupled from UI components.
 * Structured to seamlessly map to future FastAPI / ConvLSTM backend API payloads.
 */

export type SeverityLevel = "Low" | "Moderate" | "High" | "Severe";

export interface CurrentWeather {
  temperature: number;
  condition: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  rainfall: number;
  visibility: number;
  uvIndex: number;
  cloudCover: number;
  dewPoint: number;
  location: string;
  updatedAt: string;
}

export interface HazardThreat {
  id: string;
  title: string;
  subtitle?: string;
  isAvailable?: boolean;
  unavailableReason?: string;
  probability?: number | null;
  probabilityLabel?: string;
  severity: SeverityLevel;
  trend: "Increasing" | "Steady" | "Decreasing" | "Unavailable";
  trendValues?: number[];
  peakValue?: number | null;
  expectedWindow?: string;
  dataQuality?: string;
  sourceLabel?: string;
  predictionSource?: "KOLKATA_CONVLSTM" | "TOMORROW_IO_RISK_ENGINE";
  iconName: "thunderstorm" | "hail" | "rain";
  description: string;
  inputFactors?: Record<string, string>;
}

export interface NowcastStep {
  timeLabel: string;
  hourOffset: number;
  thunderstormProb: number;
  hailProb: number;
  extremeRainfallProb: number;
  overallSeverity: SeverityLevel;
  summary: string;
  expectedPrecipRate: string;
  predictionSource?: "KOLKATA_CONVLSTM" | "TOMORROW_IO_RISK_ENGINE";
  sourceLabel?: string;
}

export interface StormCell {
  id: string;
  name: string;
  currentLocation: string;
  coordinates: [number, number];
  direction: string;
  directionDegrees: number;
  speedKmH: number;
  intensity: SeverityLevel;
  expectedArrival: string;
  confidencePercent: number;
  echoTopKm: number;
  maxReflectivityDbz: number;
  predictionSource?: "KOLKATA_CONVLSTM" | "TOMORROW_IO_RISK_ENGINE";
  sourceLabel?: string;
}

export interface RiskZone {
  id: string;
  name: string;
  severity: SeverityLevel;
  coordinates: [number, number][];
  center: [number, number];
  thunderstormProb: number;
  hailProb: number;
  extremeRainProb: number;
  expectedTime: string;
  confidencePercent: number;
  affectedPopulation: string;
  predictionSource?: "KOLKATA_CONVLSTM" | "TOMORROW_IO_RISK_ENGINE";
  sourceLabel?: string;
}

export interface EarlyWarning {
  id: string;
  title: string;
  type: string;
  severity: SeverityLevel;
  description: string;
  location: string;
  expectedWindow: string;
  thunderstormProb: number;
  extremeRainProb: number;
  confidencePercent: number;
  issuedAt: string;
  predictionSource?: "KOLKATA_CONVLSTM" | "TOMORROW_IO_RISK_ENGINE";
  sourceLabel?: string;
}

export interface AlertLog {
  id: string;
  title: string;
  type?: string;
  location: string;
  timestamp: string;
  severity: SeverityLevel;
  source?: string;
  triggerValue?: string;
  threshold?: string;
  historicalEventId?: string;
  dataType?: string;
  isHistorical?: boolean;
  latitude?: number;
  longitude?: number;
  description?: string;
}

export interface DataSourceStatus {
  name: string;
  status: "Connected" | "Ready" | "Degraded";
  latencyMs: number;
  protocol: string;
}

// ==========================================
// MOCK DATA IMPLEMENTATIONS
// ==========================================

export const mockCurrentWeather: CurrentWeather = {
  temperature: 31,
  condition: "Partly Cloudy",
  feelsLike: 34,
  humidity: 84,
  windSpeed: 22,
  windDirection: "SW",
  pressure: 1008,
  rainfall: 12,
  visibility: 8,
  uvIndex: 6,
  cloudCover: 65,
  dewPoint: 24,
  location: "Detecting Location...",
  updatedAt: "Just now",
};

export const mockThreats: HazardThreat[] = [
  {
    id: "threat-1",
    title: "Thunderstorm",
    probability: 89,
    severity: "Severe",
    trend: "Increasing",
    iconName: "thunderstorm",
    description: "Rapid convective vertical uplift detected. High cloud-to-ground lightning density.",
  },
  {
    id: "threat-2",
    title: "Hail",
    probability: 64,
    severity: "High",
    trend: "Steady",
    iconName: "hail",
    description: "Strong updraft core exceeding 12km echo tops. Hailstones 15-25mm probable.",
  },
  {
    id: "threat-3",
    title: "Extreme Rainfall",
    probability: 78,
    severity: "Severe",
    trend: "Increasing",
    iconName: "rain",
    description: "High precipitable water content. Convective rainfall rates >45mm/h projected.",
  },
];

export const mockNowcastTimeline: NowcastStep[] = [
  {
    timeLabel: "NOW",
    hourOffset: 0,
    thunderstormProb: 89,
    hailProb: 64,
    extremeRainfallProb: 78,
    overallSeverity: "Severe",
    summary: "Convective cell intensifying over southwest Salem perimeter.",
    expectedPrecipRate: "35-50 mm/h",
  },
  {
    timeLabel: "+1H",
    hourOffset: 1,
    thunderstormProb: 93,
    hailProb: 70,
    extremeRainfallProb: 85,
    overallSeverity: "Severe",
    summary: "Peak convective maturity. Heavy squalls and frequent lightning strikes.",
    expectedPrecipRate: "45-65 mm/h",
  },
  {
    timeLabel: "+2H",
    hourOffset: 2,
    thunderstormProb: 86,
    hailProb: 62,
    extremeRainfallProb: 80,
    overallSeverity: "Severe",
    summary: "Slow northeastward drift towards Dharmapuri / Attur boundary.",
    expectedPrecipRate: "30-45 mm/h",
  },
  {
    timeLabel: "+3H",
    hourOffset: 3,
    thunderstormProb: 72,
    hailProb: 45,
    extremeRainfallProb: 65,
    overallSeverity: "High",
    summary: "Gradual gust front dissipation, sustained moderate precipitation.",
    expectedPrecipRate: "15-25 mm/h",
  },
  {
    timeLabel: "+4H",
    hourOffset: 4,
    thunderstormProb: 58,
    hailProb: 30,
    extremeRainfallProb: 48,
    overallSeverity: "High",
    summary: "Convective updraft weakening, stratiform rain shield trailing.",
    expectedPrecipRate: "8-15 mm/h",
  },
  {
    timeLabel: "+5H",
    hourOffset: 5,
    thunderstormProb: 44,
    hailProb: 18,
    extremeRainfallProb: 35,
    overallSeverity: "Moderate",
    summary: "Localized residual drizzle and gusty post-storm surface winds.",
    expectedPrecipRate: "3-7 mm/h",
  },
  {
    timeLabel: "+6H",
    hourOffset: 6,
    thunderstormProb: 30,
    hailProb: 10,
    extremeRainfallProb: 20,
    overallSeverity: "Low",
    summary: "Cell completely decayed. Clear sky emergence and stabilized pressure.",
    expectedPrecipRate: "< 2 mm/h",
  },
];

export const mockStormCell: StormCell = {
  id: "cell-01",
  name: "Storm Cell #01",
  currentLocation: "Salem",
  coordinates: [11.6643, 78.146],
  direction: "↗ Northeast",
  directionDegrees: 45,
  speedKmH: 28,
  intensity: "Severe",
  expectedArrival: "45 minutes",
  confidencePercent: 87,
  echoTopKm: 14.2,
  maxReflectivityDbz: 65,
};

export const mockEarlyWarning: EarlyWarning = {
  id: "warn-01",
  title: "ATMOSPHERIC SURVEILLANCE ACTIVE",
  type: "Micro-Scale Baseline Monitoring (3 km Radius)",
  severity: "Low",
  description:
    "Baseline atmospheric conditions are stable. Continuous micro-meteorological monitoring active.",
  location: "Active Sector",
  expectedWindow: "Next 1–3 hours",
  thunderstormProb: 0,
  extremeRainProb: 0,
  confidencePercent: 95,
  issuedAt: "Live Telemetry IST",
};

export const mockRiskZones: RiskZone[] = [
  {
    id: "zone-a",
    name: "ZONE A",
    severity: "Severe",
    center: [11.6643, 78.146],
    coordinates: [
      [11.82, 78.02],
      [11.88, 78.28],
      [11.55, 78.36],
      [11.48, 78.08],
    ],
    thunderstormProb: 91,
    hailProb: 68,
    extremeRainProb: 82,
    expectedTime: "1–2 hours",
    confidencePercent: 87,
    affectedPopulation: "920,000",
  },
  {
    id: "zone-b",
    name: "ZONE B",
    severity: "High",
    center: [11.0168, 76.9558],
    coordinates: [
      [11.15, 76.85],
      [11.22, 77.15],
      [10.88, 77.22],
      [10.82, 76.9],
    ],
    thunderstormProb: 74,
    hailProb: 58,
    extremeRainProb: 70,
    expectedTime: "2–3 hours",
    confidencePercent: 84,
    affectedPopulation: "1,450,000",
  },
  {
    id: "zone-c",
    name: "ZONE C",
    severity: "Moderate",
    center: [11.341, 77.7172],
    coordinates: [
      [11.45, 77.6],
      [11.52, 77.85],
      [11.22, 77.92],
      [11.18, 77.65],
    ],
    thunderstormProb: 48,
    hailProb: 25,
    extremeRainProb: 42,
    expectedTime: "3–4 hours",
    confidencePercent: 82,
    affectedPopulation: "540,000",
  },
  {
    id: "zone-d",
    name: "ZONE D",
    severity: "Low",
    center: [11.9416, 79.8083],
    coordinates: [
      [12.05, 79.7],
      [12.12, 79.95],
      [11.82, 79.98],
      [11.75, 79.72],
    ],
    thunderstormProb: 22,
    hailProb: 10,
    extremeRainProb: 18,
    expectedTime: "4–6 hours",
    confidencePercent: 90,
    affectedPopulation: "680,000",
  },
];

export const mockRecentAlerts: AlertLog[] = [];

export const mockDataSources: DataSourceStatus[] = [
  { name: "Weather Data", status: "Connected", latencyMs: 38, protocol: "AWS API" },
  { name: "Radar", status: "Connected", latencyMs: 54, protocol: "DWR X-Band" },
  { name: "Satellite", status: "Connected", latencyMs: 120, protocol: "INSAT-3DR" },
  { name: "Lightning", status: "Connected", latencyMs: 22, protocol: "LMA Optical" },
  { name: "AI Model", status: "Ready", latencyMs: 42, protocol: "ConvLSTM Inference" },
  { name: "Database", status: "Connected", latencyMs: 15, protocol: "MongoDB Replica" },
];

export const mockAIInsight = {
  quote:
    "Atmospheric moisture and increasing convective activity indicate a rising thunderstorm risk during the next 2 hours.",
  confidence: "87%",
  modelName: "Convective-Scale Nowcasting Engine",
  runtimeStatus: "Groq LPU Acceleration Ready",
};
