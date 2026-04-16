from flask import Blueprint, request, jsonify, g, send_file
import os
import math
from datetime import datetime
from werkzeug.utils import secure_filename
from models import db, Area, Platform, User, DriveActivity
from utils import StorageManager, SecretManager, log_event, log_drive_activity

api_bp = Blueprint('api', __name__)

def _resolve_platform_access(path):
    # Obtener todas las plataformas permitidas
    allowed_platforms = Platform.query.all() if g.role == 'Administrador' else g.user.platforms
    
    # Normalizar el path solicitado
    norm_path = os.path.normpath(path)
    
    for p in allowed_platforms:
        # Resolver el path físico de la plataforma
        p_path = StorageManager.get_safe_path(p.storage_path or p.name)
        if norm_path.startswith(p_path):
            return p
    
    # Si no tiene acceso a ninguna y no es admin, fuera.
    if g.role != 'Administrador':
        raise PermissionError('No tienes acceso a esta ubicación.')
    return None

def _validate_platform_password(target_platform, password):
    if target_platform and target_platform.is_encrypted and target_platform.password:
        decrypted_pass = SecretManager.decrypt(target_platform.password)
        if password != decrypted_pass:
            raise PermissionError('Contraseña incorrecta')

def _resolve_area_root(path):
    for area in Area.query.all():
        area_path = StorageManager.get_safe_path(area.name)
        if path == area_path:
            return area
    return None

def _ensure_not_area_root_action(path, action_label):
    area = _resolve_area_root(path)
    if area:
        raise PermissionError(f'No puedes {action_label} directamente en la raíz del área "{area.name}".')

@api_bp.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No se encontró el archivo'}), 400
            
        file = request.files['file']
        path_str = request.form.get('path')
        password = request.form.get('password')
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nombre de archivo vacío'}), 400
            
        # 1. Seguridad: Validar si el archivo es seguro (Extensiones, etc)
        if not StorageManager.is_safe_file(file.filename):
            return jsonify({'success': False, 'error': 'Tipo de archivo no permitido por políticas de seguridad.'}), 400
            
        # 2. Seguridad: Sanitizar nombre de archivo (Anti-Inyección y Doble Extensión)
        safe_filename = StorageManager.sanitize_filename(file.filename)
            
        # 3. Seguridad: Path Traversal Protection
        dest_dir = StorageManager.get_safe_path(path_str)
        _ensure_not_area_root_action(dest_dir, 'subir archivos')
        target_platform = _resolve_platform_access(dest_dir)
        
        # Validar contraseña si la plataforma está cifrada
        if target_platform:
            if not target_platform.can_upload:
                return jsonify({'success': False, 'error': 'Subidas deshabilitadas para esta plataforma'}), 403
            _validate_platform_password(target_platform, password)

        full_path = os.path.join(dest_dir, safe_filename)
        
        # Guardado final
        file.save(full_path)
        
        # Auditoría
        file_size = os.path.getsize(full_path)
        area_id = target_platform.area_id if target_platform else None
        platform_id = target_platform.id if target_platform else None
        log_drive_activity(safe_filename, path_str, 'Alta', g.user_id, file_size, area_id, platform_id)

        return jsonify({'success': True, 'message': 'Archivo almacenado de forma segura'})
    except PermissionError as pe:
        return jsonify({'success': False, 'error': str(pe)}), 403
    except Exception as e:
        return jsonify({'success': False, 'error': 'Error de seguridad interno'}), 500

