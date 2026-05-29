# BuildGuiders GSC Monitor

Monitor Google Search Console index status for key BuildGuiders URLs from your local machine.

## Overview
- Loads a local `config.json` (copy from `config.example.json`) to know the property, sitemaps, and focus URLs.
- Authenticates with Google Search Console (read-only).
- For each focus URL, queries the Search Console Search Analytics API for the last 30 days to see if it has impressions (used as a proxy for indexing/visibility).
- Fetches each sitemap and reports how many URLs are listed.

## Prerequisites
- Python 3.10+ installed.
- A Google Cloud project with the *Search Console API* enabled.
- OAuth 2.0 client credentials (`client_secret.json`) placed in `tools/gsc_monitor`.
- Verified ownership of `https://www.buildguiders.com/` (or your property) in Google Search Console.

## Setup
1) Copy the example config and fill in your details:
   ```powershell
   cd C:\Sites-Vercel\BuildGuiders\tools\gsc_monitor
   copy config.example.json config.json
   # edit config.json to set property_url, sitemap_urls, and focus_urls
   ```
2) Place `client_secret.json` (OAuth client for Search Console API) in `tools\gsc_monitor`.
3) Create a virtualenv and install requirements:
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

## Usage
Activate your virtualenv and run the monitor:
```powershell
cd C:\Sites-Vercel\BuildGuiders\tools\gsc_monitor
.venv\Scripts\Activate.ps1
python gsc_monitor.py
```

What to expect:
- Prompts for Google OAuth on first run; token is cached in `token.json`.
- For each focus URL: whether it shows impressions in the last 30 days (proxy for indexed/visible), impressions count, and a short note.
- For each sitemap: number of URLs found in the XML.
- A small summary of focus URL indexing status.
