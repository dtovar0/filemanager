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
