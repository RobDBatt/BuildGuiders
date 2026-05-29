# LG TV Reference

## Lineup Overview (2023–2025)

| Series | Panel | Key Feature |
|--------|-------|-------------|
| G-Series | OLED evo (MLA) | Brightest OLED, wall-mount gallery design |
| C-Series | OLED evo | Flagship consumer OLED, 4 × HDMI 2.1 |
| B-Series | OLED | Entry OLED, 4 × HDMI 2.1 (3 on 48") |
| QNED | Mini-LED LCD | Budget LCD alternative |

## HDR Format Support

LG supports: **HDR10, Dolby Vision IQ, HLG**

LG does NOT support: **HDR10+** (LG and Samsung are effectively on opposing sides of the HDR10+ vs Dolby Vision camp)

## HDMI Port Configuration

**C3 / C4 (all sizes):** All 4 HDMI ports are HDMI 2.1 (48 Gbps).
- **eARC port: HDMI 2** (on C3 and C4).
- All 4 ports support 4K@120Hz, VRR, ALLM.

**B3 (48"):** Only 3 HDMI ports (all HDMI 2.1). eARC on HDMI 2.

**QNED series (2023):** Typically 2 × HDMI 2.1, 2 × HDMI 2.0.

Always state port numbers explicitly — do not write "all LG TVs have HDMI 2.1 everywhere."

## VRR Support

- Support for: HDMI Forum VRR, AMD FreeSync Premium (C3+), NVIDIA G-Sync Compatible
- G-Sync Compatible certification added via firmware for C1 and later

## Smart Platform

- **webOS** (version varies by year: webOS 22 = C2, webOS 23 = C3, webOS 24 = C4)
- **CEC name:** SimpLink (NOT Anynet+, NOT Bravia Sync)

## Audio

- Dolby Atmos decoded internally (via built-in decoder)
- eARC on HDMI 2 — supports lossless Dolby TrueHD passthrough to AVR
- DTS is NOT natively decoded by LG — pass to AVR via eARC; some models show DTS passthrough in audio settings

## Common Mistakes to Avoid

1. **Never claim LG supports HDR10+.** LG uses Dolby Vision instead of HDR10+.
2. **Never say eARC is on HDMI 1.** On LG C/G series, eARC is always HDMI 2.
3. **Never use "Anynet+"** to describe LG's CEC — that's Samsung's name. LG = **SimpLink**.
4. **Never say "all 4 ports are HDMI 2.0"** — LG C/G/B series all have HDMI 2.1 ports.
5. **Do not confuse G-Series with C-Series.** G-Series has MLA on all sizes; C-Series has MLA only on 77" and above (2023 C3).

## Known Issues by Generation

**C3 (2023):**
- Dolby Vision gaming mode and VRR must both be enabled separately
- DTS audio content: pass through to AVR via eARC for DTS decode; LG won't decode DTS natively
- Some early units had HDMI 2.1 bandwidth negotiation issues with certain AVRs — firmware updated

**C4 (2024):**
- Introduced AMD FreeSync Premium Pro certification (C3 had FreeSync Premium)
- 4K@144Hz support added for PC gaming (C4 and above)

## Source URLs (for manual verification)

- LG support portal: https://www.lg.com/us/support
- LG C3 product page: https://www.lg.com/us/televisions/oled-tvs
- webOS changelog: accessible via Settings > Support > Software Update
