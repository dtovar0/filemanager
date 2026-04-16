import os
import secrets
import configparser
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Basic Flask Config
    SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(32))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database Fallback Logic
    config_path = os.path.join(os.path.dirname(__file__), 'config.conf')
    db_config = {}
    
    if os.path.exists(config_path):
        cp = configparser.ConfigParser()
        cp.read(config_path, encoding='utf-8')
        db_config = {
            'user': cp.get('DATABASE', 'DB_USER', fallback='root'),
            'pass': cp.get('DATABASE', 'DB_PASS', fallback=''),
            'host': cp.get('DATABASE', 'DB_HOST', fallback='localhost'),
            'name': cp.get('DATABASE', 'DB_NAME', fallback='filemanager')
        }
        SECRET_KEY = cp.get('SYSTEM', 'SECRET_KEY', fallback=SECRET_KEY)
    else:
        db_config = {
            'user': os.environ.get('DB_USER', 'root'),
            'pass': os.environ.get('DB_PASS', ''),
            'host': os.environ.get('DB_HOST', 'localhost'),
            'name': os.environ.get('DB_NAME', 'filemanager')
        }
    
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{db_config['user']}:{db_config['pass']}@{db_config['host']}/{db_config['name']}"

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # In production, we should force HTTPS and stricter cookies
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

config_by_name = {
    'dev': DevelopmentConfig,
    'prod': ProductionConfig
}
