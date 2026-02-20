#!/usr/bin/env python3
"""
Import business rows from a ZIP of CSV files into shared Supabase `businesses`.

Design goals:
- deterministic IDs/slugs
- conservative dedupe
- Calvia-focused area filtering
- dry-run report before apply
"""

from __future__ import annotations

import argparse
import csv
import io
import os
import re
import unicodedata
import uuid
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

import psycopg
from psycopg.rows import dict_row


NAMESPACE_UUID = uuid.UUID("11111111-1111-1111-1111-111111111111")

REQUIRED_BUSINESS_COLUMNS = {
    "Name",
    "Category",
    "Address",
    "Contact",
    "Rating/Reviews",
    "Website",
    "Notes",
}

EXCLUDED_SHEET_HINTS = ("beaches", "hiking", "cycling")

# Keep this conservative: only clear Calvia / SW Mallorca areas are in scope.
ALLOWED_AREA_SLUGS = {
    "bendinat",
    "cala-fornells",
    "cala-vinyes",
    "calvia-vila",
    "cas-catala",
    "costa-de-la-calma",
    "costa-den-blanes",
    "el-toro",
    "es-capdella",
    "galatzo",
    "magaluf",
    "palmanova",
    "peguera",
    "port-adriano",
    "portals-nous",
    "portals-vells",
    "sa-porrasa",
    "santa-ponsa",
    "ses-illetes",
    "sol-de-mallorca",
    "son-caliu",
    "son-ferrer",
    "torrenova",
}

CATEGORY_ALIAS_TO_SLUG = {
    "accountant": "accountants-tax-advisors",
    "bank": "banks-finance",
    "bank/finance": "banks-finance",
    "bank/repo": "banks-finance",
    "bank/transfer": "banks-finance",
    "dentist": "dentists-dental-clinics",
    "event planner": "event-planning",
    "financial advisor": "financial-advisors",
    "golf course": "golf-courses",
    "gym/fitness center": "fitness-centers",
    "lawyer": "lawyers-legal-services",
    "padel club": "tennis-clubs",
    "pharmacy": "pharmacies",
    "pilates studio": "yoga-pilates",
    "real estate agency": "real-estate-agencies",
    "supermarket": "supermarkets-grocery",
    "tennis club": "tennis-clubs",
    "yoga studio": "yoga-pilates",
}

AMBIGUOUS_CATEGORY_KEYS = {
    "pharmacy/dental",
    "pharmacy/supermarket",
    "lawyer/dental",
}

AREA_TOKEN_TO_SLUG = [
    ("portals nous", "portals-nous"),
    ("puerto portals", "portals-nous"),
    ("portals vells", "portals-vells"),
    ("port adriano", "port-adriano"),
    ("el toro", "el-toro"),
    ("santa ponsa", "santa-ponsa"),
    ("palmanova", "palmanova"),
    ("son caliu", "son-caliu"),
    ("torrenova", "torrenova"),
    ("bendinat", "bendinat"),
    ("costa den blanes", "costa-den-blanes"),
    ("costa d'en blanes", "costa-den-blanes"),
    ("cas catala", "cas-catala"),
    ("cala vinyes", "cala-vinyes"),
    ("ses illetes", "ses-illetes"),
    ("sol de mallorca", "sol-de-mallorca"),
    ("sa porrasa", "sa-porrasa"),
    ("es capdella", "es-capdella"),
    ("galatzo", "galatzo"),
    ("magaluf", "magaluf"),
    ("peguera", "peguera"),
    ("cala fornells", "cala-fornells"),
    ("costa de la calma", "costa-de-la-calma"),
    ("son ferrer", "son-ferrer"),
    ("calvia vila", "calvia-vila"),
    ("calvia", "calvia-vila"),
    ("calvià", "calvia-vila"),
    ("palma", "palma"),
    ("pollenca", "out-of-scope"),
    ("pollença", "out-of-scope"),
    ("manacor", "out-of-scope"),
    ("inca", "out-of-scope"),
]

