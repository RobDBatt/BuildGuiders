# Roku Reference

## Models In Scope

| Model | Year | Max Resolution | Notes |
|-------|------|---------------|-------|
| Roku Ultra 2022 | 2022 | 4K HDR | Ethernet + Wi-Fi 5, USB, Dolby Vision, HDR10+ |
| Roku Streaming Stick 4K | 2022 | 4K HDR | Wi-Fi only, Dolby Vision, HDR10+ |
| Roku Express 4K+ | 2021 | 4K HDR | Wi-Fi only, no Dolby Vision |
| Roku Express | 2022 | 1080p | Wi-Fi only — **NOT 4K** |
| Roku Streaming Stick+ | Legacy | 4K HDR | No Dolby Vision |

## Resolution Caps by Model — CRITICAL

| Model | Max Resolution |
|-------|---------------|
| Roku Ultra | 4K HDR |
| Roku Streaming Stick 4K | 4K HDR |
| Roku Express 4K+ | 4K HDR |
| **Roku Express** | **1080p ONLY** |

**Never write that Roku Express supports 4K.** The "Express" model (without "4K" in the name) is 1080p only.

## HDR Format Support

| Model | HDR10 | Dolby Vision | HDR10+ | HLG |
|-------|-------|-------------|--------|-----|
| Roku Ultra | ✓ | ✓ | ✓ | ✓ |
| Streaming Stick 4K | ✓ | ✓ | ✓ | ✓ |
| Express 4K+ | ✓ | ✗ | ✓ | ✓ |
| Express | ✓ | ✗ | ✗ | ✓ |

## Connectivity

| Model | Ethernet | Wi-Fi |
|-------|---------|-------|
| Roku Ultra | ✓ (built-in) | ✓ Wi-Fi 5 |
| Streaming Stick 4K | ✗ | ✓ Wi-Fi 5 |
| Express 4K+ | ✗ | ✓ Wi-Fi 5 |
| Express | ✗ | ✓ Wi-Fi 5 |

**Most Roku sticks are Wi-Fi only.** Only the Roku Ultra has built-in Ethernet.

## Audio Output

- **Roku TV / Ultra:** eARC/ARC (via TV port), passes Dolby Atmos DD+, DTS
- **Roku sticks:** Dolby Atmos compressed (DD+) via HDMI ARC — NOT lossless TrueHD
- **Private Listening:** Via Roku app on phone (personal headphone listening)

## Ecosystem / Platform

- **OS:** Roku OS (proprietary)
- **CEC name:** "Roku 1-Touch Play" / standard CEC compliance
- **No local file storage.** No USB media playback on Express models.
- **USB media playback:** Roku Ultra has USB port for local media

## Common Mistakes to Avoid

1. **Never write that Roku Express supports 4K.** It is 1080p only.
2. **Never claim Roku sticks have built-in Ethernet.** Only Ultra has Ethernet.
3. **Never write that Roku supports full-resolution Dolby Atmos (TrueHD).** All Roku devices output Atmos via DD+ (lossy), not TrueHD.
4. **Do not confuse Express 4K+ (supports 4K) with Express (1080p only).** The model name is the key differentiator.
5. **Roku OS is NOT Android TV/Google TV.** Roku has its own OS without Google Play Store.

## Source URLs

- Roku lineup comparison: https://www.roku.com/en-us/products/compare-roku
