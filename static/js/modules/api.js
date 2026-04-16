/**
 * Nexus API Module
 * Centraliza las peticiones fetch con manejo automático de CSRF y errores.
 */

const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

const getErrorMessageFromResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.json();
        return data.error || `Error ${response.status}: ${response.statusText}`;
    }

    const text = await response.text();
    return text || `Error ${response.status}: ${response.statusText}`;
};

export const NexusAPI = {
    async request(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            console.error(`[NexusAPI Error] ${url}:`, error);
            throw error;
        }
    },

    get(url) {
        return this.request(url, { method: 'GET' });
    },

    post(url, body) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    async download(url, body, fallbackFilename = 'download') {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorMessage = await getErrorMessageFromResponse(response);
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const disposition = response.headers.get('content-disposition') || '';
        const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
        const filename = filenameMatch ? decodeURIComponent(filenameMatch[1].replace(/"/g, '')) : fallbackFilename;

        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
    }
};