REPORT_COLUMNS = [
    "source_file",
    "source_row",
    "name",
    "category_raw",
    "address",
    "website",
    "category_slug",
    "area_slug",
    "action",
    "reason",
    "business_id",
    "business_slug",
]


@dataclass(frozen=True)
class Category:
    id: str
    slug: str
    name: str
    parent_id: str | None
    display_order: int


@dataclass(frozen=True)
class Area:
    id: str
    slug: str
    name: str
    latitude: float
    longitude: float


@dataclass(frozen=True)
class SourceRow:
    source_file: str
    source_row: int
    name: str
    category_raw: str
    address: str
    contact: str
    rating_reviews: str
    website: str
    notes: str


@dataclass
class EvaluatedRow:
    source: SourceRow
    action: str
    reason: str
    category: Category | None = None
    area: Area | None = None
    business_id: str = ""
    business_slug: str = ""


def normalize_text(value: str) -> str:
    cleaned = unicodedata.normalize("NFKD", value or "")
    cleaned = "".join(ch for ch in cleaned if not unicodedata.combining(ch))
    cleaned = cleaned.lower()
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def normalize_for_key(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"\s*\(repeat\)\s*$", "", value, flags=re.IGNORECASE)
    value = re.sub(r"[^a-z0-9]+", "", value)
    return value


def slugify(value: str) -> str:
    s = normalize_text(value)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-{2,}", "-", s)
    return s.strip("-")


