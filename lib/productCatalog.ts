// lib/productCatalog.ts

export type ProductCategory =
  | "hdmi_cable"
  | "hdmi_switch"
  | "hdmi_splitter"
  | "streamer"
  | "soundbar"
  | "subwoofer"
  | "receiver"
  | "networking"
  | "adapter";

export type RecommendationProduct = {
  id: string;
  asin: string;
  label: string;
  category: ProductCategory;
  notes?: string;
  tags?: string[];
};

export const RECOMMENDATION_PRODUCTS: RecommendationProduct[] = [
  // HDMI cables
  {
    id: "hdmi_21_short_6ft",
    asin: "B08TM8TW1R",
    label: "6 ft Ultra High Speed HDMI 2.1 cable",
    category: "hdmi_cable",
    notes: "Short run, consoles and streamers direct to TV/receiver",
    tags: ["4k120", "vrr", "hdr", "short_run"],
  },
  {
    id: "hdmi_21_medium_10ft",
    asin: "B08TM4V1CD",
    label: "10 ft Ultra High Speed HDMI 2.1 cable",
    category: "hdmi_cable",
    notes: "Medium run, typical TV/AV setups",
    tags: ["4k120", "vrr", "hdr", "medium_run"],
  },
  {
    id: "hdmi_21_fiber_long",
    asin: "B0B76FSQNZ",
    label: "Active fiber HDMI 2.1 cable (long run)",
    category: "hdmi_cable",
    notes: "Long run for projectors or distant TVs",
    tags: ["4k120", "vrr", "hdr", "long_run", "projector"],
  },
  {
    id: "hdmi_21_extra",
    asin: "B08MZYQ43S",
    label: "Certified Ultra High Speed HDMI 2.1 cable",
    category: "hdmi_cable",
    notes: "Extra certified option",
    tags: ["4k120", "vrr", "hdr"],
  },

  // HDMI switches
  {
    id: "hdmi_switch_21_4k120",
    asin: "B0F12C8R5R",
    label: "HDMI 2.1 switch (4K120 / VRR)",
    category: "hdmi_switch",
    notes: "For multiple 4K120 consoles into a single HDMI 2.1 input",
    tags: ["4k120", "vrr", "switch"],
  },
  {
    id: "hdmi_switch_20_4k60",
    asin: "B0CLNPGGMC",
    label: "HDMI 2.0 switch (4K60 HDR)",
    category: "hdmi_switch",
    notes: "Budget 4K60 HDR switch",
    tags: ["4k60", "hdr", "switch"],
  },

  // HDMI splitters / extractors
  {
    id: "hdmi_audio_extractor_earc",
    asin: "B0C9CB56SR",
    label: "HDMI eARC / ARC audio extractor",
    category: "hdmi_splitter",
    notes: "Send TV/streamer audio to older receivers/soundbars",
    tags: ["earc", "arc", "audio"],
  },
  {
    id: "hdmi_splitter_21",
    asin: "B0DNKSGJLR",
    label: "HDMI 2.1 splitter",
    category: "hdmi_splitter",
    notes: "Niche use where one source must feed two displays",
    tags: ["4k120", "splitter"],
  },

  // Streamers
  {
    id: "streamer_apple_tv_4k",
    asin: "B0DSDCN1SK",
    label: "Apple TV 4K (latest gen)",
    category: "streamer",
    notes: "High-end streaming box for Dolby Vision / Atmos",
    tags: ["dolby_vision", "dolby_atmos", "premium"],
  },
  {
    id: "streamer_roku_ultra",
    asin: "B0DF44RTTP",
    label: "Roku Ultra",
    category: "streamer",
    notes: "Reliable streamer with wide app support",
    tags: ["roku", "4k", "hdr"],
  },
  {
    id: "streamer_fire_tv_4k_max",
    asin: "B0BP9SNVH9",
    label: "Fire TV Stick 4K Max",
    category: "streamer",
    notes: "Compact 4K HDR streamer",
    tags: ["fire_tv", "4k", "hdr"],
  },

  // Soundbars & subwoofer
  {
    id: "soundbar_earc_atmos",
    asin: "B0FHBVS6GC",
    label: "eARC Dolby Atmos soundbar",
    category: "soundbar",
    notes: "Mid-range eARC Atmos soundbar",
    tags: ["earc", "dolby_atmos"],
  },
  {
    id: "soundbar_arc_budget",
    asin: "B0DY1Z934F",
    label: "Budget ARC soundbar",
    category: "soundbar",
    notes: "Budget soundbar using ARC",
    tags: ["arc", "budget"],
  },
  {
    id: "subwoofer_basic",
    asin: "B07VR24V4V",
    label: "Compact powered subwoofer",
    category: "subwoofer",
    notes: "For basic bass upgrades",
    tags: ["subwoofer", "bass"],
  },

  // Receivers
  {
    id: "receiver_21_4k120",
    asin: "B09HFN8T64",
    label: "4K120 / HDMI 2.1 AV receiver",
    category: "receiver",
    notes: "Modern receiver with 4K120 support",
    tags: ["4k120", "receiver", "hdmi_21"],
  },
  {
    id: "receiver_4k60_legacy",
    asin: "B0BWGKPJ82",
    label: "4K60 / HDR AV receiver",
    category: "receiver",
    notes: "Stable 4K60/HDR receiver for non-2.1 setups",
    tags: ["4k60", "receiver"],
  },

  // Networking
  {
    id: "mesh_wifi_kit",
    asin: "B08ZK2BHP2",
    label: "Mesh Wi-Fi system",
    category: "networking",
    notes: "For whole-home coverage and stable streaming",
    tags: ["mesh_wifi", "coverage"],
  },
  {
    id: "wifi_extender_budget",
    asin: "B0DZ6761T6",
    label: "Budget Wi-Fi range extender",
    category: "networking",
    notes: "Cheap extender to patch weak spots",
    tags: ["extender", "budget"],
  },
  {
    id: "wifi_extender_reliable",
    asin: "B07N1WW638",
    label: "Reliable Wi-Fi extender",
    category: "networking",
    notes: "More robust extender for stubborn dead zones",
    tags: ["extender"],
  },

  // Adapters & specialty
  {
    id: "adapter_usbc_hdmi",
    asin: "B0898BYFSB",
    label: "USB-C to HDMI adapter",
    category: "adapter",
    notes: "For laptops/phones to HDMI displays",
    tags: ["usbc", "hdmi", "laptop"],
  },
  {
    id: "adapter_usbc_dp",
    asin: "B0DQP5WS85",
    label: "USB-C to DisplayPort adapter",
    category: "adapter",
    notes: "For high-refresh monitors from USB-C devices",
    tags: ["usbc", "displayport"],
  },
  {
    id: "adapter_optical_hdmi",
    asin: "B0FGCTBHHF",
    label: "Optical / HDMI audio converter",
    category: "adapter",
    notes: "Niche optical-to-HDMI audio configuration",
    tags: ["optical", "hdmi", "audio"],
  },
];

export function getProductById(id: string): RecommendationProduct | undefined {
  return RECOMMENDATION_PRODUCTS.find((p) => p.id === id);
}

export function buildAmazonUrl(asin: string, amazonTag?: string | null): string {
  const isValidAsin =
    typeof asin === "string" && /^[A-Z0-9]{10}$/.test(asin.trim());

  if (!isValidAsin) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("buildAmazonUrl: invalid ASIN received", { asin, amazonTag });
    }
    return "";
  }

  const base = `https://www.amazon.com/dp/${asin}`;
  if (!amazonTag) return base;
  const url = new URL(base);
  url.searchParams.set("tag", amazonTag);
  return url.toString();
}