@api_bp.route('/api/drive/list', methods=['GET', 'POST'])
def list_files_api():
    try:
        # 1. Obtención de la ruta solicitada (soporta JSON POST y URL GET)
        data = (request.is_json and request.get_json()) or {}
        requested_path = data.get('path') or request.args.get('path') or ''
        
        # 2. Carga automática de la ubicación inicial si no hay ruta
        if not requested_path or requested_path in ['', '/']:
            platforms = Platform.query.order_by(Platform.name).all() if g.role == 'Administrador' else g.user.platforms
            if platforms:
                requested_path = platforms[0].storage_path or platforms[0].name
            else:
                return jsonify({'success': False, 'error': 'No tienes accesos activos.'}), 403

        # 3. Traducción a ruta física real
        path = StorageManager.get_safe_path(requested_path)
        
        # 4. Autorreparación: Asegurar que la carpeta existe físicamente
        if not os.path.exists(path):
            try: os.makedirs(path, exist_ok=True)
            except: return jsonify({'success': False, 'error': f'Ruta inaccesible: {requested_path}'}), 404
            
        # 5. Resolución de contexto y permisos
        target_platform = _resolve_platform_access(path)
        area_root = _resolve_area_root(path)

        # 6. Escaneo de archivos con metadatos extendidos
        def get_human_size(size_bytes):
            if size_bytes == 0: return "0 B"
            units = ("B", "KB", "MB", "GB", "TB")
            i = int(math.floor(math.log(size_bytes, 1024)))
            p = math.pow(1024, i)
            s = round(size_bytes / p, 2)
            return f"{s} {units[i]}"

        items = []
        for entry in os.scandir(path):
            if entry.name == '.nexus_lock': continue
            try:
                stats = entry.stat()
                items.append({
                    'name': entry.name,
                    'is_dir': entry.is_dir(),
                    'size': get_human_size(stats.st_size) if not entry.is_dir() else '--',
                    'mtime': stats.st_mtime,
                    'ctime': stats.st_ctime
                })
            except: continue 
        
        items.sort(key=lambda x: (not x['is_dir'], x['name'].lower()))
        
        resp_data = {
            'success': True,
            'items': items,
            'protected': target_platform.is_encrypted if target_platform else False,
            'current_path': requested_path,
            'permissions': {
                'can_download': target_platform.can_download if target_platform else True,
                'can_upload': target_platform.can_upload if target_platform else True
            },
            'context': {
                'kind': 'area_root' if area_root and not target_platform else 'platform',
                'area_name': area_root.name if area_root else None
            }
        }
        with open('debug_log.txt', 'a') as f:
            f.write(f"[{datetime.now()}] RESPUESTA EXITOSA: {len(items)} items enviados para {requested_path}\n")
        return jsonify(resp_data)
    except Exception as e:
        with open('debug_log.txt', 'a') as f:
            f.write(f"[{datetime.now()}] ERROR CRÍTICO: {str(e)}\n")
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/api/create-folder', methods=['POST'])
def create_folder_api():
    try:
        data = request.get_json() or {}
        base_path = StorageManager.get_safe_path(data.get('path'))
        folder_name = data.get('folder_name')
        
        if not folder_name:
            return jsonify({'success': False, 'error': 'Nombre de carpeta requerido'})
            
        new_folder_path = os.path.join(base_path, secure_filename(folder_name))
        
        if os.path.exists(new_folder_path):
            return jsonify({'success': False, 'error': 'La carpeta ya existe'})
            
        os.makedirs(new_folder_path)
        
        target_platform = _resolve_platform_access(base_path)
        area_id = target_platform.area_id if target_platform else None
        platform_id = target_platform.id if target_platform else None
        
        log_drive_activity(folder_name, data.get('path'), 'Carpeta', g.user_id, 0, area_id, platform_id)
        return jsonify({'success': True, 'message': 'Carpeta creada'})

    except PermissionError as pe:
        return jsonify({'success': False, 'error': str(pe)}), 403
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/api/drive/stats')
def get_drive_stats():
    try:
        from models import Area, Platform
        from sqlalchemy import func

        # 1. KPIs
        areas_count = Area.query.count() if g.role == 'Administrador' else len(g.user.areas)
        plats_count = Platform.query.count() if g.role == 'Administrador' else len(g.user.platforms)
        
        # Filtro de usuario para logs si no es admin
        base_query = DriveActivity.query
        if g.role != 'Administrador':
            base_query = base_query.filter_by(user_id=g.user.id)

        downloads_count = base_query.filter_by(action='Descarga').count()
        uploads_count = base_query.filter(DriveActivity.action.in_(['Alta', 'Carga'])).count()

        # 2. Datos de Gráficas: Agrupar por Area / Plataforma
        def get_chart_data(action_types):
            results = db.session.query(
                Area.name, 
                Platform.name, 
                func.sum(DriveActivity.file_size)
            ).join(Platform, DriveActivity.platform_id == Platform.id)\
             .join(Area, Platform.area_id == Area.id)\
             .filter(DriveActivity.action.in_(action_types))\
             .group_by(Area.name, Platform.name).all()
            
            labels = []
            values = []
            for a_name, p_name, total_size in results:
                labels.append(f"{a_name} / {p_name}")
                values.append(round(total_size / (1024 * 1024), 2) if total_size else 0)
            return {"labels": labels, "values": values}

        # 3. Almacenamiento REAL en Disco (Desde tabla StorageStat)
        from models import StorageStat
        storage_labels = []
        storage_values = []
        platforms = Platform.query.all() if g.role == 'Administrador' else g.user.platforms
        
        for p in platforms:
            stat = StorageStat.query.filter_by(platform_id=p.id).first()
            size_mb = round(stat.size_bytes / (1024 * 1024), 2) if stat else 0
            
            # REGLA: [PLATAFORMA] arriba / [AREA] abajo -> Chart.js usa arrays para multilínea
            label = [p.name, p.area.name if p.area else 'Sistema']
            storage_labels.append(label)
            storage_values.append(size_mb)

        return jsonify({
            'success': True, 
            'kpis': {
                'areas': areas_count,
                'platforms': plats_count,
                'downloads': downloads_count,
                'uploads': uploads_count
            },
            'charts': {
                'downloads': get_chart_data(['Descarga']),
                'uploads': get_chart_data(['Alta', 'Carga']),
                'storage': { "labels": storage_labels, "values": storage_values }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/api/drive-logs')
def get_drive_logs():
    try:
        logs = DriveActivity.query.order_by(DriveActivity.created_at.desc()).limit(6).all()
        
        return jsonify({
            'success': True, 
            'logs': [{
                'id': l.id,
                'target_name': l.file_name,
                'action': l.action,
                'created_at': l.created_at.strftime('%Y-%m-%d %H:%M:%S')
            } for l in logs]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@api_bp.route('/api/delete-item', methods=['POST'])
def delete_item_api():
    try:
        data = request.get_json() or {}
        path = StorageManager.get_safe_path(data.get('path'))
        password = data.get('password')
        
        if not os.path.exists(path):
            return jsonify({'success': False, 'error': 'Ruta no válida'})

        target_platform = _resolve_platform_access(path)
        _validate_platform_password(target_platform, password)
            
        if os.path.isdir(path):
            import shutil
            shutil.rmtree(path)
        else:
            os.remove(path)
        
        area_id = target_platform.area_id if target_platform else None
        platform_id = target_platform.id if target_platform else None
        log_drive_activity(os.path.basename(path), os.path.dirname(path), 'Baja', g.user_id, 0, area_id, platform_id)
        return jsonify({'success': True, 'message': 'Elemento eliminado'})


    except PermissionError as pe:
        return jsonify({'success': False, 'error': str(pe)}), 403
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/api/download', methods=['GET', 'POST'])
def download_file():
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            requested_path = data.get('path')
            password = data.get('password')
        else:
            requested_path = request.args.get('path')
            password = request.args.get('password')

        # Resolución inteligente: Area / Plataforma / Archivo
        path = StorageManager.get_safe_path(requested_path)
        
        target_platform = None
        if not os.path.exists(path):
            parts = requested_path.strip('/').split('/')
            if len(parts) >= 2:
                # Caso: Area/Plataforma/...
                plat = Platform.query.filter_by(name=parts[1]).first()
                if plat:
                    target_platform = plat
                    area = Area.query.get(plat.area_id)
                    actual_rel_path = os.path.join(area.name if area else '', plat.storage_path or plat.name, *parts[2:])
                    path = StorageManager.get_safe_path(actual_rel_path)
            elif len(parts) == 1:
                # Caso: Plataforma/...
                plat = Platform.query.filter_by(name=parts[0]).first()
                if plat:
                    target_platform = plat
                    area = Area.query.get(plat.area_id)
                    actual_rel_path = os.path.join(area.name if area else '', plat.storage_path or plat.name)
                    path = StorageManager.get_safe_path(actual_rel_path)

        if not os.path.exists(path):
            return f"Archivo no encontrado: {requested_path}", 404

        if os.path.isdir(path):
            return "No se pueden descargar directorios directamente", 400

        if not target_platform:
            target_platform = _resolve_platform_access(path)
            
        # Determinar MIME antes para el bypass de preview
        import mimetypes
        extension_map = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf'
        }
        ext = os.path.splitext(path)[1].lower()
        mime_type = extension_map.get(ext) or mimetypes.guess_type(path)[0] or 'application/octet-stream'

        # SEGURIDAD INTELIGENTE
        if target_platform:
            is_image = mime_type.startswith('image/')
            # Bypass para vista previa de imágenes vía GET
            if request.method == 'GET' and is_image:
                pass
            else:
                if not target_platform.can_download:
                    return "Descargas deshabilitadas", 403
                _validate_platform_password(target_platform, password)

        # Registro de Actividad
        file_size = os.path.getsize(path)
        area_id = target_platform.area_id if target_platform else None
        platform_id = target_platform.id if target_platform else None
        log_drive_activity(os.path.basename(path), requested_path, 'Descarga', g.user_id, file_size, area_id, platform_id)

        # 4. Envío del archivo
        response = send_file(path, mimetype=mime_type, as_attachment=False)
        response.headers['Cache-Control'] = 'public, max-age=3600'
        return response
    except PermissionError as pe:
        return str(pe), 403
    except Exception as e:
        return str(e), 500

@api_bp.route('/api/download-folder', methods=['GET', 'POST'])
def download_folder():
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            requested_path = data.get('path')
            password = data.get('password')
        else:
            requested_path = request.args.get('path')
            password = request.args.get('password')

        path = StorageManager.get_safe_path(requested_path)
        if not os.path.exists(path) or not os.path.isdir(path):
            return "Carpeta no encontrada", 404

        _ensure_not_area_root_action(path, 'descargar')

        target_platform = _resolve_platform_access(path)
        if target_platform:
            if not target_platform.can_download:
                return "Descargas deshabilitadas para esta plataforma", 403
            _validate_platform_password(target_platform, password)
        
        folder_name = os.path.basename(path)
        import tempfile
        import shutil
        
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp_path = tmp.name
            
        shutil.make_archive(tmp_path, 'zip', path)
        
        # Log download folder
        zip_size = os.path.getsize(tmp_path + '.zip') if os.path.exists(tmp_path + '.zip') else 0
        area_id = target_platform.area_id if target_platform else None
        platform_id = target_platform.id if target_platform else None
        log_drive_activity(f"{folder_name}.zip", requested_path, 'Descarga', g.user_id, zip_size, area_id, platform_id)

        return send_file(tmp_path + '.zip', as_attachment=True, download_name=f"{folder_name}.zip")
    except PermissionError as pe:
        return str(pe), 403
    except Exception as e:
        return str(e), 500

@api_bp.route('/api/validate-path-password', methods=['POST'])
def validate_path_password():
    try:
        data = request.get_json()
        requested_path = data.get('path')
        password = data.get('password')
        path = StorageManager.get_safe_path(requested_path)
        
        target_platform = _resolve_platform_access(path)
        
        if not target_platform:
            return jsonify({"success": False, "error": "No hay plataforma asociada"}), 404
            
        if target_platform.is_encrypted and target_platform.password:
            _validate_platform_password(target_platform, password)
            return jsonify({"success": True})
        
        return jsonify({"success": True})
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/api/view')
def view_file():
    try:
        requested_path = request.args.get('path')
        path = StorageManager.get_safe_path(requested_path)
        
        if not os.path.exists(path):
            return "No encontrado", 404
            
        allowed_platforms = g.user.platforms
        has_access = False
        for p in allowed_platforms:
            p_path = StorageManager.get_safe_path(p.storage_path or p.name)
            if path.startswith(p_path):
                has_access = True
                break
        
        if g.role != 'Administrador' and not has_access:
            return "Acceso denegado", 403
            
        return send_file(path)
    except PermissionError as pe:
        return str(pe), 403
    except Exception as e:
        return str(e), 500

@api_bp.route('/api/search')
def global_search():
    from flask import url_for
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify({"results": []})
        
    results = []
    modules = [
        {"name": "Dashboard", "link": url_for('main.index'), "icon": "fa-tachometer-alt", "cat": "Sistema"},
        {"name": "Explorador Drive", "link": url_for('main.platforms_list'), "icon": "fa-layer-group", "cat": "Sistema"},
        {"name": "Gestión de Usuarios", "link": url_for('admin.users_list'), "icon": "fa-users", "cat": "Sistema"},
        {"name": "Administrar Áreas", "link": url_for('admin.areas_list'), "icon": "fa-sitemap", "cat": "Sistema"},
        {"name": "Configuración General", "link": url_for('admin.general_settings'), "icon": "fa-cog", "cat": "Sistema"},
        {"name": "Auditoría", "link": url_for('admin.audit_view'), "icon": "fa-clipboard-list", "cat": "Sistema"}
    ]
    for m in modules:
        if query in m['name'].lower():
            results.append(m)
            
    platforms = Platform.query.filter(Platform.name.like(f"%{query}%")).limit(5).all()
    for p in platforms:
        results.append({
            "name": p.name,
            "link": f"{url_for('main.platforms_list')}?s={p.name}",
            "icon": "fa-cube",
            "cat": "Plataforma",
            "sub": p.area.name if p.area else ""
        })
        
    users = User.query.filter((User.name.like(f"%{query}%")) | (User.email.like(f"%{query}%"))).limit(5).all()
    for u in users:
        results.append({
            "name": u.name,
            "link": f"{url_for('admin.users_list')}?s={u.email}",
            "icon": "fa-user",
            "cat": "Usuario",
            "sub": u.email
        })
        
    return jsonify({"results": results})

@api_bp.route('/api/debug/seed-all')
def seed_all_debug():
    from models import Platform, StorageStat, DriveActivity, db
    import random
    from datetime import datetime
    
    # 1. Sembrar Almacenamiento
    platforms = Platform.query.all()
    for p in platforms:
        # Borrar previo si existe
        StorageStat.query.filter_by(platform_id=p.id).delete()
        stat = StorageStat(platform_id=p.id, size_bytes=int(random.randint(100, 5000) * 1024 * 1024))
        db.session.add(stat)
        
    # 2. Sembrar Actividad (Para las barras)
    for _ in range(30):
        p = random.choice(platforms) if platforms else None
        if p:
            act = DriveActivity(
                file_name=f"Archivo_{random.randint(1,100)}.zip",
                action=random.choice(['Alta', 'Descarga']),
                file_size=random.randint(1, 500) * 1024 * 1024,
                platform_id=p.id,
                area_id=p.area_id,
                created_at=datetime.utcnow()
            )
            db.session.add(act)
            
    db.session.commit()
    return jsonify({'success': True, 'message': 'Sistema sembrado con Almacenamiento y Actividad.'})
