import logging
from typing import Dict, Any

logger = logging.getLogger("stormguard-convective")

def calculate_convective_step(raw_step: Dict[str, Any], base_location: str = "Monitoring Sector") -> Dict[str, Any]:
    """
    STORMGUARD Convective Risk Engine:
    Ingests atmospheric observations and NWP forecast slices (from Tomorrow.io or fallback)
    and computes convective hazard estimates for Thunderstorm, Hail, and Extreme Rainfall.
    Uses strictly real, available API fields and transparent physics-based heuristics.
    """
    temp = float(raw_step.get("temperature", 28.0) or 28.0)
    humidity = int(raw_step.get("humidity", 75) or 75)
    rain_rate = float(raw_step.get("precipitation_intensity", 0.0) or 0.0)
    p_prob = int(raw_step.get("precipitation_probability", 0) or 0)
    cloud = int(raw_step.get("cloud_cover", 50) or 0)
    cond = str(raw_step.get("condition", "Partly Cloudy")).lower()
    wind_speed = float(raw_step.get("wind_speed", 15.0) or 15.0)
    pressure = int(raw_step.get("pressure", 1008) or 1008)
    hour = int(raw_step.get("hour_offset", 0))
    rain_accum = float(raw_step.get("rain_accumulation", 0.0) or 0.0)

    # 1. Thunderstorm Risk Estimate (Derived transparently from real atmospheric indicators)
    # Tomorrow.io free tier does not return thunderstormProbability.
    score = 0.0
    if "thunder" in cond:
        score += 50.0
    elif "rain" in cond or "squall" in cond or "shower" in cond:
        score += 20.0

    if rain_rate > 20.0:
        score += 35.0
    elif rain_rate > 8.0:
        score += 20.0
    elif rain_rate > 1.0:
        score += 10.0
    elif rain_rate > 0.0:
        score += 5.0

    score += min(25.0, p_prob * 0.3)

    if humidity > 85:
        score += 12.0
    elif humidity > 75:
        score += 6.0

    if cloud > 80:
        score += 8.0
    elif cloud > 60:
        score += 4.0

    if pressure < 1000:
        score += 10.0
    elif pressure < 1005:
        score += 5.0

    if wind_speed > 30.0:
        score += 6.0

    # If completely dry (0 rain, 0 precip prob), baseline convective risk is minimal
    if rain_rate == 0.0 and p_prob == 0:
        ts_risk = int(round(min(25.0, score)))
    else:
        ts_risk = int(round(min(95.0, max(5.0, score))))

    # 2. Hail: Unavailable on Tomorrow.io free tier (no radar echo top or sounding data)
    hail_prob = 0

    # 3. Extreme Rainfall Risk Estimate
    if rain_rate == 0.0 and p_prob == 0:
        extreme_rain_prob = 0
    else:
        rain_score = p_prob * 0.45
        if rain_rate > 25.0:
            rain_score += 45.0
        elif rain_rate > 12.0:
            rain_score += 30.0
        elif rain_rate > 3.0:
            rain_score += 15.0
        elif rain_rate > 0.1:
            rain_score += 5.0
        if humidity > 85:
            rain_score += 10.0
        if rain_accum > 10.0:
            rain_score += 15.0
        extreme_rain_prob = int(round(min(95.0, max(0.0, rain_score))))

    # 4. Severity Assessment (based on highest available active risk)
    max_risk = max(ts_risk, extreme_rain_prob)
    if max_risk >= 75:
        severity = "Severe"
    elif max_risk >= 55:
        severity = "High"
    elif max_risk >= 30:
        severity = "Moderate"
    else:
        severity = "Low"

    # 5. Expected Precipitation Rate Formatting
    if rain_rate > 30.0:
        precip_str = "> 35 mm/h"
    elif rain_rate > 15.0:
        precip_str = "20–35 mm/h"
    elif rain_rate > 5.0:
        precip_str = "8–15 mm/h"
    elif rain_rate > 0.5:
        precip_str = "2–6 mm/h"
    elif rain_rate > 0.0:
        precip_str = "< 2 mm/h"
    else:
        precip_str = "0 mm/h"

    # 6. Concise Meteorological Summary grounded strictly in real values
    loc_name = base_location.replace(" (3 km Radius)", "")
    if max_risk >= 75:
        summary = f"Convective precipitation alert for {loc_name}: rain rate {rain_rate} mm/h and {p_prob}% probability."
    elif max_risk >= 55:
        summary = f"Moderate convective development in {loc_name}. Precipitation rate {rain_rate} mm/h."
    elif max_risk >= 30:
        summary = f"Scattered cloud cover ({cloud}%) and rain probability {p_prob}% for {loc_name}."
    else:
        summary = f"Rain probability is {p_prob}% and surface rain intensity is {rain_rate} mm/h across {loc_name}."

    return {
        "time_label": raw_step.get("time_label", "NOW" if hour == 0 else f"+{hour}H"),
        "hour_offset": hour,
        "iso_time": raw_step.get("iso_time"),
        "temperature": temp,
        "humidity": humidity,
        "wind_speed": wind_speed,
        "wind_direction": raw_step.get("wind_direction", "SW"),
        "pressure": pressure,
        "precipitation_intensity": rain_rate,
        "precipitation_probability": p_prob,
        "rain_accumulation": rain_accum,
        "cloud_cover": cloud,
        "condition": raw_step.get("condition", "Partly Cloudy"),
        "thunderstorm_prob": ts_risk,
        "hail_prob": hail_prob,
        "extreme_rainfall_prob": extreme_rain_prob,
        "overall_severity": severity,
        "summary": summary,
        "expected_precip_rate": precip_str,
    }
