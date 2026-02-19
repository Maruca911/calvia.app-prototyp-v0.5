#!/usr/bin/env python3
"""
Apply SQL migration files (idempotent-safe runner with ledger).

This runner tracks applied files by absolute path + checksum in:
  public.codex_external_migrations
"""

from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
from typing import Iterable

import psycopg


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def iter_sql_files(paths: Iterable[Path]) -> list[Path]:
    files: list[Path] = []
    for p in paths:
        if p.is_file() and p.suffix == ".sql":
            files.append(p)
            continue
        if p.is_dir():
            files.extend(sorted(x for x in p.iterdir() if x.is_file() and x.suffix == ".sql"))
    return sorted(files, key=lambda x: x.name)


def ensure_ledger(conn: psycopg.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS public.codex_external_migrations (
          migration_id text PRIMARY KEY,
          checksum text NOT NULL,
          applied_at timestamptz NOT NULL DEFAULT now()
        );
        """
    )


def was_applied(conn: psycopg.Connection, migration_id: str, checksum: str) -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM public.codex_external_migrations
        WHERE migration_id = %s AND checksum = %s
        """,
        (migration_id, checksum),
    ).fetchone()
    return row is not None


def mark_applied(conn: psycopg.Connection, migration_id: str, checksum: str) -> None:
    conn.execute(
        """
        INSERT INTO public.codex_external_migrations (migration_id, checksum)
        VALUES (%s, %s)
        ON CONFLICT (migration_id)
        DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = now()
        """,
        (migration_id, checksum),
    )


def apply_file(conn: psycopg.Connection, path: Path) -> None:
    sql_text = path.read_text(encoding="utf-8")
    migration_id = str(path.resolve())
    checksum = sha256_text(sql_text)

    if was_applied(conn, migration_id, checksum):
        print(f"SKIP  {path.name} (already applied)")
        return

    print(f"APPLY {path.name}")
    try:
        conn.execute(sql_text)
        mark_applied(conn, migration_id, checksum)
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url", default=os.environ.get("CALVIA_DB_URL", ""))
    parser.add_argument("--path", action="append", required=True, help="SQL file or directory; may be repeated")
    args = parser.parse_args()

    if not args.db_url:
        raise SystemExit("Missing --db-url (or CALVIA_DB_URL).")

    paths = [Path(p).expanduser().resolve() for p in args.path]
    files = iter_sql_files(paths)
    if not files:
        raise SystemExit("No .sql files found in provided paths.")

    with psycopg.connect(args.db_url) as conn:
        ensure_ledger(conn)
        conn.commit()
        for f in files:
            apply_file(conn, f)

    print(f"Done. Applied/checked {len(files)} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
