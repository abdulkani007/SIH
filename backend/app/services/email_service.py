import logging
import re
import socket
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("stormguard.email")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_recipient_email(email: str) -> bool:
    """Validate recipient email format securely without exposing regex or backend logic."""
    if not email or not isinstance(email, str):
        return False
    email = email.strip()
    if len(email) > 254 or len(email) < 5:
        return False
    return bool(EMAIL_REGEX.match(email))

def send_alert_email(
    to_email: str,
    subject: Optional[str],
    message: str,
    alert_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Send an official severe weather alert email using configured SMTP settings.
    - Validates email address format.
    - Sends ONLY to the email address specified in to_email.
    - Never exposes SMTP username, password, or sensitive errors to the caller.
    """
    to_email = (to_email or "").strip()
    if not to_email:
        return {
            "success": False,
            "error_type": "validation",
            "detail": "Please enter a recipient email address.",
        }

    if not validate_recipient_email(to_email):
        return {
            "success": False,
            "error_type": "validation",
            "detail": "Please enter a valid email address.",
        }

    alert = alert_data or {}
    alert_type = alert.get("type") or alert.get("alertType") or "Convective Weather"
    risk_level = alert.get("severity") or alert.get("riskLevel") or "High"
    location = alert.get("location") or "Monitored Region"
    timestamp = alert.get("timestamp") or "Current Operational Period"
    forecast_window = alert.get("expected_window") or alert.get("forecastWindow") or "Next 2 Hours"
    source = alert.get("source") or "Tomorrow.io Weather Data"
    trigger_val = alert.get("trigger_value") or alert.get("triggerValue") or "Severe convective threshold crossed"
    is_historical = bool(alert.get("isHistorical") or alert.get("is_historical", False))
    data_type = alert.get("dataType") or alert.get("data_type") or ("Demonstration Alert" if is_historical else "Live Telemetry")
    is_demo = "Demonstration" in data_type or "Demo" in data_type

    # Format Subject
    if not subject or not subject.strip():
        prefix = "[DEMO EXERCISE]" if is_demo else "[HISTORICAL]" if is_historical else "[LIVE ALERT]"
        subject = f"{prefix} [StormGuard Alert] {alert_type} - {risk_level.upper()}"

    # Build Email Message
    msg = MIMEMultipart("alternative")
    sender = settings.EMAIL_FROM or settings.SMTP_USER or "alerts@stormguard.ai"
    msg["From"] = f"StormGuard AI Alerts <{sender}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    # Status classification header
    classification_banner = (
        "⚠️ DEMONSTRATION DATASET / EXERCISE SCENARIO (NOT AN ACTIVE LIVE WARNING)"
        if is_demo
        else "📋 VERIFIED HISTORICAL ARCHIVE LOG"
        if is_historical
        else "🚨 LIVE CONVECTIVE RISK WARNING"
    )

    banner_color = "#D97706" if is_demo else "#2563EB" if is_historical else "#DC2626"
    badge_text = "DEMO DATA" if is_demo else "VERIFIED" if is_historical else "LIVE ALERT"

    # Plain text version
    plain_text = (
        f"=== STORMGUARD AI SEVERE WEATHER DISPATCH ===\n"
        f"Status: {classification_banner}\n"
        f"Badge: {badge_text}\n"
        f"Alert Type: {alert_type}\n"
        f"Risk Level: {risk_level.upper()}\n"
        f"Location: {location}\n"
        f"Forecast Window: {forecast_window}\n"
        f"Observation / Trigger: {trigger_val}\n"
        f"Source: {source}\n"
        f"Timestamp: {timestamp}\n\n"
        f"--- AI ALERT EXPLANATION ---\n"
        f"{message}\n\n"
        f"Sent by StormGuard AI Nowcasting System to {to_email}\n"
    )

    # Professional HTML version
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
    .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
    .header {{ background-color: {banner_color}; color: #ffffff; padding: 20px 24px; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }}
    .header p {{ margin: 4px 0 0 0; font-size: 12px; font-weight: 600; opacity: 0.9; text-transform: uppercase; }}
    .body {{ padding: 24px; }}
    .badge {{ display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; font-family: monospace; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }}
    .grid {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }}
    .grid td {{ padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }}
    .grid td.label {{ font-weight: 700; color: #64748b; width: 35%; }}
    .grid td.value {{ font-weight: 600; color: #0f172a; }}
    .explanation {{ background-color: #f8fafc; border-left: 4px solid {banner_color}; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; line-height: 1.6; white-space: pre-line; }}
    .footer {{ padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p>{classification_banner}</p>
      <h1>{alert_type} — {risk_level.upper()} RISK</h1>
    </div>
    <div class="body">
      <table class="grid">
        <tr><td class="label">Classification</td><td class="value"><span class="badge">{badge_text}</span> {data_type}</td></tr>
        <tr><td class="label">Affected Location</td><td class="value">{location}</td></tr>
        <tr><td class="label">Forecast Horizon</td><td class="value">{forecast_window}</td></tr>
        <tr><td class="label">Telemetry / Trigger</td><td class="value">{trigger_val}</td></tr>
        <tr><td class="label">Source Authority</td><td class="value">{source}</td></tr>
        <tr><td class="label">Dispatch Timestamp</td><td class="value">{timestamp}</td></tr>
      </table>

      <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px;">
        AI Meteorological Intelligence Advisory
      </h3>
      <div class="explanation">
{message}
      </div>
    </div>
    <div class="footer">
      This automated alert was dispatched by StormGuard AI Convective Workstation directly to <strong>{to_email}</strong>.
    </div>
  </div>
</body>
</html>"""

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    # Connect and send via SMTP
    host = settings.SMTP_HOST or "smtp.gmail.com"
    port = settings.SMTP_PORT or 587
    user = settings.SMTP_USER
    password = settings.SMTP_PASS

    if not user or not password:
        logger.error("SMTP credentials missing in settings.")
        return {
            "success": False,
            "error_type": "config",
            "detail": "Failed to send alert email. Please try again.",
        }

    try:
        sent = False
        last_error = None

        # Ports to attempt: configured port first, then fallback port (465 or 587)
        ports_to_try = [port]
        fallback_port = 465 if port != 465 else 587
        if fallback_port not in ports_to_try:
            ports_to_try.append(fallback_port)

        for attempt_port in ports_to_try:
            try:
                if attempt_port == 465:
                    with smtplib.SMTP_SSL(host, attempt_port, timeout=4) as server:
                        server.login(user, password)
                        server.send_message(msg)
                        sent = True
                        break
                else:
                    with smtplib.SMTP(host, attempt_port, timeout=4) as server:
                        server.ehlo()
                        server.starttls()
                        server.ehlo()
                        server.login(user, password)
                        server.send_message(msg)
                        sent = True
                        break
            except (TimeoutError, socket.timeout, OSError) as conn_err:
                last_error = conn_err
                logger.warning(f"SMTP attempt on {host}:{attempt_port} timed out or failed: {conn_err}")
                continue

        if not sent:
            err_str = str(last_error).lower() if last_error else ""
            if isinstance(last_error, (TimeoutError, socket.timeout)) or "timed out" in err_str or "10035" in err_str or "10060" in err_str:
                logger.error(f"SMTP dispatch to {to_email} timed out on both ports 587 and 465: {last_error}")
                return {
                    "success": False,
                    "error_type": "network_timeout",
                    "detail": "Connection timed out. Your Wi-Fi network firewall blocks SMTP mail ports (587/465). Please switch to Mobile Hotspot and try again.",
                }
            return {
                "success": False,
                "error_type": "smtp_failure",
                "detail": "Failed to send alert email. Please try again.",
            }

        logger.info(f"Alert email successfully dispatched to {to_email}")
        return {
            "success": True,
            "recipient": to_email,
            "message": f"Alert email sent successfully to {to_email}.",
        }
    except smtplib.SMTPAuthenticationError:
        logger.error(f"SMTP dispatch to {to_email} failed: Authentication failed")
        return {
            "success": False,
            "error_type": "auth_failure",
            "detail": "SMTP authentication failed. Please verify your Gmail App Password.",
        }
    except Exception as e:
        logger.error(f"SMTP dispatch to {to_email} failed: {type(e).__name__}: {e}")
        return {
            "success": False,
            "error_type": "smtp_failure",
            "detail": "Failed to send alert email. Please try again.",
        }
