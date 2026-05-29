# Article Structure Reference

## MDX Frontmatter Schema

Every article must have this exact frontmatter block at the top:

```yaml
---
slug: "<article-slug>"
title: "<Full Article Title>"
brand: "<brand>"          # e.g. lg, samsung, sony, denon, roku
category: "<category>"    # e.g. tv, av-receiver, soundbar, streaming-device, gaming-console
coverImage: "/images/gg/<brand>-<slug>.jpg"
coverAlt: "<descriptive alt text for cover image>"
date: "2026-04-10"
tags:
  - "<brand>"
  - "<category>"
  - "<topic tag 1>"
  - "<topic tag 2>"
products:
  - name: "<Product display name>"
    url: "https://www.amazon.com/s?k=<URL-encoded+product+name>&tag=guidersnetw0d-20"
    description: "<One sentence: what it does for this specific problem>"
    disclosure: "Paid link: BuildGuiders may earn a commission at no extra cost to you."
description: "<150–160 character meta description — includes primary keyword naturally>"
keywords:
  - "<primary keyword>"
  - "<variant 1>"
  - "<variant 2>"
  - "<variant 3>"
published: true
---
```

### Frontmatter Rules

- `slug` must be all lowercase, hyphen-separated, no underscores
- `brand` must be one of: `lg`, `sony`, `samsung`, `hisense`, `tcl`, `vizio`, `denon`, `marantz`, `yamaha`, `onkyo`, `apple-tv`, `roku`, `fire-tv`, `chromecast`, `nvidia-shield`, `ps5`, `xbox`, `nintendo-switch`, `sonos`, `bose`, `generic`
- `category` must be one of: `tv`, `av-receiver`, `soundbar`, `streaming-device`, `gaming-console`, `hdmi`, `networking`
- `date` is always `2026-04-10` for newly generated articles
- `products` array must have exactly 1 item (the most relevant affiliate product)
- `disclosure` must be exactly: `Paid link: BuildGuiders may earn a commission at no extra cost to you.`
- Amazon URL must include `tag=guidersnetw0d-20` — never omit

---

## Required H2 Sections (in order)

### 1. Quick Answer
```md
## Quick Answer
```
- 2–4 bullet points giving the immediate fix or top 3 causes
- Should be answer-first (what to do, not what might cause it)
- Users who just need the answer should find it here

### 2. What You're Seeing
```md
## What You're Seeing
```
- Describe the exact symptom from the user's perspective
- 1–2 paragraphs
- Use concrete, specific language: "The TV shows 'No Signal' on HDMI 2 after waking from standby" not "your TV has a problem"

### 3. Quick Checks First
```md
## Quick Checks First
```
- 3–5 simple things to try before the detailed walkthrough
- Ordered from fastest to slowest
- Examples: check input, reseat cable, power cycle (30 seconds off)

### 4. Step-by-Step Fix
```md
## Step-by-Step Fix
```
- Numbered steps for the primary diagnostic/fix path
- Each step should be a specific action
- Include menu paths where relevant (e.g., "Settings → General → HDMI-UHD Color")
- Include any wait times (power cycle = 30 seconds minimum)

### 5. Other Causes (if applicable)
```md
## Other Causes
```
- Alternative explanations if Step-by-Step Fix didn't work
- Cover 2–3 less-common causes
- This section can be omitted for very focused articles

### 6. If It Still Isn't Working
```md
## If It Still Isn't Working
```
- Factory reset option (with appropriate caveat about losing settings)
- Contact manufacturer support (with link if possible)
- When to consider hardware failure vs. software/settings issue

### 7. FAQ
```md
## FAQ
```
- 3–5 questions in H3 format
- Cover related questions users commonly ask
- Keep answers concise (2–4 sentences each)

---

## MDX Component Usage

Available components (from `mdx-components.tsx`):

```mdx
<ProductBox /> - auto-renders from frontmatter products[] — do not add manually in body
```

The `ProductBox` is rendered automatically from frontmatter — do NOT add a product box in the article body. The site layout handles placement.

---

## Length Guidelines

| Article type | Target word count |
|-------------|-----------------|
| Focused troubleshooting (single cause) | 600–900 words |
| Multi-cause troubleshooting | 900–1,400 words |
| Explainer / "what is X" | 800–1,200 words |
| Comparison article | 1,000–1,600 words |

Do not pad articles with fluff to hit a word count. Every sentence should provide value.

---

## Heading Hierarchy

- `## H2` — major sections (Quick Answer, Step-by-Step Fix, FAQ, etc.)
- `### H3` — sub-steps, individual FAQ questions, sub-causes
- `#### H4` — rare; use only for deeply nested content like complex menu trees

Do **not** use `# H1` — the article title is rendered from frontmatter automatically.
