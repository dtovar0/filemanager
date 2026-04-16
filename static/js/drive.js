/**
 * Nexus Drive Engine - Unified & Secure (Production Version)
 */

const NexusAPI = {
    async post(url, body) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error en petición');
            return data;
        } catch (error) { throw error; }
    }
};

const FileIcons = {
    map: {
        'png': { type: 'Imagen PNG', icon: 'fa-file-image', color: '#10b981', is_img: true },
        'jpg': { type: 'Imagen JPG', icon: 'fa-file-image', color: '#10b981', is_img: true },
        'jpeg': { type: 'Imagen JPEG', icon: 'fa-file-image', color: '#10b981', is_img: true },
        'gif': { type: 'Imagen GIF', icon: 'fa-file-image', color: '#10b981', is_img: true },
        'webp': { type: 'Imagen WebP', icon: 'fa-file-image', color: '#10b981', is_img: true },
        'pdf': { type: 'Documento PDF', icon: 'fa-file-pdf', color: '#ef4444' },
        'doc': { type: 'Documento Word', icon: 'fa-file-word', color: '#3b82f6' },
        'docx': { type: 'Documento Word', icon: 'fa-file-word', color: '#3b82f6' },
        'xls': { type: 'Hoja de Cálculo', icon: 'fa-file-excel', color: '#059669' },
        'xlsx': { type: 'Hoja de Cálculo', icon: 'fa-file-excel', color: '#059669' },
        'zip': { type: 'Comprimido ZIP', icon: 'fa-file-zipper', color: '#f59e0b' },
        'rar': { type: 'Comprimido RAR', icon: 'fa-file-zipper', color: '#f59e0b' },
        'txt': { type: 'Texto Plano', icon: 'fa-file-lines', color: '#6b7280' },
        'mp4': { type: 'Video MP4', icon: 'fa-file-video', color: '#8b5cf6' },
        'mov': { type: 'Video MOV', icon: 'fa-file-video', color: '#8b5cf6' },
        'json': { type: 'Datos JSON', icon: 'fa-file-code', color: '#6366f1' }
    },
    getInfo(name, is_dir) {
        if (is_dir) return { type: 'Carpeta', icon: 'fa-folder', color: '#facc15' };
        const ext = name.split('.').pop().toLowerCase();
        return this.map[ext] || { type: 'Archivo', icon: 'fa-file-alt', color: '#6366f1' };
    }
};

