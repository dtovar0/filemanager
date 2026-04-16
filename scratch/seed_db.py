from app import app
from models import db, Area, Platform, User
from werkzeug.security import generate_password_hash
import os

with app.app_context():
    print("Iniciando restauración de datos maestros...")
    
    # 1. Crear Áreas si no existen
    areas_data = [
        ("TI / Infra", "Infraestructura y servicios cloud", "fa-network-wired", "#6366f1"),
        ("General", "Herramientas de uso común", "fa-globe", "#10b981"),
        ("Diseño", "Software creativo y UI/UX", "fa-palette", "#f59e0b"),
        ("Comercial", "Gestión de ventas y CRM", "fa-handshake", "#3b82f6"),
        ("Marketing", "Publicidad y analítica", "fa-bullhorn", "#ec4899")
    ]
    
    areas_objs = {}
    for name, desc, icon, color in areas_data:
        area = Area.query.filter_by(name=name).first()
        if not area:
            area = Area(name=name, description=desc, icon=icon, color=color)
            db.session.add(area)
            db.session.flush() # Para obtener el ID
        areas_objs[name] = area

    # 2. Crear Plataformas (Datos del catálogo)
    platforms_data = [
        ("AWS Console", "Infraestructura cloud", "TI / Infra", "fa-aws"),
        ("Notion", "Wiki y documentación", "General", "fa-book"),
        ("Slack", "Comunicación oficial", "General", "fa-slack"),
        ("Figma", "Herramienta de diseño", "Diseño", "fa-figma"),
        ("Jira Software", "Gestión de tareas", "TI / Infra", "fa-jira"),
        ("Salesforce", "CRM de ventas", "Comercial", "fa-salesforce"),
        ("Adobe CC", "Paquete multimedia", "Diseño", "fa-adobe"),
        ("HubSpot", "Marketing automation", "Marketing", "fa-hubspot")
    ]
    
    for name, desc, area_name, icon in platforms_data:
        if not Platform.query.filter_by(name=name).first():
            area = areas_objs.get(area_name)
            if area:
                # Usamos la lógica de automatización que creamos antes
                p = Platform(
                    name=name,
                    description=desc,
                    area_id=area.id,
                    icon=icon,
                    owner="Sistema",
                    storage_path=f"{area.name}/{name}"
                )
                db.session.add(p)

    db.session.commit()
    print("¡Restauración completada con éxito!")
