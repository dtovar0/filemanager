import os
import sys
import random
from datetime import datetime, timedelta

# Añadir el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from factory import create_app
from models import db, Platform, DriveActivity, User

def seed_activity_data():
    app = create_app('dev')
    with app.app_context():
        platforms = Platform.query.all()
        users = User.query.all()
        
        if not platforms or not users:
            print("[ERROR] Necesito plataformas y usuarios para generar actividad.")
            return

        print(f"--- Generando Actividad de Prueba (Descargas y Subidas) ---")
        
        # Generar 50 eventos aleatorios en los últimos 7 días
        actions = ['Alta', 'Descarga', 'Carga']
        
        for _ in range(60):
            p = random.choice(platforms)
            u = random.choice(users)
            action = random.choice(actions)
            # Tamaño entre 10MB y 1GB
            size = random.randint(10, 1024) * 1024 * 1024
            
            activity = DriveActivity(
                file_name=f"test_file_{random.randint(1,1000)}.dat",
                file_path=f"/{p.name}/",
                action=action,
                file_size=size,
                area_id=p.area_id,
                platform_id=p.id,
                user_id=u.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
            )
            db.session.add(activity)
            
        db.session.commit()
        print("--- Inyección de Actividad Completada con Éxito ---")

if __name__ == "__main__":
    seed_activity_data()
