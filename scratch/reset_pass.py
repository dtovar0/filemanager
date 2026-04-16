from app import app
from models import db, User
from werkzeug.security import generate_password_hash

with app.app_context():
    users = User.query.all()
    print(f"Total usuarios encontrados: {len(users)}")
    
    for u in users:
        print(f"Usuario: {u.email} | Rol: {u.role}")
        if u.role == 'Administrador' or u.email == 'admin@admin.com':
            print(f"Reseteando contraseña para {u.email} a 'admin123'...")
            u.password_hash = generate_password_hash('admin123')
            db.session.commit()
            print("¡Hecho!")
