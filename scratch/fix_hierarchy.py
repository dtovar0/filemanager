import os
from app import create_app
from models import db, Platform, Area

app = create_app()
with app.app_context():
    platforms = Platform.query.all()
    print(f"Sincronizando jerarquía de {len(platforms)} plataformas...")
    
    for p in platforms:
        if p.area:
            # La ruta correcta relativa a storage debe ser Area/Plataforma
            correct_path = f"{p.area.name}/{p.name}"
            print(f"-> Plataforma '{p.name}': {p.storage_path} => {correct_path}")
            p.storage_path = correct_path
            
            # Asegurar que la carpeta física existe
            full_physical_path = os.path.join(app.root_path, 'storage', correct_path)
            os.makedirs(full_physical_path, exist_ok=True)
            print(f"   Carpeta física verificada en: {full_physical_path}")
            
    db.session.commit()
    print("\n✅ Jerarquía sincronizada. El explorador ya debería funcionar.")
