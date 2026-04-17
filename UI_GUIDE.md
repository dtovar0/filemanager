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
- **Top Bar Height:** Estándar de `64px` (Variable: `--topbar-height`).
- **Gaps Estándar:** 
  - Gaps entre bloques mayores: `32px`.
  - Gaps entre tarjetas (Grid): `1.5rem (24px)` para simetría total.
- **Dashboard Layout (`#view-inicio`):**
  - `#view-inicio` es `flex column` con `gap: 24px`.
  - **Primera fila:** `.stats-grid` (KPIs, full-width, `grid 4 columnas`).
  - **Segunda fila:** `.dashboard-layout` (flex 72/28).
    - `.dashboard-layout__primary` (72%): `.charts-row` (flex column).
    - `.dashboard-layout__secondary` (28%): `.activity-monitor-panel`.
  - Ambas columnas usan `align-items: stretch` para simetría perfecta.
- **Explorer Master Layout (Fluid/Fixed):**
  - **Main Area (1fr):** Dinámico y fluido para aprovechar el 100% del ancho disponible (No `max-width`).
  - **Sidebar (340px):** Panel lateral fijo de alta densidad para ficha técnica.
  - **Gap:** `1.5rem (24px)` entre columnas.
  - **Container:** `.catalog-container` debe ser fluido con `padding: 0 1.75rem` para alineación simétrica.
- **Sidebar Internal Layout (Vertical 20/80):**
  - **Top Panel (20%):** Search bar y botones de acción (Subir/Nueva).
  - **Bottom Panel (80%):** Vista previa detallada y metadatos del archivo.
- **Jerarquía Semántica Obligatoria:** Todas las vistas operativas (`#view-inicio`, `#view-archivos`, etc.) DEBEN estar anidadas dentro del contenedor maestro `#catalog-root`. NUNCA cerrar el root antes de declarar todas las vistas.
- **Contenedores:** Siempre `h-full` o `min-h-screen` para asegurar simetría.

## 🧱 Component Library

### 📍 breadcrumb--dynamic (Premium Breadcrumb Bar)
Barra de navegación contextual con ubicación actual y segmentos clickeables.
- **Estructura HTML:**
  ```html
  <div id="catalog-breadcrumb" class="breadcrumb--dynamic">
      <i class="fas fa-map-marker-alt breadcrumb-location-icon"></i>
      <span class="path-segment">Área</span>
      <div class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></div>
      <span class="path-segment">Plataforma</span>
  </div>
  ```
- **Estilos:**
  - Fondo: `var(--bg-card)`.
  - Borde: `1px solid var(--border-color)`, radio `16px`.
  - Min-height: `40px`, padding: `0.5rem 1.25rem`.
  - Hover: `border-color: var(--primary-color)`, shadow indigo `0.1`.
- **Path Segments:**
  - Tipografía: `Outfit 600`, `0.82rem`, `var(--text-muted)`.
  - Hover: Fondo pill `rgba(indigo, 0.08)`, color indigo.
  - `:last-of-type`: Bold 700, fondo tintado (ubicación activa).
- **Location Icon:** `fa-map-marker-alt`, color `var(--primary-color)`, `0.8rem`.

### 📊 stats-grid (KPI Grid)
Contenedor grid para las 4 tarjetas KPI del dashboard.
- **Clase CSS:** `.stats-grid`
- **Estilos:** `display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px`.
- **Posición:** Full-width, arriba del split 72/28.

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
- **Estilos:**
  - Fondo: `var(--bg-card)`, radio `24px`, padding `1.5rem 1.25rem`.
  - Min-height: `105px`.
  - Hover: `border-color: var(--primary-color)`.
  - Transition: `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Icon Box (`.card-icon-dash`):** `64×60px`, radio `18px`, font `1.3rem`.
- **Text Column (`.kpi-text-col`):** Flex column centrado.
- **Paleta de Colores KPI:**
  - `icon-bg-emerald`: `#10b981` (Áreas / Éxito)
  - `icon-bg-indigo`: `#6366f1` (Plataformas / Sistema)
  - `icon-bg-amber`: `#f59e0b` (Descargas / Pendientes)
  - `icon-bg-blue`: `#0ea5e9` (Subidas / Información)

### 📈 stat-card-premium (Chart Panels)
Tarjeta de alta densidad para analíticas y gráficas.
- **Estructura HTML:**
  ```html
  <div class="stat-card-premium">
      <div class="monitor-header-status">
          <div class="d-flex items-center gap-075">
              <i class="fas [fa-icon]" style="color: [accent-color];"></i>
              <h2 class="stat-card-title-nexus">Título del Panel</h2>
          </div>
      </div>
      <div class="chart-stage-container">
          <canvas id="[chartId]"></canvas>
      </div>
  </div>
  ```
