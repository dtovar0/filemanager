from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Association table for User <-> Area
user_areas = db.Table('user_areas',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('area_id', db.Integer, db.ForeignKey('area.id'), primary_key=True)
)

# Association table for User <-> Platform
user_platforms = db.Table('user_platforms',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('platform_id', db.Integer, db.ForeignKey('platform.id'), primary_key=True)
)

class Area(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='Activo')
    icon = db.Column(db.String(50), default='box')
    color = db.Column(db.String(100), default='linear-gradient(135deg, #6366f1, #818cf8)')

    def to_dict(self):
        # Unique users: those directly assigned to this area or those with platform access in this area
        user_ids = {u.id for u in self.users}
        for p in self.platforms:
            for u in p.users:
                user_ids.add(u.id)
        
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'icon': self.icon,
            'color': self.color,
            'platforms_count': len(self.platforms),
            'users_count': len(user_ids),
            'user_ids': list(user_ids)
        }

class Platform(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    area_id = db.Column(db.Integer, db.ForeignKey('area.id'), nullable=False)
    area = db.relationship('Area', backref=db.backref('platforms', lazy=True))
    storage_path = db.Column(db.String(255))
    owner = db.Column(db.String(100))
    icon = db.Column(db.String(50), default='box')
    status = db.Column(db.String(20), default='Activo')
    can_download = db.Column(db.Boolean, default=False)
    can_upload = db.Column(db.Boolean, default=False)
    is_encrypted = db.Column(db.Boolean, default=False)
    password = db.Column(db.String(255)) # Encrypted platform password
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'area_id': self.area_id,
            'storage_path': self.storage_path,
            'owner': self.owner,
            'icon': self.icon,
            'status': self.status,
            'can_download': self.can_download,
            'can_upload': self.can_upload,
            'is_encrypted': self.is_encrypted,
            'has_password': True if self.password else False
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(50))
    status = db.Column(db.String(20), default='Activo')
    password_hash = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Many-to-many relationships with reverse access from Area.users
    areas = db.relationship('Area', secondary=user_areas, backref='users')
    platforms = db.relationship('Platform', secondary=user_platforms, backref='users')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'status': self.status,
            'areas': [{'id': a.id, 'name': a.name, 'icon': a.icon or 'box', 'color': a.color} for a in self.areas],
            'platforms_count': len(self.platforms)
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    id = db.Column(db.Integer, primary_key=True)
    target_type = db.Column(db.String(50))
    target_name = db.Column(db.String(100))
    action = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    user_name = db.Column(db.String(100))
    user_email = db.Column(db.String(100))
    description = db.Column(db.Text)
    payload = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))

class DriveActivity(db.Model):
    __tablename__ = 'drive_activity'
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255))
    file_path = db.Column(db.String(512))
    action = db.Column(db.String(50)) # Alta, Baja, Descarga, Carpeta
    file_size = db.Column(db.BigInteger, default=0)
    area_id = db.Column(db.Integer, db.ForeignKey('area.id'), nullable=True)
    platform_id = db.Column(db.Integer, db.ForeignKey('platform.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    user = db.relationship('User', backref=db.backref('drive_activities', lazy=True))


class SystemSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True, default=1)
    portal_name = db.Column(db.String(100), default='FileManager')
    portal_logo_url = db.Column(db.String(255))
    portal_logo_type = db.Column(db.String(10), default='image')
    portal_icon = db.Column(db.String(50), default='fa-box')
    db_type = db.Column(db.String(20), default='mysql')
    db_host = db.Column(db.String(100), default='localhost')
    db_port = db.Column(db.String(10), default='3306')
    db_user = db.Column(db.String(100))
    db_password = db.Column(db.String(100))
    db_name = db.Column(db.String(100), default='filemanager_access')
    db_ssl = db.Column(db.Boolean, default=False)
    portal_logo_bg = db.Column(db.String(20), default='#6366f1')
    portal_icon_color = db.Column(db.String(20), default='#ffffff')
    
    smtp_host = db.Column(db.String(100))
    smtp_port = db.Column(db.String(10), default='587')
    smtp_user = db.Column(db.String(100))
    smtp_password = db.Column(db.String(100))
    smtp_encryption = db.Column(db.String(10), default='TLS')
    smtp_auth = db.Column(db.Boolean, default=True)
    smtp_from_name = db.Column(db.String(100), default='Nexus Access')
    smtp_from_email = db.Column(db.String(100))
    
    email_subject = db.Column(db.String(200), default='Nueva Solicitud de Acceso - Portal Nexus')
    email_body = db.Column(db.Text)
    
    ldap_enabled = db.Column(db.Boolean, default=False)
    ldap_server = db.Column(db.String(100))
    ldap_port = db.Column(db.String(10), default='389')
    ldap_base_dn = db.Column(db.String(200))
    ldap_user_dn = db.Column(db.String(200))
    ldap_password = db.Column(db.String(100))
    ldap_use_ssl = db.Column(db.Boolean, default=False)
    ldap_user_attribute = db.Column(db.String(50), default='uid')
    
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'portal_name': self.portal_name,
            'portal_logo_url': self.portal_logo_url,
            'portal_logo_type': self.portal_logo_type,
            'portal_icon': self.portal_icon,
            'db_type': self.db_type,
            'db_host': self.db_host,
            'db_port': self.db_port,
            'db_user': self.db_user,
            'db_name': self.db_name,
            'smtp_host': self.smtp_host,
            'smtp_port': self.smtp_port,
            'smtp_user': self.smtp_user,
            'smtp_encryption': self.smtp_encryption,
            'email_subject': self.email_subject,
            'email_body': self.email_body,
            'ldap_enabled': self.ldap_enabled,
            'ldap_server': self.ldap_server,
            'ldap_port': self.ldap_port,
            'ldap_base_dn': self.ldap_base_dn,
            'ldap_user_dn': self.ldap_user_dn
        }

class StorageStat(db.Model):
    __tablename__ = 'storage_stats'
    id = db.Column(db.Integer, primary_key=True)
    platform_id = db.Column(db.Integer, db.ForeignKey('platform.id'), nullable=False)
    size_bytes = db.Column(db.BigInteger, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    platform = db.relationship('Platform', backref=db.backref('storage_stats', lazy=True, cascade="all, delete-orphan"))
