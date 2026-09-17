import time
import logging
from typing import Dict, Any, Optional, List
import httpx
from app.core.config import settings

logger = logging.getLogger("stormguard-tomorrow")

WEATHER_CODE_MAP: Dict[int, str] = {
    1000: "Clear",
    1100: "Mostly Clear",
    1101: "Partly Cloudy",
    1102: "Mostly Cloudy",
    1001: "Cloudy",
    2000: "Fog",
    2100: "Light Fog",
    4000: "Drizzle",
    4001: "Rain",
    4200: "Light Rain",
    4201: "Heavy Rain",
    5000: "Snow",
    5001: "Flurries",
    5100: "Light Snow",
    5101: "Heavy Snow",
    6000: "Freezing Drizzle",
    6001: "Freezing Rain",
    6200: "Light Freezing Rain",
    6201: "Heavy Freezing Rain",
    7000: "Ice Pellets",
    7101: "Heavy Ice Pellets",
    7102: "Light Ice Pellets",
    8000: "Thunderstorm",
}

def degrees_to_compass(deg: float) -> str:
    val = int((deg / 22.5) + 0.5)
    arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return arr[(val % 16)]

class TomorrowService:
    """
    Tomorrow.io Weather API v4 Client
    
    Provides real-time observations and 0-6h hourly forecast data with:
    - Strict server-side key management (never returned in responses or logs).
    - In-memory TTL cache (300 seconds) keyed by rounded coordinates to prevent
      exceeding Tomorrow.io free tier rate limits (25 requests/hour).
    - Resilient error handling (HTTP 429, timeouts, network issues).
    """

    def __init__(self, cache_ttl_seconds: int = 300):
        self.cache_ttl = cache_ttl_seconds
        # In-memory cache: key -> {"timestamp": float, "data": dict}
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_cache_key(self, lat: float, lon: float) -> str:
        return f"{round(lat, 2)},{round(lon, 2)}"

    def is_configured(self) -> bool:
        return bool(settings.TOMORROW_API_KEY and settings.TOMORROW_API_KEY.strip())

    async def fetch_forecast_timeline(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Fetch 0-6h forecast and current weather timeline from Tomorrow.io API v4.
        Uses in-memory cache to strictly respect API rate limits.
        """
        if not self.is_configured():
            return None

        cache_key = self._get_cache_key(lat, lon)
        cached = self._cache.get(cache_key)
        now = time.time()

        if cached and (now - cached["timestamp"] < self.cache_ttl):
            logger.debug("Serving Tomorrow.io data from cache for (%s, %s)", round(lat, 2), round(lon, 2))
            return cached["data"]

        url = f"https://api.tomorrow.io/v4/weather/forecast?location={lat},{lon}&timesteps=1h&units=metric"
        headers = {
            "apikey": settings.TOMORROW_API_KEY.strip(),
            "accept": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url, headers=headers)

            if response.status_code == 200:
                data = response.json()
                self._cache[cache_key] = {"timestamp": now, "data": data}
                logger.info("Successfully fetched fresh Tomorrow.io forecast for (%s, %s)", round(lat, 2), round(lon, 2))
                return data

            elif response.status_code == 429:
                logger.warning("Tomorrow.io rate limit reached (HTTP 429). Falling back gracefully.")
                if cached:
                    return cached["data"]
                return None

            elif response.status_code in (401, 403):
                logger.error("Tomorrow.io authentication error (HTTP %d). Please check TOMORROW_API_KEY in backend/.env.", response.status_code)
                return None

            else:
                logger.warning("Tomorrow.io API returned HTTP %d: %s", response.status_code, response.text[:120])
                if cached:
                    return cached["data"]
                return None

        except httpx.TimeoutException:
            logger.warning("Tomorrow.io request timed out. Using fallback.")
            if cached:
                return cached["data"]
            return None
        except Exception as e:
            logger.warning("Tomorrow.io connection error (%s). Using fallback.", str(e))
            if cached:
                return cached["data"]
            return None

    async def get_current_weather(
        self, lat: float, lon: float, location_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Parse real-time observation from Tomorrow.io forecast timeline (hour 0).
        """
        raw_data = await self.fetch_forecast_timeline(lat, lon)
        if not raw_data:
            return None

        try:
            timelines = raw_data.get("timelines", {})
            hourly = timelines.get("hourly", [])
            if not hourly:
                return None

            current_slot = hourly[0]
            values = current_slot.get("values", {})

            temp = float(values.get("temperature", 28.0))
            feels_like = float(values.get("temperatureApparent", temp + 2.0))
            humidity = int(round(float(values.get("humidity", 75))))
            
            # Wind speed in Tomorrow.io metric is m/s -> convert to km/h
            raw_wind_ms = float(values.get("windSpeed", 5.0))
            wind_speed = round(raw_wind_ms * 3.6, 1)
            wind_direction = degrees_to_compass(float(values.get("windDirection", 225.0)))

            # Pressure in hPa
            pressure = int(round(float(values.get("pressureSurfaceLevel", 1008.0))))

            # Rainfall in mm/h
            rain_rate = float(values.get("rainIntensity", values.get("precipitationIntensity", 0.0)))

            # Visibility in km
            visibility = round(float(values.get("visibility", 10.0)), 1)
            uv_index = int(round(float(values.get("uvIndex", 4))))
            cloud_cover = int(round(float(values.get("cloudCover", 60))))

            dew_point = values.get("dewPoint")
            if dew_point is not None:
                dew_point = round(float(dew_point), 1)
            else:
                dew_point = round(temp - ((100 - humidity) / 5), 1)

            weather_code = int(values.get("weatherCode", 1000))
            condition = WEATHER_CODE_MAP.get(weather_code, "Partly Cloudy")

            precip_prob = int(round(float(values.get("precipitationProbability", 0))))
            rain_accum = round(float(values.get("rainAccumulation", 0.0)), 1)

            resolved_location = location_name or f"{round(lat, 3)}°N, {round(lon, 3)}°E"

            # Formatted update timestamp (UTC/IST)
            update_time = time.strftime("%H:%M:%S")

            return {
                "temperature": temp,
                "condition": condition,
                "feels_like": feels_like,
                "humidity": humidity,
                "wind_speed": wind_speed,
                "wind_direction": wind_direction,
                "pressure": pressure,
                "rainfall": rain_rate,
                "precipitation_probability": precip_prob,
                "rain_accumulation": rain_accum,
                "visibility": visibility,
                "uv_index": uv_index,
                "cloud_cover": cloud_cover,
                "dew_point": dew_point,
                "location": resolved_location,
                "updated_at": f"Tomorrow.io Live Telemetry • {update_time}",
                "is_live_tomorrow": True,
                "raw_values": values,
            }

        except Exception as e:
            logger.error("Error parsing Tomorrow.io current weather values: %s", str(e))
            return None

    async def get_0_to_6h_forecast(
        self, lat: float, lon: float
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve 0 to 6 hours forecast steps (7 steps: NOW, +1H, +2H, +3H, +4H, +5H, +6H).
        """
        raw_data = await self.fetch_forecast_timeline(lat, lon)
        if not raw_data:
            return None

        try:
            timelines = raw_data.get("timelines", {})
            hourly = timelines.get("hourly", [])
            if not hourly:
                return None

            forecast_steps = []
            for i in range(min(7, len(hourly))):
                slot = hourly[i]
                vals = slot.get("values", {})
                time_label = "NOW" if i == 0 else f"+{i}H"

                temp = float(vals.get("temperature", 28.0))
                humidity = int(round(float(vals.get("humidity", 75))))
                wind_speed = round(float(vals.get("windSpeed", 5.0)) * 3.6, 1)
                wind_dir = degrees_to_compass(float(vals.get("windDirection", 225.0)))
                pressure = int(round(float(vals.get("pressureSurfaceLevel", 1008.0))))
                rain_rate = float(vals.get("rainIntensity", vals.get("precipitationIntensity", 0.0)))
                precip_prob = int(round(float(vals.get("precipitationProbability", 0))))
                rain_accum = round(float(vals.get("rainAccumulation", 0.0)), 1)
                cloud_cover = int(round(float(vals.get("cloudCover", 60))))
                code = int(vals.get("weatherCode", 1000))
                condition = WEATHER_CODE_MAP.get(code, "Partly Cloudy")

                # Tomorrow.io thunderstorm probability if provided
                ts_prob_field = vals.get("thunderstormProbability")
                hail_prob_field = vals.get("hailProbability") or vals.get("hailBinary")

                forecast_steps.append({
                    "time_label": time_label,
                    "hour_offset": i,
                    "iso_time": slot.get("time"),
                    "temperature": temp,
                    "humidity": humidity,
                    "wind_speed": wind_speed,
                    "wind_direction": wind_dir,
                    "pressure": pressure,
                    "precipitation_intensity": rain_rate,
                    "precipitation_probability": precip_prob,
                    "rain_accumulation": rain_accum,
                    "cloud_cover": cloud_cover,
                    "condition": condition,
                    "thunderstorm_prob_raw": ts_prob_field,
                    "hail_prob_raw": hail_prob_field,
                })

            return forecast_steps

        except Exception as e:
            logger.error("Error parsing Tomorrow.io forecast steps: %s", str(e))
            return None

tomorrow_service = TomorrowService()