- **Estilos:**
  - Fondo: `var(--bg-card)`, radio `20px`, padding `1.25rem 1.5rem`.
  - `flex: 1; min-height: 0; display: flex; flex-direction: column`.
  - Hover: `border-color: var(--primary-color)`.
- **Chart Container (`.chart-stage-container`):** `flex: 1; min-height: 120px`.
- **Iconos por gráfica:**
  - Descargas: `fa-chart-line` / `#10b981` (emerald).
  - Subidas: `fa-cloud-upload-alt` / `var(--primary-color)` (indigo).

### 🔲 monitor-header-status (Panel Header System)
Header unificado para todos los paneles del dashboard. Garantiza simetría visual entre gráficas, monitor de sistema y cualquier panel futuro.
- **Estructura HTML:**
  ```html
  <div class="monitor-header-status">
      <div class="d-flex items-center gap-075">
          <i class="fas [fa-icon]" style="color: [accent-color];"></i>
          <h2 class="stat-card-title-nexus">Título</h2>
      </div>
      <!-- Opcional: indicador de estado -->
      <span class="monitor-status-pulse"></span>
  </div>
  ```
- **Estilos:**
  - Layout: `display: flex; align-items: center; justify-content: space-between`.
  - Separador: `border-bottom: 1px solid var(--border-color)`.
  - Espaciado: `padding-bottom: 16px; margin-bottom: 20px`.
- **Título (`.stat-card-title-nexus`):**
  - Tipografía: `Outfit`, peso `700`, tamaño `1rem`.
  - Color: `var(--text-primary)`.
- **Acciones:** Los botones o iconos de acción (flechas `->`) deben estar anclados a la derecha.

### 🛰️ activity-monitor-panel (System Monitor)
Panel lateral del dashboard para visualización de logs en tiempo real.
- **Estructura HTML:**
  ```html
  <div class="activity-monitor-panel">
      <div class="monitor-header-status">
          <div class="d-flex items-center gap-075">
              <i class="fas fa-satellite-dish" style="color: var(--primary-color);"></i>
              <h2 class="stat-card-title-nexus">Monitor de Sistema</h2>
          </div>
          <span class="monitor-status-pulse"></span>
      </div>
      <div id="activity-log-monitor" class="log-list-dynamic">
          <!-- Inyección dinámica vía drive.js -->
      </div>
  </div>
  ```
- **Estilos:**
  - Fondo: `var(--bg-card)`, radio `20px`, padding `20px`.
  - `flex: 1` (llena la columna secundaria).
- **Log List (`.log-list-dynamic`):** `flex: 1; overflow-y: auto; max-height: 580px`.

### 🛰️ Crystal Timeline (Timeline Items)
Sistema de logs cronológicos premium con conectores verticales y micro-animaciones.
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
- **Item (`.premium-timeline-item`):**
  - Padding: `0.85rem 1rem`, radio `14px`.
  - Hover: `background: rgba(indigo, 0.03)`, `translateX(4px)`.
  - Conector vertical: `::after` gradient line entre nodos.
- **Node (`.timeline-node`):** `40×40px`, radio `12px`, hover `scale(1.08)`.
- **Content (`.timeline-content`):** Flex column, `gap: 2px`, `min-width: 0`.
- **User (`.timeline-user`):** `Outfit 700`, `0.85rem`, `text-primary`, ellipsis.
- **Time (`.timeline-time`):** `Outfit 600`, `0.7rem`, `text-muted`, `opacity: 0.7`.
- **Body (`.timeline-body`):** `0.78rem`, `text-muted`, ellipsis.
- **Glow States:**
  - `node-glow--indigo`: `#6366f1` — Operaciones Normales (shadow `0 4px 12px`)
  - `node-glow--emerald`: `#10b981` — Éxito / Descarga
  - `node-glow--rose`: `#e11d48` — Peligro / Eliminación
  - `node-glow--amber`: `#f59e0b` — Advertencia / Carpeta

### 🔘 Nexus Button Master
Sistema de botones unificado para acciones críticas y secundarias.
- **Dimensiones:** Altura fija de `48px`.
- **Estructura:** Cuerpo transparente con borde sutil, icono dentro de caja sólida (`btn-icon-box` de 32px).
- **Tipografía:** `Outfit`, peso 700, tamaño `0.8rem`.
- **Comportamiento:**
  - Hover: Elevación -2px, cambio de fondo a gradiente suave.
  - Active: `scale(0.97)`.

