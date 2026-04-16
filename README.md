# 📂 FileManager Portal - Ultimate Administrative Suite

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![CSS3](https://img.shields.io/badge/CSS3-BEM-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 🚀 Propósito del Proyecto
FileManager es una plataforma de gestión de storage empresarial orientada a la seguridad, la trazabilidad y la experiencia de usuario premium. Permite centralizar accesos a múltiples "Plataformas" segregadas por "Áreas" con una interfaz de alta densidad funcional.

---

## 🏗️ Arquitectura del Sistema

### 1. El Core (Flask Backend)
- **Patrón Factory:** Inicialización robusta en `factory.py`.
- **Modularidad:** Uso de Blueprints (`admin`, `api`, `main`) para separación de responsabilidades.
- **Modelado:** SQLAlchemy con relaciones complejas para trazabilidad (Audit Logs).
- **Seguridad:** Protección CSRF, JWT para autenticación y Talisman para headers de seguridad.

### 2. Diseño & UI (The Design System)
- **Grilla 8pt:** Espaciado consistente basado en múltiplos de 8px.
- **Tokens Semánticos:** Sistema de colores centralizado con soporte nativo para **Dark Mode**.
- **Tipografía Moderna:** Uso de *Outfit* para títulos y *Inter* para lecturabilidad en datos.
- **Micro-interacciones:** Animaciones Bezier y feedback táctil para experiencias móviles.

### 3. Módulos Principales
- **Drive:** Explorador de archivos dinámico con filtros y estados de encriptación.
- **Admin Center:** Gestión de Usuarios, Áreas, Plataformas y Configuración Global.
- **Auditoría:** Registro exhaustivo de cada acción realizada en el sistema.

---

## 🛠️ Stack Tecnológico
- **Backend:** Python (Flask), SQLAlchemy, JWT, Flask-WTF.
- **Frontend:** HTML5 Semántico, Vanilla CSS (BEM Architecture), Modern JS (ES6+).
- **Base de Datos:** SQLite (Dev) / MySQL (Prod support via SQLAlchemy).
- **Ecosistema:** Jinja2 Templates con inyección global de estado.

---

## 🔧 Instalación y Despliegue

### Requisitos Previos
- Python 3.8 o superior.
- Pip (Gestor de paquetes).

### Pasos de Instalación
1. **Clonar y Preparar:**
   ```bash
   git clone <repo-url>
   cd filemanager
   python -m venv venv
   source venv/bin/activate
   ```

2. **Instalar Dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configuración de Variables:**
   Renombra `.env.example` a `.env` y configura tu `SECRET_KEY`.

4. **Inicialización y Ejecución:**
   ```bash
   python app.py
   ```
   *El sistema creará automáticamente las tablas y la estructura necesaria en el primer arranque.*

---

## 📈 Propuesta de Mejora (Roadmap v2.0)

1. **Anti-Flicker con Hotwire Turbo:** Implementar `turbo-frames` en el Drive para navegación instantánea sin refresco de página.
2. **WebSockets (Flask-SocketIO):** Notificaciones push inmediatas cuando un administrador aprueba una solicitud.
3. **Optimización Mobile-First:** Refinar el `Safe Area` para dispositivos con notch y optimizar el `Viewport Lock` para el Android Wrapper.
4. **Sistema de Migraciones:** Migrar de `db.create_all()` a Flask-Migrate (Alembic) para mayor control de esquema.

---

## 📝 Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
