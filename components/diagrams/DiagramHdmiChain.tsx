export default function DiagramHdmiChain() {
  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
      <svg
        viewBox="0 0 400 160"
        role="img"
        aria-label="HDMI chain: console to AVR or soundbar to TV"
        className="h-auto w-full"
      >
        <rect width="400" height="160" fill="none" />

        <rect
          x="20"
          y="40"
          width="90"
          height="60"
          rx="6"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        <text
          x="65"
          y="75"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          Console
        </text>

        <rect
          x="155"
          y="40"
          width="90"
          height="60"
          rx="6"
          fill="#0f172a"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x="200"
          y="65"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          AVR /{" "}
        </text>
        <text
          x="200"
          y="82"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          Soundbar
        </text>

        <rect
          x="290"
          y="40"
          width="90"
          height="60"
          rx="6"
          fill="#0f172a"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        <text
          x="335"
          y="75"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          TV
        </text>

        <line
          x1="110"
          y1="70"
          x2="155"
          y2="70"
          stroke="#94a3b8"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        <line
          x1="245"
          y1="70"
          x2="290"
          y2="70"
          stroke="#94a3b8"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />

        <defs>
          <marker
            id="arrow"
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
