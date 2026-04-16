import { NexusAPI } from './api.js';
import { FileIcons, UI } from './ui.js';

export class FileExplorer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.tableBody = document.getElementById(options.tableBodyId);
        this.currentPath = options.initialPath || '';
        this.viewMode = localStorage.getItem('catalog_view') || 'grid';
        this.onPathChange = options.onPathChange || (() => {});
        this.onFileSelect = options.onFileSelect || (() => {});
        this.onDownloadRequest = options.onDownloadRequest || (() => {});
        this.beforeDeleteItem = options.beforeDeleteItem || (async () => ({}));
        this.iconResolver = options.iconResolver || null;
        this.permissions = options.permissions || { can_download: true, can_upload: true, can_delete: true };
        
        this.items = [];
    }

    async loadFiles(path = this.currentPath) {
        try {
            this.showLoading();
            const data = await NexusAPI.post('/api/drive/list', { path });
            console.log(`[FileExplorer] Datos recibidos para ${path}:`, data);
            
            if (data.success) {
                this.items = data.items || [];
                this.currentPath = data.current_path || path;
                
                try {
                    this.render();
                } catch (renderError) {
                    console.error("[FileExplorer] Error en renderizado visual:", renderError);
                }
                
                if (this.onPathChange) {
                    try {
                        this.onPathChange(
                            this.currentPath, 
                            data.protected, 
                            data.permissions, 
                            data.context
                        );
                    } catch (navError) {
                        console.error("[FileExplorer] Error actualizando navegación/barras:", navError);
                    }
                }
            }
        } catch (error) {
            UI.toast(error.message, 'error', 4000);
        }
    }

    render() {
        if (!this.container) return;
        
        if (this.viewMode === 'grid') {
            this.renderGrid();
        } else {
            this.renderTable();
        }
    }

    renderGrid() {
        this.container.innerHTML = '';
        if (this.items.length === 0) return this.renderEmpty();

        this.items.forEach(item => {
            const info = (this.iconResolver && item.is_dir) 
                ? this.iconResolver(item.name, this.currentPath) 
                : FileIcons.getInfo(item.name, item.is_dir);
                
            const card = document.createElement('div');
            card.className = 'explorer-item';
            card.dataset.name = item.name;
            card.innerHTML = `
                <div class="explorer-icon-wrapper" style="color: ${info.color}">
                    <i class="fas ${info.icon}"></i>
                </div>
                <div class="explorer-item-name" title="${item.name}">${item.name}</div>
            `;
            
            card.onclick = () => {
                this.deselectAll();
                card.classList.add('selected');
                this.onFileSelect(item);
            };

            if (item.is_dir) {
                card.ondblclick = () => this.loadFiles(`${this.currentPath}/${item.name}`);
            }

            this.container.appendChild(card);
        });
    }

    renderTable() {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';
        
        this.items.forEach(item => {
            const info = (this.iconResolver && item.is_dir) 
                ? this.iconResolver(item.name, this.currentPath) 
                : FileIcons.getInfo(item.name, item.is_dir);

            const row = document.createElement('tr');
            row.className = 'explorer-row';
            row.innerHTML = `
                <td width="40"><i class="fas ${info.icon}" style="color: ${info.color}"></i></td>
                <td><span class="fw-600">${item.name}</span></td>
                <td class="fs-xs text-muted">${item.is_dir ? '--' : (item.size / 1024 / 1024).toFixed(2) + ' MB'}</td>
                <td class="text-right">
                    <button class="btn btn-ghost btn-sm" data-action="download"><i class="fas fa-download"></i></button>
                </td>
            `;
            
            row.onclick = () => this.onFileSelect(item);
            if (item.is_dir) row.ondblclick = () => this.loadFiles(`${this.currentPath}/${item.name}`);

            const downloadBtn = row.querySelector('[data-action="download"]');
            if (downloadBtn) {
                downloadBtn.onclick = (event) => {
                    event.stopPropagation();
                    this.onDownloadRequest(item);
                };
            }
            
            this.tableBody.appendChild(row);
        });
    }

    deselectAll() {
        this.container.querySelectorAll('.explorer-item').forEach(el => el.classList.remove('selected'));
    }

    showLoading() {
        const loading = '<div class="loader-container"><i class="fas fa-circle-notch fa-spin"></i> Cargando...</div>';
        if (this.viewMode === 'grid') this.container.innerHTML = loading;
        else if (this.tableBody) this.tableBody.innerHTML = `<tr><td colspan="4">${loading}</td></tr>`;
    }

    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>Ubicación vacía</p>
            </div>
        `;
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        localStorage.setItem('catalog_view', mode);
        this.render();
    }

    async deleteItem(item) {
        const confirmed = await UI.confirm(
            '¿Eliminar elemento?',
            `Estás a punto de borrar permanentemente: ${item.name}`
        );

        if (confirmed) {
            try {
                const fullPath = `${this.currentPath}/${item.name}`;
                const extraPayload = await this.beforeDeleteItem(item, this.currentPath);
                if (extraPayload === false) return;

                const data = await NexusAPI.post('/api/delete-item', { path: fullPath, ...(extraPayload || {}) });
                if (data.success) {
                    UI.toast('Elemento eliminado');
                    this.loadFiles();
                }
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        }
    }
}
