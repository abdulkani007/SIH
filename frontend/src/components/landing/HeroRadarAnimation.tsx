export default function HeroRadarAnimation({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center -z-10 ${className}`}
      aria-hidden="true"
    >
      <div className="relative w-[680px] h-[680px] max-w-[95vw] max-h-[95vw] flex items-center justify-center">
        
        {/* Soft Radial Ambient Aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-cyan-500/10 blur-3xl opacity-70" />

        {/* SVG Concentric Range Rings and Crosshairs */}
        <svg viewBox="0 0 600 600" className="w-full h-full opacity-40">
          <defs>
            {/* Ambient Hero Conical Sweep */}
            <radialGradient id="heroSweepGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric Radar Rings */}
          <circle cx="300" cy="300" r="70" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          <circle cx="300" cy="300" r="140" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          <circle cx="300" cy="300" r="210" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="5 5" opacity="0.6" />
          <circle cx="300" cy="300" r="280" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.4" />

          {/* Crosshairs */}
          <line x1="20" y1="300" x2="580" y2="300" stroke="#818cf8" strokeWidth="0.75" strokeDasharray="3 6" opacity="0.4" />
          <line x1="300" y1="20" x2="300" y2="580" stroke="#818cf8" strokeWidth="0.75" strokeDasharray="3 6" opacity="0.4" />

          {/* Diagonal Spokes */}
          <line x1="102" y1="102" x2="498" y2="498" stroke="#818cf8" strokeWidth="0.5" strokeDasharray="2 8" opacity="0.3" />
          <line x1="102" y1="498" x2="498" y2="102" stroke="#818cf8" strokeWidth="0.5" strokeDasharray="2 8" opacity="0.3" />

          {/* Animated 360 Radar Sweep Beam using native SVG animateTransform */}
          <g transform="translate(300, 300)">
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="7s"
                repeatCount="indefinite"
              />
              {/* Sweep Cone */}
              <path
                d="M 0 0 L 230 -160 A 280 280 0 0 1 280 0 Z"
                fill="url(#heroSweepGradient)"
              />
              {/* Leading Neon Beam */}
              <line
                x1="0"
                y1="0"
                x2="280"
                y2="0"
                stroke="#6366f1"
                strokeWidth="2"
                strokeOpacity="0.7"
              />
              <line
                x1="0"
                y1="0"
                x2="280"
                y2="0"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeOpacity="0.9"
              />
            </g>
          </g>

          {/* Static Radar Echo Blips that pulse */}
          <g transform="translate(420, 210)">
            <circle r="4" fill="#ef4444" opacity="0.8" />
            <circle r="12" fill="none" stroke="#ef4444" strokeWidth="1">
              <animate attributeName="r" values="4;18" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </g>

          <g transform="translate(210, 390)">
            <circle r="3.5" fill="#f59e0b" opacity="0.8" />
            <circle r="10" fill="none" stroke="#f59e0b" strokeWidth="1">
              <animate attributeName="r" values="3;14" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>

          <g transform="translate(230, 180)">
            <circle r="3" fill="#10b981" opacity="0.7" />
          </g>

          {/* Central Emitter Node */}
          <circle cx="300" cy="300" r="18" fill="#6366f1" fillOpacity="0.12">
            <animate attributeName="r" values="6;26;6" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="300" cy="300" r="5" fill="#4f46e5" />
          <circle cx="300" cy="300" r="1.5" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}
