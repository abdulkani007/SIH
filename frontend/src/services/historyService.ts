import { getApiUrl } from "../config/api";

export type SeverityLevel = "Low" | "Moderate" | "High" | "Severe";
export type DataType = "Verified Historical Data" | "Demonstration Dataset";
export type EventType =
  | "Thunderstorm"
  | "Hailstorm"
  | "Extreme Rainfall"
  | "Cloudburst"
  | "Squall Line"
  | "Other";

export interface HistoricalTimelineStep {
  step: string;
  timeOffset: string;
  radarDbz?: number | null;
  rainRateMmH?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  hail?: string | null;
  thunderstorm?: string | null;
  summary?: string | null;
  source?: string | null;
}

export interface HistoricalEvent {
  eventId: string;
  eventName: string;
  eventType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventDate: string;
  startTime: string;
  endTime?: string | null;
  severity: SeverityLevel;
  dataType: DataType;
  maxRainfall?: number | null;
  maxRadarDbz?: number | null;
  hailOccurred: boolean;
  hailSizeCm?: number | null;
  thunderstormOccurred: boolean;
  source: string;
  sourceReference?: string | null;
  notes?: string | null;
  createdAt: string;
  timelineSteps?: HistoricalTimelineStep[] | null;
}

export interface HistoricalEventCreateData {
  eventName: string;
  eventType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventDate: string;
  startTime: string;
  endTime?: string | null;
  severity: SeverityLevel;
  dataType: DataType;
  maxRainfall?: number | null;
  maxRadarDbz?: number | null;
  hailOccurred: boolean;
  hailSizeCm?: number | null;
  thunderstormOccurred: boolean;
  source: string;
  sourceReference?: string | null;
  notes?: string | null;
  timelineSteps?: HistoricalTimelineStep[] | null;
}

export const historyService = {
  async getHistoricalEvents(params?: {
    location?: string;
    eventType?: string;
    date?: string;
    severity?: string;
    dataType?: string;
    lat?: number;
    lon?: number;
  }): Promise<HistoricalEvent[]> {
    try {
      const q = new URLSearchParams();
      if (params?.location) q.append("location", params.location);
      if (params?.eventType && params.eventType !== "All") q.append("event_type", params.eventType);
      if (params?.date) q.append("date", params.date);
      if (params?.severity && params.severity !== "All") q.append("severity", params.severity);
      if (params?.dataType && params.dataType !== "All") q.append("data_type", params.dataType);
      if (params?.lat !== undefined) q.append("lat", params.lat.toString());
      if (params?.lon !== undefined) q.append("lon", params.lon.toString());
      const qs = q.toString() ? `?${q.toString()}` : "";

      const res = await fetch(getApiUrl(`/api/historical-events${qs}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn("Error fetching historical events from backend:", err);
    }
    return [];
  },

  async getHistoricalEventById(eventId: string): Promise<HistoricalEvent | null> {
    try {
      const res = await fetch(getApiUrl(`/api/historical-events/${encodeURIComponent(eventId)}`));
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`Error fetching historical event ${eventId}:`, err);
    }
    return null;
  },

  async createHistoricalEvent(
    payload: HistoricalEventCreateData
  ): Promise<HistoricalEvent> {
    const res = await fetch(getApiUrl("/api/historical-events"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonStringifyWithAliases(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || "Failed to create historical event record.");
    }

    return await res.json();
  },

  async updateHistoricalEvent(
    eventId: string,
    payload: Partial<HistoricalEventCreateData>
  ): Promise<HistoricalEvent> {
    const res = await fetch(getApiUrl(`/api/historical-events/${encodeURIComponent(eventId)}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonStringifyWithAliases(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || "Failed to update historical event record.");
    }

    return await res.json();
  },

  async deleteHistoricalEvent(eventId: string): Promise<void> {
    const res = await fetch(getApiUrl(`/api/historical-events/${encodeURIComponent(eventId)}`), {
      method: "DELETE",
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || "Failed to delete historical event record.");
    }
  },
};

function jsonStringifyWithAliases(data: any): string {
  return JSON.stringify(data);
}
