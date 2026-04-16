import os
import secrets
from cryptography.fernet import Fernet
from models import db, AuditLog, User, DriveActivity

class SecretManager:
    _key_file = 'secret.key'
    _key = None

    @classmethod
    def get_key(cls):
        # Prioritize Environment Variable for Production Security
        env_key = os.environ.get('MASTER_ENCRYPTION_KEY')
        if env_key:
            return env_key.encode()

        if not cls._key:
            if os.path.exists(cls._key_file):
                with open(cls._key_file, 'rb') as f:
                    cls._key = f.read()
            else:
                # Security Warning: Writing key to file is a fallback for dev only
                # In strict production mode, this should probably raise an error
                cls._key = Fernet.generate_key()
                with open(cls._key_file, 'wb') as f:
                    f.write(cls._key)
        return cls._key

    @classmethod
    def encrypt(cls, value):
        if not value: return None
        f = Fernet(cls.get_key())
        return f.encrypt(value.encode()).decode()

    @classmethod
    def decrypt(cls, encrypted_value):
        if not encrypted_value: return None
        f = Fernet(cls.get_key())
        return f.decrypt(encrypted_value.encode()).decode()

class StorageManager:
    # ROOT_STORAGE debe ser una ruta absoluta
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ROOT_STORAGE = os.path.normpath(os.path.join(BASE_DIR, 'storage'))
    
    # Extensiones prohibidas por riesgo de RCE (Remote Code Execution)
    FORBIDDEN_EXTENSIONS = {
        '.exe', '.msi', '.bat', '.sh', '.php', '.phtml', '.php5', '.js', '.jsx',
        '.py', '.pyc', '.pl', '.cgi', '.asp', '.aspx', '.jsp', '.jspx', '.rb',
        '.vbs', '.com', '.scr', '.pif', '.hta', '.cpl'
    }

    @classmethod
    def sanitize_filename(cls, filename):
        """Sanitización profunda de nombres de archivo"""
        import re
        from werkzeug.utils import secure_filename
        
        # 1. Quitar caracteres de control y nulos
        filename = "".join(ch for ch in filename if ord(ch) > 31)
        
        # 2. Uso de secure_filename como base
        name = secure_filename(filename)
        
        # 3. Eliminar puntos extra para evitar ataques de doble extensión
        # solo permitimos el último punto para la extensión real
        parts = name.split('.')
        if len(parts) > 2:
            # Re-ensamblar: nombre_con_puntos_unificados.extension
            name = "_".join(parts[:-1]) + "." + parts[-1]
            
        return name

    @classmethod
    def is_safe_file(cls, filename):
        """Valida si el archivo es seguro para ser almacenado"""
        ext = os.path.splitext(filename.lower())[1]
        
        # Bloqueo por extensión prohibida
        if ext in cls.FORBIDDEN_EXTENSIONS:
            return False
            
        # Bloqueo de archivos sin extensión (riesgo de scripts políglotas)
        if not ext:
            return False
            
        return True

    @classmethod
    def get_safe_path(cls, requested_path):
        if not requested_path:
            return cls.ROOT_STORAGE
            
        if not os.path.exists(cls.ROOT_STORAGE):
            os.makedirs(cls.ROOT_STORAGE)

        # 1. Normalización estricta
        # Eliminamos cualquier intento de '../' antes de procesar
        clean_req = requested_path.replace('..', '').replace('\\', '/')
        
        abs_requested = os.path.normpath(os.path.join(cls.ROOT_STORAGE, clean_req))

        # 2. Validación de Cuna (Commonpath check)
        # Garantiza que la ruta resuelta JAMÁS escape del ROOT_STORAGE
        common = os.path.commonpath([cls.ROOT_STORAGE, abs_requested])
        if common != cls.ROOT_STORAGE:
            # Error genérico para no revelar estructura de carpetas
            raise PermissionError("Acceso a ubicación no autorizada.")

        return abs_requested

def log_event(target_type, target_name, action, description, user_id=None, payload=None):
    u_name = "Sistema"
    u_email = ""
    if user_id:
        user_obj = User.query.get(user_id)
        if user_obj:
            u_name = user_obj.name
            u_email = user_obj.email

    from flask import request
    ip = request.remote_addr if request else None
    ua = request.user_agent.string if request and request.user_agent else None

    new_log = AuditLog(
        target_type=target_type,
        target_name=target_name,
        action=action,
        description=description,
        user_id=user_id,
        user_name=u_name,
        user_email=u_email,
        payload=payload,
        ip_address=ip,
        user_agent=ua
    )
    db.session.add(new_log)
    db.session.commit()

def log_drive_activity(file_name, file_path, action, user_id=None, file_size=0, area_id=None, platform_id=None):
    from flask import request
    ip = request.remote_addr if request else None
    ua = request.user_agent.string if request and request.user_agent else None

    new_log = DriveActivity(
        file_name=file_name,
        file_path=file_path,
        action=action,
        user_id=user_id,
        file_size=file_size,
        area_id=area_id,
        platform_id=platform_id,
        ip_address=ip,
        user_agent=ua
    )
    db.session.add(new_log)
    db.session.commit()
