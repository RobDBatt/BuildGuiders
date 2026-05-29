# Skill: generate-gadget-article

## Purpose

Generate a new BuildGuiders article (MDX) for a consumer electronics troubleshooting or explainer topic.

## Invocation

```
/generate-gadget-article <problem-slug> <brand>
```

**Examples:**
- `/generate-gadget-article earc-not-working lg`
- `/generate-gadget-article 4k-hdr-not-detected sony`
- `/generate-gadget-article dolby-atmos-not-playing denon`
- `/generate-gadget-article hdmi-arc-no-sound samsung`

---

## Before You Write

Load these reference files **first**:

1. **`references/article-structure.md`** — MDX frontmatter schema + required H2 sections
2. **`references/writing-guidelines.md`** — Tone, reading level, consumer-friendly conventions
3. **`references/problem-templates.md`** — Pre-validated problem slugs and symptom descriptions
4. **`references/integration-roadmap.md`** — Where this fits in the bulk generation pipeline

Then load the brand-specific reference from `gadget-product-specs/references/<brand>.md`.

For cross-cutting topics (HDMI, eARC, Dolby Atmos), also read:
- `gadget-product-specs/references/lg.md` — CEC names, eARC port locations
- `gadget-product-specs/references/samsung.md` — CRITICAL: no Dolby Vision

---

## In-Scope Brands

| Category | Brands |
|----------|--------|
| TVs | LG, Sony, Samsung, Hisense, TCL, Vizio |
| AV Receivers | Denon, Marantz, Yamaha, Onkyo |
| Streamers | Apple TV, Roku, Amazon Fire TV, Chromecast / Google TV dongle, Nvidia Shield |
| Gaming | PS5, Xbox Series X/S, Nintendo Switch |
| Soundbars | Sonos, Bose, Samsung |
| HDMI / Cables | Generic, Monoprice, Belkin, Zeskit |

---

## Execution Sequence

1. **Load brand reference** → check max resolution, HDR support, HDMI port map, CEC name
2. **Verify slug against known problems** → see `problem-templates.md`
3. **Check format rules** → Samsung+DV is forbidden; optical+Atmos is forbidden; see `gadget-product-specs/SKILL.md`
4. **Choose affiliate product** → use `lib/productCatalog.ts` or fall back to `pickProductForTopic(slug, category)`
5. **Write MDX** → follow frontmatter schema exactly; generate all required H2 sections
6. **Self-audit before returning**:
   - Run CRITICAL rules from `gadget-product-specs/SKILL.md` through the generated text
   - Check power cycle times (≥ 30 seconds)
   - Verify device resolution claims match brand reference
   - Confirm affiliate link uses `tag=guidersnetw0d-20`

---

## Do NOT

- Claim Samsung TVs support Dolby Vision
- Claim Nintendo Switch supports 4K
- Claim Fire TV Stick Lite supports 4K
- Claim optical/TOSLINK carries Dolby Atmos or DTS:X
- Claim HDMI 2.0 supports 4K@120Hz
- Use the phrase "HDMI 2.1 cable" — cables have speed ratings, not HDMI versions
- Recommend waiting less than 30 seconds during power cycling
- Write "Anynet+" for LG (it's SimpLink), or "SimpLink" for Samsung (it's Anynet+)
- Write "HEOS" for Yamaha (it's MusicCast) or "MusicCast" for Denon/Marantz (it's HEOS)

---

## Output

Save the generated MDX to:
```
content/articles/<brand>/<problem-slug>.mdx
```

If the brand directory doesn't exist, use `content/articles/<category>/` instead.

After writing, confirm there are no errors with:
```bash
node scripts/audit-local-rules.mjs --slug <problem-slug>
```
