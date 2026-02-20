#!/usr/bin/env python3
"""
Sync calvia.eu `businesses` into calvia.app `listings` (additive/upsert).
"""

from __future__ import annotations

import argparse
import os
import re
import uuid
from dataclasses import dataclass
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


UUID_NS = uuid.UUID("11111111-1111-1111-1111-111111111111")

PARENT_BY_KEY = {
    "real_estate": "a1000000-0000-0000-0000-000000000001",
    "dining": "a1000000-0000-0000-0000-000000000002",
    "activities": "a1000000-0000-0000-0000-000000000003",
    "daily_life": "a1000000-0000-0000-0000-000000000004",
    "health": "a1000000-0000-0000-0000-000000000005",
}

# Hand-tuned map from calvia.eu category slug to preferred calvia.app subcategory slug
SLUG_MAP = {
    "restaurants": "fine-dining",
    "fine-dining": "fine-dining",
    "bars-nightlife": "bars-nightlife",
    "cafes-coffee-shops": "cafes-brunch",
    "beach-clubs": "beach-clubs",
    "hotels-accommodation": "accommodation",
    "water-sports-diving": "water-sports",
    "supermarkets-grocery": "supermarkets",
    "taxi-transport": "car-rental",
    "dentists-dental-clinics": "dentists",
    "coworking-offices": "coworking",
    "pet-services": "veterinary",
    "banks-finance": "tax-accounting",
    "pharmacies": "pharmacies",
    "lawyers-advisors": "lawyers-legal",
    "accountants-tax-advisors": "tax-accounting",
    "financial-advisors": "tax-accounting",
    "yoga-pilates": "wellness",
    "golf-courses": "golf",
    "tennis-padel": "padel",
    "property-management": "property-management",
    "real-estate-agencies": "agencies",
    "boat-charters-yachting": "water-sports",
}


def slugify(value: str) -> str:
    s = value.strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-{2,}", "-", s)
    return s.strip("-")


def titleize_slug(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.replace("_", "-").split("-") if part)


def choose_parent_key(slug: str) -> str:
    s = slug.lower()
    if any(k in s for k in ("estate", "agency", "property", "rental")):
        return "real_estate"
    if any(k in s for k in ("restaurant", "dining", "cafe", "bar", "nightlife", "club", "hotel")):
        return "dining"
    if any(k in s for k in ("sport", "golf", "tennis", "padel", "water", "boat", "yacht", "hiking", "bike")):
        return "activities"
    if any(k in s for k in ("dent", "pharma", "health", "yoga", "pilates", "wellness", "medical")):
        return "health"
    return "daily_life"


@dataclass
class CategoryRow:
    id: str
    slug: str
    parent_id: str | None
    name: str


def load_categories(conn: psycopg.Connection) -> dict[str, list[CategoryRow]]:
    out: dict[str, list[CategoryRow]] = {}
    rows = conn.execute("SELECT id, slug, parent_id, name FROM categories").fetchall()
    for r in rows:
        row = CategoryRow(
            id=str(r["id"]),
            slug=r["slug"],
            parent_id=(str(r["parent_id"]) if r["parent_id"] else None),
            name=r["name"],
        )
        out.setdefault(row.slug, []).append(row)
    return out


