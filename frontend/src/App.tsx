import { useState, useEffect } from "react";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { authService } from "@/services/authService";

export type PageRoute = "login" | "landing" | "dashboard";

export default function App() {
  const getInitialRoute = (): PageRoute => {
    const path = window.location.pathname.toLowerCase();
    const isAuthed = authService.isAuthenticated();

    if (path === "/dashboard") {
      return isAuthed ? "dashboard" : "login";
    }
    if (path === "/login") {
      return isAuthed ? "dashboard" : "login";
    }
    // Default to landing page on root /
    return "landing";
  };

  const [currentPage, setCurrentPage] = useState<PageRoute>(getInitialRoute);

  const navigateTo = (page: PageRoute) => {
    let target = page;
    if (target === "dashboard" && !authService.isAuthenticated()) {
      target = "login";
    }
    setCurrentPage(target);
    const url = target === "login" ? "/login" : target === "dashboard" ? "/dashboard" : "/";
    window.history.pushState({ page: target }, "", url);
  };

  const handleLogout = () => {
    authService.signOut();
    setCurrentPage("login");
    window.history.pushState({ page: "login" }, "", "/login");
  };

  useEffect(() => {
    // If user has a token, verify active session against backend
    if (authService.isAuthenticated()) {
      authService.getProfile().then((profile) => {
        if (!profile) {
          handleLogout();
        }
      });
    }

    const handlePopState = () => {
      setCurrentPage(getInitialRoute());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div
      className={
        currentPage === "dashboard"
          ? "h-screen h-[100dvh] w-full overflow-hidden"
          : "min-h-screen min-h-[100dvh] w-full"
      }
    >
      {currentPage === "dashboard" && (
        <Dashboard onLogout={handleLogout} />
      )}
      {currentPage === "login" && (
        <Login
          onNavigateHome={() => navigateTo("landing")}
          onLoginSuccess={() => navigateTo("dashboard")}
        />
      )}
      {currentPage === "landing" && (
        <Landing
          onNavigateLogin={() => navigateTo("login")}
          onNavigateDashboard={() => navigateTo("dashboard")}
        />
      )}
    </div>
  );
}
