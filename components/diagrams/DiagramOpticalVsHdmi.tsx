export default function DiagramOpticalVsHdmi() {
  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
      <svg
        viewBox="0 0 400 200"
        role="img"
        aria-label="Optical versus HDMI ARC connection between TV and soundbar"
        className="h-auto w-full"
      >
        <rect width="400" height="200" fill="none" />

        <rect
          x="30"
          y="30"
          width="90"
          height="40"
          rx="6"
          fill="#0f172a"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        <text
          x="75"
          y="55"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          TV
        </text>

        <rect
          x="280"
          y="30"
          width="90"
          height="40"
          rx="6"
          fill="#0f172a"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x="325"
          y="55"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          Soundbar
        </text>

        <line
          x1="120"
          y1="50"
          x2="280"
          y2="50"
          stroke="#38bdf8"
          strokeWidth="2"
          markerEnd="url(#arrow-hdmi)"
        />
        <text
          x="200"
          y="40"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="10"
        >
          HDMI ARC
        </text>
        <text
          x="200"
          y="70"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="9"
        >
          Supports more formats (eARC/ARC)
        </text>

        <rect
          x="30"
          y="110"
          width="90"
          height="40"
          rx="6"
          fill="#0f172a"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        <text
          x="75"
          y="135"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          TV
        </text>

        <rect
          x="280"
          y="110"
          width="90"
          height="40"
          rx="6"
          fill="#0f172a"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x="325"
          y="135"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          Soundbar
        </text>

        <line
          x1="120"
          y1="130"
          x2="280"
          y2="130"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 4"
          markerEnd="url(#arrow-optical)"
        />
        <text
          x="200"
          y="120"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="10"
        >
          Optical
        </text>
        <text
          x="200"
          y="150"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="9"
        >
          Basic audio only (no Atmos/TrueHD)
        </text>

        <defs>
          <marker
            id="arrow-hdmi"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#38bdf8" />
          </marker>
          <marker
            id="arrow-optical"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
