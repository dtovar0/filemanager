/**
 * Nexus Context Menu Module
 * Permite crear menús emergentes dinámicos ligados a elementos del DOM.
 */

export class ContextMenu {
    constructor(menuId) {
        this.menu = document.getElementById(menuId);
        this.activeTarget = null;
        this.onAction = null;

        if (this.menu) {
            this.init();
        }
    }

    init() {
        // Cerrar menú al hacer click en cualquier lado
        document.addEventListener('click', () => this.hide());
        document.addEventListener('scroll', () => this.hide());
        
        // Evitar que el menú mismo cierre al clickear sus opciones (opcional)
        this.menu.onclick = (e) => e.stopPropagation();
    }

    show(e, target, items = []) {
        e.preventDefault();
        this.activeTarget = target;
        
        // Renderizar items dinámicamente si se pasan
        if (items.length > 0) {
            this.renderItems(items);
        }

        this.menu.classList.remove('d-none');
        this.menu.style.display = 'block';
        
        // Posicionamiento inteligente (evitar que se salga de la pantalla)
        const { clientX: x, clientY: y } = e;
        const { innerWidth: winW, innerHeight: winH } = window;
        const { offsetWidth: menuW, offsetHeight: menuH } = this.menu;

        const posX = (x + menuW > winW) ? x - menuW : x;
        const posY = (y + menuH > winH) ? y - menuH : y;

        this.menu.style.left = `${posX}px`;
        this.menu.style.top = `${posY}px`;
    }

    renderItems(items) {
        this.menu.innerHTML = '';
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'context-menu-separator';
                this.menu.appendChild(sep);
                return;
            }

            const el = document.createElement('div');
            el.className = `context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`;
            el.innerHTML = `
                <i class="fas ${item.icon}"></i>
                <span>${item.label}</span>
            `;
            
            if (!item.disabled) {
                el.onclick = () => {
                    item.action(this.activeTarget);
                    this.hide();
                };
            }
            
            this.menu.appendChild(el);
        });
    }

    hide() {
        if (this.menu) {
            this.menu.style.display = 'none';
        }
    }
}
