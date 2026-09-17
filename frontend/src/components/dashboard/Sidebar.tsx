import { useEffect } from "react";
import {
  Shield,
  CloudLightning,
  LayoutDashboard,
  CloudSun,
  Activity,
  Map,
  Compass,
  Bell,
  History,
  Bot,
  Settings,
  LogOut,
  Radio,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";
import LineSidebar from "@/components/reactbits/LineSidebar";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onLogout,
}: SidebarProps) {
  const navItems = [
    { id: "Overview", label: "Overview", icon: LayoutDashboard },
    { id: "Live Weather", label: "Live Weather", icon: CloudSun },
    { id: "Nowcasting", label: "Nowcasting", icon: Activity },
    { id: "Risk Map", label: "Risk Map", icon: Map },
    { id: "Storm Tracking", label: "Storm Tracking", icon: Compass },
    { id: "Alerts", label: "Alerts", icon: Bell, badge: "3" },
    { id: "Historical Events", label: "Historical Events", icon: History },
    { id: "AI Assistant", label: "AI Assistant", icon: Bot },
  ];

  const activeIdx = navItems.findIndex((item) => item.id === currentTab);

  // Lock body scroll when mobile drawer is open to prevent background page scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 h-full w-[280px] sm:w-80 max-w-[85vw] shrink-0 flex-shrink-0 bg-white/95 backdrop-blur-xl border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out select-none overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Branding */}
        <div>
          <div className="h-22 px-6 flex items-center justify-between border-b border-slate-100 bg-white/80">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <div className="relative">
                  <Shield className="w-6 h-6 stroke-[2.2]" />
                  <CloudLightning className="w-3.5 h-3.5 text-amber-300 absolute inset-0 m-auto" />
                </div>
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
                  <span>STORMGUARD</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80 font-extrabold">
                    AI
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 tracking-tight mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Doppler Radar Command</span>
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links powered by React Bits LineSidebar */}
          <div className="py-6 px-4 space-y-3">
            <div className="px-5 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Navigation</span>
              <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 font-bold">
                8 MODULES
              </span>
            </div>
            <LineSidebar
              items={navItems}
              active={activeIdx >= 0 ? activeIdx : 0}
              accentColor="#0082FB"
              textColor="#475569"
              markerColor="#CBD5E1"
              showIndex={true}
              showMarker={true}
              proximityRadius={95}
              maxShift={20}
              markerLength={42}
              markerGap={6}
              tickScale={0.5}
              scaleTick={true}
              itemGap={22}
              fontSize={0.92}
              smoothing={90}
              onItemClick={(index, label) => {
                const selected = navItems[index];
                onSelectTab(selected ? selected.id : label);
                onClose();
              }}
            />
          </div>
        </div>

        {/* Bottom Status & Profile */}
        <div className="p-5 border-t border-slate-100 bg-gradient-to-t from-slate-50/90 via-slate-50/40 to-transparent space-y-4">
          {/* Station Status Chip */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Station Feed</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                LIVE • 9.41 GHz
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Doppler X-Band • 1km²</span>
              <span className="text-blue-600 font-bold">42s Sweep</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="pt-1 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-xs shadow-sm ring-2 ring-white">
                  {authService.getInitials(authService.getCurrentUser().username)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-black text-slate-900 leading-tight truncate">
                  {authService.getCurrentUser().username}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
                  {authService.getCurrentUser().email}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Settings"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  authService.signOut();
                  onLogout();
                }}
                title="Sign Out"
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
