import apiClient from './apiClient';

export const courtService = {
  /**
   * Obtiene la lista de canchas de juego disponibles.
   * @param {object} params - Filtros opcionales como { club_id }.
   * @returns {Promise<object>} Lista de canchas.
   */
  async getCourts(params = {}) {
    try {
      const response = await apiClient.get('internal/canchas/', { params });
      return response.data; // Retorna { data: [...] }
    } catch (error) {
      console.error('Error al obtener canchas:', error);
      throw error;
    }
  }
};

export default courtService;