def normalize_website(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    candidate = raw
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", candidate):
        candidate = f"https://{candidate}"
    parsed = urlparse(candidate)
    host = parsed.netloc.lower().replace("www.", "")
    path = parsed.path.rstrip("/")
    return f"{host}{path}"


def website_for_storage(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw):
        return raw
    return f"https://{raw}"


def parse_rating(value: str) -> float | None:
    m = re.search(r"([0-5](?:\.[0-9])?)", value or "")
    if not m:
        return None
    try:
        rating = float(m.group(1))
    except ValueError:
        return None
    if rating < 0 or rating > 5:
        return None
    return rating


def extract_email(value: str) -> str:
    m = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", value or "", flags=re.IGNORECASE)
    return m.group(0).lower() if m else ""


def extract_phone(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    compact = re.sub(r"[^\d+()\-.\s]", "", raw).strip()
    if sum(ch.isdigit() for ch in compact) < 7:
        return ""
    return compact


def is_repeat_name(name: str) -> bool:
    return bool(re.search(r"\(repeat\)", name or "", flags=re.IGNORECASE))


def normalize_category_key(value: str) -> str:
    v = normalize_text(value)
    v = re.sub(r"\s*/\s*", "/", v)
    return v


def load_categories(conn: psycopg.Connection) -> dict[str, list[Category]]:
    rows = conn.execute(
        """
        SELECT
          id::text AS id,
          slug,
          name,
          parent_id::text AS parent_id,
          COALESCE(display_order, 0) AS display_order
        FROM categories
        ORDER BY slug, parent_id NULLS FIRST, COALESCE(display_order, 0), name
        """
    ).fetchall()
    out: dict[str, list[Category]] = {}
    for row in rows:
        category = Category(
            id=row["id"],
            slug=row["slug"],
            name=row["name"],
            parent_id=row["parent_id"],
            display_order=int(row["display_order"] or 0),
        )
        out.setdefault(category.slug, []).append(category)
    return out


def pick_category(categories_by_slug: dict[str, list[Category]], slug: str) -> Category | None:
    candidates = categories_by_slug.get(slug, [])
    if not candidates:
        return None
    # Prefer top-level categories for calvia.eu category pages.
    top_level = [c for c in candidates if c.parent_id is None]
    if top_level:
        return sorted(top_level, key=lambda c: (c.display_order, c.name))[0]
    return sorted(candidates, key=lambda c: (c.display_order, c.name))[0]


def load_areas(conn: psycopg.Connection) -> dict[str, Area]:
    rows = conn.execute(
        """
        SELECT id::text AS id, slug, name, latitude, longitude
        FROM areas
        ORDER BY name
        """
    ).fetchall()
    return {
        row["slug"]: Area(
            id=row["id"],
            slug=row["slug"],
            name=row["name"],
            latitude=float(row["latitude"] or 0),
            longitude=float(row["longitude"] or 0),
        )
        for row in rows
    }


def resolve_area_slug(address: str) -> str | None:
    text = normalize_text(address)
    if not text:
        return None
    for token, slug in AREA_TOKEN_TO_SLUG:
        if token in text:
            return slug
    return None


def iter_zip_business_rows(zip_path: Path) -> Iterable[SourceRow]:
    with zipfile.ZipFile(zip_path) as zf:
        for member in sorted(zf.namelist()):
            if not member.lower().endswith(".csv"):
                continue
            if any(hint in member.lower() for hint in EXCLUDED_SHEET_HINTS):
                continue
            text = zf.read(member).decode("utf-8-sig", "replace")
            reader = csv.DictReader(io.StringIO(text))
            if not reader.fieldnames:
                continue
            if not REQUIRED_BUSINESS_COLUMNS.issubset(set(reader.fieldnames)):
                continue
            for idx, row in enumerate(reader, start=2):
                yield SourceRow(
                    source_file=Path(member).name,
                    source_row=idx,
                    name=(row.get("Name") or "").strip(),
                    category_raw=(row.get("Category") or "").strip(),
                    address=(row.get("Address") or "").strip(),
                    contact=(row.get("Contact") or "").strip(),
                    rating_reviews=(row.get("Rating/Reviews") or "").strip(),
                    website=(row.get("Website") or "").strip(),
                    notes=(row.get("Notes") or "").strip(),
                )


def read_existing_businesses(conn: psycopg.Connection) -> list[dict]:
    return conn.execute(
        """
        SELECT
          id::text AS id,
          slug,
          name,
          address,
          website,
          area_id::text AS area_id
        FROM businesses
        """
    ).fetchall()


def build_description(source: SourceRow, category: Category, area: Area) -> str:
    if source.notes:
        return source.notes
    return f"{category.name} in {area.name}, Calvia."


def choose_business_slug(base_name: str, area_slug: str, business_id: str, used: set[str]) -> str:
    base = slugify(base_name) or "business"
    if base not in used:
        used.add(base)
        return base

    with_area = f"{base}-{area_slug}"
    if with_area not in used:
        used.add(with_area)
        return with_area

    fallback = f"{base}-{business_id.split('-')[0]}"
    used.add(fallback)
    return fallback


def evaluate_rows(
    source_rows: Iterable[SourceRow],
    categories_by_slug: dict[str, list[Category]],
    areas_by_slug: dict[str, Area],
    existing_rows: list[dict],
) -> list[EvaluatedRow]:
    existing_name_addr = {
        (normalize_for_key(r["name"]), normalize_for_key(r.get("address") or ""))
        for r in existing_rows
    }
    existing_name_area_web: set[tuple[str, str, str]] = set()
    existing_name_area: set[tuple[str, str]] = set()
    used_slugs = {normalize_text(r["slug"]) for r in existing_rows if r.get("slug")}

    for row in existing_rows:
        name_key = normalize_for_key(row["name"])
        area_id = row.get("area_id") or ""
        website_key = normalize_website(row.get("website") or "")
        existing_name_area.add((name_key, area_id))
        existing_name_area_web.add((name_key, area_id, website_key))

    seen_zip_keys: set[tuple[str, str, str, str, str]] = set()
    evaluated: list[EvaluatedRow] = []

    for src in source_rows:
        if not src.name:
            evaluated.append(EvaluatedRow(source=src, action="HOLD_AMBIGUOUS", reason="Missing business name"))
            continue

        if is_repeat_name(src.name):
            evaluated.append(EvaluatedRow(source=src, action="SKIP_DUPLICATE", reason="Explicit '(Repeat)' marker"))
            continue

        category_key = normalize_category_key(src.category_raw)
        if category_key in AMBIGUOUS_CATEGORY_KEYS:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="HOLD_AMBIGUOUS",
                    reason=f"Ambiguous category '{src.category_raw}'",
                )
            )
            continue

        mapped_slug = CATEGORY_ALIAS_TO_SLUG.get(category_key)
        if not mapped_slug:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="HOLD_AMBIGUOUS",
                    reason=f"Unmapped category '{src.category_raw}'",
                )
            )
            continue

        category = pick_category(categories_by_slug, mapped_slug)
        if not category:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="HOLD_AMBIGUOUS",
                    reason=f"Mapped slug '{mapped_slug}' not found in DB",
                )
            )
            continue

        area_slug = resolve_area_slug(src.address)
        if not area_slug:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="HOLD_AMBIGUOUS",
                    category=category,
                    reason="Could not infer area from address",
                )
            )
            continue
        if area_slug == "out-of-scope":
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="HOLD_OUT_OF_SCOPE",
                    category=category,
                    area=None,
                    reason=f"Address outside Calvia scope: {src.address}",
                )
            )
            continue
        if area_slug not in ALLOWED_AREA_SLUGS:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="HOLD_OUT_OF_SCOPE",
                    category=category,
                    reason=f"Area '{area_slug}' is out of import scope",
                )
            )
            continue

        area = areas_by_slug.get(area_slug)
        if not area:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="HOLD_AMBIGUOUS",
                    category=category,
                    reason=f"Area slug '{area_slug}' not found in DB",
                )
            )
            continue

        name_key = normalize_for_key(src.name)
        addr_key = normalize_for_key(src.address)
        website_key = normalize_website(src.website)

        if (name_key, addr_key) in existing_name_addr and addr_key:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="SKIP_DUPLICATE",
                    category=category,
                    area=area,
                    reason="Existing business matches normalized name+address",
                )
            )
            continue

        if website_key:
            if (name_key, area.id, website_key) in existing_name_area_web:
                evaluated.append(
                    EvaluatedRow(
                        source=src,
                        action="SKIP_DUPLICATE",
                        category=category,
                        area=area,
                        reason="Existing business matches normalized name+area+website",
                    )
                )
                continue
        else:
            if (name_key, area.id) in existing_name_area:
                evaluated.append(
                    EvaluatedRow(
                        source=src,
                        action="SKIP_DUPLICATE",
                        category=category,
                        area=area,
                        reason="Existing business matches normalized name+area (website missing)",
                    )
                )
                continue

        zip_key = (name_key, addr_key, website_key, category.id, area.id)
        if zip_key in seen_zip_keys:
            evaluated.append(
                EvaluatedRow(
                    source=src,
                    action="SKIP_DUPLICATE",
                    category=category,
                    area=area,
                    reason="Duplicate row within ZIP import batch",
                )
            )
            continue
        seen_zip_keys.add(zip_key)

        business_id = str(
            uuid.uuid5(
                NAMESPACE_UUID,
                f"zip-business:{name_key}:{addr_key}:{website_key}:{category.id}:{area.id}",
            )
        )
        business_slug = choose_business_slug(src.name, area.slug, business_id, used_slugs)

        evaluated.append(
            EvaluatedRow(
                source=src,
                action="INSERT",
                reason="Ready for import",
                category=category,
                area=area,
                business_id=business_id,
                business_slug=business_slug,
            )
        )

        existing_name_addr.add((name_key, addr_key))
        existing_name_area.add((name_key, area.id))
        existing_name_area_web.add((name_key, area.id, website_key))

    return evaluated


