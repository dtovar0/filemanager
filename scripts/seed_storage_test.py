import os
import sys
import random

# Añadir el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from factory import create_app
from models import db, Platform, StorageStat

def seed_test_data():
    app = create_app('dev')
    with app.app_context():
        # Asegurar tablas
        db.create_all()
        
        platforms = Platform.query.all()
        if not platforms:
            print("[ERROR] No hay plataformas en la base de datos para inyectar datos.")
            return

        print(f"--- Inyectando Datos de Prueba: Uso de Disco ---")
        
        for p in platforms:
            # Tamaño aleatorio entre 50MB y 4.5GB
            dummy_size = random.randint(50, 4500) * 1024 * 1024
            
            stat = StorageStat.query.filter_by(platform_id=p.id).first()
            if not stat:
                stat = StorageStat(platform_id=p.id)
                db.session.add(stat)
            
            stat.size_bytes = dummy_size
            print(f"[TEST] {p.name}: {dummy_size / (1024*1024):.2f} MB")
        
        db.session.commit()
        print("--- Inyección de Datos de Prueba Completada ---")

if __name__ == "__main__":
    seed_test_data()
