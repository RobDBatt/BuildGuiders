export default function DiagramWifiMesh() {
  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
      <svg
        viewBox="0 0 400 200"
        role="img"
        aria-label="Mesh Wi-Fi network with main router and mesh nodes"
        className="h-auto w-full"
      >
        <rect width="400" height="200" fill="none" />

        <circle
          cx="200"
          cy="80"
          r="24"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        <text
          x="200"
          y="78"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          Main
        </text>
        <text
          x="200"
          y="92"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="11"
        >
          router
        </text>

        <circle
          cx="80"
          cy="140"
          r="20"
          fill="#0f172a"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x="80"
          y="138"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="10"
        >
          Mesh
        </text>
        <text
          x="80"
          y="150"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="10"
        >
          node
        </text>

        <circle
          cx="320"
          cy="140"
          r="20"
          fill="#0f172a"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x="320"
          y="138"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="10"
        >
          Mesh
        </text>
        <text
          x="320"
          y="150"
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize="10"
        >
          node
        </text>

        <line
          x1="200"
          y1="104"
          x2="80"
          y2="120"
          stroke="#94a3b8"
          strokeWidth="2"
        />
        <line
          x1="200"
          y1="104"
          x2="320"
          y2="120"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        <text
          x="80"
          y="170"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="10"
        >
          Living room
        </text>
        <text
          x="320"
          y="170"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="10"
        >
          Bedroom
        </text>
      </svg>
    </div>
  );
}
