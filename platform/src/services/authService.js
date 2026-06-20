import apiClient from './apiClient';

/**
 * Servicio de Autenticación para interactuar con la API de Django y manejar el JWT.
 */
export const authService = {
  /**
   * Envía credenciales de inicio de sesión al backend.
   * @param {string} email - Email o identificador único del usuario.
   * @param {string} password - Contraseña del usuario.
   * @returns {Promise<object>} Datos del usuario autenticado.
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('auth/login/', { email, password });
      const { token, user } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('lnv_token', token);
        localStorage.setItem('lnv_session', JSON.stringify(user));
      }

      return user;
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      throw error;
    }
  },

  /**
   * Cierra la sesión activa y elimina las credenciales almacenadas localmente.
   */
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lnv_token');
      localStorage.removeItem('lnv_session');
    }
  },

  /**
   * Obtiene la sesión actual almacenada del usuario.
   * @returns {object|null} Datos del usuario o null si no está autenticado.
   */
  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('lnv_session');
      try {
        return session ? JSON.parse(session) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  /**
   * Obtiene el token JWT actual.
   * @returns {string|null} Token o null.
   */
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lnv_token');
    }
    return null;
  },

  /**
   * Verifica si hay una sesión válida activa.
   * @returns {boolean} True si el usuario tiene un token almacenado.
   */
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;
