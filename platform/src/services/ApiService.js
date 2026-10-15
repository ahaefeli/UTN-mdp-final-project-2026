import axios from 'axios';
import { getApiBaseUrl } from './apiClient';

class ApiService {
    constructor() {
        const base = getApiBaseUrl();
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
