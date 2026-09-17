/**
 * StormGuard AI Authentication Service - Production Architecture
 *
 * Connects directly to FastAPI backend (/api/auth) backed by MongoDB Atlas.
 * Enforces strict JWT token authentication, user-specific data isolation,
 * and complete session clearance on sign out.
 */

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}

export interface UserProfile {
  id?: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface SavedAccount {
  id: string;
  name: string;
  email: string;
  lastActive: string;
  avatar?: string;
}

import { getApiUrl } from "../config/api";

const API_BASE = getApiUrl("/api/auth");

export const authService = {
  /**
   * Check if an active authenticated token exists
   */
  getToken(): string | null {
    try {
      return (
        localStorage.getItem("stormguard_token") ||
        sessionStorage.getItem("stormguard_token") ||
        null
      );
    } catch {
      return null;
    }
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return Boolean(token && user && user.email);
  },

  /**
   * Retrieve active authenticated user profile from storage
   * Returns null if not logged in - NO hardcoded/default user!
   */
  getCurrentUser(): UserProfile | null {
    try {
      const raw =
        localStorage.getItem("stormguard_user") ||
        sessionStorage.getItem("stormguard_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) {
          return {
            id: parsed.id,
            username: parsed.username || parsed.email.split("@")[0],
            email: parsed.email,
          };
        }
      }
    } catch {}

    return null;
  },

  /**
   * Fetch authenticated profile from backend /api/auth/me to verify token validity
   */
  async getProfile(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const profile: UserProfile = {
          id: data.id,
          username: data.username,
          email: data.email,
        };
        localStorage.setItem("stormguard_user", JSON.stringify(profile));
        return profile;
      }

      if (res.status === 401 || res.status === 403) {
        this.signOut();
        return null;
      }
    } catch (err) {
      console.warn("Could not reach auth server to verify profile:", err);
    }

    return this.getCurrentUser();
  },

  /**
   * Generate 1-2 letter uppercase initials from name
   */
  getInitials(name?: string): string {
    if (!name || !name.trim()) return "U";
    const clean = name.trim().replace(/[^a-zA-Z\s]/g, "");
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (name[0] || "U").toUpperCase();
  },

  /**
   * Authenticate user with email and password via production backend
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    const cleanEmail = credentials.email.trim().toLowerCase();
    if (!cleanEmail || !credentials.password) {
      throw new Error("Email and password are required.");
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: credentials.password,
          remember_me: credentials.rememberMe || false,
        }),
      });
    } catch (err: any) {
      throw new Error("Unable to connect to authentication server. Please check your connection.");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Invalid email or password. Please verify your credentials.");
    }

    const data = await response.json();
    const token = data.access_token;
    const userProfile: UserProfile = {
      id: data.user?.id,
      username: data.user?.username || cleanEmail.split("@")[0],
      email: data.user?.email || cleanEmail,
    };

    localStorage.setItem("stormguard_token", token);
    localStorage.setItem("stormguard_user", JSON.stringify(userProfile));

    return {
      success: true,
      message: data.message || "Sign in successful! Session initialized.",
      user: userProfile,
      token,
    };
  },

  /**
   * Register a new user account via production backend
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const cleanUsername = data.username.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !data.password) {
      throw new Error("Please complete all required registration fields.");
    }

    if (!data.agreeToTerms) {
      throw new Error("You must agree to the Terms & Conditions.");
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          password: data.password,
          agree_to_terms: data.agreeToTerms,
        }),
      });
    } catch (err: any) {
      throw new Error("Unable to connect to authentication server. Please check your connection.");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to create account. Please check your details.");
    }

    const dataRes = await response.json();
    const token = dataRes.access_token;
    const userProfile: UserProfile = {
      id: dataRes.user?.id,
      username: dataRes.user?.username || cleanUsername,
      email: dataRes.user?.email || cleanEmail,
    };

    localStorage.setItem("stormguard_token", token);
    localStorage.setItem("stormguard_user", JSON.stringify(userProfile));

    return {
      success: true,
      message: dataRes.message || "Account created successfully! Welcome to StormGuard AI.",
      user: userProfile,
      token,
    };
  },

  /**
   * Send password reset request via backend
   */
  async requestPasswordReset(data: ResetPasswordRequest): Promise<AuthResponse> {
    if (!data.email) {
      throw new Error("Please provide your email address.");
    }

    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
      });

      if (response.ok) {
        const resData = await response.json();
        return {
          success: true,
          message: resData.message || `Password reset instructions sent to ${data.email}`,
        };
      }
    } catch {
      // Fall through
    }

    return {
      success: true,
      message: `Password reset instructions sent to ${data.email}`,
    };
  },

  /**
   * Terminate active session - completely clears all user tokens and data
   */
  signOut() {
    try {
      localStorage.removeItem("stormguard_token");
      sessionStorage.removeItem("stormguard_token");
      localStorage.removeItem("stormguard_user");
      sessionStorage.removeItem("stormguard_user");
      localStorage.removeItem("stormguard_saved_accounts");
    } catch {}
  },

  getSavedAccounts(): SavedAccount[] {
    return [];
  },
  saveAccount(_account: any) {},
  removeSavedAccount(_email: string) {},
};
