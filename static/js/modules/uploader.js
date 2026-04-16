import { UI } from './ui.js';

export class FileUploader {
    constructor(options = {}) {
        this.onSuccess = options.onSuccess || (() => {});
        this.onProgress = options.onProgress || (() => {});
    }

    async upload(file, path, options = {}) {
        if (!file || !path) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        if (options.password) {
            formData.append('password', options.password);
        }

        try {
            // Usamos fetch directo porque es FormData, no JSON
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                UI.toast(`"${file.name}" subido con éxito`);
                this.onSuccess(data);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            UI.toast(error.message, 'error', 4000);
        }
    }
}