def write_report(path: Path, rows: list[EvaluatedRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=REPORT_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "source_file": row.source.source_file,
                    "source_row": row.source.source_row,
                    "name": row.source.name,
                    "category_raw": row.source.category_raw,
                    "address": row.source.address,
                    "website": row.source.website,
                    "category_slug": row.category.slug if row.category else "",
                    "area_slug": row.area.slug if row.area else "",
                    "action": row.action,
                    "reason": row.reason,
                    "business_id": row.business_id,
                    "business_slug": row.business_slug,
                }
            )


def apply_inserts(conn: psycopg.Connection, rows: list[EvaluatedRow]) -> tuple[int, int]:
    inserted = 0
    conflicts = 0
    for row in rows:
        src = row.source
        assert row.category is not None
        assert row.area is not None

        description = build_description(src, row.category, row.area)
        phone = extract_phone(src.contact)
        email = extract_email(src.contact)
        rating = parse_rating(src.rating_reviews)
        website = website_for_storage(src.website)
        notes_parts = [
            src.notes.strip(),
            f"Imported from {src.source_file}:{src.source_row}",
        ]
        if src.rating_reviews.strip():
            notes_parts.append(f"Source rating/reviews: {src.rating_reviews.strip()}")
        notes = " | ".join(part for part in notes_parts if part)

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO businesses (
                  id,
                  name,
                  slug,
                  description,
                  category_id,
                  area_id,
                  phone,
                  email,
                  website,
                  address,
                  latitude,
                  longitude,
                  is_placeholder,
                  rating,
                  notes,
                  social_links,
                  location_confidence,
                  needs_geocoding
                )
                VALUES (
                  %s, %s, %s, %s, %s::uuid, %s::uuid, %s, %s, %s, %s,
                  %s, %s, false, %s, %s, '{}'::jsonb, 'area', true
                )
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
                """,
                (
                    row.business_id,
                    src.name,
                    row.business_slug,
                    description,
                    row.category.id,
                    row.area.id,
                    phone,
                    email,
                    website,
                    src.address,
                    row.area.latitude,
                    row.area.longitude,
                    rating,
                    notes,
                ),
            )
            if cur.fetchone():
                inserted += 1
            else:
                conflicts += 1
    conn.commit()
    return inserted, conflicts


def print_summary(rows: list[EvaluatedRow]) -> None:
    counts: dict[str, int] = {}
    for row in rows:
        counts[row.action] = counts.get(row.action, 0) + 1
    print("Summary:")
    for key in sorted(counts):
        print(f"  {key}: {counts[key]}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import ZIP CSV businesses into Supabase")
    parser.add_argument(
        "--zip-path",
        default="/Users/marianacarvalho/Downloads/drive-download-20260220T115607Z-1-001.zip",
        help="Path to ZIP containing CSV sheets",
    )
    parser.add_argument(
        "--db-url",
        default=os.environ.get("CALVIA_DB_URL", ""),
        help="Postgres connection string for Supabase",
    )
    parser.add_argument(
        "--reports-dir",
        default="/Users/marianacarvalho/Documents/calvia.app-prototyp-v0.5/reports",
        help="Directory for dry-run reports",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="Apply INSERTs to DB")
    mode.add_argument("--dry-run", action="store_true", help="Dry-run only (default)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.db_url:
        raise SystemExit("Missing --db-url (or CALVIA_DB_URL)")

    zip_path = Path(args.zip_path).expanduser().resolve()
    if not zip_path.exists():
        raise SystemExit(f"ZIP not found: {zip_path}")

    reports_dir = Path(args.reports_dir).expanduser().resolve()
    candidate_report = reports_dir / "zip_import_candidates.csv"
    skipped_report = reports_dir / "zip_import_skipped_or_hold.csv"

    with psycopg.connect(args.db_url, row_factory=dict_row) as conn:
        categories_by_slug = load_categories(conn)
        areas_by_slug = load_areas(conn)
        existing_rows = read_existing_businesses(conn)
        source_rows = list(iter_zip_business_rows(zip_path))
        evaluated = evaluate_rows(source_rows, categories_by_slug, areas_by_slug, existing_rows)

        insert_rows = [r for r in evaluated if r.action == "INSERT"]
        other_rows = [r for r in evaluated if r.action != "INSERT"]
        write_report(candidate_report, insert_rows)
        write_report(skipped_report, other_rows)
        print(f"Wrote report: {candidate_report}")
        print(f"Wrote report: {skipped_report}")
        print_summary(evaluated)

        if args.apply:
            inserted, conflicts = apply_inserts(conn, insert_rows)
            print(f"Applied: inserted={inserted}, slug_conflicts_skipped={conflicts}")
        else:
            print("Dry run complete. Use --apply to import INSERT rows.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
