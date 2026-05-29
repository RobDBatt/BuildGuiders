# Affiliate Management Utilities

This directory contains tools for managing affiliate products and article mappings for BuildGuiders.

## Scripts

### `apply-affiliate-map.mjs`

Injects curated affiliate products into MDX frontmatter based on the `article-affiliate-map.csv`.

**Usage:**

```bash
# Dry run (see what would change)
node scripts/apply-affiliate-map.mjs --dry-run

# Apply high/medium confidence matches only
node scripts/apply-affiliate-map.mjs

# Apply high/medium AND low confidence matches (forced logic)
# - Network -> Ethernet Cable
# - Remote -> Rechargeable Batteries
node scripts/apply-affiliate-map.mjs --apply-low
```

### `validate-content.mjs` (updated)

Now includes a check for duplicate affiliate disclosure text ("Paid link...") in the article body. This is a warning, not an error.

## NPM Commands

- `npm run sync:affiliates`: Runs the map application script (default mode) and then validates content immediately.

## Data Files

- `affiliate-products.json`: The source of truth for product metadata (ASINs, URLs, Descriptions).
- `article-affiliate-map.csv`: Maps article slugs to product keys.
