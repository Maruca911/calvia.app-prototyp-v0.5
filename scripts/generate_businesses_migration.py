#!/usr/bin/env python3
"""
Generate a deterministic, idempotent Supabase migration to import `calvia_businesses.json` into `listings`.

- Skips Pets entries for now.
- Uses UUIDv5 (stable IDs) to make re-runs safe.
"""

from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path


NAMESPACE_UUID = uuid.UUID("11111111-1111-1111-1111-111111111111")


CATEGORY_ID_MAP: dict[str, str] = {
    "Shopping - Supermarket": "b6000000-0000-0000-0000-000000000001",
    "Shopping - Pharmacy": "b6000000-0000-0000-0000-000000000002",
    "Shopping - Boutique": "b6000000-0000-0000-0000-000000000003",
    "Education - International School": "b7000000-0000-0000-0000-000000000001",
    "Education - Language Academy": "b7000000-0000-0000-0000-000000000002",
    "Professional Services - Lawyers & Advisors": "b8000000-0000-0000-0000-000000000001",
    # Tax variants -> tax-accounting
    "Professional Services - Tax Lawyers": "b8000000-0000-0000-0000-000000000002",
    "Professional Services - Tax & Legal Advisors": "b8000000-0000-0000-0000-000000000002",
    "Professional Services - Tax & Fiscal Lawyers": "b8000000-0000-0000-0000-000000000002",
    # Car Rental / Automotive variants -> car-rental
    "Car Rental / Automotive - Car Rental": "b4000000-0000-0000-0000-000000000005",
    "Car Rental / Automotive - Car Wash & Service Centre": "b4000000-0000-0000-0000-000000000005",
    "Car Rental / Automotive - Mechanic / Body Shop": "b4000000-0000-0000-0000-000000000005",
    # Cafes & Bakeries variants -> cafes-brunch
    "Cafes & Bakeries - Bakery & Coffee Shop": "b2000000-0000-0000-0000-000000000004",
    "Cafes & Bakeries - Cafe": "b2000000-0000-0000-0000-000000000004",
    "Cafes & Bakeries - Cafe & Brunch": "b2000000-0000-0000-0000-000000000004",
    "Cafes & Bakeries - Healthy Cafe & Deli": "b2000000-0000-0000-0000-000000000004",
    # Home services -> best-fit buckets
    "Home Services - Pool & Garden Maintenance": "b9000000-0000-0000-0000-000000000001",
    "Home Services - Property Management & Pool Service": "b9000000-0000-0000-0000-000000000001",
    "Home Services - Plumbing, Electrical & Maintenance": "b9000000-0000-0000-0000-000000000003",
    "Home Services - Cleaning, Pool & Garden Maintenance": "b9000000-0000-0000-0000-000000000002",
}


TAG_MAP: dict[str, list[str]] = {
    "b6000000-0000-0000-0000-000000000001": ["supermarket", "grocery"],
    "b6000000-0000-0000-0000-000000000002": ["pharmacy", "health"],
    "b6000000-0000-0000-0000-000000000003": ["boutique", "shopping"],
    "b7000000-0000-0000-0000-000000000001": ["school", "education"],
    "b7000000-0000-0000-0000-000000000002": ["languages", "education"],
    "b8000000-0000-0000-0000-000000000001": ["lawyer", "legal"],
    "b8000000-0000-0000-0000-000000000002": ["tax", "accounting"],
    "b4000000-0000-0000-0000-000000000005": ["car-rental", "automotive"],
    "b2000000-0000-0000-0000-000000000004": ["cafe", "coffee", "brunch"],
    "b9000000-0000-0000-0000-000000000001": ["pool", "garden"],
    "b9000000-0000-0000-0000-000000000002": ["cleaning", "home-services"],
    "b9000000-0000-0000-0000-000000000003": ["maintenance", "repairs"],
}


