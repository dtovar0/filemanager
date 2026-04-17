from flask import Blueprint, render_template, request, redirect, url_for, g, make_response, jsonify, current_app
import jwt
import os
import secrets
import pymysql
import configparser
from datetime import datetime, timedelta
from werkzeug.security import check_password_hash, generate_password_hash
from models import db, Area, Platform, User, AuditLog, SystemSettings

main_bp = Blueprint('main', __name__)

@main_bp.route('/install', methods=['GET', 'POST'])
def web_installer():
    # Solo permitir si no existe config.conf o si se fuerza (seguridad básica)
    config_path = os.path.join(current_app.root_path, 'config.conf')
    if os.path.exists(config_path) and request.method == 'GET':
        return redirect(url_for('main.login'))

    if request.method == 'POST':
        try:
            db_host = request.form.get('db_host')
            db_user = request.form.get('db_user')
            db_pass = request.form.get('db_pass')
            db_name = request.form.get('db_name')
            drop_db = request.form.get('drop_db') == 'on'
            
            admin_name = request.form.get('admin_name')
            admin_email = request.form.get('admin_email')
            admin_pass = request.form.get('admin_pass')

            # 1. Crear Base de Datos
            conn = pymysql.connect(host=db_host, user=db_user, password=db_pass)
            with conn.cursor() as cursor:
                if drop_db:
                    cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4")
            conn.close()

            # 2. Importar Schema y Crear Admin
            # Nota: SQLALchemy necesita que la DB exista primero
            temp_uri = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}"
            from sqlalchemy import create_engine
            engine = create_engine(temp_uri)
            
            # Ejecutar Schema
            schema_path = os.path.join(current_app.root_path, 'schema.sql')
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
                with engine.connect() as con:
                    for statement in schema_sql.split(';'):
                        if statement.strip():
                            con.execute(db.text(statement))
            
            # Crear Admin vía Tabla directa (evitando problemas de sesión de Flask-SQLAlchemy antes de config)
            pass_hash = generate_password_hash(admin_pass)
            with engine.connect() as con:
                con.execute(db.text("INSERT INTO user (name, email, role, status, password_hash) VALUES (:name, :email, 'Administrador', 'Activo', :pass)"),
                            {"name": admin_name, "email": admin_email, "pass": pass_hash})
                con.commit()

            # 3. Generar Config.conf
            cp = configparser.ConfigParser()
            cp.add_section('DATABASE')
            cp['DATABASE']['DB_USER'] = db_user
            cp['DATABASE']['DB_PASS'] = db_pass
            cp['DATABASE']['DB_HOST'] = db_host
            cp['DATABASE']['DB_NAME'] = db_name
            
            cp.add_section('REDIS')
            cp['REDIS']['REDIS_ENABLED'] = 'False'
            cp['REDIS']['REDIS_HOST'] = 'localhost'
            cp['REDIS']['REDIS_PORT'] = '6379'
            
            cp.add_section('SYSTEM')
            cp['SYSTEM']['SECRET_KEY'] = secrets.token_hex(24)
            cp['SYSTEM']['DEBUG'] = 'False'
            
            with open(config_path, 'w') as configfile:
                cp.write(configfile)

            return render_template('install.html', success=True)
            
        except Exception as e:
            return render_template('install.html', error=str(e))

    return render_template('install.html')

