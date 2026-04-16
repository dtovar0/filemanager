from app import app
from models import db, Area, User

with app.app_context():
    areas = Area.query.all()
    users = User.query.all()
    print(f"AREAS_COUNT:{len(areas)}")
    for a in areas:
        print(f"- Area: {a.name} (ID: {a.id})")
    print(f"USERS_COUNT:{len(users)}")
