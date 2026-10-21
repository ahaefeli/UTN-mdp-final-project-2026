import axios from 'axios';
import { getPublicApiBase } from '../utils/publicApi';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: `${getPublicApiBase()}/`,
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
