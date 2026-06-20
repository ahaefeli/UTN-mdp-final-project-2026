import apiClient from './apiClient';

/**
 * Servicio para consumir las rutas REST relativas a Usuarios en VoleyHub.
 */
export const userService = {
  /**
   * Obtiene la lista de usuarios.
   * @param {object} params - Filtros como { page }.
   * @returns {Promise<object>} Lista de usuarios y paginación si aplica.
   */
  async getUsers(params = {}) {
    try {
      const response = await apiClient.get('internal/usuarios/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  /**
   * Obtiene un usuario específico por su ID.
   * @param {string} id - UUID/ID del usuario.
   * @returns {Promise<object>} Detalles del usuario.
   */
  async getUserById(id) {
    try {
      const response = await apiClient.get('internal/usuarios/', {
        params: { user_id: id }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Registra o crea un nuevo usuario (Jugador, Entrenador, Árbitro, etc.).
   * @param {object} userData - Datos de registro (user, password, role, organization_id, dni, etc.).
   * @returns {Promise<object>} Usuario creado.
   */
  async createUser(userData) {
    try {
      const response = await apiClient.post('internal/usuarios/', userData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  /**
   * Actualiza el perfil de un usuario existente.
   * @param {string} id - ID del usuario.
   * @param {object} userData - Datos modificados.
   * @returns {Promise<object>} Usuario modificado.
   */
  async updateUser(id, userData) {
    try {
      const response = await apiClient.put('internal/usuarios/', userData, {
        params: { user_id: id }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar usuario con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un usuario.
   * @param {string} id - ID del usuario.
   * @returns {Promise<object>} Confirmación de eliminación.
   */
  async deleteUser(id) {
    try {
      const response = await apiClient.delete('internal/usuarios/', {
        params: { user_id: id }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar usuario con ID ${id}:`, error);
      throw error;
    }
  }
};

export default userService;
