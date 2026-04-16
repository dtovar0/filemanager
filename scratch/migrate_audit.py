from factory import create_app
from models import db
from sqlalchemy import text
import os

app = create_app('dev')
with app.app_context():
    try:
        # Agregar columnas a audit_log
        db.session.execute(text("ALTER TABLE audit_log ADD COLUMN ip_address VARCHAR(45) AFTER payload"))
        db.session.execute(text("ALTER TABLE audit_log ADD COLUMN user_agent VARCHAR(255) AFTER ip_address"))
        
        # Agregar columnas a drive_activity
        db.session.execute(text("ALTER TABLE drive_activity ADD COLUMN ip_address VARCHAR(45) AFTER user_id"))
        db.session.execute(text("ALTER TABLE drive_activity ADD COLUMN user_agent VARCHAR(255) AFTER ip_address"))
        
        db.session.commit()
        print("Migración exitosa: Columnas IP y UserAgent añadidas.")
    except Exception as e:
        db.session.rollback()
        print(f"Error o columnas ya existentes: {str(e)}")
