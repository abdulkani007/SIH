import type { AlertLog, EarlyWarning } from "@/data/mockWeather";
import { getApiUrl } from "@/config/api";

export interface AIExplanationResponse {
  alertId: string;
  explanation: string;
  model: string;
  status: string;
}

export interface SendEmailPayload {
  to: string;
  message: string;
  alertId?: string;
  subject?: string;
  alertData?: Partial<AlertLog | EarlyWarning> & Record<string, any>;
}

export interface SendEmailResponse {
  success: boolean;
  recipient?: string;
  message?: string;
  detail?: string;
}

export const alertService = {
  /**
   * Request Groq AI natural-language meteorological alert explanation.
   */
  async generateAlertExplanation(
    alertData: Partial<AlertLog | EarlyWarning> & Record<string, any>,
    alertId?: string
  ): Promise<AIExplanationResponse> {
    const res = await fetch(getApiUrl("/api/alerts/generate-ai-explanation"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertId: alertId || (alertData as any).id,
        alertData,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || "Failed to generate AI alert explanation.");
    }

    return await res.json();
  },

  /**
   * Dispatch an official emergency weather alert email strictly to the entered recipient.
   */
  async sendAlertEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
    const res = await fetch(getApiUrl("/api/alerts/send-email"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.to,
        alertId: payload.alertId,
        message: payload.message,
        subject: payload.subject,
        alertData: payload.alertData,
      }),
    });

    const data: SendEmailResponse = await res.json().catch(() => ({
      success: false,
      detail: "Failed to parse server response.",
    }));

    return data;
  },
};
