"""
Clear all registered users and messages from MongoDB (alumni_db).

Usage:
  python clear_registrations.py           # delete only
  python clear_registrations.py --smoke   # delete, then register + login example user
"""
from __future__ import annotations

import argparse
import io
import sys

from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "alumni_db"


def clear_db() -> tuple[int, int]:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    u = db["users"].delete_many({})
    m = db["messages"].delete_many({})
    return u.deleted_count, m.deleted_count


def smoke() -> None:
    from fastapi.testclient import TestClient

    from main import app

    u_del, m_del = clear_db()
    print(f"Cleared {u_del} users, {m_del} messages.")

    pdf = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
    files = {
        "resume_file": ("resume.pdf", io.BytesIO(pdf), "application/pdf"),
        "id_card_file": ("id.pdf", io.BytesIO(pdf), "application/pdf"),
    }
    data = {
        "name": "Example Alumni",
        "email": "example.alumni@test.local",
        "password": "TestPass123",
        "role": "Alumni",
        "roll_no": "",
        "company": "Acme Corp",
        "position": "Software Engineer",
        "location": "Test City",
        "details": "",
        "work_experience": "",
    }

    client = TestClient(app)
    r = client.post("/register", data=data, files=files)
    if r.status_code != 200:
        print("Register failed:", r.status_code, r.text)
        sys.exit(1)
    body = r.json()
    if body.get("error"):
        print("Register error:", body)
        sys.exit(1)
    print("Register OK:", body.get("message", body))

    r2 = client.post(
        "/login",
        params={
            "email": "example.alumni@test.local",
            "password": "TestPass123",
        },
    )
    if r2.status_code != 200:
        print("Login failed:", r2.status_code, r2.text)
        sys.exit(1)
    login_body = r2.json()
    if login_body.get("error"):
        print("Login error:", login_body)
        sys.exit(1)
    print("Login OK:", login_body.get("user", {}).get("email"))

    r3 = client.get("/users")
    assert r3.status_code == 200
    users = r3.json().get("users") or []
    print(f"GET /users: {len(users)} user(s)")

    r4 = client.get("/profile", params={"email": "example.alumni@test.local"})
    assert r4.status_code == 200
    prof = r4.json().get("user") or {}
    print("GET /profile:", prof.get("name"), prof.get("role"), prof.get("company"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="After clearing, register example alumni and test login + profile + users list",
    )
    args = parser.parse_args()

    if args.smoke:
        smoke()
        return

    try:
        u_del, m_del = clear_db()
    except Exception as e:
        print("MongoDB error (is mongod running?):", e)
        sys.exit(1)
    print(f"Deleted {u_del} users and {m_del} messages from {DB_NAME}.")


if __name__ == "__main__":
    main()
