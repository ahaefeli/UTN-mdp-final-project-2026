import axios from 'axios';

class ApiService {
    constructor() {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/';
        const cleanBase = base.endsWith('/') ? base : `${base}/`;
        this.client = axios.create({
            baseURL: `${cleanBase}internal/`
        });
    }

    async get(endpoint) {
        try {
            const response = await this.client.get(endpoint);
            return response.data;
        } catch (error) {
            console.error(`Error al consumir ${endpoint}:`, error);
            throw error;
        }
    }
}

export const apiService = new ApiService();
