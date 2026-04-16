import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'filemanager.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- USER TABLE ---")
cursor.execute("SELECT id, name, email FROM user")
for row in cursor.fetchall():
    print(row)

print("\n--- DRIVE_ACTIVITY TABLE (Last 5) ---")
cursor.execute("SELECT id, file_name, user_id FROM drive_activity ORDER BY id DESC LIMIT 5")
for row in cursor.fetchall():
    print(row)

conn.close()