class FileExplorer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.items = [];
        this.currentPath = '';
        this.allPlatforms = options.platforms || [];
        this.onPathChange = options.onPathChange;
        this.onFileSelect = options.onFileSelect;
        this.isAreaRoot = false;
    }

    async loadFiles(path = '', password = null) {
        try {
            const data = await NexusAPI.post('/api/drive/list', { path, password });
            if (data.success) {
                this.lastPassword = password; // Guardar clave exitosa para previsualizaciones
                this.items = data.items || [];
                this.currentPath = data.current_path || path;
                this.render();
                if (this.onPathChange) this.onPathChange(this.currentPath, data);
            }
        } catch (error) {
            if (error.message.includes('Contraseña') || error.message.includes('cifrada')) {
                const { value: pass } = await Swal.fire({
                    title: 'Acceso Protegido',
                    text: 'Se requiere clave para auditar esta ubicación',
                    input: 'password',
                    confirmButtonColor: '#6366f1'
                });
                if (pass) this.loadFiles(path, pass);
            } else { Swal.fire('Error', error.message, 'error'); }
        }
    }

    render() {
        if (!this.container) {
            console.error('FileExplorer: Container not found!');
            return;
        }
        this.container.innerHTML = '';
        if (this.items.length === 0) {
            this.container.innerHTML = `
                <div class="h-full w-full d-flex flex-col items-center justify-center opacity-30 p-2" style="grid-column: 1 / -1;">
                    <i class="fas fa-folder-open mb-1" style="font-size: 80px;"></i>
                    <p class="fw-700 fs-lg">Esta ubicación está vacía</p>
                </div>`;
            return;
        }

        this.items.forEach(item => {
            const info = FileIcons.getInfo(item.name, item.is_dir);
            const pathParts = this.currentPath.split('/').filter(p => p !== '');
            
            // Iconos de plataforma en raíz
            if (pathParts.length === 1 && item.is_dir) {
                const plat = this.allPlatforms.find(p => p.name === item.name || p.storage_path === item.name);
                if (plat && plat.icon) info.icon = plat.icon.startsWith('fa-') ? plat.icon : 'fa-' + plat.icon;
            }

        const card = document.createElement('div');
        card.className = 'explorer-item';
        
        // Construcción de la tarjeta vertical Luxury con diferenciación cromática reforzada
        card.innerHTML = `
            <div class="explorer-icon-wrapper" style="background: ${info.color}25; color: ${info.color}; border: 1.5px solid ${info.color}40; box-shadow: 0 8px 20px ${info.color}20;">
                <i class="fas ${info.icon}"></i>
            </div>
            <div class="explorer-item-info">
                <div class="explorer-item-name" title="${item.name}">${item.name}</div>
            </div>
        `;
        card.onclick = () => {
            this.container.querySelectorAll('.explorer-item').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            this.onFileSelect(item, info);
        };
        if (item.type === 'dir' || item.is_dir) {
            card.ondblclick = () => {
                const newPath = this.currentPath === '/' ? '/' + item.name : this.currentPath + '/' + item.name;
                this.loadFiles(newPath);
            };
        }
        this.container.appendChild(card);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const platformsData = window.NEXUS_PLATFORMS || [];
    const archivosGrid = document.getElementById('archivos-grid');
    const areaScreen = document.getElementById('area-selector-screen');
    const breadcrumb = document.getElementById('catalog-breadcrumb');

    let currentPerms = { can_download: true, can_upload: true, protected: false };

    const explorer = new FileExplorer('explorer-container', {
        platforms: platformsData,
        onPathChange: (path, data) => {
            // Limpiar buscador al cambiar de carpeta
            const searchInput = document.getElementById('file-search');
            if (searchInput) searchInput.value = '';
            
            // Resetear Panel de Detalles al cambiar de directorio
            const empty = document.getElementById('details-empty');
            const content = document.getElementById('details-content');
            if (empty) {
                empty.classList.remove('d-none');
                empty.classList.add('d-flex');
            }
            if (content) {
                content.classList.add('d-none');
                content.classList.remove('d-flex');
            }

            currentPerms = {
                can_download: data.permissions?.can_download ?? true,
                can_upload: data.permissions?.can_upload ?? true,
                protected: data.protected ?? false
            };
            const gridWrapper = document.getElementById('archivos-grid');
            if (data.context?.kind === 'area_root') {
                gridWrapper.classList.add('is-area-root-layout');
                explorer.isAreaRoot = true;
            } else {
                gridWrapper.classList.remove('is-area-root-layout');
                explorer.isAreaRoot = false;
            }
            if (!breadcrumb) return;
            breadcrumb.innerHTML = '';
            const parts = path.split('/').filter(p => p !== '');
            parts.forEach((p, i) => {
                const seg = document.createElement('span'); seg.className = 'path-segment'; seg.innerText = p;
                seg.onclick = () => explorer.loadFiles(parts.slice(0, i + 1).join('/'));
                breadcrumb.appendChild(seg);
                if (i < parts.length - 1) breadcrumb.insertAdjacentHTML('beforeend', ' <i class="fas fa-chevron-right fs-xs opacity-30 mx-05"></i> ');
            });
        },
        onFileSelect: async (item, info) => {
            const empty = document.getElementById('details-empty');
            const content = document.getElementById('details-content');
            if (empty) {
                empty.classList.add('d-none');
                empty.classList.remove('d-flex');
            }
            if (content) {
                content.classList.remove('d-none');
                content.classList.add('d-flex');
                
                // Restauración de Metadatos y Diseño Premium
                document.getElementById('detail-name').innerText = item.name;
                
                const badge = document.getElementById('detail-type-badge');
                if (badge) {
                    badge.innerText = info.type.toUpperCase();
                    // Fondo dinámico según tipo con opacidad optimizada
                    badge.style.background = info.color + '25';
                    // Texto en negro profundo para legibilidad total solicitado
                    badge.style.color = '#111827'; 
                    badge.style.border = `1.5px solid ${info.color}45`;
                }
                document.getElementById('detail-size').innerText = item.size || '--';
                document.getElementById('detail-date').innerText = item.ctime ? new Date(item.ctime * 1000).toLocaleString('es-MX', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: true 
                }) : '--';

                // 1. Elementos y Color
                const previewBox = content.querySelector('.preview-nexus-box');
                const previewIcon = document.getElementById('detail-icon-large');
                
                // Color dinámico según tipo
                previewIcon.style.color = info.color;
                previewIcon.className = 'fas ' + info.icon;
                previewIcon.style.display = 'block';
                previewIcon.classList.remove('opacity-40');
                
                // Limpieza de imágenes previas
                const oldImgs = previewBox.querySelectorAll('img');
                oldImgs.forEach(img => img.remove());

                // 2. Motor de Previsualización (Inyección Directa e Incondicional)
                if (info.is_img) {
                    const currentPathClean = explorer.currentPath.replace(/\/+$/, '');
                    const fullItemPath = `${currentPathClean}/${item.name}`;
                    
                    // Solo mandamos el parámetro si realmente tenemos una clave almacenada
                    let previewUrl = `/api/download?path=${encodeURIComponent(fullItemPath)}`;
                    if (explorer.lastPassword) {
                        previewUrl += `&password=${encodeURIComponent(explorer.lastPassword)}`;
                    }
                    
                    // Ocultamos el icono proactivamente para la imagen
                    previewIcon.style.display = 'none';

                    const img = document.createElement('img');
                    img.src = previewUrl;
                    img.className = 'animate-fade-in';
                    img.style.cssText = 'max-height: 150px; width: auto; max-width: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: block;';
                    
                    img.onerror = () => {
                        // Si la imagen real falla, restauramos el icono con una señal visual
                        img.remove();
                        previewIcon.style.display = 'block';
                        previewIcon.style.color = info.color;
                        previewIcon.classList.add('opacity-40');
                    };
                    
                    previewBox.appendChild(img);
                }
            }
        }
    });

    // Motor de Búsqueda con Delegación Global (Blindado)
    document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'file-search') {
            const query = e.target.value.toLowerCase().trim();
            const items = document.querySelectorAll('.explorer-item');
            
            items.forEach(item => {
                const nameElement = item.querySelector('.explorer-item-name');
                const name = (nameElement ? nameElement.innerText : (item.getAttribute('title') || 'unknown')).toLowerCase();
                const match = name.includes(query);
                
                if (match) {
                    item.classList.remove('d-none');
                    item.style.setProperty('display', 'flex', 'important');
                    item.style.setProperty('visibility', 'visible', 'important');
                } else {
                    item.classList.add('d-none');
                    item.style.setProperty('display', 'none', 'important');
                    item.style.setProperty('visibility', 'hidden', 'important');
                }
            });
        }
    });


    async function getPassIfProtected() {
        if (!currentPerms.protected) return null;
        const { value: pass } = await Swal.fire({
            title: 'Validación de Acceso',
            text: 'Ingrese clave para descargar/previsualizar:',
            input: 'password',
            confirmButtonColor: '#6366f1'
        });
        return pass;
    }

    // ACCIONES DE DESCARGA
    async function downloadSelected() {
        if (!currentPerms.can_download) { Swal.fire('Bloqueado', 'Descargas deshabilitadas.', 'info'); return; }
        const selected = explorer.container.querySelector('.explorer-item.selected');
        if (!selected) return;
        const name = selected.querySelector('.explorer-item-name').innerText;
        const password = await getPassIfProtected();
        if (currentPerms.protected && !password) return;
        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.content },
                body: JSON.stringify({ path: `${explorer.currentPath}/${name}`, password: password || '' })
            });
            if (!response.ok) { const err = await response.json(); throw new Error(err.error); }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
    }

    document.getElementById('btn-download-main')?.addEventListener('click', downloadSelected);
    document.getElementById('ctx-download')?.addEventListener('click', downloadSelected);

    // ACCIÓN DE ELIMINAR
    async function deleteSelected() {
        const selected = explorer.container.querySelector('.explorer-item.selected');
        if (!selected) return;
        const name = selected.querySelector('.explorer-item-name').innerText;
        const { isConfirmed } = await Swal.fire({
            title: '¿Eliminar elemento?',
            text: `Se borrará permanentemente: ${name}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (isConfirmed) {
            const password = await getPassIfProtected();
            try {
                const data = await NexusAPI.post('/api/delete', { path: `${explorer.currentPath}/${name}`, password: password || '' });
                if (data.success) {
                    Swal.fire('Eliminado', 'El archivo ha sido borrado.', 'success');
                    explorer.loadFiles(explorer.currentPath);
                }
            } catch (e) { Swal.fire('Error', e.message, 'error'); }
        }
    }

    document.getElementById('ctx-delete')?.addEventListener('click', deleteSelected);
    document.getElementById('btn-delete-main')?.addEventListener('click', deleteSelected);

    document.getElementById('trigger-upload')?.addEventListener('click', () => {
        if (!currentPerms.can_upload) { Swal.fire('Acceso Restringido', 'Subidas deshabilitadas.', 'info'); return; }
        const input = document.createElement('input'); input.type = 'file'; input.multiple = true;
        input.onchange = async () => {
            const password = await getPassIfProtected();
            if (currentPerms.protected && !password) return;
            for (const file of input.files) {
                const fd = new FormData(); fd.append('file', file); fd.append('path', explorer.currentPath);
                if (password) fd.append('password', password);
                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.content },
                        body: fd
                    });
                    const d = await res.json();
                    if (d.success) explorer.loadFiles(explorer.currentPath);
                } catch (e) { Swal.fire('Error', e.message, 'error'); }
            }
        };
        input.click();
    });

    const ctxMenu = document.getElementById('context-menu');
    document.addEventListener('contextmenu', (e) => {
        if (explorer.isAreaRoot) return;
        const item = e.target.closest('.explorer-item');
        if (item) {
            e.preventDefault();
            explorer.container.querySelectorAll('.explorer-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            
            // Forzar actualización de panel de detalles al hacer click derecho
            const itemName = item.querySelector('.explorer-item-name').innerText;
            const fileItem = explorer.items.find(i => i.name === itemName);
            if (fileItem) explorer.onFileSelect(fileItem, FileIcons.getInfo(fileItem.name, fileItem.is_dir));

            ctxMenu.style.left = `${e.pageX}px`; ctxMenu.style.top = `${e.pageY}px`; ctxMenu.classList.remove('d-none');
        } else { ctxMenu.classList.add('d-none'); }
    });
    document.addEventListener('click', () => ctxMenu.classList.add('d-none'));

    document.getElementById('open-folder-modal')?.addEventListener('click', () => {
        if (!currentPerms.can_upload) { Swal.fire('Acceso Restringido', 'Creación de carpetas deshabilitada.', 'info'); return; }
        document.getElementById('newFolderModal').classList.remove('d-none');
    });

    document.getElementById('confirm-new-folder')?.addEventListener('click', async () => {
        const name = document.getElementById('newFolderName').value;
        if (!name) return;
        const password = await getPassIfProtected();
        if (currentPerms.protected && !password) return;
        try {
            const data = await NexusAPI.post('/api/create-folder', { path: explorer.currentPath, folder_name: name, password: password || '' });
            if (data.success) { document.getElementById('newFolderModal').classList.add('d-none'); explorer.loadFiles(explorer.currentPath); }
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
    });

    function renderActivityLogs(logs) {
        const container = document.getElementById('activity-log-monitor');
        if (!container) return;
        
        const colors = {
            'Alta': { icon: 'fa-cloud-upload-alt', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)' },
            'Carga': { icon: 'fa-cloud-upload-alt', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)' },
            'Descarga': { icon: 'fa-cloud-download-alt', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            'Baja': { icon: 'fa-trash-alt', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
            'Carpeta': { icon: 'fa-folder-plus', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
        };

        container.innerHTML = ''; 
        
        if (!logs || logs.length === 0) {
            container.innerHTML = `
                <div class="premium-empty-state-chart" style="margin-top: 2rem; opacity: 0.8;">
                    <div class="chart-empty-icon" style="background: rgba(99, 102, 241, 0.05); width: 60px; height: 60px;">
                        <i class="fas fa-wave-square" style="font-size: 24px;"></i>
                    </div>
                    <p class="chart-empty-title" style="font-size: 0.9rem;">Sin Actividad</p>
                    <p class="chart-empty-text" style="font-size: 0.75rem;">El monitor de auditoría está a la escucha de nuevos eventos.</p>
                </div>
            `;
            return;
        }

        logs.forEach(log => {
            const info = colors[log.action] || { icon: 'fa-info-circle', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
            const logCard = document.createElement('div');
            logCard.className = 'log-item-monitor';
            
            // Mapeo de campos desde API a UI
            const userDisplay = log.user_name || 'Sistema';
            const targetDisplay = log.target_name || 'Objeto';
            const logTime = log.created_at ? log.created_at.split(' ')[1] : 'N/D';

            logCard.innerHTML = `
                <div class="status-badge-icon" style="background: ${info.bg}; color: ${info.color};">
                    <i class="fas ${info.icon}"></i>
                </div>
                <div class="flex-1 overflow-hidden">
                    <div class="d-flex justify-between items-center mb-025">
                        <span class="log-user-name">${userDisplay}</span>
                        <span class="log-time-stamp">${logTime}</span>
                    </div>
                    <div class="log-target-text text-truncate">${targetDisplay}</div>
                </div>
            `;
            container.appendChild(logCard);
        });
    }

    function createPremiumChartEmpty(title, text, iconClass = 'fa-chart-pie') {
        return `
            <div class="nexus-empty-state">
                <div class="nexus-empty-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3 class="nexus-empty-title">${title}</h3>
                <p class="nexus-empty-text">${text}</p>
            </div>
        `;
    }

    function initCharts(chartData) {
        if (!chartData) return;
        const isEmpty = (obj) => !obj || !obj.values || obj.values.length === 0 || obj.values.every(v => v === 0);

        // 1. GRÁFICA DE DESCARGAS
        const canvasDownload = document.getElementById('downloadChart');
        if (canvasDownload) {
            if (isEmpty(chartData.downloads)) {
                canvasDownload.parentElement.innerHTML = createPremiumChartEmpty("Sin Tráfico", "No hay registros de descargas.", "fa-chart-line");
            } else {
                new Chart(canvasDownload.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: chartData.downloads.labels,
                        datasets: [{
                            label: 'Descargas (MB)',
                            data: chartData.downloads.values,
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: '#10b981',
                            borderWidth: 1,
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { display: true, color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
                        }
                    }
                });
            }
        }

        // 2. GRÁFICA DE SUBIDAS
        const canvasUpload = document.getElementById('uploadChart');
        if (canvasUpload) {
            if (isEmpty(chartData.uploads)) {
                canvasUpload.parentElement.innerHTML = createPremiumChartEmpty("Sin Actividad", "El historial de subidas está vacío.", "fa-cloud-upload-alt");
            } else {
                new Chart(canvasUpload.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: chartData.uploads.labels,
                        datasets: [{
                            label: 'Subidas (MB)',
                            data: chartData.uploads.values,
                            backgroundColor: 'rgba(99, 102, 241, 0.7)',
                            borderColor: '#6366f1',
                            borderWidth: 1,
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { display: true, color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
                        }
                    }
                });
            }
        }
    }

    async function loadStats() {
        try {
            // Carga de KPIs y Gráficas
            const statsResp = await fetch('/api/drive/stats');
            const statsData = await statsResp.json();
            if (statsData.success) {
                const kpiAreas = document.getElementById('kpi-areas');
                if (kpiAreas) kpiAreas.innerText = statsData.kpis.areas;
                
                const kpiPlatforms = document.getElementById('kpi-platforms');
                if (kpiPlatforms) kpiPlatforms.innerText = statsData.kpis.platforms;
                
                const kpiDownloads = document.getElementById('kpi-downloads');
                if (kpiDownloads) kpiDownloads.innerText = statsData.kpis.downloads;
                
                const kpiUploads = document.getElementById('kpi-uploads');
                if (kpiUploads) kpiUploads.innerText = statsData.kpis.uploads;
                
                initCharts(statsData.charts);
            }

            // Carga de Logs de Actividad Real
            const logsResp = await fetch('/api/drive-logs');
            const logsData = await logsResp.json();
            if (logsData.success) {
                renderActivityLogs(logsData.logs);
            }
        } catch (e) {
            console.error('Error al cargar estadísticas:', e);
        }
    }

    function switchTab(id, trigger = null) {
        document.querySelectorAll('.catalog-view').forEach(v => {
            v.classList.add('d-none'); if (v.id === 'view-' + id) v.classList.remove('d-none');
        });
        document.querySelectorAll('.catalog-tab-item').forEach(t => t.classList.remove('active'));
        if (trigger) trigger.classList.add('active');

        // Control dinámico de breadcrumb
        if (breadcrumb) {
            if (id === 'archivos' && trigger && trigger.dataset.areaName) {
                breadcrumb.classList.remove('d-none');
                breadcrumb.classList.add('d-flex');
            } else {
                breadcrumb.classList.add('d-none');
                breadcrumb.classList.remove('d-flex');
            }
        }

        if (id === 'inicio') loadStats();

        if (id === 'archivos') {
            if (trigger && trigger.dataset.areaName) {
                if(areaScreen) areaScreen.classList.add('d-none');
                if(archivosGrid) archivosGrid.classList.remove('d-none');
                explorer.loadFiles(trigger.dataset.areaName);
            } else {
                if(areaScreen) areaScreen.classList.remove('d-none');
                if(archivosGrid) archivosGrid.classList.add('d-none');
            }
        }
    }
    
    document.querySelectorAll('.catalog-tab-item').forEach(t => t.onclick = () => switchTab(t.dataset.tab, t));
    
    document.querySelectorAll('[data-action="open-area"]').forEach(c => {
        c.onclick = () => {
            if(areaScreen) areaScreen.classList.add('d-none');
            if(archivosGrid) archivosGrid.classList.remove('d-none');
            if (breadcrumb) {
                breadcrumb.classList.remove('d-none');
                breadcrumb.classList.add('d-flex');
            }
            explorer.loadFiles(c.dataset.areaName);
        };
    });

    switchTab('inicio', document.querySelector('[data-tab="inicio"]'));

    // Tecla ESC para limpiar buscador (Atajo Maestro)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('file-search');
            if (searchInput && searchInput.value !== '') {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });

});
