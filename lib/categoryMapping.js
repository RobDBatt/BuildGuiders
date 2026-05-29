// lib/categoryMapping.js
// JavaScript helper used by scripts (Node) for mapping free-form
// topic hints to canonical category slugs from lib/categories.ts.

/** @type {Record<string, string>} */
export const CATEGORY_MAPPING = {
  // TVs
  tv: "tvs",
  oled: "tvs",
  qled: "tvs",
  "no signal": "tvs",
  picture: "tvs",

  // Receivers & Amps
  avr: "receivers-amps",
  receiver: "receivers-amps",
  "av receiver": "receivers-amps",
  amp: "receivers-amps",
  "dolby atmos": "receivers-amps",

  // Soundbars
  soundbar: "soundbars",
  "sound bar": "soundbars",
  "arc soundbar": "soundbars",
  "earc soundbar": "soundbars",

  // Speakers & Subwoofers
  speaker: "speakers-subwoofers",
  speakers: "speakers-subwoofers",
  subwoofer: "speakers-subwoofers",
  "wireless sub": "speakers-subwoofers",

  // Streaming Devices
  "apple tv": "streaming-devices",
  roku: "streaming-devices",
  "fire tv": "streaming-devices",
  chromecast: "streaming-devices",
  "streaming box": "streaming-devices",

  // Cables & Connections
  hdmi: "cables-connections",
  "hdmi cable": "cables-connections",
  "hdmi 2.1": "cables-connections",
  earc: "cables-connections",
  arc: "cables-connections",
  "optical cable": "cables-connections",
  "surge protector": "cables-connections",

  // Troubleshooting
  handshake: "troubleshooting",
  "no audio": "troubleshooting",
  "no sound": "troubleshooting",
  "audio dropouts": "troubleshooting",
  "lip sync": "troubleshooting",
  "hdr not working": "troubleshooting",
};

/**
 * Infer a canonical category slug from a list of free-form hints.
 * @param {string[]} hints
 * @returns {string}
 */
export function inferCategorySlugFromHints(hints) {
  const lowered = hints.map((h) => h.toLowerCase());
  for (const hint of lowered) {
    for (const key of Object.keys(CATEGORY_MAPPING)) {
      if (hint.includes(key)) {
        return CATEGORY_MAPPING[key];
      }
    }
  }
  // Default fallback if nothing matches
  return "troubleshooting";
}

