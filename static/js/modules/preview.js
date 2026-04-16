/**
 * Nexus Preview Module
 * Gestiona la previsualización de archivos en un modal tipo Lightbox.
 */

export const Preview = {
    show(item, path) {
        const ext = item.name.split('.').pop().toLowerCase();
        const fullPath = `${path}/${item.name}`;
        const url = `/api/view?path=${encodeURIComponent(fullPath)}`;

        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
            this.showImage(item.name, url);
        } else {
            // Si no es imagen, podríamos descargar o mostrar un aviso
            Swal.fire({
                title: item.name,
                text: 'La previsualización no está disponible para este tipo de archivo.',
                icon: 'info',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
            });
        }
    },

    showImage(name, url) {
        Swal.fire({
            title: name,
            imageUrl: url,
            imageAlt: name,
            width: 'auto',
            padding: '1rem',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                image: 'rounded-20 shadow-lg'
            }
        });
    }
};
