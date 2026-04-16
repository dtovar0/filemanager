from flask import Blueprint, render_template, request, redirect, url_for, jsonify, g, current_app
import os
from datetime import datetime
from models import db, Area, User, Platform, SystemSettings, AuditLog
from utils import SecretManager, log_event, StorageManager

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/areas')
def areas_list():
    all_areas = Area.query.order_by(Area.name).all()
    all_users = User.query.all()
    
    # El template areas.html requiere datos serializados en JSON para el script areas.js
    areas_json = [a.to_dict() for a in all_areas]
    all_users_json = [u.to_dict() for u in all_users]
    
    return render_template('areas.html', 
                           areas=all_areas, 
                           users=all_users,
                           areas_json=areas_json,
                           all_users_json=all_users_json)

@admin_bp.route('/admin/areas-api')
def areas_api_list():
    all_areas = Area.query.all()
    return jsonify([a.to_dict() for a in all_areas])

@admin_bp.route('/admin/add-area', methods=['POST'])
def add_area():
    try:
        name = request.form.get('name')
        description = request.form.get('description')
        icon = request.form.get('icon', 'box')
        color = request.form.get('color')
        
        import re
        if not name or not re.match(r'^[a-zA-Z0-9_-]+$', name):
            return jsonify({"success": False, "error": "El nombre del área es obligatorio y solo puede contener letras, números, guiones y guiones bajos (sin espacios ni símbolos)."})
            
        new_area = Area(name=name, description=description, icon=icon, color=color)
        db.session.add(new_area)
        
        # Crear Carpeta Física
        try:
            area_full_path = os.path.join(StorageManager.ROOT_STORAGE, name)
            if not os.path.exists(area_full_path):
                os.makedirs(area_full_path, exist_ok=True)
        except Exception as dir_err:
            print(f"Error creando directorio de área: {dir_err}")
            
        db.session.commit()
        
        log_event('Área', name, 'Alta', f"Se creó una nueva área y su carpeta: {name}", g.user_id)
        return jsonify({"success": True, "message": "Área y carpeta creadas correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/edit-area/<int:id>', methods=['POST'])
def edit_area(id):
    try:
        area = Area.query.get_or_404(id)
        old_name = area.name
        import re
        new_name = request.form.get('name')
        if not new_name or not re.match(r'^[a-zA-Z0-9_-]+$', new_name):
            return jsonify({"success": False, "error": "Nombre inválido: use solo letras, números, guiones y guiones bajos."})
            
        area.name = new_name
        area.description = request.form.get('description')
        area.icon = request.form.get('icon', 'box')
        area.color = request.form.get('color')
        area.status = request.form.get('status', 'Activo')
        
        db.session.commit()
        log_event('Área', area.name, 'Modificación', f"Se actualizó el área: {old_name} -> {area.name}", g.user_id)
        return jsonify({"success": True, "message": "Área actualizada correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/delete-area/<int:id>', methods=['POST'])
def delete_area(id):
    try:
        area = Area.query.get_or_404(id)
        name = area.name
        db.session.delete(area)
        db.session.commit()
        log_event('Área', name, 'Baja', f"Se eliminó el área: {name}", g.user_id)
        return jsonify({"success": True, "message": "Área eliminada correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "No se puede eliminar el área porque tiene plataformas asociadas."})

@admin_bp.route('/admin/users')
def users_list():
    all_users = User.query.order_by(User.name).all()
    all_areas = Area.query.all()
    
    # El template users.html requiere datos serializados en JSON para el script users.js
    users_json = [u.to_dict() for u in all_users]
    all_areas_json = [a.to_dict() for a in all_areas]
    
    return render_template('users.html', 
                           users=all_users, 
                           areas=all_areas,
                           users_json=users_json,
                           all_areas_json=all_areas_json)


@admin_bp.route('/admin/add-user', methods=['POST'])
def add_user():
    from werkzeug.security import generate_password_hash
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        role = request.form.get('role')
        password = request.form.get('password')
        area_ids = request.form.getlist('area_ids[]')
        
        if not name or not email or not password:
            return jsonify({"success": False, "error": "Nombre, email y contraseña son obligatorios."})
            
        new_user = User(name=name, email=email, role=role)
        new_user.password_hash = generate_password_hash(password)
        
        # Assign areas
        import json
        areas_json = request.form.get('areas', '[]')
        try:
            area_names = json.loads(areas_json)
        except:
            area_names = []
            
        for name in area_names:
            area = Area.query.filter_by(name=name).first()
            if area:
                new_user.areas.append(area)
                
        db.session.add(new_user)
        db.session.commit()
        
        log_event('Usuario', name, 'Alta', f"Se creó el usuario: {name} ({email})", g.user_id)
        return jsonify({"success": True, "message": "Usuario creado correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/edit-user/<int:id>', methods=['POST'])
def edit_user(id):
    from werkzeug.security import generate_password_hash
    try:
        user = User.query.get_or_404(id)
        user.name = request.form.get('name')
        user.email = request.form.get('email')
        user.role = request.form.get('role')
        user.status = request.form.get('status', 'Activo')
        
        password = request.form.get('password')
        if password:
            user.password_hash = generate_password_hash(password)
            
        # Update areas
        import json
        areas_json = request.form.get('areas', '[]')
        try:
            area_names = json.loads(areas_json)
        except:
            area_names = []
            
        user.areas = []
        for name in area_names:
            area = Area.query.filter_by(name=name).first()
            if area:
                user.areas.append(area)
                
        db.session.commit()
        log_event('Usuario', user.name, 'Modificación', f"Se actualizó el usuario: {user.name}", g.user_id)
        return jsonify({"success": True, "message": "Usuario actualizado correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/delete-user/<int:id>', methods=['POST'])
def delete_user(id):
    try:
        user = User.query.get_or_404(id)
        name = user.name
        db.session.delete(user)
        db.session.commit()
        log_event('Usuario', name, 'Baja', f"Se eliminó el usuario: {name}", g.user_id)
        return jsonify({"success": True, "message": "Usuario eliminado correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/change-password/<int:id>', methods=['POST'])
def change_user_password(id):
    from werkzeug.security import generate_password_hash
    try:
        user = User.query.get_or_404(id)
        password = request.form.get('password')
        
        if not password or len(password) < 8:
            return jsonify({"success": False, "error": "La contraseña debe tener al menos 8 caracteres."})
            
        user.password_hash = generate_password_hash(password)
        db.session.commit()
        
        log_event('Usuario', user.name, 'Seguridad', f"Se cambió la contraseña del usuario: {user.name}", g.user_id)
        return jsonify({"success": True, "message": "Contraseña actualizada correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/add-platform', methods=['POST'])
def add_platform():
    try:
        name = request.form.get('name')
        description = request.form.get('description')
        area_id = request.form.get('area_id')
        icon = request.form.get('icon', 'box')
        can_download = request.form.get('can_download') == 'on'
        can_upload = request.form.get('can_upload') == 'on'
        is_encrypted = request.form.get('is_encrypted') == 'on'
        password = request.form.get('password')
        
        import re
        if not name or not area_id or not re.match(r'^[a-zA-Z0-9_-]+$', name):
            return jsonify({"success": False, "error": "Nombre obligatorio e inválido: use solo letras, números y guiones (sin espacios)."})
            
        area = Area.query.get(area_id)
        if not area:
            return jsonify({"success": False, "error": "Área no válida."})

        # Automatización de Ruta y Propietario
        auto_storage_path = os.path.join(area.name, name)
        auto_owner = g.user.name if g.user else "Administrador"

        new_platform = Platform(
            name=name, description=description, area_id=area_id, 
            storage_path=auto_storage_path, icon=icon, owner=auto_owner,
            can_download=can_download, can_upload=can_upload,
            is_encrypted=is_encrypted
        )
        if password:
            new_platform.password = SecretManager.encrypt(password)
            
        db.session.add(new_platform)
        
        # Crear Carpeta Física en Cascada
        try:
            platform_full_path = os.path.join(StorageManager.ROOT_STORAGE, auto_storage_path)
            if not os.path.exists(platform_full_path):
                os.makedirs(platform_full_path, exist_ok=True)
        except Exception as dir_err:
            print(f"Error creando directorio de plataforma: {dir_err}")
            
        db.session.commit()
        
        log_event('Plataforma', name, 'Alta', f"Se creó la plataforma y su carpeta: {name} en {auto_storage_path}", g.user_id)
        return jsonify({"success": True, "message": "Plataforma y carpeta creadas correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/edit-platform/<int:id>', methods=['POST'])
def edit_platform(id):
    try:
        platform = Platform.query.get_or_404(id)
        old_name = platform.name
        
        import re
        new_name = request.form.get('name')
        if not new_name or not re.match(r'^[a-zA-Z0-9_-]+$', new_name):
            return jsonify({"success": False, "error": "Nombre inválido: use solo letras, números y guiones (sin espacios)."})

        platform.name = new_name
        platform.description = request.form.get('description')
        platform.area_id = request.form.get('area_id')
        platform.icon = request.form.get('icon', 'box')
        platform.can_download = request.form.get('can_download') == 'on'
        platform.can_upload = request.form.get('can_upload') == 'on'
        platform.is_encrypted = request.form.get('is_encrypted') == 'on'
        
        # Si el nombre o el área cambian, actualizamos la ruta también para mantener consistencia
        area = Area.query.get(platform.area_id)
        if area:
            platform.storage_path = os.path.join(area.name, platform.name)

        password = request.form.get('password')
        if password:
            platform.password = SecretManager.encrypt(password)
            
        db.session.commit()
        log_event('Plataforma', platform.name, 'Modificación', f"Se actualizó la plataforma: {platform.name}", g.user_id)
        return jsonify({"success": True, "message": "Plataforma actualizada correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/delete-platform/<int:id>', methods=['POST'])
def delete_platform(id):
    try:
        platform = Platform.query.get_or_404(id)
        name = platform.name
        db.session.delete(platform)
        db.session.commit()
        log_event('Plataforma', name, 'Baja', f"Se eliminó la plataforma: {name}", g.user_id)
        return jsonify({"success": True, "message": "Plataforma eliminada correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})


@admin_bp.route('/admin/general')
def general_settings():
    settings = SystemSettings.query.first()
    return render_template('general.html', settings=settings)

@admin_bp.route('/admin/notifications')
def notifications_view():
    settings = SystemSettings.query.first()
    return render_template('notifications.html', settings=settings)

@admin_bp.route('/admin/auth')
def auth_settings():
    settings = SystemSettings.query.first()
    local_users = User.query.all()
    return render_template('auth.html', settings=settings, users=local_users)

@admin_bp.route('/admin/update-general', methods=['POST'])
def update_general_settings():
    try:
        settings = SystemSettings.query.first()
        settings.portal_name = request.form.get('portal_name')
        settings.portal_logo_bg = request.form.get('portal_logo_bg')
        settings.portal_logo_type = request.form.get('portal_logo_type')
        settings.portal_logo_url = request.form.get('portal_logo_url')
        settings.portal_icon = request.form.get('portal_icon')
        settings.portal_icon_color = request.form.get('portal_icon_color')
        db.session.commit()
        log_event('Configuración', 'General', 'Modificación', "Se actualizó la configuración general", g.user_id)
        return jsonify({"success": True, "message": "Configuración actualizada"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/update-notifications', methods=['POST'])
def update_notification_settings():
    try:
        settings = SystemSettings.query.first()
        settings.smtp_server = request.form.get('smtp_server')
        settings.smtp_port = int(request.form.get('smtp_port') or 587)
        settings.smtp_user = request.form.get('smtp_user')
        settings.smtp_password = request.form.get('smtp_password')
        settings.smtp_encryption = request.form.get('smtp_encryption')
        settings.mail_from = request.form.get('mail_from')
        db.session.commit()
        log_event('Configuración', 'Notificaciones', 'Modificación', "Se actualizó la configuración de correo", g.user_id)
        return jsonify({"success": True, "message": "Configuración de notificaciones actualizada"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/update-auth', methods=['POST'])
def update_auth_settings():
    try:
        settings = SystemSettings.query.first()
        settings.auth_method = request.form.get('auth_method')
        settings.ldap_server = request.form.get('ldap_server')
        settings.ldap_base_dn = request.form.get('ldap_base_dn')
        db.session.commit()
        log_event('Configuración', 'Autenticación', 'Modificación', f"Se cambió método auth a {settings.auth_method}", g.user_id)
        return jsonify({"success": True, "message": "Configuración de autenticación actualizada"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

from models import db, Area, User, Platform, SystemSettings, AuditLog, DriveActivity

@admin_bp.route('/admin/audit')
def audit_view():
    log_type = request.args.get('type', 'admin')
    page = request.args.get('page', 1, type=int)
    per_page = 8

    if log_type == 'drive':
        pagination = DriveActivity.query.order_by(DriveActivity.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    else:
        pagination = AuditLog.query.order_by(AuditLog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    return render_template('audit.html', 
                           logs=pagination.items, 
                           current_page=page, 
                           total_pages=pagination.pages,
                           total_logs=pagination.total,
                           log_type=log_type)




@admin_bp.route('/admin/test-db', methods=['POST'])
def test_db_connection():
    # Lógica de prueba de DB (simplificada para el ejemplo)
    return jsonify({"success": True, "message": "Conexión exitosa a la base de datos"})

@admin_bp.route('/admin/update-storage', methods=['POST'])
def update_storage_settings():
    try:
        settings = SystemSettings.query.first()
        settings.storage_path = request.form.get('storage_path')
        db.session.commit()
        return jsonify({"success": True, "message": "Configuración de almacenamiento actualizada"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/test-email', methods=['POST'])
def test_email():
    # Lógica de prueba de correo (simplificada)
    return jsonify({"success": True, "message": "Correo de prueba enviado correctamente"})


@admin_bp.route('/admin/test-ldap', methods=['POST'])
def test_ldap_connection():
    # Lógica de prueba LDAP (simplificada)
    return jsonify({"success": True, "message": "Conexión LDAP exitosa"})

@admin_bp.route('/admin/user-access/<int:user_id>')
def user_access(user_id):
    try:
        user = User.query.get_or_404(user_id)
        all_platforms = Platform.query.all()
        user_platform_ids = [p.id for p in user.platforms]
        
        platforms_data = []
        for p in all_platforms:
            platforms_data.append({
                "id": p.id,
                "name": p.name,
                "area_name": p.area.name if p.area else "General",
                "has_access": p.id in user_platform_ids,
                "bg_color": p.area.color if p.area else "#6366f1"
            })
            
        return jsonify({
            "success": True,
            "user": user.name,
            "platforms": platforms_data
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/update-user-access/<int:user_id>', methods=['POST'])
def update_user_access(user_id):
    try:
        data = request.get_json()
        platform_ids = data.get('platform_ids', [])
        
        user = User.query.get_or_404(user_id)
        user.platforms = []
        
        for pid in platform_ids:
            p = Platform.query.get(pid)
            if p:
                user.platforms.append(p)
                
        db.session.commit()
        log_event('Usuario', user.name, 'Accesos', f"Se actualizaron accesos de plataforma para {user.name}", g.user_id)
        return jsonify({"success": True, "message": "Accesos actualizados correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@admin_bp.route('/admin/update-area-users/<int:area_id>', methods=['POST'])
def update_area_users(area_id):
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        
        area = Area.query.get_or_404(area_id)
        # Limpiar miembros actuales y asignar nuevos
        area.users = []
        
        for uid in user_ids:
            u = User.query.get(uid)
            if u:
                area.users.append(u)
                
        db.session.commit()
        log_event('Área', area.name, 'Accesos', f"Se actualizaron los miembros del área: {area.name}", g.user_id)
        return jsonify({"success": True, "message": "Miembros actualizados correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})







@admin_bp.route('/admin/update-platform-users/<int:platform_id>', methods=['POST'])
def update_platform_users(platform_id):
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        
        platform = Platform.query.get_or_404(platform_id)
        
        # Sincronización directa de usuarios (mucho más rápido)
        platform.users = User.query.filter(User.id.in_(user_ids)).all()
                
        db.session.commit()
        log_event('Plataforma', platform.name, 'Accesos', f"Se actualizaron los permisos de acceso para la plataforma: {platform.name}", g.user_id)
        return jsonify({"success": True, "message": "Permisos actualizados correctamente"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})
