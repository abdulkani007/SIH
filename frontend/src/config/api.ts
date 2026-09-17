/**
 * API Configuration for StormGuard
 * Supports local development (relative /api with Vite proxy),
 * Vercel rewrites (/api relative proxy),
 * and direct cross-origin Render backend via VITE_API_URL environment variable.
 */
const RAW_BASE_URL = (import.meta.env.VITE_API_URL as string) || "";
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

/**
 * Returns full API endpoint path.
 * If VITE_API_URL is set (e.g. "https://stormguard-api.onrender.com"):
 *   getApiUrl("/api/weather/current") => "https://stormguard-api.onrender.com/api/weather/current"
 * If VITE_API_URL is not set:
 *   getApiUrl("/api/weather/current") => "/api/weather/current"
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
