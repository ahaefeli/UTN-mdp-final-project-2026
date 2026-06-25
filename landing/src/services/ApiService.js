import axios from 'axios';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: 'http://127.0.0.1:8000/api/internal/'
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
