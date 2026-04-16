from app import app, db
from models import DriveActivity

with app.app_context():
    try:
        DriveActivity.__table__.create(db.engine)
        print("Tabla drive_activity creada con éxito.")
    except Exception as e:
        print(f"La tabla probablemente ya existe o hubo un error: {e}")
