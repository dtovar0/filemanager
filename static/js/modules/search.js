import { NexusAPI } from './api.js';

export class GlobalSearch {
    constructor(inputId, resultsId) {
        this.input = document.getElementById(inputId);
        this.resultsContainer = document.getElementById(resultsId);
        this.timeout = null;

        if (this.input && this.resultsContainer) {
            this.init();
        }
    }

    init() {
        this.input.addEventListener('input', () => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.performSearch(), 300);
        });

        // Cerrar resultados al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    async performSearch() {
        const query = this.input.value.trim();
        if (query.length < 2) {
            this.hideResults();
            return;
        }

        try {
            const data = await NexusAPI.get(`/api/search?q=${encodeURIComponent(query)}`);
            this.renderResults(data.results);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    renderResults(results) {
        this.resultsContainer.innerHTML = '';
        if (results.length === 0) {
            this.resultsContainer.innerHTML = '<div class="search-no-results">No se encontraron coincidencias</div>';
        } else {
            results.forEach(res => {
                const item = document.createElement('a');
                item.href = res.link;
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div class="res-icon"><i class="fas ${res.icon}"></i></div>
                    <div class="res-info">
                        <div class="res-name">${res.name}</div>
                        <div class="res-cat">${res.cat} ${res.sub ? '• ' + res.sub : ''}</div>
                    </div>
                `;
                this.resultsContainer.appendChild(item);
            });
        }
        this.showResults();
    }

    showResults() { this.resultsContainer.classList.add('active'); }
    hideResults() { this.resultsContainer.classList.remove('active'); }
}
