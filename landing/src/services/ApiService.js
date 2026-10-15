import axios from 'axios';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: 'http://192.168.1.8:8000/public/'
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
