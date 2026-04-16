// Requires window.__chartData to be set inline before this script loads

function updateClock() {
    const clockElement = document.getElementById('realtime-clock');
    if (clockElement) {
        const now = new Date();
        const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clockElement.textContent = time;
    }
}
setInterval(updateClock, 1000);
updateClock();

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

document.addEventListener('DOMContentLoaded', function () {
    const data = window.__chartData;

    // Helper to check if array is empty or all values are zero
    const isEmpty = (arr) => !arr || arr.length === 0 || arr.every(v => v === 0);

    // Chart: Users per Platform
    const canvasPlatform = document.getElementById('usersPlatformChart');
    if (canvasPlatform) {
        if (isEmpty(data.usersPlatformValues)) {
            canvasPlatform.parentElement.innerHTML = createPremiumChartEmpty("Ranking Vacío", "No hay datos de uso para generar un ranking de plataformas.", "fa-trophy");
        } else {
            const ctxPlatform = canvasPlatform.getContext('2d');
            const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8';
            new Chart(ctxPlatform, {
                type: 'bar',
                data: {
                    labels: data.usersPlatformLabels,
                    datasets: [{
                        label: 'Usuarios',
                        data: data.usersPlatformValues,
                        backgroundColor: data.accentColor,
                        borderRadius: 6,
                        barThickness: 32
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { size: 9 } } },
                        y: { beginAtZero: true, grid: { display: false }, ticks: { color: textColor, stepSize: 1, font: { size: 9 } } }
                    }
                }
            });
        }
    }

    // Chart: Users per Area (Bar)
    const canvasArea = document.getElementById('usersAreaBarChart');
    if (canvasArea) {
        if (isEmpty(data.usersAreaValues)) {
            canvasArea.parentElement.innerHTML = createPremiumChartEmpty("Distribución TI", "Registra áreas para visualizar la distribución de servicios.", "fa-chart-pie");
        } else {
            const ctxAreaBar = canvasArea.getContext('2d');
            const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8';
            // Helper to handle potential gradients (take first color)
            const areaColors = (data.usersAreaColors || []).map(c => {
                if (c && c.includes('gradient')) {
                    const match = c.match(/#[0-9a-fA-F]{3,6}/);
                    return match ? match[0] : '#10b981';
                }
                return c || '#10b981';
            });

            new Chart(ctxAreaBar, {
                type: 'bar',
                data: {
                    labels: data.usersAreaLabels,
                    datasets: [{
                        label: 'Usuarios',
                        data: data.usersAreaValues,
                        backgroundColor: areaColors,
                        borderRadius: 6,
                        barThickness: 32
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { size: 9 } } },
                        y: { beginAtZero: true, grid: { display: false }, ticks: { color: textColor, stepSize: 1, font: { size: 9 } } }
                    }
                }
            });
        }
    }

    // Chart: Most Visited Platforms
    const canvasVisited = document.getElementById('mostVisitedChart');
    if (canvasVisited) {
        if (isEmpty(data.mostVisitedValues)) {
            canvasVisited.parentElement.innerHTML = createPremiumChartEmpty("Sin Tráfico", "Las visitas aparecerán aquí conforme se use el portal.", "fa-chart-line");
        } else {
            const ctxVisited = canvasVisited.getContext('2d');
            const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8';
            new Chart(ctxVisited, {
                type: 'bar',
                data: {
                    labels: data.mostVisitedLabels,
                    datasets: [{
                        label: 'Visitas',
                        data: data.mostVisitedValues,
                        backgroundColor: '#3b82f6',
                        borderRadius: 6,
                        barThickness: 32
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { size: 9 } } },
                        y: { beginAtZero: true, grid: { display: false }, ticks: { color: textColor, stepSize: 1, font: { size: 9 } } }
                    }
                }
            });
        }
    }

    // Chart: Storage Usage (The New Real Storage Monitor)
    const canvasStorage = document.getElementById('storageUsageChart');
    if (canvasStorage) {
        fetch('/api/drive/stats')
            .then(resp => resp.json())
            .then(statsData => {
                if (statsData.success && !isEmpty(statsData.charts.storage.values)) {
                    const ctxStorage = canvasStorage.getContext('2d');
                    
                    // Conversión MB -> GB
                    const valuesInGB = statsData.charts.storage.values.map(v => (v / 1024).toFixed(2));
                    
                    new Chart(ctxStorage, {
                        type: 'bar',
                        data: {
                            labels: statsData.charts.storage.labels, // Arreglos multilínea del API
                            datasets: [{
                                label: 'Ocupación (GB)',
                                data: valuesInGB,
                                backgroundColor: [
                                    '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
                                    '#0ea5e9', '#8b5cf6', '#ec4899'
                                ],
                                borderRadius: 8,
                                barThickness: 45
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return ` Ocupación: ${context.raw} GB`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(255,255,255,0.05)' },
                                    ticks: { color: '#64748b', font: { size: 9 } }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: {
                                        color: '#94a3b8',
                                        font: { size: 8, weight: '700' },
                                        padding: 10
                                    }
                                }
                            }
                        }
                    });
                } else {
                    canvasStorage.parentElement.innerHTML = createPremiumChartEmpty("Sin Datos", "Asigne espacio a las plataformas para ver el peso en GB.", "fa-database");
                }
            });
    }
});
