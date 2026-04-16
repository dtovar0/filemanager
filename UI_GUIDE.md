# 🎨 NEXUS DESIGN SYSTEM & UI GUIDE

## 🏷️ Brand Tokens (El Gato Gourmet Mty & Nexus)
| Token | Valor | Uso |
|---|---|---|
| Primary (Gourmet) | `#FF5733` | Brand Accents (Naranja) |
| Secondary (Gourmet) | `#2C3E50` | Primary Text / Dark (Azul Profundo) |
| Accent (Nexus) | `#6366f1` | Interactive Elements (Indigo) |
| Success | `#10b981` | Status Approved (Esmeralda) |
| Warning | `#f59e0b` | Status Pending (Ambar) |

## 📐 Layout System (8pt Grid)
- **Base Grid:** Todos los espaciados, paddings y márgenes son múltiplos de `8px`.
- **Gaps Estándar:** 
  - Gaps entre bloques mayores: `32px`.
  - Gaps entre tarjetas (Grid): `20px` o `24px`.
- **Dashboard Layout:** Master layout 72% (Primary) / 28% (Secondary).
- **Explorer Master Layout (80/20):**
  - **Primary Column (80%):** Área principal de navegación de archivos.
  - **Sidebar Column (20% / ~300px):** Panel lateral fijo para gestión.
- **Sidebar Internal Layout (Vertical 20/80):**
  - **Top Panel (20%):** Search bar y botones de acción (Subir/Nueva).
  - **Bottom Panel (80%):** Vista previa detallada y metadatos del archivo.
- **Jerarquía Semántica Obligatoria:** Todas las vistas operativas (`#view-inicio`, `#view-archivos`, etc.) DEBEN estar anidadas dentro del contenedor maestro `#catalog-root`. NUNCA cerrar el root antes de declarar todas las vistas.
- **Contenedores:** Siempre `h-full` o `min-h-screen` para asegurar simetría.

## 🧱 Component Library

### 💳 status-card-dash (KPI Cards)
Micro-tarjetas para métricas críticas de alta densidad.
- **Estructura HTML:**
  ```html
  <div class="status-card-dash">
      <div class="card-icon-dash [icon-bg-class]">
          <i class="fas [fa-icon]"></i>
      </div>
      <div class="kpi-text-col">
          <div class="kpi-value-new">Label</div>
          <div class="kpi-label-new">Value</div>
      </div>
  </div>
  ```
- **Paleta de Colores KPI (Parity Original):**
  - `icon-bg-emerald`: `#10b981` (Áreas / Éxito)
  - `icon-bg-indigo`: `#6366f1` (Plataformas / Sistema)
  - `icon-bg-amber`: `#f59e0b` (Descargas / Pendientes)
  - `icon-bg-blue`: `#0ea5e9` (Subidas / Información)

### 📈 stat-card-premium
Tarjeta de alta densidad para analíticas y gráficas.
- **Altura:** `310px`.
- **Borde:** `1px solid var(--border-color)`.
- **Radio:** `20px`.
- **Efecto:** Sin animaciones intrusivas, elevación táctil ligera.

### 🛰️ Crystal Timeline (System Monitor)
Sistema de logs cronológicos con indicadores de estado brillantes.
- **Estructura HTML:**
  ```html
  <div class="premium-timeline-item">
      <div class="timeline-node [node-glow-class]">
          <i class="fas [icon]"></i>
      </div>
      <div class="timeline-content">
          <div class="timeline-header">
              <span class="timeline-user">Nombre</span>
              <span class="timeline-time">HH:MM</span>
          </div>
          <div class="timeline-body">Acción: Objeto</div>
      </div>
  </div>
  ```
- **Glow States:**
  - `node-glow--indigo`: #6366f1 (Operaciones Normales)
  - `node-glow--emerald`: #10b981 (Éxito / Descarga)
  - `node-glow--rose`: #e11d48 (Peligro / Eliminación)
  - `node-glow--amber`: #f59e0b (Advertencia / Carpeta)

### 🔘 Nexus Button Master
Sistema de botones unificado para acciones críticas y secundarias.
- **Dimensiones:** Altura fija de `48px`.
- **Estructura:** Cuerpo transparente con borde sutil, icono dentro de caja sólida (`btn-icon-box` de 32px).
- **Tipografía:** `Outfit`, peso 700, tamaño `0.8rem`.
- **Comportamiento:**
  - Hover: Elevación -2px, cambio de fondo a gradiente suave.
  - Active: `scale(0.97)`.

### 🌌 Premium Empty State (The Indigo Void)
Componente de alta densidad para directorios sin contenido.
- **Visual:** Blob radial indigo animado (pulso suave) + Icono central `fa-folder-open`.
- **Tipografía:** Título `1.5rem` (Peso 900), Texto descriptivo `0.95rem` con interlineado `1.6`.
- **Clase CSS:** `.premium-empty-state-nexus-v2`.

## 📑 Business Rules (UI Compliance)
1. **No Inline Styles:** Solo se permiten en casos excepcionales de inyección dinámica por JS. El resto debe estar en `drive.css` o `style.css`.
2. **Interactive States:** Target mínimo de `48px` para táctil. Efecto click: `transform: scale(0.96)`.
3. **Glassmorphism:** Uso moderado de `backdrop-filter: blur(12px)` para paneles luxury.

---
*Last Updated: 2026-04-16*
