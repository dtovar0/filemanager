/**
 * Nexus UI Module
 * Gestiona el renderizado de iconos, tipos de archivos y utilidades de feedback visual.
 */

export const FileIcons = {
    map: {
        'png': { type: 'Imagen', icon: 'fa-file-image', color: '#10b981' },
        'jpg': { type: 'Imagen', icon: 'fa-file-image', color: '#10b981' },
        'jpeg': { type: 'Imagen', icon: 'fa-file-image', color: '#10b981' },
        'gif': { type: 'Imagen', icon: 'fa-file-image', color: '#10b981' },
        'webp': { type: 'Imagen', icon: 'fa-file-image', color: '#10b981' },
        'pdf': { type: 'Documento PDF', icon: 'fa-file-pdf', color: '#ef4444' },
        'doc': { type: 'Documento', icon: 'fa-file-word', color: '#2563eb' },
        'docx': { type: 'Documento', icon: 'fa-file-word', color: '#2563eb' },
        'txt': { type: 'Archivo de Texto', icon: 'fa-file-lines', color: '#64748b' },
        'zip': { type: 'Comprimido', icon: 'fa-file-zipper', color: '#f59e0b' },
        'rar': { type: 'Comprimido', icon: 'fa-file-zipper', color: '#f59e0b' },
        'iso': { type: 'Imagen de Disco', icon: 'fa-compact-disc', color: '#8b5cf6' },
        'exe': { type: 'Ejecutable', icon: 'fa-file-import', color: '#475569' },
        'js': { type: 'Código JavaScript', icon: 'fa-file-code', color: '#facc15' },
        'py': { type: 'Código Python', icon: 'fa-file-code', color: '#3b82f6' },
        'html': { type: 'Archivo HTML', icon: 'fa-file-code', color: '#ea580c' },
        'css': { type: 'Hoja de Estilo', icon: 'fa-file-code', color: '#06b6d4' },
    },

    getInfo(name, is_dir) {
        if (is_dir) return { type: 'Directorio', icon: 'fa-folder', color: '#facc15' };
        const ext = name.split('.').pop().toLowerCase();
        return this.map[ext] || { type: 'Archivo', icon: 'fa-file-alt', color: 'var(--primary-color)' };
    }
};

export const UI = {
    toast(title, icon = 'success', timer = 2000) {
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: icon,
            title: title,
            showConfirmButton: false,
            timer: timer,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)'
        });
    },

    async confirm(title, text) {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary-color)',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)'
        });
        return result.isConfirmed;
    }
};
