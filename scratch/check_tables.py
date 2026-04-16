import sqlite3
import os

db_path = '/home/dtovar/bayblade/filemanager/instance/filemanager.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cur.fetchall())
    conn.close()
else:
    print("DB not found")
