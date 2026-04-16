# 📚 Reglas de Negocio - Nexus Drive

## Módulo: Explorador de Archivos (Drive)

### Regla: Validación de Acceso Cifrado
El sistema debe verificar si una ubicación tiene la propiedad `protected: true` antes de permitir listados o previsualizaciones. 

### Caso Práctico:
Si un usuario intenta entrar a una carpeta cifrada sin una sesión de clave activa, el motor `drive.js` debe interceptar la petición y lanzar un desafío de contraseña (Swal).

### Impacto:
Garantiza la confidencialidad de los datos sensibles en entornos multi-plataforma.

---

## Módulo: Monitor de Actividad (Auditoría)

### Regla: Sincronización de Logs
Toda acción de escritura (Upload, Delete, New Folder) debe ser registrada en la base de datos y reflejada en el Monitor de Sistema en tiempo real.

### Ejemplo:
Al subir un archivo, se debe ejecutar un trigger que inyecte el evento en el contenedor `#activity-log-monitor`.

### Impacto:
Trazabilidad total para el administrador sobre las operaciones de los usuarios.

---

## Módulo: Interfaz UX (Sistema 8pt)

### Regla: Prohibición de Estilos Inline
Ningún componente de la interfaz debe contener el atributo `style=""`. Todo el layout debe ser controlado mediante clases BEM o variables CSS.

### Impacto:
Mantenibilidad del diseño y capacidad de respuesta coherente (Responsive Design).

---

## Módulo: Gestión de Permisos (RBAC)

### Regla: Control de Acciones en UI
La visibilidad de los controles críticos (Botones de descarga, eliminación y carga) debe estar vinculada directamente a los booleanos `can_download` y `can_upload` de la plataforma activa.

### Caso Práctico:
Si una plataforma tiene `can_download: false`, el botón `#btn-download-main` en el panel de detalles debe ser removido del DOM o pasar a estado oculto (`d-none`).

### Impacto:
Evita el acceso no autorizado a funciones de manipulación de archivos.

---

## Módulo: Sistema de Vistas Previas

### Regla: Renderizado de Miniaturas
El panel de detalles debe diferenciar entre archivos multimedia y documentos estáticos.
1. **Multimedia (Imágenes):** Se inyectará un elemento `<img>` con la URL base64 o ruta temporal.
2. **Documentos:** Se mostrará el icono de FontAwesome asignado en el mapeo de `FileIcons`.

### Regla: Legibilidad de Metadatos
Todo valor de tamaño de archivo (bytes) debe ser formateado mediante una función de conversión antes de ser inyectado en el span `#detail-size`.

### Impacto:
Mejora la experiencia de usuario (UX) al proporcionar contexto visual inmediato sobre el archivo seleccionado.
