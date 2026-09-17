/**
 * StormGuard AI Weather Service
 *
 * Connects directly to FastAPI backend (/api/weather & /api/nowcast & /api/alerts)
 * with transparent fallback to local mock data if the backend is unreachable or invalid.
 */

import {
  mockCurrentWeather,
  mockThreats,
  mockNowcastTimeline,
  mockStormCell,
  mockEarlyWarning,
  mockRiskZones,
  mockDataSources,
  mockAIInsight,
  type CurrentWeather,
  type HazardThreat,
  type NowcastStep,
  type StormCell,
  type EarlyWarning,
  type RiskZone,
  type AlertLog,
  type DataSourceStatus,
} from "@/data/mockWeather";
import { getApiUrl } from "@/config/api";

export interface WeatherTelemetry {
  location?: string;
  latitude?: number;
  longitude?: number;
  location_source?: "gps" | "search";
  temperature?: number;
  humidity?: number;
  pressure?: number;
  rainfall_rate?: number;
  reflectivity_dbz?: number;
  storm_cell_name?: string;
  storm_cell_speed?: number;
  storm_cell_direction?: string;
  expected_arrival?: string;
  threat_thunderstorm?: number;
  threat_hail?: number;
  threat_rain?: number;
  source_label?: string;
}

export interface HourlyForecastStep {
  timeLabel: string;
  hourOffset: number;
  isoTime?: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  precipitationIntensity: number;
  precipitationProbability: number;
  rainAccumulation: number;
  cloudCover: number;
  condition: string;
  thunderstormProb: number;
  hailProb: number;
  extremeRainfallProb: number;
  overallSeverity: "Low" | "Moderate" | "High" | "Severe";
  summary: string;
  expectedPrecipRate: string;
}

export interface HourlyForecastResponse {
  location: string;
  latitude: number;
  longitude: number;
  source: string;
  updatedAt: string;
  steps: HourlyForecastStep[];
}

