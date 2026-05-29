---
name: gadget-product-specs
description: Verified AV/streaming/gaming device specs for BuildGuiders article generation, fact-checking, and auditing. Use whenever writing or reviewing content about specific TV models, AV receivers, soundbars, streaming devices, gaming consoles, or HDMI connection specs. Provides ground-truth specs sourced from manufacturer documentation so the model never has to guess.
---

# AV Device Specs — Ground Truth

This skill is the canonical knowledge source for consumer electronics product facts on BuildGuiders. The structured data lives in `lib/known-models.json`; the per-brand reference files in `references/` provide narrative context, common gotchas, and curated model specs.

## When to use this skill

- **Writing a new article** — load the brand's reference file before drafting. The brand's verified port specs, HDR formats, and CEC name must come from here, not from training-data recall.
- **Fact-checking an existing article** — cross-check every format claim, resolution claim, and port claim against this skill's data.
- **Answering product spec questions** — defer to this data, NOT to training data.

## How to look up data — preferred source order

For any spec claim (HDR format, HDMI port version, max resolution, audio format, CEC name):

1. **First check `lib/known-models.json`** — structured ground-truth data. Contains TV, AVR, streamer, console, and soundbar specs with `manualVerifiedAt` timestamps.
2. **Then check the brand reference file** (`references/<brand>.md`) for narrative context, lineup overview, and common mistake patterns.
3. **Only as a last resort:** WebFetch the manufacturer's product page. Be aware that Samsung, Sony, and LG product pages frequently block automated scraping.

## In-scope brands (active article generation)

**TVs:**
- `references/lg.md` — LG OLED evo, QNED, webOS, SimpLink CEC
- `references/sony.md` — Sony BRAVIA XR, Google TV, Bravia Sync CEC
- `references/samsung.md` — Samsung Neo QLED, QLED, QD-OLED, Tizen, Anynet+ CEC
- `references/hisense.md` — Hisense ULED, Google TV / Roku TV
- `references/tcl.md` — TCL Mini-LED, Google TV / Roku TV
- `references/vizio.md` — Vizio QLED, SmartCast

**AV Receivers:**
- `references/denon.md` — Denon AVR-X / AVR-S series, HEOS multi-room
- `references/marantz.md` — Marantz Cinema series, HEOS multi-room
- `references/yamaha.md` — Yamaha RX-V / AVENTAGE, MusicCast
- `references/onkyo.md` — Onkyo TX-NR series, Chromecast Built-in

**Streaming Devices:**
- `references/apple-tv.md` — Apple TV 4K Gen 3, tvOS, Dolby Vision
- `references/roku.md` — Roku Ultra, Streaming Stick 4K, 1-Touch Play CEC
- `references/fire-tv.md` — Fire TV Stick 4K Max, Fire TV Stick Lite (1080p only)

**Gaming Consoles:**
- Specs in `lib/known-models.json` → `consoles` section

**Out-of-scope brands** (no curated reference file yet): Insignia, Toshiba, Skyworth, Element, Sceptre, Westinghouse. Do NOT generate new articles for these brands until a reference file is built.

## Critical "do not invent" rules

These rules exist because they are the most common error patterns in AV content:

1. **Samsung does NOT support Dolby Vision.** Samsung uses HDR10+ instead. Any claim of Samsung + Dolby Vision is CRITICAL. All other major TV brands (LG, Sony, TCL, Hisense, Vizio) support Dolby Vision.

2. **Optical/TOSLINK CANNOT carry Dolby Atmos or DTS:X.** Optical is limited to Dolby Digital 5.1 compressed or stereo PCM. For Atmos: eARC over HDMI is required.

3. **HDMI 2.0 maxes at 4K@60Hz.** 4K@120Hz requires HDMI 2.1 (48 Gbps). Never claim HDMI 2.0 + 4K@120.

4. **Never write "HDMI 2.1 cable" or "HDMI 2.0 cable."** Cables have speed ratings: Certified Ultra High Speed (48Gbps), Certified Premium High Speed (18Gbps), High Speed (10.2Gbps).

5. **Nintendo Switch outputs 1080p docked, 720p handheld — NO 4K.** The Switch uses HDMI 1.4. Never claim 4K or HDR output.

6. **Fire TV Stick Lite is 1080p ONLY.** Not 4K capable. The 4K model is the Fire TV Stick 4K or 4K Max.

7. **Xbox Series S renders games at 1440p max.** Never write 4K@120Hz or 4K gaming for Series S. (4K streaming apps and upscaling are different.)

8. **ARC vs eARC is not interchangeable.** Standard ARC: compressed audio only (Dolby Digital 5.1). eARC: lossless including Dolby TrueHD, DTS-HD MA, Dolby Atmos, DTS:X.

9. **Apple TV 4K Gen 3 does NOT do 4K@120Hz.** The HDMI 2.1 port exists but Apple disabled 4K@120Hz in tvOS.

10. **HDMI port asymmetry.** Most TVs have a mix of port versions. State the specific port number for eARC, 4K@120, VRR — don't generalize "all HDMI ports support X".

11. **Sonos uses WiFi, NOT Bluetooth, for music playback.** Do not describe Sonos as a "Bluetooth speaker" or suggest Bluetooth pairing for audio.

12. **CEC brand names must be correct per brand.** Samsung = Anynet+, LG = SimpLink, Sony = Bravia Sync. Never mix these.

## Adding new models

When you encounter a model not in `lib/known-models.json`:
1. Check the manufacturer's product page for the model's full spec sheet.
2. Verify: HDMI port count + which ports are 2.1 vs 2.0, eARC port number, HDR formats, VRR support, and known issues.
3. Add the entry to `lib/known-models.json` with a `manualVerifiedAt: YYYY-MM-DD` timestamp.
4. If the brand has or needs context updates, update the matching `references/<brand>.md`.

Don't add a model you can't verify. The table's value is that every entry is sourced.

## Related files

- `lib/known-models.json` — structured ground-truth data
- `scripts/audit-local-rules.mjs` — uses this data to catch AV-domain errors
- `scripts/audit-local-llm.mjs` — uses this data as ground-truth context for local LLM fact-checking
- `scripts/audit-accuracy-claude.mjs` — search-grounded Claude audit (paid API)
