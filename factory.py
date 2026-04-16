from flask import Flask, g, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_talisman import Talisman
import jwt
import os
from datetime import datetime

from models import db, User, Platform, SystemSettings
from config import config_by_name

csrf = CSRFProtect()

def create_app(config_name='dev'):
    # Configurar zona horaria de México para todo el proceso
    os.environ['TZ'] = 'America/Mexico_City'
    try:
        import time
        time.tzset()
    except AttributeError:
        # En Windows time.tzset() no existe, pero en Linux (tu sistema) es vital
        pass

    app = Flask(__name__, 
                template_folder='templates',
                static_folder='static')
    
    app.config.from_object(config_by_name[config_name])
    
    # Initialize Extensions
    db.init_app(app)
    csrf.init_app(app)
    
    # Security Headers - Relaxed for stability
    Talisman(app, 
             force_https=app.config.get('SESSION_COOKIE_SECURE', False), 
             content_security_policy={
                 'default-src': ["'self'", "https:"],
                 'script-src': ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'", "'unsafe-eval'"],
                 'style-src': ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
                 'img-src': ["'self'", "data:", "https:"],
                 'font-src': ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                 'connect-src': ["'self'", "https:"]
             }
    )

    # Register Blueprints
    from blueprints.api import api_bp
    from blueprints.admin import admin_bp
    from blueprints.main import main_bp
    app.register_blueprint(api_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(main_bp)

    # Global Context Processors & Hooks
    @app.before_request
    def require_login():
        public_endpoints = ['main.login', 'static', 'api.list_files_api', 'api.seed_all_debug'] 
        user_endpoints = ['main.drive', 'main.logout', 'api.list_files_api', 'api.download_file', 'api.download_folder', 'api.view_file']
        
        token = request.cookies.get('token')
        g.user = None
        g.user_id = None
        g.role = None

        if token:
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                g.user_id = data.get('user_id')
                g.role = data.get('role')
                g.user = User.query.get(g.user_id)
                if g.user and g.user.status != 'Activo':
                    g.user = None
            except:
                pass
                
        # Redirigir si no está autenticado
        if not g.user and request.endpoint not in public_endpoints:
            if request.endpoint == 'static': return
            return redirect(url_for('main.login'))
            
        # Redirigir si no es admin y trata de acceder a rutas administrativas (que no sean API)
        if g.user and g.role != 'Administrador' and request.endpoint not in user_endpoints:
            if request.endpoint and not request.endpoint.startswith('api.') and not request.endpoint.startswith('admin.'):
                return redirect(url_for('main.drive'))

    @app.context_processor
    def inject_global_settings():
        try:
            settings = SystemSettings.query.first()
            platforms_count = Platform.query.count()
            return dict(
                portal_settings=settings,
                total_platforms_count=platforms_count,
                now=datetime.now(),
                current_user=getattr(g, 'user', None)
            )
        except:
            return dict(portal_settings=None, total_platforms_count=0, now=datetime.now(), current_user=None)

    return app
