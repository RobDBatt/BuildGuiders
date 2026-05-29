# AV Device Manual Sources

## Purpose

This file lists authoritative sources for AV device specifications. Use when writing new articles or updating `lib/known-models.json`.

For any spec you cannot confirm from memory or brand reference files, look it up from these sources before writing.

---

## TV Spec Sources

| Brand | Main Spec Page |
|-------|---------------|
| LG | https://www.lg.com/us/tvs — click product → Specs tab |
| Samsung | https://www.samsung.com/us/televisions-home-theater/tvs/ |
| Sony | https://www.sony.com/en/articles/bravia-tv |
| Hisense | https://www.hisense-usa.com/tv |
| TCL | https://www.tcl.com/us/en/television |
| Vizio | https://www.vizio.com/en/tv |

---

## AV Receiver Spec Sources

| Brand | Main Spec Page |
|-------|---------------|
| Denon | https://www.denon.com/en-us/category/av-receivers |
| Marantz | https://www.marantz.com/en-us/category/av-receivers |
| Yamaha | https://usa.yamaha.com/products/audio_visual/av_receivers_amps/ |
| Onkyo | https://www.us.onkyo.com/en/av-receivers.html |

---

## Streaming Device Spec Sources

| Brand | Main Spec Page |
|-------|---------------|
| Apple TV | https://www.apple.com/apple-tv-4k/specs/ |
| Roku | https://www.roku.com/en-us/products/compare-roku |
| Amazon Fire TV | https://www.amazon.com/b?node=8521791011 (Fire TV lineup) |
| Google Chromecast | https://store.google.com/us/category/tv-speakers |
| Nvidia Shield | https://www.nvidia.com/en-us/shield/ |

---

## Gaming Console Spec Sources

| Brand | Main Spec Page |
|-------|---------------|
| Sony PS5 | https://www.playstation.com/en-us/ps5/ps5-specifications/ |
| Xbox Series X/S | https://www.xbox.com/en-US/consoles/xbox-series-x |
| Nintendo Switch | https://www.nintendo.com/en-US/hardware/switch/ |

---

## HDMI Specification Reference

| Topic | Source |
|-------|--------|
| HDMI Forum specifications | https://www.hdmi.org/spec/summary |
| HDMI 2.1 features (4K@120, VRR, eARC) | https://www.hdmi.org/spec21sub/overview |
| Cable certification tiers | https://www.hdmi.org/spec/typea_p (Premium) and https://www.hdmi.org/spec/uhs (Ultra High Speed) |
| eARC vs ARC | https://www.hdmi.org/spec/earc |

---

## Dolby / DTS Format References

| Topic | Source |
|-------|--------|
| Dolby Atmos overview | https://professional.dolby.com/tv/dolby-atmos/ |
| Dolby Vision compatible TVs | https://www.dolby.com/consumer-dolby/dolby-vision/ |
| DTS:X overview | https://dts.com/dtsx/ |
| HDR10+ compatible TVs | https://hdr10plus.org/ |

---

## Review Sites (for real-world measurements)

Use these to cross-check manufacturer claims:

| Site | Specialization |
|------|---------------|
| RTings.com | TV/monitor measurements (input lag, HDR brightness, contrast) |
| AVS Forum | AV receiver/speaker discussions; user measurements |
| Digital Trends | Consumer tech reviews |
| The Verge | Consumer electronics coverage |
| Sound & Vision | AV-focused magazine reviews |

---

## Update Policy

When a new model launches or specs change:
1. Update `lib/known-models.json` with the new model entry
2. Update the relevant brand reference file in `references/<brand>.md`
3. Add the manufacturer spec URL to this file if it's a new brand
4. Run `node scripts/audit-local-rules.mjs` to confirm no existing articles need updates

Review this file every 3–6 months to add new models and remove discontinued products.
