# Apple TV Reference

## Models In Scope

| Model | Year | Note |
|-------|------|------|
| Apple TV 4K (3rd Gen) | 2022 | A2737 (Wi-Fi), A2843 (Wi-Fi + Ethernet) |
| Apple TV 4K (2nd Gen) | 2021 | A2169 |
| Apple TV HD | 2015–2022 | 1080p only — retired 2022 |

## Current Hardware Specs (3rd Gen)

- **HDMI version:** HDMI 2.1 port (but 4K@120Hz is NOT enabled by Apple)
- **Max resolution output:** 4K@60Hz HDR
- **HDR formats:** HDR10, Dolby Vision (including Dolby Vision IQ), HLG
- **Audio output:** Dolby Atmos (compressed, via Dolby Digital Plus) — NOT lossless TrueHD
- **Connectivity (A2843):** Built-in Gigabit Ethernet + Wi-Fi 6 (802.11ax)
- **Connectivity (A2737):** Wi-Fi 6 only (no Ethernet)
- **Operating system:** tvOS

## Critical Limitations

**4K@120Hz is NOT supported.** Apple TV 4K Gen 3 has an HDMI 2.1 port but Apple has not enabled 4K@120Hz output in tvOS as of 2026. Do not write that it supports 4K@120Hz or VRR.

**Dolby Atmos is compressed, not lossless.** Apple TV outputs Dolby Atmos via Dolby Digital Plus (lossy). It does NOT output Dolby TrueHD (lossless Atmos). For lossless Atmos, a dedicated Blu-ray player or eARC from a TV's streaming app is required.

**No DTS:X native output.** Apple TV does not output DTS:X. DTS audio encoded content is transcoded to PCM or Dolby.

**Match Frame Rate / Match Dynamic Range** must be manually enabled in Settings > Video and Audio > Match Content for best HDR/frame rate behavior.

## Ecosystem

- **AirPlay 2:** Built-in. Works with Sonos, Samsung TVs, LG TVs, Denon/Marantz receivers
- **HomeKit Hub:** Functions as a HomeKit hub when connected to power
- **Siri Remote:** Includes gyroscope/accelerometer, touch surface, Siri button

## App Availability (as of 2026)

Available: Netflix, Disney+, Max, Prime Video, Apple TV+, YouTube, Peacock, Paramount+, ESPN+, Hulu
Not available natively: Google Play Movies (use browser or AirPlay from iPhone)

## Common Mistakes to Avoid

1. **Never claim Apple TV 4K supports 4K@120Hz.** The HDMI 2.1 port exists but Apple disabled 4K@120.
2. **Never say Dolby Atmos from Apple TV is lossless.** It's Dolby Digital Plus (lossy). Write "supports Dolby Atmos (Dolby Digital Plus)" if precision is needed.
3. **Never say Apple TV has Ethernet on all models.** Only the A2843 (Wi-Fi + Ethernet) has built-in Ethernet. The cheaper A2737 requires an adapter.
4. **Never claim VRR support.** Apple TV 4K (2022) does not support VRR.
5. **DTS content is not output natively.** Don't write "Apple TV passes through DTS:X."

## Source URLs

- Apple TV product page: https://www.apple.com/apple-tv-4k/
- Apple TV 4K specs: https://www.apple.com/apple-tv-4k/specs/
