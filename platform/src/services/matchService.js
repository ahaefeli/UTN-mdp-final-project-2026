import apiClient from './apiClient';

/**
 * Servicio para consumir las rutas REST relativas a Partidos (Matches) en VoleyHub.
 */
export const matchService = {
  /**
   * Obtiene la lista de partidos con filtros opcionales.
   * @param {object} params - Filtros como { club_id, team_id, status, page }.
   * @returns {Promise<object>} Lista de partidos y paginación si aplica.
   */
  async getMatches(params = {}) {
    try {
      const response = await apiClient.get('internal/torneos/partidos/', { params });
      return response.data; // Retorna { data: [...] } o { data: [...], pagination: {...} }
    } catch (error) {
      console.error('Error al obtener partidos:', error);
      throw error;
    }
  },

  /**
   * Obtiene los detalles de un partido por su ID.
   * @param {string} id - UUID del partido.
   * @returns {Promise<object>} Detalles del partido.
   */
  async getMatchById(id) {
    try {
      const response = await apiClient.get('internal/torneos/partidos/', {
        params: { match_id: id }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el partido con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo partido.
   * @param {object} matchData - Datos del partido a crear.
   * @returns {Promise<object>} Partido creado.
   */
  async createMatch(matchData) {
    try {
      const response = await apiClient.post('internal/torneos/partidos/', matchData);
      return response.data;
    } catch (error) {
      console.error('Error al crear partido:', error);
      throw error;
    }
  },

  /**
   * Actualiza un partido existente.
   * @param {string} id - UUID del partido.
   * @param {object} matchData - Datos modificados.
   * @returns {Promise<object>} Partido modificado.
   */
  async updateMatch(id, matchData) {
    try {
      const response = await apiClient.put('internal/torneos/partidos/', matchData, {
        params: { match_id: id }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el partido con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un partido.
   * @param {string} id - UUID del partido.
   * @returns {Promise<object>} Confirmación de eliminación.
   */
  async deleteMatch(id) {
    try {
      const response = await apiClient.delete('internal/torneos/partidos/', {
        params: { match_id: id }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el partido con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reprograma la fecha, cancha y/o árbitro de un partido.
   * @param {string} matchId - UUID del partido.
   * @param {object} data - { court_id, match_datetime, referee_id }
   * @returns {Promise<object>} Partido reprogramado.
   */
  async rescheduleMatch(matchId, data) {
    try {
      const response = await apiClient.post('internal/torneos/partidos/reprogramar/', {
        match_id: matchId,
        ...data
      });
      return response.data;
    } catch (error) {
      console.error(`Error al reprogramar el partido con ID ${matchId}:`, error);
      throw error;
    }
  },

  /**
   * Registra el final de un partido y la puntuación de los sets.
   * @param {string} matchId - UUID del partido.
   * @param {Array} scores - Lista de sets con formato [{ set_number: 1, local_points: 25, visitor_points: 20 }, ...]
   * @returns {Promise<object>} Partido finalizado.
   */
  async finishMatch(matchId, scores) {
    try {
      const response = await apiClient.post('internal/torneos/partidos/finalizar/', {
        match_id: matchId,
        score_detail: scores
      });
      return response.data;
    } catch (error) {
      console.error(`Error al finalizar el partido con ID ${matchId}:`, error);
      throw error;
    }
  }
};

export default matchService;
