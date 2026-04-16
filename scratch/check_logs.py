from factory import create_app
from models import DriveActivity, User
import os

app = create_app('dev')
with app.app_context():
    logs = DriveActivity.query.order_by(DriveActivity.id.desc()).limit(5).all()
    for l in logs:
        user_name = l.user.name if l.user else "N/A"
        print(f"Log ID: {l.id}, Action: {l.action}, UserID: {l.user_id}, Name in relationship: {user_name}")
