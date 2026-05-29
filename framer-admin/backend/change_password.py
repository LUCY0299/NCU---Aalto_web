"""
change_password.py - Admin credential management
================================================
Usage: python change_password.py
"""

import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import User
from routers.auth import hash_password

def change_credentials():
    print("=== NCU x Aalto EMBA - Change Admin Credentials ===\n")

    db = SessionLocal()

    # Show current users
    users = db.query(User).all()
    if not users:
        print("No users found. Run seed.py first.")
        db.close()
        return

    print("Current admin accounts:")
    for u in users:
        print(f"  [{u.id}] {u.username} ({'Admin' if u.is_admin else 'User'}) - Active: {u.is_active}")

    print()
    target = input("Enter username to edit (or press Enter for 'admin'): ").strip() or "admin"

    user = db.query(User).filter(User.username == target).first()
    if not user:
        print(f"User '{target}' not found.")
        db.close()
        return

    print(f"\nEditing user: {user.username}")
    print("(Press Enter to keep current value)\n")

    # New username
    new_username = input(f"New username [{user.username}]: ").strip()
    if new_username:
        # Check if new username already taken
        existing = db.query(User).filter(User.username == new_username).first()
        if existing and existing.id != user.id:
            print(f"Error: username '{new_username}' already exists.")
            db.close()
            return
        user.username = new_username

    # New password
    new_password = input("New password (leave blank to keep current): ").strip()
    if new_password:
        if len(new_password) < 8:
            print("Warning: password should be at least 8 characters.")
            confirm = input("Continue anyway? (y/n): ").strip().lower()
            if confirm != 'y':
                db.close()
                return
        user.hashed_password = hash_password(new_password)

    db.commit()
    print(f"\nDone! Updated credentials:")
    print(f"  Username: {user.username}")
    if new_password:
        print(f"  Password: {new_password}")
    else:
        print(f"  Password: (unchanged)")
    db.close()


if __name__ == "__main__":
    change_credentials()
