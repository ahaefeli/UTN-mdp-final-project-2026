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
  },

  async getTeams(params = {}) {
    try {
      const response = await apiClient.get('internal/equipos/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  },

  async updateTeam(id, teamData) {
    try {
      const response = await apiClient.put(`internal/equipos/${id}/`, teamData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar equipo con ID ${id}:`, error);
      throw error;
    }
  }
};

export default teamService;
