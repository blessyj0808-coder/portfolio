import os
import re
import html
from typing import Any, Dict, Tuple

from flask import Flask, jsonify, request
from flask_cors import CORS

from backend.database import init_db, get_connection


app = Flask(__name__, static_folder=None)
CORS(app)  # allow frontend hosted on a different domain (Render static + Render backend)


def _validate_payload(payload: Dict[str, Any]) -> Tuple[bool, str, Dict[str, str]]:
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    message = (payload.get("message") or "").strip()

    if not name or not email or not message:
        return False, "All fields (name, email, message) are required.", {}

    # Simple email sanity check (not exhaustive, but prevents obvious junk)
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return False, "Invalid email address.", {}

    if len(message) > 5000:
        return False, "Message is too long (max 5000 chars).", {}

    return True, "", {"name": name, "email": email, "message": message}


@app.get("/health")
@app.get("/health/")
def health() -> Any:
    return jsonify({"status": "ok"})


@app.post("/api/contact")
def contact() -> Any:
    payload = request.get_json(silent=True) or {}
    ok, error, data = _validate_payload(payload)
    if not ok:
        return jsonify({"ok": False, "error": error}), 400

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO contact_messages (name, email, message)
            VALUES (%s, %s, %s)
            RETURNING id;
            """,
            (data["name"], data["email"], data["message"]),
        )
        msg_id = cur.fetchone()[0]

    return jsonify({"ok": True, "id": msg_id})


def _startup() -> None:
    # Ensure tables exist when the service boots.
    init_db()


_startup()


def _admin_authorized() -> bool:
    """
    Simple admin protection for `/admin`.
    - Set `ADMIN_TOKEN` in Render to require access.
    - If `ADMIN_TOKEN` is not set, admin is open (dev convenience).
    """
    expected = os.getenv("ADMIN_TOKEN", "").strip()
    if not expected:
        return True

    # Allow `GET /admin?token=...` for easy browser testing.
    token = (request.args.get("token") or "").strip()

    # Also support `Authorization: Bearer <token>`
    if not token:
        auth = (request.headers.get("Authorization") or "").strip()
        if auth.lower().startswith("bearer "):
            token = auth[7:].strip()

    return token == expected


@app.get("/admin")
@app.get("/admin/")
def admin() -> Any:
    """
    View latest contact form submissions stored in Neon Postgres.
    """
    if not _admin_authorized():
        return jsonify({"ok": False, "error": "Unauthorized"}), 403

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM contact_messages;")
        (total,) = cur.fetchone()

        cur.execute(
            """
            SELECT id, name, email, message, created_at
            FROM contact_messages
            ORDER BY created_at DESC
            LIMIT 20;
            """
        )
        rows = cur.fetchall()

    messages = []
    for (msg_id, name, email, message, created_at) in rows:
        created = created_at.isoformat() if created_at is not None else None
        messages.append(
            {
                "id": msg_id,
                "name": name,
                "email": email,
                "message": message,
                "created_at": created,
            }
        )

    payload = {"ok": True, "total": total, "messages": messages}

    # If opened in a browser, return a readable HTML page.
    # Frontend is not using /admin, but this prevents "blank page" confusion.
    accept = (request.headers.get("Accept") or "").lower()
    if "text/html" in accept:
        if total == 0:
            body = "<p>No contact messages yet.</p>"
        else:
            items = []
            for m in messages:
                items.append(
                    "<li>"
                    f"<div><b>{html.escape(str(m.get('name') or ''))}</b> "
                    f"<span style='color:#666'>({html.escape(str(m.get('email') or ''))})</span></div>"
                    f"<div style='font-size:13px;color:#111;margin-top:6px'>{html.escape(str(m.get('message') or ''))}</div>"
                    f"<div style='color:#666;font-size:12px;margin-top:6px'>{html.escape(str(m.get('created_at') or ''))}</div>"
                    f"</li>"
                )
            body = "<ul style='padding-left:18px'>" + "".join(items) + "</ul>"

        return (
            "<!doctype html>"
            "<html><head><meta charset='utf-8'/>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'/>"
            "<title>Admin - Contact Messages</title>"
            "<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 16px} "
            "h1{font-size:20px;margin-bottom:14px} "
            "small{color:#666}</style>"
            "</head><body>"
            "<h1>Contact Messages (Neon)</h1>"
            f"<small>Total: {total}</small>"
            "<hr/>"
            f"{body}"
            "</body></html>"
        )

    return jsonify(payload)


if __name__ == "__main__":
    # Local dev: `python backend/server.py`
    app.run(host="0.0.0.0", port=int(__import__("os").getenv("PORT", "5000")), debug=True)

