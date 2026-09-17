import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("stormguard.ai_alert")

def generate_alert_explanation(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an emergency weather alert explanation using Groq LLM.
    Strictly adheres to truthful parameters provided in alert_data.
    Never invents radar echo tops, lightning strikes, or hail sizes if absent.
    """
    alert_id = str(alert_data.get("id") or alert_data.get("alertId") or "alert-live")
    alert_type = alert_data.get("type") or alert_data.get("alertType") or "Severe Convective Weather"
    risk_level = alert_data.get("severity") or alert_data.get("riskLevel") or "High"
    location = alert_data.get("location") or "Active Monitoring Sector"
    forecast_window = alert_data.get("expected_window") or alert_data.get("expectedWindow") or alert_data.get("forecastWindow") or "Next 2 Hours"
    source = alert_data.get("source") or "Tomorrow.io Weather Data"
    trigger_val = alert_data.get("trigger_value") or alert_data.get("triggerValue") or ""
    threshold = alert_data.get("threshold") or ""
    is_historical = bool(alert_data.get("isHistorical") or alert_data.get("is_historical", False))
    data_type = alert_data.get("dataType") or alert_data.get("data_type") or ("Demonstration Alert" if is_historical else "Live Telemetry")
    is_demo = "Demonstration" in data_type or "Demo" in data_type

    status_tag = (
        "EXERCISE / DEMO DATA (NOT AN ACTIVE WARNING)"
        if is_demo
        else "VERIFIED HISTORICAL ARCHIVE LOG"
        if is_historical
        else "LIVE OPERATIONAL WARNING"
    )

    if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY.strip())

            system_prompt = (
                "You are the official StormGuard AI Emergency Weather Alert Composer for the Smart India Hackathon.\n"
                "Compose a concise, high-priority meteorological alert dispatch strictly based on the following verified alert record:\n\n"
                "STRICT TRUTHFULNESS & GROUNDING RULES:\n"
                "1. ONLY state facts and measurements explicitly given in the alert data.\n"
                "2. NEVER invent radar dBZ, rainfall rates, hail sizes, lightning strikes, probabilities, or locations not given.\n"
                "3. If the status is EXERCISE / DEMO DATA or HISTORICAL, you MUST explicitly state that this is a simulated exercise or historical replay, and NOT an active real-time warning.\n"
                "4. If status is LIVE OPERATIONAL WARNING, state the risk level and provide practical public safety instructions.\n"
                "5. Keep the total explanation under 120 words. Format with clear bullet points or bold labels."
            )

            user_prompt = (
                f"Alert Type: {alert_type}\n"
                f"Status: {status_tag}\n"
                f"Classification: {data_type}\n"
                f"Risk Level: {risk_level.upper()}\n"
                f"Location: {location}\n"
                f"Forecast Horizon: {forecast_window}\n"
                f"Telemetry / Trigger: {trigger_val if trigger_val else 'Crossed configured warning threshold'}\n"
                f"Threshold: {threshold}\n"
                f"Attribution: {source}\n\n"
                "Generate the official emergency alert dispatch."
            )

            completion = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=220,
            )

            message_text = completion.choices[0].message.content.strip()
            return {
                "alertId": alert_id,
                "explanation": message_text,
                "model": f"Groq ({settings.GROQ_MODEL})",
                "status": status_tag,
            }
        except Exception as e:
            logger.warning(f"Groq API alert generation failed: {e}. Falling back to structured generator.")

    # Rule-based Truthful Fallback
    if is_demo:
        fallback_msg = (
            f"⚠️ [SIMULATED EXERCISE - DEMO DATA]\n\n"
            f"Event Type: {alert_type}\n"
            f"Location: {location}\n"
            f"Risk Level: {risk_level.upper()}\n"
            f"Simulated Horizon: {forecast_window}\n\n"
            f"This alert is generated for calibration and exercise testing from demonstration records. "
            f"It does NOT represent an active live warning. Telemetry trigger: {trigger_val or 'Configured threshold crossed'}.\n\n"
            f"Data Attribution: {source}."
        )
    elif is_historical:
        fallback_msg = (
            f"📋 [HISTORICAL EVENT DISPATCH ARCHIVE]\n\n"
            f"Event Type: {alert_type}\n"
            f"Location: {location}\n"
            f"Severity: {risk_level.upper()}\n"
            f"Recorded Window: {forecast_window}\n\n"
            f"Verified meteorological log recorded for {location}. "
            f"Observation details: {trigger_val or 'Threshold criteria satisfied'}.\n\n"
            f"Source Authority: {source}."
        )
    else:
        fallback_msg = (
            f"🚨 [LIVE WEATHER ALERT: {alert_type.upper()}]\n\n"
            f"Location: {location}\n"
            f"Risk Level: {risk_level.upper()}\n"
            f"Forecast Window: {forecast_window}\n\n"
            f"Current atmospheric parameters indicate severe convective development across {location}. "
            f"Observed trigger: {trigger_val or 'Atmospheric instability threshold crossed'}.\n\n"
            f"Recommended Action: Monitor official local safety advisories and secure outdoor property.\n"
            f"Source: {source}."
        )

    return {
        "alertId": alert_id,
        "explanation": fallback_msg,
        "model": "StormGuard Convective Engine (Truthful Local Inference)",
        "status": status_tag,
    }
