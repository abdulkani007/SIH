import {
  useRef,
  useState,
  useCallback,
  useEffect,
  isValidElement,
  type CSSProperties,
  type ReactNode,
  type ComponentType,
} from "react";
import "./LineSidebar.css";

const FALLOFF_CURVES = {
  linear: (p: number) => p,
  smooth: (p: number) => p * p * (3 - 2 * p),
  sharp: (p: number) => p * p * p,
};

const DEFAULT_ITEMS = [
  "Overview",
  "Components",
  "Animations",
  "Backgrounds",
  "Showcase",
  "Playground",
  "Templates",
  "Changelog",
  "Community",
  "Resources",
  "Documentation",
  "Support",
];

export type LineSidebarItemObject = {
  id?: string;
  label: string;
  icon?: ComponentType<{ className?: string }> | ReactNode;
  badge?: string | number;
};

export type LineSidebarItem = string | LineSidebarItemObject;

export interface LineSidebarProps {
  items?: LineSidebarItem[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: "linear" | "smooth" | "sharp";
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  defaultActive?: number | null;
  active?: number | null;
  onItemClick?: (index: number, label: string) => void;
  className?: string;
  style?: CSSProperties;
}

export default function LineSidebar({
  items = DEFAULT_ITEMS,
  accentColor = "#0082fb",
  textColor = "#64748b",
  markerColor = "#cbd5e1",
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 22,
  falloff = "smooth",
  markerLength = 42,
  markerGap = 6,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 22,
  fontSize = 0.92,
  smoothing = 100,
  defaultActive = null,
  active,
  onItemClick,
  className = "",
  style = {},
}: LineSidebarProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const initialActive = active !== undefined ? active : defaultActive;
  const activeRef = useRef<number | null>(initialActive ?? null);
  const smoothingRef = useRef<number>(smoothing);
  const [activeIndex, setActiveIndex] = useState<number | null>(initialActive ?? null);

  activeRef.current = activeIndex;
  smoothingRef.current = smoothing;

  // Single rAF loop that eases every item's --effect toward its target using
  // frame-rate independent exponential smoothing, so color, shift and scale
  // all move together without staggering CSS transitions.
  const runFrame = useCallback(
    (now: number) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const tau = Math.max(smoothingRef.current, 1) / 1000;
      const k = 1 - Math.exp(-dt / tau);

      let moving = false;
      const itemsEls = itemRefs.current;
      for (let i = 0; i < itemsEls.length; i++) {
        const el = itemsEls[i];
        if (!el) continue;
        const target = Math.max(
          targetsRef.current[i] || 0,
          activeRef.current === i ? 1 : 0
        );
        const cur = currentRef.current[i] || 0;
        const next = cur + (target - cur) * k;
        const settled = Math.abs(target - next) < 0.0015;
        const value = settled ? target : next;
        currentRef.current[i] = value;
        el.style.setProperty("--effect", value.toFixed(4));
        if (!settled) moving = true;
      }

      rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
    },
    []
  );

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }

    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.smooth;
      const itemsEls = itemRefs.current;
      for (let i = 0; i < itemsEls.length; i++) {
        const el = itemsEls[i];
        if (!el) continue;
        const center = el.offsetTop + el.offsetHeight / 2;
        const distance = Math.abs(pointerY - center);
        targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop]
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  const handleClick = useCallback(
    (index: number, label: string) => {
      setActiveIndex(index);
      activeRef.current = index;
      startLoop();
      onItemClick?.(index, label);
    },
    [onItemClick, startLoop]
  );

  // Sync external active prop if provided
  useEffect(() => {
    if (active !== undefined && active !== activeIndex) {
      setActiveIndex(active);
      activeRef.current = active;
      startLoop();
    }
  }, [active, activeIndex, startLoop]);

  useEffect(() => {
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    []
  );

  return (
    <nav
      className={`line-sidebar${showMarker ? " line-sidebar--markers" : ""}${
        scaleTick ? " line-sidebar--scale-tick" : ""
      }${className ? ` ${className}` : ""}`}
      style={
        {
          "--accent-color": accentColor,
          "--text-color": textColor,
          "--marker-color": markerColor,
          "--marker-length": `${markerLength}px`,
          "--marker-gap": `${markerGap}px`,
          "--tick-scale": tickScale,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
          "--font-size": `${fontSize}rem`,
          "--smoothing": `${smoothing}ms`,
          ...style,
        } as CSSProperties
      }
    >
      <ul
        ref={listRef}
        className="line-sidebar__list"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {items.map((item, index) => {
          const isObj = typeof item === "object" && item !== null;
          const label = isObj ? item.label : String(item);
          const Icon = isObj && item.icon ? item.icon : null;
          const badge = isObj ? item.badge : null;
          const isCurrent = activeIndex === index;

          return (
            <li
              key={`${label}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="line-sidebar__item"
              aria-current={isCurrent ? "true" : undefined}
              onClick={() => handleClick(index, label)}
            >
              {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
              <span className="line-sidebar__label">
                {showIndex && (
                  <span className="line-sidebar__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
                {Icon && (
                  <span className="line-sidebar__icon">
                    {isValidElement(Icon) ? (
                      Icon
                    ) : (
                      (() => {
                        const IconComponent = Icon as ComponentType<{ className?: string }>;
                        return <IconComponent className="w-4 h-4" />;
                      })()
                    )}
                  </span>
                )}
                <span className="line-sidebar__text">{label}</span>
                {badge && <span className="line-sidebar__badge">{badge}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
