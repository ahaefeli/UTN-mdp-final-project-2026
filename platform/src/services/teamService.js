import apiClient from './apiClient';

export const teamService = {
  /**
   * Obtiene los equipos filtrados por categoría y rama.
   * @param {string} category - Categoría del equipo (ej: SUB_14, PRIMERA, etc.).
   * @param {string} branch - Rama del equipo (MALE, FEMALE).
   * @returns {Promise<object>} Lista de equipos que coinciden.
   */
  async getTeamsByCategoryAndBranch(category, branch) {
    try {
      const response = await apiClient.get('internal/equipos/', {
        params: { category, branch }
      });
      return response.data; // Retorna { data: [...] }
    } catch (error) {
      console.error('Error al obtener equipos por categoría y rama:', error);
      throw error;
    }
  }
};

export default teamService;
