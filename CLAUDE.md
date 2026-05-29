# BuildGuiders — HVAC Troubleshooting & Buying Guides

BuildGuiders is an Amazon affiliate content site targeting HVAC troubleshooting and buying guides. The niche: mini-splits, smart thermostats, tankless water heaters, window ACs, and portable ACs.

**Affiliate tag:** `buildguiders-20` — CRITICAL: set `NEXT_PUBLIC_AMAZON_TAG=buildguiders-20` in Vercel. Never use `buildguiders-20` or `gearguiders-20`.

**Target query pattern:** `[brand] [model] [error code] [symptom]`

Good examples:
- "MRCOOL DIY E1 error code communication fix"
- "Mitsubishi MSZ-GL P8 overheat discharge fix"
- "Navien NPE-180A E003 ignition failure"
- "Ecobee SmartThermostat E1 no C-wire fix"
- "Frigidaire window AC F1 temperature sensor error"

**Main competitors:** PICKHVAC, HVACProSales, FilterBuy, TanklessHelp

---

## Article Generation

Articles live in `content/articles/` as `.mdx` files. Cover images use `/images/covers/` path prefix.

To generate articles, run (with `OPENAI_API_KEY` in environment):
```
node scripts/research-and-generate.mjs
```

Then validate and push:
```
npm run check:all
npm run qa:verify
```

---

## Content Accuracy Rules (enforced by pre-commit hooks)

### HVAC Safety — Non-Negotiable
- **NEVER recommend DIY refrigerant work** — EPA 608 certification is required. Always say "contact a licensed HVAC technician" for any refrigerant issue (recharging, leak repair, refrigerant type).
- **SEER2** is the current efficiency standard (replaced SEER in Jan 2023). Use SEER2 when citing efficiency ratings; note SEER if comparing older units.
- **240V circuit required** for most mini-splits — always state electrical requirements upfront.
- **C-wire required** for most smart thermostats — always mention in smart thermostat articles.
- **Cold weather heat pump limits:** Most residential heat pumps lose efficiency below 5°F / -15°C and shut down below -22°F / -30°C. Hyper-heat models (Mitsubishi H2i+, some Bosch/Daikin) rated to -13°F / -25°C or lower. Never claim a standard heat pump works normally in extreme cold.
- **Power cycle minimum:** 30 seconds for all HVAC equipment.

### BTU Sizing Rules
- General rule: ~20 BTU per sq ft (adjust for climate zone, ceiling height, insulation quality)
- Do not recommend undersizing (always err toward the next size up for humid/hot climates)
- BTU tiers: 9,000 / 12,000 / 18,000 / 24,000 / 36,000 BTU — match to typical room sizes accurately

### Brand-Product Matrix
**Mini-split brands (do NOT attribute thermostats or water heaters to these):**
MRCOOL, Mitsubishi, Daikin, LG, Pioneer, Senville, Gree, Midea, Cooper & Hunter, Bosch (HVAC), Friedrich, Carrier, Lennox, Trane, Goodman

**Smart thermostat brands (do NOT attribute mini-splits to these):**
Ecobee, Honeywell Home, Google Nest, Sensi, Emerson, Lux, Wyze

**Tankless water heater brands (do NOT attribute HVAC systems to these):**
Navien, Rinnai, Noritz, Takagi, Rheem (tankless), A.O. Smith, Bradford White, Stiebel Eltron, EcoSmart

**Window AC brands:** Frigidaire, LG (window line), GE, Friedrich, Midea, hOmelabs, Black+Decker

### Error Code Accuracy
- Never invent error codes — cite the specific brand's official documentation
- Error code meanings vary by brand AND model generation — always note the specific model series
- The same error code number (e.g., E1) means different things on different brands

### Affiliate Product Rules
- Troubleshooting article about error code → link to the unit itself OR a replacement part/sensor
- Freezing/icing issue → link to refrigerant gauges, condensate pumps, or air filter (never the thermostat)
- Thermostat articles → link to the specific thermostat model
- Water heater error codes → link to the unit or descaling kit
- All URLs must use `tag=buildguiders-20`
- Disclosure note must be: `Paid link: BuildGuiders may earn a commission at no extra cost to you.`

---

## MDX Frontmatter Format

```
---
slug: [slug]
title: [Article Title with Year]
brand: [mrcool | mitsubishi | daikin | lg | pioneer | senville | ecobee | honeywell | nest | navien | rinnai | frigidaire | other]
category: [mini-splits | smart-thermostats | water-heaters | window-ac | portable-ac | air-quality]
coverImage: /images/covers/Cover-HVAC.png
coverAlt: [brief description]
date: '[YYYY-MM-DD]'
tags:
  - [tag 1]
  - [tag 2]
products:
  - name: [Product Name with Model Number]
    description: [2-3 sentences — BTU, coverage area, key specs, why recommended]
    url: https://www.amazon.com/s?k=[Product+Name]&tag=buildguiders-20
    note: 'Paid link: BuildGuiders may earn a commission at no extra cost to you.'
description: [1-2 sentence meta description]
keywords: [keyword1, keyword2, keyword3, keyword4, keyword5]
published: true
---
```

---

## Validation Scripts (pre-commit hooks)

1. `check:brand-match` — Catches brand-product mismatches (e.g., thermostat brand writing mini-split article)
2. `check:format-claims` — Catches DIY refrigerant advice, wrong SEER/SEER2 usage
3. `check:power-cycle` — Catches wait times under 30 seconds
4. `check:mojibake` — Catches encoding corruption

Run all checks:
```
npm run check:all
npm run qa:verify
```
