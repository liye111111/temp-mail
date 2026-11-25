#!/usr/bin/env python3
"""Fetch Google Ads Keyword Plan ideas for SEO planning.

Requires env from ~/bin/env.d/gsc.env (or google-ads.env). Never prints secrets.
See docs/seo-keyword-planner.md.
"""

from __future__ import annotations

import argparse
import json
import os
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate keyword ideas via Google Ads API")
    parser.add_argument("--seed", required=True, help="Seed keyword")
    parser.add_argument("--language-id", default=os.environ.get("GOOGLE_ADS_PROBE_LANGUAGE_ID", "1000"))
    parser.add_argument("--geo-id", default=os.environ.get("GOOGLE_ADS_PROBE_GEO_ID", "2840"))
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--json", action="store_true", help="Print JSON array only")
    args = parser.parse_args()

    customer_id = os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "").replace("-", "").strip()
    if not customer_id:
        print("missing env: GOOGLE_ADS_CUSTOMER_ID", file=sys.stderr)
        return 2
    if not os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN"):
        print("missing env: GOOGLE_ADS_DEVELOPER_TOKEN", file=sys.stderr)
        return 2
    if not os.environ.get("GOOGLE_ADS_USE_PROTO_PLUS"):
        os.environ["GOOGLE_ADS_USE_PROTO_PLUS"] = "true"

    has_sa = bool(os.environ.get("GOOGLE_ADS_JSON_KEY_FILE_PATH"))
    has_oauth = all(
        os.environ.get(k)
        for k in ("GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN")
    )
    if not has_sa and not has_oauth:
        print(
            "set GOOGLE_ADS_JSON_KEY_FILE_PATH or CLIENT_ID/SECRET/REFRESH_TOKEN",
            file=sys.stderr,
        )
        return 2

    try:
        from google.ads.googleads.client import GoogleAdsClient
        from google.ads.googleads.errors import GoogleAdsException
    except ImportError:
        print("install: pip install google-ads", file=sys.stderr)
        return 2

    client = GoogleAdsClient.load_from_env()
    service = client.get_service("KeywordPlanIdeaService")
    request = client.get_type("GenerateKeywordIdeasRequest")
    request.customer_id = customer_id
    request.language = f"languageConstants/{args.language_id}"
    request.geo_target_constants.append(f"geoTargetConstants/{args.geo_id}")
    request.keyword_plan_network = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH_AND_PARTNERS
    request.keyword_seed.keywords.append(args.seed)
    if hasattr(request, "page_size"):
        request.page_size = max(args.limit, 1)

    try:
        response = service.generate_keyword_ideas(request=request)
    except GoogleAdsException as ex:
        for err in ex.failure.errors:
            print(f"{err.error_code}: {err.message}", file=sys.stderr)
        return 2

    rows = []
    for idea in response:
        metrics = idea.keyword_idea_metrics
        competition = None
        if getattr(metrics, "competition", None) is not None:
            competition = str(metrics.competition).split(".")[-1]
        rows.append(
            {
                "text": idea.text,
                "avg_monthly_searches": getattr(metrics, "avg_monthly_searches", None),
                "competition": competition,
            }
        )
        if len(rows) >= args.limit:
            break

    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
    else:
        print(
            json.dumps(
                {
                    "seed": args.seed,
                    "language_id": args.language_id,
                    "geo_id": args.geo_id,
                    "count": len(rows),
                    "ideas": rows,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    return 0 if rows else 1


if __name__ == "__main__":
    sys.exit(main())
