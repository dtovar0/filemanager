import os
from app import create_app
from models import db, Platform, Area

app = create_app()
with app.app_context():
    platforms = Platform.query.all()
    print(f"Total plataformas: {len(platforms)}")
    for p in platforms:
        print(f"- ID: {p.id}, Nombre: {p.name}, Path: {p.storage_path}")
        if p.storage_path and '/home/dtovar' in p.storage_path:
            p.storage_path = p.storage_path.split('/')[-1]
            print(f"  -> ACTUALIZADO a: {p.storage_path}")
    
    areas = Area.query.all()
    print(f"Total áreas: {len(areas)}")
    for a in areas:
        print(f"- Area: {a.name}")
        
    db.session.commit()
