// Requires: window.__platformData, window.__areaData, window.__allUsers, window.__urls set inline

    var platformData = window.__platformData;
    var areaData = window.__areaData;
    var allUsers = window.__allUsers;
    var currentArea = '';
    var currentAreaId = '';
    var selectedUserIds = [];

    var areaPage = 1;
    var areasPerPage = 999;
    
    function hexToRGBA(color, alpha = 0.1) {
        if (!color) return color;
        let hex = color;
        if (color.startsWith('var')) {
            hex = getComputedStyle(document.documentElement).getPropertyValue(color.replace('var(', '').replace(')', '')).trim();
        }
        if (!hex || !hex.startsWith('#')) return hex;
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3];
        } else if (hex.length == 7) {
            r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6];
        }
        return `rgba(${+r}, ${+g}, ${+b}, ${alpha})`;
    }

    function renderAreaGrid() {
        const grid = document.getElementById('areaGrid');
        if (!grid) return;

        if (areaData.length === 0) {
            grid.innerHTML = createPremiumEmptyState("No hay Áreas Registradas", "Comienza creando tu primera área (ej: IT, Ventas) para organizar tus plataformas digitales.");
            grid.style.display = 'block'; // Ensure it spans across
            return;
        }
        grid.style.display = 'grid';

        const start = (areaPage - 1) * areasPerPage;
        const end = start + areasPerPage;
        const pageData = areaData.slice(start, end);

        pageData.forEach(area => {
            const is_disabled = area.status === 'Deshabilitado';
            const card = document.createElement('div');
            card.className = 'area-card-modern';
            card.style.setProperty('--card-hover-border', is_disabled ? '#ef4444' : 'var(--primary-color)');
            card.setAttribute('data-action', 'platforms-drilldown');
            card.setAttribute('data-area-name', area.name);
            card.setAttribute('data-area-id', area.id);
            card.style.cursor = 'pointer';

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem;">
                    <div class="area-card-icon" style="background: ${hexToRGBA(area.color || 'var(--primary-color)', 0.12)}; color: ${area.color || (is_disabled ? '#ef4444' : 'var(--primary-color)')};">
                        ${iconsMap[area.icon] || iconsMap['box']}
                    </div>
                    <div>
                        <h3 style="font-family: 'Outfit'; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.15rem; color: var(--text-primary);">${area.name}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">${area.platform_count} Plataformas Asignadas</p>
                    </div>
                </div>
                <div class="health-bar-container" style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; margin-bottom: 0.75rem;">
                    <div class="health-bar" style="width: 100%; height: 100%; background: ${is_disabled ? '#ef4444' : (area.color || 'var(--primary-color)')}; border-radius: 3px;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                    <span style="color: ${is_disabled ? '#ef4444' : (area.color || 'var(--primary-color)')}; font-weight: 600;">
                        Estado de Red: ${area.status}
                    </span>
                    <span style="color: var(--text-muted);">Gestionar →</span>
                </div>
            `;
            grid.appendChild(card);
        });

        // renderAreaPagination();
    }

    function renderAreaPagination() {
        const container = document.getElementById('areaPagination');
        if (!container) return;
        
        const totalPages = Math.ceil(areaData.length / areasPerPage);
        if (totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = `
            <div class="pagination-controls" style="justify-content: center;">
                <button class="page-btn-modern" data-action="platforms-change-area-page" data-offset="-1" ${areaPage === 1 ? 'disabled' : ''}>Anterior</button>
                <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; background: #f8fafc; padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center;">
                    ${areaPage} / ${totalPages}
                </div>
                <button class="page-btn-modern" data-action="platforms-change-area-page" data-offset="1" ${areaPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
            </div>
        `;
    }

    function changeAreaPage(offset) {
        areaPage += offset;
        renderAreaGrid();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const iconsMap = {
        'server': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>',
        'cloud': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>',
        'cpu': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
        'database': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
        'lock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
        'code': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
        'terminal': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>',
        'monitor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        'activity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
        'shield': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        'wifi': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
        'globe': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        'hard-drive': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>',
        'key': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"></path></svg>',
        'settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
        'layers': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
        'smartphone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
        'tablet': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
        'git-branch': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>',
        'hash': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>',
        'headphones': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>',
        'tool': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
        'git-pull-request': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>',
        'wifi-off': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
        'box': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.11-1.79V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"></path><polyline points="2.32 6.16 12 11 21.68 6.16"></polyline><line x1="12" y1="22.76" x2="12" y2="11"></line></svg>',
        'folder': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
        'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        'heart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        'trending-up': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 18 1"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        'dollar-sign': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        'briefcase': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
        'truck': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
        'book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
        'map-pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
        'camera': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
        'award': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
        'mic': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
        'coffee': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`
    };

    function createPremiumEmptyState(title, text, iconClass = 'fa-search') {
        return `
            <div class="premium-empty-state-nexus">
                <div class="empty-state-visual-nexus">
                    <div class="empty-state-blob-nexus"></div>
                    <div class="empty-state-icon-wrapper-nexus">
                        <i class="fas ${iconClass}"></i>
                    </div>
                </div>
                <h2 class="empty-state-title-nexus">${title}</h2>
                <p class="empty-state-text-nexus">${text}</p>
            </div>
        `;
    }

    function populateIconGrid() {
        const grid = document.getElementById('iconSelectorZone');
        if (!grid) return;
        grid.innerHTML = '';
        let count = 0;
        for (const [key, svg] of Object.entries(iconsMap)) {
            if (count >= 30) break; 
            const item = document.createElement('div');
            item.className = 'icon-item';
            if (document.getElementById('selectedIconInput')?.value === key) item.classList.add('active');
            item.innerHTML = svg;
            item.setAttribute('data-action', 'platforms-select-icon');
            item.setAttribute('data-icon-key', key);
            grid.appendChild(item);
            count++;
        }
    }

    function selectPlatformIcon(el, key) {
        document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        const input = document.getElementById('selectedIconInput');
        if (input) {
            input.value = key;
            updateLivePreview();
        }
    }

    function changeStep(step) {
        currentStep = step;
        if (step === 2) populateIconGrid();
        
        // Modal Sections
        const s1 = document.getElementById('step1');
        const s2 = document.getElementById('step2');
        const s3 = document.getElementById('step3');
        
        // Indicators
        const i1 = document.getElementById('item1');
        const i2 = document.getElementById('item2');
        const i3 = document.getElementById('item3');
        const progress = document.getElementById('stepProgress');
        
        // Buttons
        const btnNext = document.getElementById('btnNext');
        const btnSubmit = document.getElementById('btnSubmit');
        const btnBack = document.getElementById('btnBack');
        const btnCancel = document.getElementById('btnCancel');

        // Reset All
        [s1, s2, s3].forEach(s => s?.classList.remove('active'));
        [i1, i2, i3].forEach(i => i?.classList.remove('active', 'completed'));

        const isEdit = document.getElementById('createPlatformForm').getAttribute('data-mode') === 'edit';

        if (step === 1) {
            s1.classList.add('active');
            i1.classList.add('active');
            progress.style.width = '0%';
            btnNext.classList.remove('d-none');
            btnSubmit.classList.add('d-none');
            btnBack.classList.add('d-none');
            btnCancel.classList.remove('d-none');
        } else if (step === 2) {
            s2.classList.add('active');
            i1.classList.add('completed');
            i2.classList.add('active');
            
            if (isEdit) {
                progress.style.width = '100%';
                btnNext.classList.add('d-none');
                btnSubmit.classList.remove('d-none');
            } else {
                progress.style.width = '50%';
                btnNext.classList.remove('d-none');
                btnSubmit.classList.add('d-none');
            }
            
            btnBack.classList.remove('d-none');
            btnCancel.classList.add('d-none');
        } else if (step === 3 && !isEdit) {
            s3.classList.add('active');
            i1.classList.add('completed');
            i2.classList.add('completed');
            i3.classList.add('active');
            progress.style.width = '100%';
            btnNext.classList.add('d-none');
            btnSubmit.classList.remove('d-none');
            btnBack.classList.remove('d-none');
            btnCancel.classList.add('d-none');
        }
    }

    async function handlePlatformSubmit(e) {
        e.preventDefault();
        const form = e.target;
        if (typeof validatePremiumForm === 'function' && !validatePremiumForm(form)) return;

        const isEdit = form.getAttribute('data-mode') === 'edit';
        const platformId = form.getAttribute('data-edit-id');
        const endpoint = isEdit ? `/admin/edit-platform/${platformId}` : '/admin/add-platform';

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = isEdit ? "Actualizando..." : "Registrando...";

        const formData = new FormData(form);
        formData.append('users', JSON.stringify(selectedUserIds));
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                window.closeModal('platformModal');
                Swal.fire({ 
                    title: isEdit ? 'Actualizado' : 'Registrado', 
                    text: data.message, 
                    icon: 'success', 
                    timer: 1500, 
                    showConfirmButton: false,
                    toast: true,
                    position: 'bottom-end',
                    customClass: { popup: 'toast-save' }
                });
                sessionStorage.setItem('active_platform_area', currentArea);
                sessionStorage.setItem('active_platform_area_id', currentAreaId);
                setTimeout(() => location.reload(), 1500);
            } else {
                btn.disabled = false;
                btn.innerHTML = originalText;
                Swal.fire('Error', data.error || 'Error en la operación', 'error');
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        }
    }

    function populatePlatformPickers() {
        const addGroup = document.getElementById('addPlatformIconGroup');
        if (!addGroup) return;
        let addHtml = '';
        let first = true;
        for (const [key, svg] of Object.entries(iconsMap)) {
            addHtml += `
                <label>
                    <input type="radio" name="icon" value="${key}" ${first ? 'checked' : ''}>
                    <div class="icon-preview" title="${key}">${svg}</div>
                </label>
            `;
            first = false;
        }
        addGroup.innerHTML = addHtml;
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderAreaGrid();
        populatePlatformPickers();

        const subSearchInput = document.getElementById('platformSearchSub');
        if (subSearchInput) {
            subSearchInput.addEventListener('input', (event) => {
                handlePlatformSearch(event.target.value || '');
            });
        }

        document.querySelectorAll('.js-sync-color').forEach((picker) => {
            picker.addEventListener('input', (event) => {
                const textInputId = event.target.dataset.textInputId;
                const swatchId = event.target.dataset.swatchId;
                window.syncColorInput(event.target, textInputId, swatchId);
            });
        });

        document.querySelectorAll('.js-picklist-filter').forEach((input) => {
            input.addEventListener('input', (event) => {
                filterPicklist(event.target, event.target.dataset.listId);
            });
        });


        // Live Preview Updates
        const platformNameInput = document.querySelector('input[name="name"]');
        if (platformNameInput) {
            platformNameInput.addEventListener('input', (e) => {
                const previewName = document.getElementById('previewPlatformName');
                if (previewName) previewName.textContent = e.target.value || "Nombre Plataforma";
            });
        }

        // Render area card icons from DB
        document.querySelectorAll('.area-card-icon[data-area-icon]').forEach(el => {
            const iconKey = el.getAttribute('data-area-icon') || 'box';
            el.innerHTML = iconsMap[iconKey] || iconsMap['box'];
        });

        // Global Search Deep Linking
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('s');
        
        if (searchQuery) {
            // Find which area contains this platform
            for (const [area, platforms] of Object.entries(platformData)) {
                const found = platforms.find(p => p.name.toLowerCase() === searchQuery.toLowerCase());
                if (found) {
                    drillDown(area, found.area_id);
                    setTimeout(() => {
                        const subInput = document.getElementById('platformSearchSub');
                        if (subInput) {
                            subInput.value = searchQuery;
                            handlePlatformSearch(searchQuery);
                        }
                    }, 100);
                    break;
                }
            }
        }

        // Restore active area if saved (e.g. after reload)
        const savedArea = sessionStorage.getItem('active_platform_area');
        const savedAreaId = sessionStorage.getItem('active_platform_area_id');
        if (savedArea && savedAreaId) {
            drillDown(savedArea, savedAreaId);
            sessionStorage.removeItem('active_platform_area');
            sessionStorage.removeItem('active_platform_area_id');
        }

        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-action]');
            if (!trigger) return;

            const action = trigger.getAttribute('data-action');
            if (action === 'platforms-open-create-modal') return openCreateModal();
            if (action === 'platforms-edit-selected') return handleEditPlatform();
            if (action === 'platforms-delete-selected') return handleDeletePlatform();
            if (action === 'platforms-close-modal') return closePlatformModal();
            if (action === 'platforms-step-next') return window.handleNext();
            if (action === 'platforms-step-back') return window.handleBack();
            if (action === 'platforms-drilldown') return drillDown(trigger.dataset.areaName, trigger.dataset.areaId);
            if (action === 'platforms-change-area-page') return changeAreaPage(parseInt(trigger.dataset.offset));
            if (action === 'platforms-select-icon') return selectPlatformIcon(trigger, trigger.dataset.iconKey);
            if (action === 'platforms-select-all') {
                const checkboxes = document.querySelectorAll('.platform-checkbox');
                checkboxes.forEach(cb => cb.checked = trigger.checked);
                updateActionButtons();
            }
            if (action === 'platforms-move-item') return moveItem(trigger.dataset.userId);
            if (action === 'platforms-show-catalog') return showCatalog();
            if (action === 'platforms-go-home') window.location.href = window.__urls.index;

            if (action === 'platforms-manage-access') return openPlatformAccessModal();
            if (action === 'platforms-close-access-modal') return window.closeModal('platformAccessModal');
            if (action === 'platforms-toggle-access-user') {
                const userId = trigger.dataset.userId;
                return togglePlatUser(userId, trigger.dataset.source);
            }
        });

        const accessForm = document.getElementById('platformAccessForm');
        if (accessForm) {
            accessForm.addEventListener('submit', (e) => {
                e.preventDefault();
                savePlatformAccess();
            });
        }

        document.addEventListener('change', (event) => {
            if (event.target.classList.contains('platform-checkbox')) {
                updateActionButtons();
            }
        });

        // Form Submit Delegation
        document.addEventListener('submit', (event) => {
            const form = event.target;
            const submitAction = form.getAttribute('data-action-submit');
            
            if (submitAction === 'platform-save') {
                handlePlatformSubmit(event);
            }
        });
        // Toggle Dynamic Labels and Password Field
        ['chkDescargas', 'chkUpload', 'chkEncriptado'].forEach(id => {
            const chk = document.getElementById(id);
            if (chk) {
                chk.addEventListener('change', (e) => {
                    const label = chk.closest('.nexus-switch-group').querySelector('.nexus-switch-label');
                    const feature = label.getAttribute('data-feature');
                    label.textContent = e.target.checked ? 'Activo' : feature;

                    // Specific logic for Encriptado -> Password field
                    if (id === 'chkEncriptado') {
                        const passwordInput = document.getElementById('passwordInput');
                        if (passwordInput) {
                            passwordInput.disabled = !e.target.checked;
                            if (!e.target.checked) passwordInput.value = '';
                        }
                    }
                });
            }
        });

    });

    function renderPlatformsTable(data) {
        const tbody = document.getElementById('drillDownTableBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            const isSearch = document.getElementById('platformSearch')?.value.trim() !== "";
            const icon = isSearch ? 'fa-search' : 'fa-box-open';
            const title = isSearch ? 'Sin resultados' : 'Sin Plataformas';
            const text = isSearch ? 'No pudimos encontrar herramientas que coincidan con su búsqueda.' : `No hay plataformas registradas en el área "${currentArea}".`;

            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="padding: 0; border: none;">
                        ${createPremiumEmptyState(title, text, icon)}
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(p => {
            const tr = document.createElement('tr');
            const defaultIcon = iconsMap['box'];
            const platIcon = iconsMap[p.icon] || defaultIcon;

            tr.innerHTML = `
                <td class="col-cb">
                <input type="checkbox" class="platform-checkbox" value="${p.id}" style="cursor: pointer; width: 16px; height: 16px;">
                </td>
                <td style="width: 40px;">
                    <div style="width: 32px; height: 32px; color: var(--primary-color); display: flex; align-items: center; justify-content: center;">
                        <div style="width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">${platIcon}</div>
                    </div>
                </td>
                <td>
                    <div>
                        <span style="font-weight: 600; font-size: 0.95rem;">${p.name}</span>
                        <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.storage_path || p.url || ''}</div>
                    </div>
                </td>
                <td>
                    <div style="color: var(--text-muted); font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.description || ''}">
                        ${p.description || '-'}
                    </div>
                </td>
                <td style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">
                    <i class="fas fa-users" style="margin-right: 4px; font-size: 0.75rem; opacity: 0.7;"></i> ${p.user_count || 0}
                </td>
                <td>
                    <span class="badge badge-success">
                        <span class="status-dot"></span> Online
                    </span>
                </td>
                <td style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">
                    <span class="badge ${p.can_download ? 'badge-success' : 'badge-danger'}" style="padding: 2px 8px; font-size: 0.7rem;">
                        ${p.can_download ? 'SI' : 'NO'}
                    </span>
                </td>
                <td>
                    <span class="badge ${p.can_upload ? 'badge-success' : 'badge-danger'}" style="padding: 2px 8px; font-size: 0.7rem;">
                        ${p.can_upload ? 'SI' : 'NO'}
                    </span>
                </td>
                <td>
                    <span class="badge ${p.is_encrypted ? 'badge-success' : 'badge-danger'}" style="padding: 2px 8px; font-size: 0.7rem;">
                        ${p.is_encrypted ? 'SI' : 'NO'}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        updateActionButtons();
    }

    function handlePlatformSearch(query) {
        const q = query.toLowerCase();
        const filtered = platformData[currentArea].filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.description && p.description.toLowerCase().includes(q))
        );
        renderPlatformsTable(filtered);
    }

    function drillDown(areaName, areaId) {
        currentArea = areaName;
        currentAreaId = areaId;
        document.getElementById('gridView').style.display = 'none';
        document.getElementById('drillDownView').style.display = 'flex';
        document.getElementById('drillDownView').classList.remove('d-none');
        
        // Reset search field
        document.getElementById('platformSearchSub').value = '';

        // Dynamic Breadcrumb Update
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <span class="breadcrumb-item" data-action="platforms-go-home">Inicio</span>
                <span>/</span>
                <span class="breadcrumb-item" style="cursor: pointer;" data-action="platforms-show-catalog">Plataformas</span>
                <span>/</span>
                <span class="breadcrumb-item active">${areaName}</span>
            `;
        }

        renderPlatformsTable(platformData[areaName]);

        // Update preview tag if modal is opened later
        const previewAreaTag = document.getElementById('previewAreaTag');
        if (previewAreaTag) previewAreaTag.textContent = areaName.toUpperCase();
    }

    function updateActionButtons() {
        const checkedCount = document.querySelectorAll('.platform-checkbox:checked').length;
        const btnEdit = document.getElementById('btnEditPlatform');
        const btnDelete = document.getElementById('btnDeletePlatform');
        const btnAccess = document.getElementById('btnManagePlatformAccess');
        
        if (btnEdit) btnEdit.disabled = checkedCount !== 1;
        if (btnDelete) btnDelete.disabled = checkedCount === 0;
        if (btnAccess) btnAccess.disabled = checkedCount !== 1;
    }

    // Access Management Functions
    function openPlatformAccessModal() {
        const checked = document.querySelector('.platform-checkbox:checked');
        if (!checked) return;
        
        const platformId = checked.value;
        const platform = platformData[currentArea].find(p => p.id == platformId);
        if (!platform) return;

        document.getElementById('accessPlatformId').value = platformId;
        document.getElementById('accessPlatformNameLabel').textContent = platform.name;
        
        // Reset filters
        document.querySelectorAll('.picklist-filter-input').forEach(i => i.value = '');
        
        refreshPlatUserPicklist(platform.user_ids || []);
        window.openModal('platformAccessModal');
    }

    function refreshPlatUserPicklist(preselectedIds = []) {
        const availList = document.getElementById('accessPlatUsersAvailableList');
        const selectedList = document.getElementById('accessPlatUsersSelectedList');
        if (!availList || !selectedList) return;

        availList.innerHTML = '';
        selectedList.innerHTML = '';

        const users = window.__allUsers || [];
        users.forEach(user => {
            const isSelected = preselectedIds.includes(user.id);
            const card = createPlatUserCard(user, isSelected);
            if (isSelected) selectedList.appendChild(card);
            else availList.appendChild(card);
        });
        
        updatePlatUsersHiddenInput();
    }

    function createPlatUserCard(user, isSelected) {
        const card = document.createElement('div');
        card.className = 'picklist-card-premium' + (isSelected ? ' selected' : '');
        card.setAttribute('data-action', 'platforms-toggle-access-user');
        card.setAttribute('data-user-id', user.id);
        card.setAttribute('data-source', isSelected ? 'selected' : 'available');
        
        const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        card.innerHTML = `
            <div class="card-icon" style="background: var(--bg-hover); font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">
                ${initials}
            </div>
            <div class="card-info">
                <span class="card-name">${user.name}</span>
                <span class="card-meta">${user.email || 'Sin correo'}</span>
            </div>
            <div class="card-action-icon">
                <i class="fas ${isSelected ? 'fa-times' : 'fa-plus'}"></i>
            </div>
        `;
        return card;
    }

    function togglePlatUser(userId, source) {
        const availList = document.getElementById('accessPlatUsersAvailableList');
        const selectedList = document.getElementById('accessPlatUsersSelectedList');
        const isNowSelected = source === 'available';
        
        // Find user
        const user = window.__allUsers.find(u => u.id == userId);
        if (!user) return;

        // Remove current
        const currentList = isNowSelected ? availList : selectedList;
        const items = Array.from(currentList.children);
        const itemToMove = items.find(el => el.getAttribute('data-user-id') == userId);
        if (itemToMove) itemToMove.remove();
        
        // Add to next
        const targetCard = createPlatUserCard(user, isNowSelected);
        (isNowSelected ? selectedList : availList).appendChild(targetCard);
        
        updatePlatUsersHiddenInput();
    }

    function updatePlatUsersHiddenInput() {
        const selectedList = document.getElementById('accessPlatUsersSelectedList');
        const input = document.getElementById('accessSelectedPlatUsersInput');
        if (!selectedList || !input) return;

        const ids = Array.from(selectedList.children).map(el => parseInt(el.getAttribute('data-user-id')));
        input.value = JSON.stringify(ids);

        // Update count
        const badge = document.getElementById('selectedPlatUserCount');
        if (badge) badge.textContent = ids.length;
    }

    function savePlatformAccess() {
        const platformId = document.getElementById('accessPlatformId').value;
        const userIds = JSON.parse(document.getElementById('accessSelectedPlatUsersInput').value || '[]');

        fetch(`/admin/update-platform-users/${platformId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('input[name="csrf_token"]').value
            },
            body: JSON.stringify({ user_ids: userIds })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.closeModal('platformAccessModal');
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'bottom-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
                Toast.fire({ 
                    icon: 'success', 
                    title: data.message
                });
                setTimeout(() => location.reload(), 1500);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error });
            }
        });
    }

    // Event Listeners for checkboxes
    document.getElementById('drillDownTableBody').addEventListener('change', (e) => {
        if (e.target.classList.contains('platform-checkbox')) {
            updateActionButtons();
        }
    });

    document.getElementById('selectAllPlatforms').onclick = function() {
        const checkboxes = document.querySelectorAll('.platform-checkbox');
        checkboxes.forEach(cb => cb.checked = this.checked);
        updateActionButtons();
    };

    function openCreateModal() {
        window.openModal('platformModal');
        document.getElementById('modalAreaHidden').value = currentAreaId;
        const form = document.getElementById('createPlatformForm');
        form.reset();
        form.setAttribute('data-mode', 'create');
        document.getElementById('item3').style.display = 'flex';
        
        document.getElementById('platformModalTitle').textContent = "Registrar Nueva Plataforma";
        selectedUserIds = [];
        changeStep(1);
        updatePicklist();
    }

    function openEditModal() {
        const checked = document.querySelector('.platform-checkbox:checked');
        if (!checked) return;
        
        const platformId = checked.value;
        const platform = platformData[currentArea].find(p => p.id == platformId);
        
        window.openModal('platformModal');
        document.getElementById('platformModalTitle').textContent = "Modificar Plataforma";
        document.getElementById('item3').style.display = 'none';
        
        const form = document.getElementById('createPlatformForm');
        form.elements['name'].value = platform.name || '';
        form.elements['description'].value = platform.description || '';
        document.getElementById('modalAreaHidden').value = platform.area_id || currentAreaId;
        
        form.elements['can_download'].checked = platform.can_download || false;
        form.elements['can_upload'].checked = platform.can_upload || false;
        form.elements['is_encrypted'].checked = platform.is_encrypted || false;

        if (platform.icon) {
            document.getElementById('selectedIconInput').value = platform.icon;
        }
        if (platform.bg_color) {
            form.elements['bg_color'].value = platform.bg_color;
            document.getElementById('bgColorInput').value = platform.bg_color;
            document.getElementById('bgColorPicker').value = platform.bg_color;
            document.getElementById('bgSwatch').style.background = platform.bg_color;
        }
        if (platform.text_color) {
            form.elements['text_color'].value = platform.text_color;
            document.getElementById('textColorInput').value = platform.text_color;
            document.getElementById('textColorPicker').value = platform.text_color;
            document.getElementById('textSwatch').style.background = platform.text_color;
        }
        updateLivePreview();
        
        selectedUserIds = [...(platform.user_ids || [])];
        changeStep(1);
        updatePicklist();
        
        form.setAttribute('data-mode', 'edit');
        form.setAttribute('data-edit-id', platformId);
    }

    function filterPicklist(input, listId) {
        const q = input.value.toLowerCase();
        const items = document.getElementById(listId).getElementsByClassName('picklist-item');
        for (let item of items) {
            item.style.display = item.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
        }
    }

    function updatePicklist() {
        const availableList = document.getElementById('availableList');
        const assignedList = document.getElementById('assignedList');
        availableList.innerHTML = '';
        assignedList.innerHTML = '';
        
        allUsers.forEach(u => {
            const card = document.createElement('div');
            card.className = 'picklist-card-premium';
            const isActive = selectedUserIds.includes(u.id);
            const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const roleColor = u.role === 'Administrador' ? '#f43f5e' : (u.role === 'Auditor' ? '#0ea5e9' : '#6366f1');
            
            card.innerHTML = `
                <div class="card-icon" style="background: ${roleColor}; opacity: ${isActive ? '1' : '0.8'};">
                    ${initials}
                </div>
                <div class="card-info">
                    <span class="card-name">${u.name}</span>
                    <span class="card-meta">${u.email || 'sin correo'} • ${u.role || 'Usuario'}</span>
                </div>
                <i class="fas ${isActive ? 'fa-minus-circle text-danger' : 'fa-plus-circle text-primary'}" style="font-size: 1.1rem; opacity: 0.7;"></i>
            `;
            card.setAttribute('data-action', 'platforms-move-item');
            card.setAttribute('data-user-id', u.id);
            
            if (isActive) {
                assignedList.appendChild(card);
            } else {
                availableList.appendChild(card);
            }
        });
        
        document.getElementById('selectedUsersInput').value = JSON.stringify(selectedUserIds);
    }

    function moveItem(userId) {
        const index = selectedUserIds.indexOf(userId);
        if (index > -1) {
            selectedUserIds.splice(index, 1);
        } else {
            selectedUserIds.push(userId);
        }
        updatePicklist();
    }

    async function handlePlatformSubmit(e) {
        e.preventDefault();
        const form = e.target;
        if (typeof validatePremiumForm === 'function' && !validatePremiumForm(form)) return;

        const isEdit = form.getAttribute('data-mode') === 'edit';
        const platformId = form.getAttribute('data-edit-id');
        const endpoint = isEdit ? `/admin/edit-platform/${platformId}` : '/admin/add-platform';

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = isEdit ? "Actualizando..." : "Registrando...";

        const formData = new FormData(form);
        formData.append('users', JSON.stringify(selectedUserIds));
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                window.closeModal('platformModal');
                Swal.fire({ 
                    title: isEdit ? 'Actualizado' : 'Registrado', 
                    text: data.message, 
                    icon: 'success', 
                    timer: 1500, 
                    showConfirmButton: false,
                    toast: true,
                    position: 'bottom-end',
                    customClass: { popup: 'toast-save' }
                });
                sessionStorage.setItem('active_platform_area', currentArea);
                sessionStorage.setItem('active_platform_area_id', currentAreaId);
                setTimeout(() => location.reload(), 1500);
            } else {
                btn.disabled = false;
                btn.innerHTML = originalText;
                Swal.fire('Error', data.error || 'Error en la operación', 'error');
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        }
    }

    function showCatalog() {
        document.getElementById('drillDownView').style.display = 'none';
        document.getElementById('gridView').style.display = 'block';
        
        // Clear search on return
        document.getElementById('platformSearchSub').value = '';
        
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <span class="breadcrumb-item" data-action="platforms-go-home">Inicio</span>
                <span>/</span>
                <span class="breadcrumb-item active" style="cursor: pointer;" data-action="platforms-show-catalog">Plataformas</span>
            `;
        }
    }


    function closePlatformModal() {
        if (window.closeModal) window.closeModal('platformModal');
        else document.getElementById('platformModal').style.display = 'none';
    }

    let currentStep = 1;

    window.handleNext = function() {
        const currentStepEl = document.getElementById(`step${currentStep}`);
        const isEdit = document.getElementById('createPlatformForm').getAttribute('data-mode') === 'edit';
        
        if (typeof window.validatePremiumForm === 'function') {
            if (!window.validatePremiumForm(currentStepEl)) return;
        }

        if (currentStep === 1) {
            changeStep(2);
        } else if (currentStep === 2 && !isEdit) {
            changeStep(3);
        }
    };

    window.handleBack = function() {
        if (currentStep === 2) changeStep(1);
        else if (currentStep === 3) changeStep(2);
    };



    function handleEditPlatform() {
        openEditModal();
    }

    function handleDeletePlatform() {
        const checked = document.querySelectorAll('.platform-checkbox:checked');
        if (checked.length === 0) return;

        showConfirm(
            `¿Eliminar ${checked.length} plataformas?`,
            'Esta acción eliminará de forma permanente el acceso a las herramientas seleccionadas.',
            async () => {
                const promises = Array.from(checked).map(cb => fetch(`/admin/delete-platform/${cb.value}`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('input[name="csrf_token"]')?.value || document.querySelector('meta[name="csrf-token"]')?.content
                    }
                }));
                try {
                    await Promise.all(promises);
                    sessionStorage.setItem('active_platform_area', currentArea);
                    sessionStorage.setItem('active_platform_area_id', currentAreaId);
                    location.reload();
                } catch (err) {
                    Swal.fire('Error', 'No se pudo eliminar', 'error');
                }
            }
        );
    }

    window.syncColorInput = function(picker, textInputId, swatchId) {
        const color = picker.value;
        const textInput = document.getElementById(textInputId);
        if (textInput) textInput.value = color.toUpperCase();
        const swatch = document.getElementById(swatchId);
        if (swatch) swatch.style.background = color;
        updateLivePreview();
    };

    function updateLivePreview() {
        const bgColor = document.getElementById('bgColorInput')?.value || '#6366f1';
        const textColor = document.getElementById('textColorInput')?.value || '#ffffff';
        const previewCard = document.getElementById('platformPreviewCard');
        const previewIconWrapper = document.getElementById('previewIconWrapper');
        
        const previewPlatformName = document.getElementById('previewPlatformName');
        const nameInput = document.querySelector('input[name="name"]');
        if (previewPlatformName && nameInput) {
            previewPlatformName.textContent = nameInput.value || "Nombre Plataforma";
        }

        if (previewCard) previewCard.style.background = bgColor;
        if (previewIconWrapper) {
            previewIconWrapper.style.color = textColor;
            previewIconWrapper.style.background = hexToRGBA(textColor, 0.2);
            
            const selectedIconKey = document.getElementById('selectedIconInput')?.value || 'box';
            previewIconWrapper.innerHTML = iconsMap[selectedIconKey] || iconsMap['box'];
        }
    }

    // Initialize listeners for color swatch click to trigger hidden color picker
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('color-swatch') || e.target.closest('.premium-color-input')) {
            const container = e.target.closest('.premium-color-input');
            if (container) {
                const picker = container.querySelector('input[type="color"]');
                if (picker) picker.click();
            }
        }
    });
