import re
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


if __name__ == "__main__":
    # Local dev: `python backend/server.py`
    app.run(host="0.0.0.0", port=int(__import__("os").getenv("PORT", "5000")), debug=True)