def pick_target_category(
    conn: psycopg.Connection,
    categories_by_slug: dict[str, list[CategoryRow]],
    source_slug: str,
    source_name: str,
) -> str:
    preferred_slug = SLUG_MAP.get(source_slug, source_slug)
    candidates = categories_by_slug.get(preferred_slug, [])
    # Prefer discover subcategories (non-null parent_id) if available.
    for c in candidates:
        if c.parent_id is not None:
            return c.id
    if candidates:
        return candidates[0].id

    parent_key = choose_parent_key(source_slug)
    parent_id = PARENT_BY_KEY[parent_key]
    new_slug = preferred_slug
    new_name = source_name.strip() if source_name.strip() else titleize_slug(preferred_slug)
    new_id = str(uuid.uuid5(UUID_NS, f"calvia-sync-category:{new_slug}:{parent_id}"))

    conn.execute(
        """
        INSERT INTO categories (id, name, slug, description, icon_name, sort_order, display_order, parent_id)
        VALUES (%s, %s, %s, %s, %s, 999, 999, %s)
        ON CONFLICT (slug) DO NOTHING
        """,
        (
            new_id,
            new_name,
            new_slug,
            "Auto-created during businesses->listings sync",
            "folder",
            parent_id,
        ),
    )
    # Refresh cache for this slug
    categories_by_slug.setdefault(new_slug, []).append(
        CategoryRow(id=new_id, slug=new_slug, parent_id=parent_id, name=new_name)
    )
    return new_id


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url", default=os.environ.get("CALVIA_DB_URL", ""))
    args = parser.parse_args()

    if not args.db_url:
        raise SystemExit("Missing --db-url (or CALVIA_DB_URL).")

    # Supabase pooler (PgBouncer transaction mode) can reject prepared statements.
    with psycopg.connect(args.db_url, row_factory=dict_row, prepare_threshold=None) as conn:
        categories_by_slug = load_categories(conn)

        businesses = conn.execute(
            """
            SELECT
              b.id,
              b.name,
              b.slug,
              b.description,
              b.phone,
              b.email,
              b.website,
              b.address,
              b.image_url,
              b.social_links,
              b.rating,
              b.notes,
              c.slug AS source_category_slug,
              c.name AS source_category_name,
              a.name AS area_name
            FROM businesses b
            JOIN categories c ON c.id = b.category_id
            LEFT JOIN areas a ON a.id = b.area_id
            ORDER BY b.created_at, b.name
            """
        ).fetchall()

        upserted = 0
        mapped = 0
        for b in businesses:
            source_slug = b["source_category_slug"] or "imported"
            source_name = b["source_category_name"] or titleize_slug(source_slug)
            target_category_id = pick_target_category(conn, categories_by_slug, source_slug, source_name)

            listing_id = str(uuid.uuid5(UUID_NS, f"business-listing:{b['id']}"))
            tags = [source_slug]
            if b["slug"]:
                tags.append(slugify(str(b["slug"])))

            conn.execute(
                """
                INSERT INTO listings (
                  id,
                  category_id,
                  name,
                  description,
                  image_url,
                  contact_phone,
                  contact_email,
                  website_url,
                  address,
                  neighborhood,
                  social_media,
                  tags,
                  is_featured
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, COALESCE(%s, '{}'::jsonb), %s::text[], false)
                ON CONFLICT (id) DO UPDATE SET
                  category_id = EXCLUDED.category_id,
                  name = EXCLUDED.name,
                  description = EXCLUDED.description,
                  image_url = EXCLUDED.image_url,
                  contact_phone = EXCLUDED.contact_phone,
                  contact_email = EXCLUDED.contact_email,
                  website_url = EXCLUDED.website_url,
                  address = EXCLUDED.address,
                  neighborhood = EXCLUDED.neighborhood,
                  social_media = EXCLUDED.social_media,
                  tags = EXCLUDED.tags
                """,
                (
                    listing_id,
                    target_category_id,
                    b["name"] or "",
                    b["description"] or "",
                    b["image_url"] or "",
                    b["phone"] or "",
                    b["email"] or "",
                    b["website"] or "",
                    b["address"] or "",
                    b["area_name"] or "Calvia",
                    Jsonb(b["social_links"] or {}),
                    tags,
                ),
            )

            conn.execute(
                """
                INSERT INTO business_listing_map (business_id, listing_id)
                VALUES (%s, %s)
                ON CONFLICT (business_id) DO UPDATE SET listing_id = EXCLUDED.listing_id
                """,
                (b["id"], listing_id),
            )
            upserted += 1
            mapped += 1

        conn.commit()
        print(f"Synced businesses -> listings: {upserted} upserts, {mapped} mappings.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
