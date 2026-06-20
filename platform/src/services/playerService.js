import apiClient from './apiClient';

/**
 * Servicio para consumir las rutas REST relativas a Jugadores (Players) en VoleyHub.
 */
export const playerService = {
  /**
   * Obtiene la lista de jugadores, opcionalmente filtrada por equipo.
   * @param {string} [teamId] - UUID opcional del equipo para filtrar.
   * @returns {Promise<object>} Lista de jugadores devuelta por el backend.
   */
  async getPlayers(teamId = '') {
    try {
      const params = {};
      if (teamId) {
        params.team_id = teamId;
      }
      const response = await apiClient.get('internal/jugadores/', { params });
      return response.data; // Retorna { data: [...] }
    } catch (error) {
      console.error('Error al obtener jugadores:', error);
      throw error;
    }
  }
};

export default playerService;
