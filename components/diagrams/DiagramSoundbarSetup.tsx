export default function DiagramSoundbarSetup() {
  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
      <svg
        viewBox="0 0 400 200"
        role="img"
        aria-label="Soundbar setup with TV, soundbar, and subwoofer"
        className="h-auto w-full"
      >
        <rect width="400" height="200" fill="none" />

        <rect
          x="130"
          y="20"
          width="140"
          height="50"
          rx="6"
          fill="#0f172a"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        <text
          x="200"
          y="50"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          TV
        </text>

        <rect
          x="120"
          y="90"
          width="160"
          height="40"
          rx="4"
          fill="#0f172a"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x="200"
          y="115"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          Soundbar
        </text>

        <rect
          x="300"
          y="110"
          width="60"
          height="60"
          rx="6"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        <text
          x="330"
          y="140"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="12"
        >
          Subwoofer
        </text>

        <line
          x1="200"
          y1="70"
          x2="200"
          y2="90"
          stroke="#94a3b8"
          strokeWidth="2"
          markerEnd="url(#arrow-down)"
        />
        <text
          x="205"
          y="82"
          fill="#e5e7eb"
          fontSize="10"
        >
          HDMI ARC
        </text>

        <path
          d="M240 110 C 270 100 300 100 330 115"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          markerEnd="url(#arrow-down)"
        />
        <text
          x="285"
          y="100"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="10"
        >
          Wireless
        </text>

        <defs>
          <marker
            id="arrow-down"
            viewBox="0 0 10 10"
            refX="5"
            refY="8"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 0 L5 8 z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
