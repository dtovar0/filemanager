from factory import create_app
from models import db, User
from werkzeug.security import generate_password_hash
import sys

def change_password(email, new_password):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"Error: Usuario con email '{email}' no encontrado.")
            # Buscar por rol si no se encuentra por email
            user = User.query.filter_by(role='Administrador').first()
            if user:
                print(f"Usando administrador encontrado: {user.email}")
        
        if user:
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            print(f"Éxito: Password actualizado correctamente para {user.email}")
            print(f"Hash generado: {user.password_hash}")
        else:
            print("Error: No se encontró ningún usuario administrador.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python3 change_admin_pw.py <email> <nueva_password>")
    else:
        change_password(sys.argv[1], sys.argv[2])
