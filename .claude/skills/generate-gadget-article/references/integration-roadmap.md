# Integration Roadmap

## Where Article Generation Fits

```
┌─────────────────────────────────────────────────────────────────┐
│              BuildGuiders Content Pipeline                      │
│                                                                  │
│  1. TOPIC DISCOVERY                                              │
│     GA4 error queries → build-error-backlog-from-ga.mjs         │
│     Manual topic list → content/inbox/                          │
│     Gap analysis → report-category-coverage.mjs                 │
│                         ↓                                        │
│  2. GENERATION (you are here)                                    │
│     /generate-gadget-article <slug> <brand>                      │
│     OR  generate-articles-batch.mjs (batch mode)                │
│                         ↓                                        │
│  3. LOCAL VALIDATION                                             │
│     audit-local-rules.mjs --slug <slug>                         │
│     check-brand-product-match.mjs                                │
│     check-format-claims.mjs                                      │
│                         ↓                                        │
│  4. ACCURACY AUDIT (optional, for important articles)            │
│     audit-accuracy-claude.mjs --slug <slug>                      │
│     fix-from-audit.mjs (if issues found)                         │
│                         ↓                                        │
│  5. COMMIT GATE                                                  │
│     .husky/pre-commit (runs all 7 checks)                        │
│                         ↓                                        │
│  6. DEPLOY                                                       │
│     next build → Vercel                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Batch Generation Flow

For bulk article generation (e.g., 20 articles in one session):

```bash
# 1. Generate articles from a topic list
node scripts/generate-articles-batch.mjs --input content/inbox/topics.json

# 2. Run local rules audit on all new articles
node scripts/audit-local-rules.mjs

# 3. Run accuracy audit on high-priority articles
node scripts/audit-accuracy-claude.mjs --slug earc-not-working

# 4. Fix any audit findings
node scripts/fix-from-audit.mjs

# 5. Verify fixes applied correctly
node scripts/verify-fixes.mjs

# 6. Commit (pre-commit check runs automatically)
git add content/articles/ && git commit -m "feat: add 20 new AV troubleshooting articles"
```

---

## Priority Tiers for Generation

### Tier 1 — High Value (generate first)
Articles about top search-volume problems. These get accuracy-audited by Claude.

- PS5 / Xbox 4K@120Hz problems (gaming + HDMI keywords)
- LG / Samsung HDMI no signal
- eARC not working (any brand)
- Dolby Atmos not playing from streaming apps
- TV won't connect to WiFi after firmware update

### Tier 2 — Medium Value
Articles covering common but less search-competitive topics. Local rules audit only.

- Sound out of sync
- ARC vs eARC explainer
- CEC causing TV to turn on randomly
- TV picture looks washed out in HDR

### Tier 3 — Long Tail
Niche model-specific articles. Auto-generate in batch, validate with local rules.

- `<brand>-<specific-error-code>-fix`
- `<model>-remote-not-working`
- `<brand>-firmware-update-error`

---

## Input File Format (for batch generation)

`content/inbox/topics.json`:
```json
[
  {
    "slug": "lg-earc-not-working",
    "brand": "lg",
    "category": "tv",
    "title": "LG eARC Not Working: How to Fix It",
    "priority": 1
  },
  {
    "slug": "ps5-4k120-not-showing",
    "brand": "ps5",
    "category": "gaming-console",
    "title": "PS5 Not Showing 4K@120Hz: Fix It in Minutes",
    "priority": 1
  }
]
```

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Required for audit-accuracy-claude.mjs | — |
| `SPEC_VERIFY_ENABLED` | Enable model-specific spec verification | `true` |
| `SPEC_VERIFY_MODEL` | Claude model to use for spec verification | `claude-opus-4-5` |
| `OLLAMA_BASE_URL` | Ollama server for audit-local-llm.mjs | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `qwen2.5:14b-instruct-q4_K_M` |

---

## Scheduled Automation

### GitHub Actions (scheduled batch)

`.github/workflows/scheduled-generate.yml` runs weekly to:
1. Pull GA4 query report (top 50 "not found" error queries)
2. Generate articles for any missing slug
3. Audit with local rules
4. Commit and push (triggers Vercel deploy)

Current status: see `.github/workflows/` directory.

---

## Metrics

Track per-article:
- **Audit pass rate:** % of new articles passing local rules on first generation
- **Fix rate:** % of articles needing Claude fixes
- **Affiliate click-through rate:** tracked via GA4 events on ProductBox component

Target: >90% of generated articles pass local rules without fixes.

---

## Skill Update Policy

When a new TV/device model launches that changes supported specs:
1. Update `lib/known-models.json` first
2. Update the brand reference file in `gadget-product-specs/references/<brand>.md`
3. Re-run `audit-local-rules.mjs` across all articles to catch any previously valid content now outdated

Review `lib/known-models.json` every 6 months for new model additions.
