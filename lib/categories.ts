// lib/categories.ts

export type CategoryConfig = {
  slug: string;
  label: string;
  description: string;
};

export const CATEGORIES: CategoryConfig[] = [
  {
    slug: "tvs",
    label: "TVs",
    description:
      "Setup help, picture tweaks, HDMI input problems, and general TV troubleshooting.",
  },
  {
    slug: "receivers-amps",
    label: "Receivers & Amps",
    description:
      "AVR and amp setup, HDMI routing, audio formats, and no-sound issues.",
  },
  {
    slug: "soundbars",
    label: "Soundbars",
    description:
      "Connecting soundbars, fixing ARC/eARC issues, lip-sync delay, and audio dropouts.",
  },
  {
    slug: "speakers-subwoofers",
    label: "Speakers & Subwoofers",
    description:
      "Speaker wiring, wireless subs, hum and buzz issues, and room-tuning basics.",
  },
  {
    slug: "streaming-devices",
    label: "Streaming Devices",
    description:
      "Apple TV, Roku, Fire TV, Chromecast, and streaming box connection and app issues.",
  },
  {
    slug: "cables-connections",
    label: "Cables & Connections",
    description:
      "HDMI, eARC/ARC, optical, and power cabling problems that affect picture and sound.",
  },
  {
    slug: "troubleshooting",
    label: "Troubleshooting",
    description:
      "Cross-device issues like Dolby Atmos not working, handshake failures, and general glitches.",
  },
];

export function normalizeCategoryKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function getCategoryConfigForSlug(
  slug: string,
): CategoryConfig | undefined {
  const key = normalizeCategoryKey(slug);
  return CATEGORIES.find(
    (category) => normalizeCategoryKey(category.slug) === key,
  );
}
