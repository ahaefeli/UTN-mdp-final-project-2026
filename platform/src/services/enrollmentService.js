import apiClient from './apiClient';

/**
 * Servicio para consumir las rutas REST relativas a Inscripciones de Torneos (Tournament Enrollments) en VoleyHub.
 */
export const enrollmentService = {
  /**
   * Obtiene la lista de inscripciones con filtros opcionales.
   * @param {string} [tournamentId] - UUID del torneo.
   * @param {string} [teamId] - UUID del equipo.
   * @returns {Promise<object>} Lista de inscripciones.
   */
  async getEnrollments(tournamentId = '', teamId = '') {
    try {
      const params = {};
      if (tournamentId) {
        params.tournament_id = tournamentId;
      }
      if (teamId) {
        params.team_id = teamId;
      }
      const response = await apiClient.get('internal/torneos/inscripciones/', { params });
      return response.data; // Retorna { data: [...] }
    } catch (error) {
      console.error('Error al obtener inscripciones:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva inscripción (vincula un equipo a un torneo).
   * @param {string} tournamentId - UUID del torneo.
   * @param {string} teamId - UUID del equipo.
   * @returns {Promise<object>} Inscripción creada.
   */
  async createEnrollment(tournamentId, teamId) {
    try {
      const response = await apiClient.post('internal/torneos/inscripciones/', {
        tournament_id: tournamentId,
        team_id: teamId
      });
      return response.data; // Retorna { data: {...} }
    } catch (error) {
      console.error('Error al crear inscripción:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los torneos activos para rellenar los selectores.
   * @returns {Promise<object>} Lista de torneos.
   */
  async getTournaments() {
    try {
      const response = await apiClient.get('internal/torneos/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener torneos:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los equipos para rellenar los selectores.
   * @returns {Promise<object>} Lista de equipos.
   */
  async getTeams() {
    try {
      const response = await apiClient.get('internal/equipos/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  }
};

export default enrollmentService;
