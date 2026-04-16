import os
import sys

# Añadir el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from factory import create_app
from models import db, AuditLog, DriveActivity

def rebuild_logs():
    app = create_app('dev')
    with app.app_context():
        print("--- Iniciando Reconstrucción de Tablas de Log ---")
        
        # Eliminar tablas
        db.reflect()
        for table_name in ['audit_logs', 'drive_activity']:
            table = db.metadata.tables.get(table_name)
            if table is not None:
                table.drop(db.engine)
                print(f"[OK] Tabla {table_name} eliminada.")
        
        # Volver a crear todo según los modelos actuales
        db.create_all()
        print("[OK] Estructuras de tablas recreadas vacías.")
        
        db.session.commit()
        print("--- Proceso Completado con Éxito ---")

if __name__ == "__main__":
    rebuild_logs()