NEIGHBORHOOD_MATCHES: list[tuple[str, str]] = [
    ("portals nous", "Portals Nous"),
    ("puerto portals", "Puerto Portals"),
    ("santa ponsa", "Santa Ponsa"),
    ("palmanova", "Palmanova"),
    ("costa d'en blanes", "Costa d'en Blanes"),
    ("bendinat", "Bendinat"),
    ("son caliu", "Son Caliu"),
    ("sol de mallorca", "Sol de Mallorca"),
    ("peguera", "Peguera"),
    ("magaluf", "Magaluf"),
    ("calvià", "Calvia"),
    ("calvia", "Calvia"),
]


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_text_array(values: list[str]) -> str:
    if not values:
        return "'{}'::text[]"
    escaped = [v.replace('"', '\\"').replace("\\", "\\\\") for v in values]
    # Use ARRAY[...] for readability.
    return "ARRAY[" + ", ".join(sql_quote(v) for v in escaped) + "]::text[]"


def infer_neighborhood(address: str | None) -> str:
    addr = (address or "").lower()
    for needle, neighborhood in NEIGHBORHOOD_MATCHES:
        if needle in addr:
            return neighborhood
    return "Calvia"


def instagram_to_social(instagram: str | None) -> dict:
    if not instagram:
        return {}
    val = instagram.strip()
    if not val:
        return {}
    if val.startswith("@"):
        return {"instagram": f"https://instagram.com/{val[1:]}"}
    if val.startswith("http://") or val.startswith("https://"):
        return {"instagram": val}
    return {"instagram": val}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--input",
        default=str(Path(__file__).resolve().parents[1] / "calvia_businesses.json"),
        help="Path to calvia_businesses.json",
    )
    ap.add_argument(
        "--output",
        default=str(
            Path(__file__).resolve().parents[1]
            / "supabase"
            / "migrations"
            / "20260214040200_import_calvia_businesses.sql"
        ),
        help="Path to output migration .sql file",
    )
    args = ap.parse_args()

    in_path = Path(args.input).resolve()
    out_path = Path(args.output).resolve()

    data = json.loads(in_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise SystemExit("Input JSON must be a list of objects")

    rows: list[str] = []
    skipped = 0
    unknown = 0

    for item in data:
        category = str(item.get("category") or "").strip()
        if category.startswith("Pets -"):
            skipped += 1
            continue

        category_id = CATEGORY_ID_MAP.get(category)
        if not category_id:
            unknown += 1
            continue

        src_id = item.get("id")
        name = str(item.get("name") or "").strip()
        if not name:
            unknown += 1
            continue

        listing_id = uuid.uuid5(NAMESPACE_UUID, f"calvia_businesses:{src_id}:{name}")

        description = str(item.get("description") or "")
        phone = str(item.get("phone") or "")
        website = str(item.get("website") or "")
        address = str(item.get("address") or "")
        neighborhood = infer_neighborhood(address)
        social = instagram_to_social(item.get("instagram"))
        tags = TAG_MAP.get(category_id, [])

        rows.append(
            "("
            + ", ".join(
                [
                    sql_quote(str(listing_id)),
                    sql_quote(category_id),
                    sql_quote(name),
                    sql_quote(description),
                    sql_quote(phone),
                    sql_quote(website),
                    sql_quote(address),
                    sql_quote(neighborhood),
                    sql_quote(json.dumps(social, ensure_ascii=True)) + "::jsonb",
                    sql_text_array(tags),
                    "false",
                ]
            )
            + ")"
        )

    header = f"""/*
  # Import calvia_businesses.json into listings

  Generated by scripts/generate_businesses_migration.py
  Source: {in_path}

  Notes:
  - Skips Pets entries
  - Uses UUIDv5 deterministic IDs (namespace {NAMESPACE_UUID})
  - Additive only (no deletes)
*/

INSERT INTO listings (
  id,
  category_id,
  name,
  description,
  contact_phone,
  website_url,
  address,
  neighborhood,
  social_media,
  tags,
  is_featured
)
VALUES
"""

    body = ",\n".join("  " + r for r in rows) + "\nON CONFLICT (id) DO NOTHING;\n"
    footer = f"\n-- skipped_pets={skipped} unknown_category_or_invalid={unknown}\n"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(header + body + footer, encoding="utf-8")
    print(f"Wrote {out_path} (rows={len(rows)}, skipped_pets={skipped}, unknown={unknown})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

