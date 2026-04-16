from app import app
from models import db, User, SystemSettings
from werkzeug.security import generate_password_hash

with app.app_context():
    # 1. Crear Administrador
    admin_email = 'admin@admin.com'
    admin = User.query.filter_by(email=admin_email).first()
    if not admin:
        print(f"Creando administrador: {admin_email}")
        admin = User(
            name="Administrador Global",
            email=admin_email,
            role="Administrador"
        )
        admin.password_hash = generate_password_hash('admin123')
        db.session.add(admin)
    else:
        print("El administrador ya existe, actualizando contraseña...")
        admin.password_hash = generate_password_hash('admin123')
    
    # 2. Asegurar que existan Settings base
    settings = SystemSettings.query.first()
    if not settings:
        print("Creando configuración inicial del sistema...")
        settings = SystemSettings(
            portal_name="Portal TI",
            portal_logo_bg="#6366f1",
            portal_logo_type="icon",
            portal_icon="fa-box"
        )
        db.session.add(settings)
    
    db.session.commit()
    print("¡Acceso restaurado!")
    print(f"Usuario: {admin_email}")
    print("Contraseña: admin123")