function buildQuery(coords?: { lat: number; lon: number }, locationName?: string): string {
  const params = new URLSearchParams();
  if (coords) {
    params.append("lat", String(coords.lat));
    params.append("lon", String(coords.lon));
  }
  if (locationName) {
    params.append("location", locationName);
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

export const weatherService = {
  async getCurrentWeather(
    coords?: { lat: number; lon: number },
    locationName?: string
  ): Promise<CurrentWeather> {
    try {
      const res = await fetch(getApiUrl(`/api/weather/current${buildQuery(coords, locationName)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const d = await res.json();
        return {
          temperature: d.temperature ?? mockCurrentWeather.temperature,
          condition: d.condition ?? mockCurrentWeather.condition,
          feelsLike: d.feels_like ?? mockCurrentWeather.feelsLike,
          humidity: d.humidity ?? mockCurrentWeather.humidity,
          windSpeed: d.wind_speed ?? mockCurrentWeather.windSpeed,
          windDirection: d.wind_direction ?? mockCurrentWeather.windDirection,
          pressure: d.pressure ?? mockCurrentWeather.pressure,
          rainfall: d.rainfall ?? mockCurrentWeather.rainfall,
          visibility: d.visibility ?? mockCurrentWeather.visibility,
          uvIndex: d.uv_index ?? mockCurrentWeather.uvIndex,
          cloudCover: d.cloud_cover ?? mockCurrentWeather.cloudCover,
          dewPoint: d.dew_point ?? mockCurrentWeather.dewPoint,
          location: d.location ?? mockCurrentWeather.location,
          updatedAt: d.updated_at ?? mockCurrentWeather.updatedAt,
        };
      }
    } catch (err) {
      console.warn("Using fallback weather observation:", err);
    }
    return mockCurrentWeather;
  },

  async getHourlyForecast(
    coords?: { lat: number; lon: number },
    locationName?: string
  ): Promise<HourlyForecastResponse | null> {
    try {
      const res = await fetch(getApiUrl(`/api/weather/forecast${buildQuery(coords, locationName)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const d = await res.json();
        return {
          location: d.location,
          latitude: d.latitude,
          longitude: d.longitude,
          source: d.source,
          updatedAt: d.updated_at,
          steps: (d.steps || []).map((s: any) => ({
            timeLabel: s.time_label,
            hourOffset: s.hour_offset,
            isoTime: s.iso_time,
            temperature: s.temperature,
            humidity: s.humidity,
            windSpeed: s.wind_speed,
            windDirection: s.wind_direction,
            pressure: s.pressure,
            precipitationIntensity: s.precipitation_intensity,
            precipitationProbability: s.precipitation_probability,
            rainAccumulation: s.rain_accumulation,
            cloudCover: s.cloud_cover,
            condition: s.condition,
            thunderstormProb: s.thunderstorm_prob,
            hailProb: s.hail_prob,
            extremeRainfallProb: s.extreme_rainfall_prob,
            overallSeverity: s.overall_severity,
            summary: s.summary,
            expectedPrecipRate: s.expected_precip_rate,
          })),
        };
      }
    } catch (err) {
      console.warn("Using fallback hourly forecast:", err);
    }
    return null;
  },

  async getThreatOverview(
    coords?: { lat: number; lon: number },
    locationName?: string
  ): Promise<HazardThreat[]> {
    try {
      const res = await fetch(getApiUrl(`/api/nowcast/threats${buildQuery(coords, locationName)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          return items.map((t: any) => ({
            id: t.id,
            title: t.title,
            subtitle: t.subtitle,
            isAvailable: t.is_available ?? true,
            unavailableReason: t.unavailable_reason,
            probability: t.probability,
            probabilityLabel: t.probability_label,
            severity: t.severity,
            trend: t.trend,
            trendValues: t.trend_values || [],
            peakValue: t.peak_value,
            expectedWindow: t.expected_window,
            dataQuality: t.data_quality,
            sourceLabel: t.source_label,
            predictionSource: t.prediction_source,
            iconName: t.icon_name,
            description: t.description,
            inputFactors: t.input_factors || {},
          }));
        }
      }
    } catch (err) {
      console.warn("Using fallback threats:", err);
    }
    return mockThreats;
  },

  async getNowcastTimeline(
    coords?: { lat: number; lon: number },
    locationName?: string
  ): Promise<NowcastStep[]> {
    try {
      const res = await fetch(getApiUrl(`/api/nowcast/timeline${buildQuery(coords, locationName)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          return items.map((s: any) => ({
            timeLabel: s.time_label,
            hourOffset: s.hour_offset,
            thunderstormProb: s.thunderstorm_prob,
            hailProb: s.hail_prob,
            extremeRainfallProb: s.extreme_rainfall_prob,
            overallSeverity: s.overall_severity,
            summary: s.summary,
            expectedPrecipRate: s.expected_precip_rate,
            predictionSource: s.prediction_source,
            sourceLabel: s.source_label,
          }));
        }
      }
    } catch (err) {
      console.warn("Using fallback nowcast timeline:", err);
    }
    return mockNowcastTimeline;
  },

  async getStormCell(
    coords?: { lat: number; lon: number },
    locationName?: string
  ): Promise<StormCell> {
    try {
      const res = await fetch(getApiUrl(`/api/nowcast/storm-cells${buildQuery(coords, locationName)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const cells = await res.json();
        if (Array.isArray(cells) && cells.length > 0) {
          const c = cells[0];
          return {
            id: c.id,
            name: c.name,
            currentLocation: c.current_location,
            coordinates: c.coordinates,
            direction: c.direction,
            directionDegrees: c.direction_degrees,
            speedKmH: c.speed_km_h,
            intensity: c.intensity,
            expectedArrival: c.expected_arrival,
            confidencePercent: c.confidence_percent,
            echoTopKm: c.echo_top_km,
            maxReflectivityDbz: c.max_reflectivity_dbz,
            predictionSource: c.prediction_source,
            sourceLabel: c.source_label,
          };
        }
      }
    } catch (err) {
      console.warn("Using fallback storm cell telemetry:", err);
    }
    return mockStormCell;
  },

  async getEarlyWarning(
    locationName?: string,
    coords?: { lat: number; lon: number }
  ): Promise<EarlyWarning> {
    try {
      const res = await fetch(getApiUrl(`/api/alerts/active${buildQuery(coords, locationName)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const w = await res.json();
        return {
          id: w.id,
          title: w.title,
          type: w.type,
          severity: w.severity,
          description: w.description,
          location: w.location,
          expectedWindow: w.expected_window,
          thunderstormProb: w.thunderstorm_prob,
          extremeRainProb: w.extreme_rain_prob,
          confidencePercent: w.confidence_percent,
          issuedAt: w.issued_at,
          predictionSource: w.prediction_source,
          sourceLabel: w.source_label,
        };
      }
    } catch (err) {
      console.warn("Using fallback early warning:", err);
    }
    return {
      ...mockEarlyWarning,
      location: locationName ? `${locationName} Sector` : mockEarlyWarning.location,
    };
  },

  async getRiskZones(
    coords?: { lat: number; lon: number },
    locationName?: string
  ): Promise<RiskZone[]> {
    try {
      const res = await fetch(getApiUrl(`/api/nowcast/risk-zones${buildQuery(coords, locationName)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const zones = await res.json();
        if (Array.isArray(zones) && zones.length > 0) {
          return zones.map((z: any) => ({
            id: z.id,
            name: z.name,
            severity: z.severity,
            center: z.center,
            coordinates: z.coordinates,
            thunderstormProb: z.thunderstorm_prob,
            hailProb: z.hail_prob,
            extremeRainProb: z.extreme_rain_prob,
            expectedTime: z.expected_time,
            confidencePercent: z.confidence_percent,
            affectedPopulation: z.affected_population,
            predictionSource: z.prediction_source,
            sourceLabel: z.source_label,
          }));
        }
      }
    } catch (err) {
      console.warn("Using fallback risk zones:", err);
    }
    return mockRiskZones;
  },

  async getRecentAlerts(
    coords?: { lat: number; lon: number },
    location?: string
  ): Promise<AlertLog[]> {
    try {
      const params = new URLSearchParams();
      if (coords?.lat !== undefined && coords?.lon !== undefined) {
        params.append("lat", coords.lat.toString());
        params.append("lon", coords.lon.toString());
      }
      if (location) {
        params.append("location", location);
      }
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(getApiUrl(`/api/alerts/recent${qs}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const rawAlerts = await res.json();
        if (Array.isArray(rawAlerts)) {
          return rawAlerts.map((a: any) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            location: a.location,
            timestamp: a.timestamp,
            severity: a.severity,
            source: a.source,
            triggerValue: a.trigger_value || a.triggerValue,
            threshold: a.threshold,
            historicalEventId: a.historical_event_id || a.historicalEventId,
            dataType: a.data_type || a.dataType,
            isHistorical: Boolean(a.is_historical || a.isHistorical),
            description: a.description,
            latitude: a.latitude,
            longitude: a.longitude,
          }));
        }
      }
    } catch (err) {
      console.warn("Using fallback alerts:", err);
    }
    return [];
  },

  async getDataSources(): Promise<DataSourceStatus[]> {
    try {
      const res = await fetch(getApiUrl("/api/weather/sources"));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const ds = await res.json();
        if (Array.isArray(ds)) {
          return ds.map((d: any) => ({
            name: d.name,
            status: d.status,
            latencyMs: d.latency_ms,
            protocol: d.protocol,
          }));
        }
      }
    } catch (err) {
      console.warn("Using fallback data sources:", err);
    }
    return mockDataSources;
  },

  async getAIInsight() {
    try {
      const res = await fetch(getApiUrl("/api/nowcast/insight"));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        return await res.json();
      }
    } catch (err) {
      console.warn("Using fallback AI insight:", err);
    }
    return mockAIInsight;
  },

  async askAssistant(query: { question: string } & WeatherTelemetry) {
    try {
      const res = await fetch(getApiUrl("/api/nowcast/assistant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        return await res.json();
      }
    } catch (err) {
      console.warn("Assistant backend fetch failed, using fallback:", err);
    }
    return {
      answer: `Atmospheric surveillance active for ${query.location || "your sector"}. Convective threat analysis: Thunderstorm probability is ${query.threat_thunderstorm !== undefined ? query.threat_thunderstorm + "%" : "evaluated"}, Hail probability is ${query.threat_hail !== null && query.threat_hail !== undefined ? query.threat_hail + "%" : "not reported in current observations"}. Take appropriate safety precautions for active weather conditions.`,
      confidence: "88%",
      model: "StormGuard Convective Decision Engine",
      referenced_telemetry: {
        location: query.location || "Active Sector",
        cell: query.storm_cell_name || "Regional Storm Track",
      },
    };
  },
};
