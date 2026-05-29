export default function DiagramArcEarc() {
  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
      <svg
        viewBox="0 0 400 160"
        role="img"
        aria-label="ARC and eARC connection between TV and soundbar or AVR"
        className="h-auto w-full"
      >
        <rect width="400" height="160" fill="none" />

        <rect
          x="20"
          y="50"
          width="130"
          height="60"
          rx="6"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        <text
          x="85"
          y="70"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          TV
        </text>
        <text
          x="85"
          y="86"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          (HDMI eARC)
        </text>

        <rect
          x="250"
          y="50"
          width="130"
          height="60"
          rx="6"
          fill="#0f172a"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x="315"
          y="70"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          Soundbar / AVR
        </text>
        <text
          x="315"
          y="86"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          (HDMI eARC)
        </text>

        <line
          x1="150"
          y1="80"
          x2="250"
          y2="80"
          stroke="#f97316"
          strokeWidth="2"
          markerStart="url(#arrow-left)"
          markerEnd="url(#arrow-right)"
        />
        <text
          x="200"
          y="72"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          ARC / eARC
        </text>

        <defs>
          <marker
            id="arrow-right"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#f97316" />
          </marker>
          <marker
            id="arrow-left"
            viewBox="0 0 10 10"
            refX="2"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M10 0 L0 5 L10 10 z" fill="#f97316" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
