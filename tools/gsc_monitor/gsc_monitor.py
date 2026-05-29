import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from dateutil.parser import parse as parse_date  # type: ignore
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build, Resource
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


@dataclass
class Config:
    property_url: str
    client_secrets_file: str
    token_file: str
    sitemap_urls: List[str]
    focus_urls: List[str]


def load_config(path: str) -> Config:
    if not os.path.exists(path):
        print(f"[ERROR] config.json not found at {path}.")
        print(
            "Copy config.example.json to config.json, fill in your property_url, sitemaps, and focus_urls, then rerun."
        )
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    required = ["property_url", "client_secrets_file", "token_file", "sitemap_urls", "focus_urls"]
    for key in required:
        if key not in data:
            print(f"[ERROR] Missing required config key: {key}")
            sys.exit(1)

    return Config(
        property_url=data["property_url"],
        client_secrets_file=data["client_secrets_file"],
        token_file=data["token_file"],
        sitemap_urls=list(data.get("sitemap_urls", [])),
        focus_urls=list(data.get("focus_urls", [])),
    )


def authenticate(cfg: Config) -> Resource:
    creds: Optional[Credentials] = None
    if os.path.exists(cfg.token_file):
        creds = Credentials.from_authorized_user_file(cfg.token_file, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as exc:  # pragma: no cover - network/IO
                print(f"[WARN] Token refresh failed: {exc}")
                creds = None

        if not creds:
            if not os.path.exists(cfg.client_secrets_file):
                print(f"[ERROR] OAuth client secrets file not found: {cfg.client_secrets_file}")
                print(
                    "Download client_secret.json from Google Cloud (Search Console API enabled) "
                    "and place it in tools/gsc_monitor/"
                )
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(cfg.client_secrets_file, SCOPES)
            creds = flow.run_local_server(port=0)
            with open(cfg.token_file, "w", encoding="utf-8") as token:
                token.write(creds.to_json())

    try:
        service = build("searchconsole", "v1", credentials=creds)
        return service
    except Exception as exc:  # pragma: no cover - network/IO
        print(f"[ERROR] Failed to initialize Search Console API client: {exc}")
        sys.exit(1)


def fetch_impressions(service: Resource, property_url: str, url: str) -> Tuple[bool, int, str]:
    """Return (indexed_guess, impressions, note)."""
    start_date = (datetime.now(timezone.utc) - timedelta(days=30)).date()
    end_date = datetime.now(timezone.utc).date()
    body = {
        "startDate": str(start_date),
        "endDate": str(end_date),
        "dimensions": ["page"],
        "dimensionFilterGroups": [
            {
                "filters": [
                    {
                        "dimension": "page",
                        "operator": "equals",
                        "expression": url,
                    }
                ]
            }
        ],
        "rowLimit": 1,
        "startRow": 0,
        "type": "web",
    }
    try:
        response = (
            service.searchanalytics()
            .query(siteUrl=property_url, body=body)
            .execute()
        )
        rows = response.get("rows", [])
        if not rows:
            return (False, 0, "No impressions in last 30d (maybe not indexed yet)")
        row = rows[0]
        impressions = int(row.get("impressions", 0))
        return (impressions > 0, impressions, "Has impressions in last 30d")
    except HttpError as http_err:
        if http_err.resp.status == 403:
            return (False, 0, "Access denied: ensure Search Console API is enabled and property is verified")
        return (False, 0, f"HTTP error querying Search Console: {http_err}")
    except Exception as exc:  # pragma: no cover - unexpected
        return (False, 0, f"Error querying Search Console: {exc}")


def inspect_focus_urls(service: Resource, cfg: Config) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for url in cfg.focus_urls:
        indexed, impressions, note = fetch_impressions(service, cfg.property_url, url)
        results.append(
            {
                "url": url,
                "indexed": indexed,
                "impressions": impressions,
                "note": note,
            }
        )
    return results


def fetch_sitemap_counts(sitemap_url: str) -> int:
    try:
        with urllib.request.urlopen(sitemap_url, timeout=20) as resp:
            if resp.status != 200:
                print(f"[WARN] Failed to fetch sitemap {sitemap_url}: HTTP {resp.status}")
                return 0
            xml_bytes = resp.read()
        root = ET.fromstring(xml_bytes)
        urls = set()
        for loc in root.iter():
            if loc.tag.endswith("loc") and loc.text:
                urls.add(loc.text.strip())
        return len(urls)
    except Exception as exc:  # pragma: no cover - network/IO
        print(f"[WARN] Error fetching/parsing sitemap {sitemap_url}: {exc}")
        return 0


def print_focus_results(items: List[Dict[str, Any]]) -> None:
    indexed_count = 0
    for item in items:
        print(f"[FOCUS] {item['url']}")
        print(f"  indexed: {item['indexed']}")
        print(f"  last_30d_impressions: {item['impressions']}")
        print(f"  notes: {item['note']}")
        if item["indexed"]:
            indexed_count += 1

    total = len(items)
    not_indexed = total - indexed_count
    print()
    print("Summary:")
    print(f"  Total focus URLs: {total}")
    print(f"  Indexed (impressions>0): {indexed_count}")
    print(f"  Not indexed or unknown: {not_indexed}")


def print_sitemap_results(cfg: Config) -> None:
    for sitemap_url in cfg.sitemap_urls:
        count = fetch_sitemap_counts(sitemap_url)
        print(f"Sitemap: {sitemap_url}")
        print(f"  urls_in_sitemap: {count}")


def main() -> None:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cfg_path = os.path.join(base_dir, "config.json")

    cfg = load_config(cfg_path)

    try:
        service = authenticate(cfg)
    except SystemExit:
        return

    print("Checking focus URLs via Search Console (last 30 days impressions)...")
    focus = inspect_focus_urls(service, cfg)
    print_focus_results(focus)

    print()
    print("Checking sitemaps...")
    print_sitemap_results(cfg)


if __name__ == "__main__":
    main()