@main_bp.route('/test_db', methods=['POST'])
def test_db():
    data = request.json
    try:
        conn = pymysql.connect(
            host=data.get('db_host'),
            user=data.get('db_user'),
            password=data.get('db_pass'),
            connect_timeout=5
        )
        conn.close()
        return jsonify({"success": True, "message": "Conexión exitosa con el servidor MySQL"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Fallo de conexión: {str(e)}"})

@main_bp.route('/')
def index():
    if not g.user: return redirect(url_for('main.login'))
    if g.role != 'Administrador': return redirect(url_for('main.drive'))
    
    all_areas = Area.query.order_by(Area.name).all()
    platforms = Platform.query.all()
    
    # 1. KPIs Básicos
    total_platforms = len(platforms)
    total_users = User.query.count()
    areas_count_list = [(area.name, len(area.platforms)) for area in all_areas]
    latest_platforms = Platform.query.order_by(Platform.created_at.desc()).limit(5).all()
    most_downloaded = Platform.query.order_by(Platform.can_download.desc()).limit(5).all()
    log_list = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(8).all()
    recent_events = len(log_list)

    # 2. Datos para Gráficos
    users_per_platform = []
    for p in platforms:
        count = len(p.users)
        if count > 0:
            users_per_platform.append({'label': p.name, 'value': count})
    users_per_platform = sorted(users_per_platform, key=lambda x: x['value'], reverse=True)[:5]
    
    users_per_area = []
    for a in all_areas:
        users_per_area.append({'label': a.name, 'value': len(a.users)})
    users_per_area = sorted(users_per_area, key=lambda x: x['value'], reverse=True)[:5]

    return render_template('index.html', 
                           total=total_platforms,
                           total_users=total_users,
                           areas_count=areas_count_list,
                           log_list=log_list,
                           recent_events=recent_events,
                           areas_count_num=len(all_areas),
                           visits_total=sum(p.can_download or 0 for p in platforms),
                           latest=latest_platforms,
                           most_visited=most_downloaded,
                           users_platform_labels=[x['label'] for x in users_per_platform],
                           users_platform_values=[x['value'] for x in users_per_platform],
                           users_area_labels=[x['label'] for x in users_per_area],
                           users_area_values=[x['value'] for x in users_per_area],
                           users_area_colors=[Area.query.filter_by(name=x['label']).first().color if Area.query.filter_by(name=x['label']).first() else '#6366f1' for x in users_per_area])

@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        print(f">>> INTENTO DE LOGIN: {email}")
        
        user = User.query.filter_by(email=email).first()
        if user:
            print(f">>> USUARIO ENCONTRADO: {user.email}")
            is_valid = check_password_hash(user.password_hash, password)
            print(f">>> CONTRASEÑA VALIDA: {is_valid}")
            
            if is_valid:
                # Validar estado del usuario
                if user.status != 'Activo':
                    print(f">>> LOGIN RECHAZADO: Usuario {user.email} está {user.status}")
                    return render_template('login.html', error="Tu cuenta está deshabilitada. Contacta al administrador.")

                from flask import current_app
                token = jwt.encode({
                    'user_id': user.id,
                    'role': user.role,
                    'exp': datetime.utcnow() + timedelta(hours=8)
                }, current_app.config['SECRET_KEY'], algorithm="HS256")
                
                resp = make_response(redirect(url_for('main.index')))
                resp.set_cookie('token', token, httponly=True, secure=current_app.config.get('SESSION_COOKIE_SECURE', False))
                print(">>> LOGIN EXITOSO, REDIRIGIENDO...")
                return resp
        else:
            print(">>> USUARIO NO ENCONTRADO")
        
        return render_template('login.html', error="Credenciales inválidas")
    return render_template('login.html')

@main_bp.route('/logout')
def logout():
    resp = make_response(redirect(url_for('main.login')))
    resp.delete_cookie('token')
    return resp

@main_bp.route('/drive')
def drive():
    if not g.user: return redirect(url_for('main.login'))
    user = User.query.get(g.user_id)
    
    # Si es Administrador, ve todas las áreas activas. Si no, solo las asignadas.
    if user.role == 'Administrador':
        all_areas = Area.query.order_by(Area.name).all() # Ver todas las áreas
        approved_platforms = Platform.query.all() # Ver todas las plataformas
    else:
        all_areas = [a for a in user.areas if a.status == 'Activo']
        approved_platforms = user.platforms
    return render_template('drive.html', 
                           all_areas=all_areas, 
                           approved_platforms=approved_platforms,
                           platforms_json=[p.to_dict() for p in approved_platforms])

@main_bp.route('/platforms')
def platforms_list():
    all_areas = Area.query.all()
    platforms = Platform.query.order_by(Platform.name).all()
    
    # Agrupar plataformas por área
    grouped = {area.name: [] for area in all_areas}
    for p in platforms:
        if p.area.name in grouped:
            approved_users = [u.id for u in p.users]
            grouped[p.area.name].append({
                "id": p.id,
                "name": p.name,
                "area": p.area.name,
                "area_id": p.area_id,
                "description": p.description,
                "can_download": p.can_download,
                "can_upload": p.can_upload,
                "is_encrypted": p.is_encrypted,
                "storage_path": p.storage_path,
                "icon": p.icon or "box",
                "user_count": len(approved_users),
                "user_ids": approved_users
            })
    
    area_list = []
    for area in all_areas:
        area_list.append({
            "id": area.id,
            "name": area.name,
            "status": area.status,
            "icon": area.icon or 'box',
            "platform_count": len(grouped.get(area.name, []))
        })

    all_users = [u.to_dict() for u in User.query.order_by(User.name).all()]
    return render_template('platforms.html', 
                          grouped_platforms=grouped, 
                          area_list=area_list,
                          all_users=all_users,
                          areas=all_areas)
