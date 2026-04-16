/**
 * Audit Module - Event Delegation & Logic
 * Pattern: document.addEventListener('click', e => { ... })
 */
document.addEventListener('DOMContentLoaded', () => {
    const datos = window.__datos || {};

    /* ─── Event Delegation (Click) ─── */
    document.addEventListener('click', e => {
        const trigger = e.target.closest('[data-action]');
        if (!trigger) return;

        const action = trigger.dataset.action;

        if (action === 'go-home') {
            window.location.href = datos.urls.home;
        }
    });

    /* ─── Change/Input Observers (js-* classes) ─── */
    document.addEventListener('input', e => {
        const trigger = e.target.closest('.js-audit-search');
        if (trigger) {
            ui.filterAuditTable(trigger.value);
        }
    });

    /* ─── UI Controller ─── */
    const ui = {
        filterAuditTable(query) {
            const filter = query.toLowerCase();
            const table = document.querySelector('.modern-table');
            if (!table) return;
            
            const rows = table.getElementsByClassName('audit-row');
            const tbody = table.querySelector('tbody');
            let visibleCount = 0;

            // Remove existing search empty state if any
            const existingEmpty = tbody.querySelector('.search-empty-row');
            if (existingEmpty) existingEmpty.remove();

            for (let i = 0; i < rows.length; i++) {
                const text = rows[i].innerText.toLowerCase();
                if (text.includes(filter)) {
                    rows[i].classList.remove('is-hidden');
                    visibleCount++;
                } else {
                    rows[i].classList.add('is-hidden');
                }
            }

            if (visibleCount === 0 && rows.length > 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'search-empty-row';
                emptyRow.innerHTML = `
                    <td colspan="5">
                        <div class="premium-empty-state">
                            <div class="empty-state-visual">
                                <div class="empty-state-blob"></div>
                                <div class="empty-state-icon-wrapper">
                                    <i class="fas fa-search"></i>
                                </div>
                            </div>
                            <h3 class="empty-state-title">Sin resultados</h3>
                            <p class="empty-state-text">No pudimos encontrar registros que coincidan con su búsqueda.</p>
                        </div>
                    </td>
                `;
                tbody.appendChild(emptyRow);
            }
        }
    };
});