### 🌌 Premium Empty State — The Indigo Void (Explorer)
Componente de alta densidad para directorios sin contenido.
- **Clase CSS:** `.premium-empty-state-nexus-v2`.
- **Estructura HTML:**
  ```html
  <div class="premium-empty-state-nexus-v2">
      <div class="empty-state-visual-nexus">
          <div class="empty-state-blob-nexus"></div>
          <div class="empty-state-icon-wrapper-nexus">
              <i class="fas fa-folder-open"></i>
          </div>
      </div>
      <h2 class="empty-state-title-nexus">Ubicación Vacía</h2>
      <p class="empty-state-text-nexus">Descripción...</p>
  </div>
  ```
- **Visual:** Blob radial indigo animado (`indigoVoidPulse` 3s) + Icono 72×72px flotante (`floatIcon` 3s).
- **Tipografía:** Título `Outfit 900` / `1.5rem`, Texto `0.95rem` / line-height `1.6` / max-width `380px`.

### 🔬 Luxury Scan Empty State (Sidebar Detail)
Estado vacío del panel lateral de ficha técnica.
- **Clase CSS:** `.empty-state-luxury`.
- **Estructura HTML:**
  ```html
  <div class="empty-state-luxury">
      <div class="empty-state-luxury__icon-box">
          <i class="fas fa-fingerprint"></i>
      </div>
      <h3 class="empty-state-luxury__title">Nexus Intelligence</h3>
      <p class="empty-state-luxury__text">Selecciona un activo...</p>
      <span class="empty-state-luxury__badge">Esperando Selección...</span>
  </div>
  ```
- **Icon Box:** `80×80px`, radio `24px`, fondo `rgba(indigo, 0.1)`, laser scan `::before` animación.
- **Estilos:** `flex: 1; justify-content: center` (centrado vertical en el panel).
- **Título:** `Outfit` / `1.25rem` / peso `900`.
- **Badge:** Uppercase, `0.7rem`, peso `800`, borde indigo sutil.

### 🧪 Nexus Preview System (Sidebar Assets)
Componentes para la visualización de activos seleccionados en la columna de detalles.
- **.preview-nexus-frame:**
  - Dimensiones: `100% x 140px`.
  - Border-radius: `20px`.
  - Dark Mode BG: `#0f172a !important`.
  - Elementos: `img` o `icon` centrados matemáticamente.
- **.nexus-detail-filename:**
  - Carácter: Único y segregado (Evita herencia de grid).
  - Posicionamiento: `relative !important` (Nunca absoluto).
  - Tipografía: `Outfit 700`, `1.05rem`, centrado, alineación vertical debajo del frame.
- **.datasheet-nexus-grid:**
  - Rejilla técnica de metadatos.
  - Dark Mode BG: `#0f172a` (Sincronizado con el Frame).

## 📑 Business Rules (UI Compliance)
1. **No Inline Styles:** Solo se permiten en casos excepcionales de inyección dinámica por JS (colores de iconos contextuales). El resto debe estar en `drive.css` o `style.css`.
2. **Interactive States:** Target mínimo de `48px` para táctil. Efecto click: `transform: scale(0.96)`.
3. **Glassmorphism:** Uso moderado de `backdrop-filter: blur(12px)` para paneles luxury.
4. **Panel Consistency:** Todo panel del dashboard DEBE usar `.monitor-header-status` como header con icono + título + separador y dispersión horizontal.
5. **Fluidity Rule:** Queda prohibido el uso de `max-width` fijos en contenedores de vista operativa. La aplicación es fluida por defecto.
6. **No `!important`:** Evitar `!important` en nuevas reglas. Resolver especificidad con selectores más específicos.

---
*Last Updated: 2026-04-16*

## 🔔 Sistema de Notificaciones
- **Componente:** SweetAlert2 Toasts.
- **Ubicación:** `bottom-end` (Inferior Derecha).
- **Regla Anti-Encimamiento:** Las notificaciones disparadas desde un modal activo DEBEN ser Toasts para evitar la sobrecarga visual de múltiples capas modales.
- **Estilo Sincronizado:** 
  - Dark Mode: Background `#1e293b`, Color `#f8fafc`.
  - Light Mode: Background `#ffffff`, Color `#1e293b`.
- **Transiciones:** Fade-in desde la derecha con barra de progreso esmeralda.
