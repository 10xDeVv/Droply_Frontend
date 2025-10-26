const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async createRoom() {
        return this.request('/api/v1/rooms/create', {
            method: 'POST',
        });
    }

    async joinRoom(code, sessionId) {
        const normalized = (code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        return this.request('/api/v1/rooms/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Session-Id': sessionId,
            },
            body: JSON.stringify({ code }),
        });
    }

    async getRoom(roomId) {
        return this.request(`/api/v1/rooms/${roomId}`);
    }

    async requestUpload(roomId, fileName, fileSize, contentType) {
        return this.request('/api/v1/files/request-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                roomId,
                fileName,
                contentType,
                fileSize,
            }),
        });
    }

    async confirmUpload({ roomId, fileName, objectPath, contentType, fileSize }) {
        return this.request('/api/v1/files/confirm-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ roomId, fileName, objectPath, contentType, fileSize }),
        });
    }

    async getDownloadUrl(roomId, fileId) {
        return this.request(`/api/v1/files/download/${roomId}/${fileId}`);
    }

    async uploadToSupabase(signedUrl, file) {
        const response = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
            },
            body: file,
        });

        if (!response.ok) {
            throw new Error('Failed to upload file to storage');
        }

        return response;
    }
}

export const api = new ApiService();
