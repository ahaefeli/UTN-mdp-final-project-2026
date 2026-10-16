import apiClient from './apiClient';

export const tournamentService = {
  /**
   * Obtiene la lista de todos los torneos.
   * @returns {Promise<object>} Lista de torneos.
   */
  async getTournaments(params) {
    try {
      const response = await apiClient.get('internal/torneos/', { params });
      return response.data; // Retorna { data: [...] }
    } catch (error) {
      console.error('Error al obtener los torneos:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo torneo con sus fechas (stages) asociadas.
   * @param {object} tournamentData - Payload { name, year, category, branch, stages: [...] }
   * @returns {Promise<object>} Torneo creado.
   */
  async createTournament(tournamentData) {
    try {
      const response = await apiClient.post('internal/torneos/', tournamentData);
      return response.data; // Retorna { data: {...} }
    } catch (error) {
      console.error('Error al crear el torneo:', error);
      throw error;
    }
  },

  /**
   * Obtiene un torneo por su ID.
   * @param {string} tournamentId - UUID del torneo.
   * @returns {Promise<object>} Detalles del torneo.
   */
  async getTournamentById(tournamentId) {
    try {
      const response = await apiClient.get(`internal/torneos/${tournamentId}/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener el torneo:', error);
      throw error;
    }
  },

  /**
   * Obtiene las fechas (stages) asociadas a un torneo.
   * @param {string} tournamentId - UUID del torneo.
   * @returns {Promise<object>} Lista de fechas.
   */
  async getStages(tournamentId) {
    try {
      const response = await apiClient.get('internal/torneos/fechas/', {
        params: { tournament_id: tournamentId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener las fechas del torneo:', error);
      throw error;
    }
  },

  /**
   * Agrega una nueva fecha (stage) a un torneo.
   * @param {object} stageData - Payload { tournament_id, date, name }
   * @returns {Promise<object>} Fecha creada.
   */
  async addStage(stageData) {
    try {
      const response = await apiClient.post('internal/torneos/fechas/', stageData);
      return response.data; // Retorna { data: {...} }
    } catch (error) {
      console.error('Error al agregar fecha:', error);
      throw error;
    }
  },

  /**
   * Actualiza un torneo existente.
   * @param {string} tournamentId - UUID del torneo.
   * @param {object} tournamentData - Payload de actualización.
   * @returns {Promise<object>} Torneo actualizado.
   */
  async updateTournament(tournamentId, tournamentData) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lnv_token') : '';
      const response = await apiClient.put(`internal/torneos/${tournamentId}/`, tournamentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar el torneo:', error);
      if (error.response) {
        const { status } = error.response;
        if (status === 401 || status === 403) {
          throw new Error('Permisos insuficientes o sesión expirada');
        }
      }
      throw error;
    }
  },

  /**
   * Elimina una fecha (stage) de un torneo.
   * @param {string|number} stageId - ID de la fecha.
   * @returns {Promise<object>} Respuesta del servidor.
   */
  async archiveTournament(tournamentId) {
    const response = await apiClient.put(`internal/torneos/${tournamentId}/`, { is_deleted: true });
    return response.data;
  },

  async restoreTournament(tournamentId) {
    const response = await apiClient.put(`internal/torneos/${tournamentId}/`, { is_deleted: false });
    return response.data;
  },

  async deleteTournament(tournamentId) {
    const response = await apiClient.delete(`internal/torneos/${tournamentId}/`);
    return response.data;
  },

  async deleteStage(stageId) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lnv_token') : '';
      const response = await apiClient.delete('internal/torneos/fechas/', {
        params: { id: stageId },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar fecha:', error);
      if (error.response) {
        const { status } = error.response;
        if (status === 401 || status === 403) {
          throw new Error('Permisos insuficientes o sesión expirada');
        }
      }
      throw error;
    }
  }
};

export default tournamentService;

