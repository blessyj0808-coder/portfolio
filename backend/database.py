import os
from typing import Optional

import psycopg


def _get_database_url() -> Optional[str]:
    # Neon typically provides a DATABASE_URL. Support both names for convenience.
    return os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")


def get_connection() -> psycopg.Connection:
    db_url = _get_database_url()
    if not db_url:
        raise RuntimeError(
            "Database URL missing. Set `DATABASE_URL` (recommended) from Neon."
        )
    # autocommit so INSERTs are immediately persisted without extra commits.
    return psycopg.connect(db_url, autocommit=True)


def init_db() -> None:
    """
    Create required tables if they don't exist.
    Safe to run on every startup.
    """
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS contact_messages (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )

