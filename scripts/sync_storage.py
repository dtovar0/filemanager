import os
import sys

# Añadir el directorio raíz al path para importar modelos y factory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from factory import create_app
from models import db, Platform, StorageStat
from utils import StorageManager

def sync_storage():
    # Inicializar app en modo producción/dev según convenga
    app = create_app('dev')
    with app.app_context():
        # Asegurar que la tabla exista
        db.create_all()
        
        platforms = Platform.query.all()
        print(f"--- Iniciando Sincronización de Almacenamiento ({len(platforms)} plataformas) ---")
        
        for p in platforms:
            p_path = StorageManager.get_safe_path(p.storage_path or p.name)
            total_size = 0
            
            if os.path.exists(p_path):
                for dirpath, dirnames, filenames in os.walk(p_path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        try:
                            # Evitar conteo doble con symlinks y manejar errores de acceso
                            if not os.path.islink(fp):
                                total_size += os.path.getsize(fp)
                        except: continue
            
            # Buscar o crear registro de estadística
            stat = StorageStat.query.filter_by(platform_id=p.id).first()
            if not stat:
                stat = StorageStat(platform_id=p.id)
                db.session.add(stat)
            
            stat.size_bytes = total_size
            print(f"[OK] {p.name}: {total_size / (1024*1024):.2f} MB")
        
        db.session.commit()
        print("--- Sincronización Finalizada de forma Exitosa ---")

if __name__ == "__main__":
    sync_storage()
