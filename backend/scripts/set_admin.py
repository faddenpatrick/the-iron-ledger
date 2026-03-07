"""Set a user as admin by email.

Usage:
    python scripts/set_admin.py <email>
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User


def set_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User not found: {email}")
            sys.exit(1)
        user.is_admin = True
        db.commit()
        print(f"User {email} is now an admin.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/set_admin.py <email>")
        sys.exit(1)
    set_admin(sys.argv[1])
