import { useState, useEffect } from "react";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

export type PageRoute = "login" | "landing" | "dashboard";

export default function App() {
  const getInitialRoute = (): PageRoute => {
    const path = window.location.pathname.toLowerCase();
    if (path === "/dashboard") return "dashboard";
    if (path === "/login") return "login";
    // Default to landing page on root /
    return "landing";
  };

  const [currentPage, setCurrentPage] = useState<PageRoute>(getInitialRoute);

  const navigateTo = (page: PageRoute) => {
    setCurrentPage(page);
    const url = page === "login" ? "/login" : page === "dashboard" ? "/dashboard" : "/";
    window.history.pushState({ page }, "", url);
  };

  useEffect(() => {
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
        <Dashboard onLogout={() => navigateTo("login")} />
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
