from factory import create_app
from models import User
import os

app = create_app('dev')
with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}")
