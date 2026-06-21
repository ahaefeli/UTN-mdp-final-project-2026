'use client';

import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import authService from '../../services/authService';
import matchService from '../../services/matchService';

export default function DashboardTestPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [matches, setMatches] = useState([]);
  
  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Carga inicial: Verificar si la sesión ya existe en localStorage
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const currentUser = authService.getCurrentUser();
      const currentToken = authService.getToken();
      setUser(currentUser);
      setToken(currentToken);
      setIsAuthenticated(true);
      fetchMatches();
    }
  }, []);

  // Función para obtener partidos del backend
  const fetchMatches = async () => {
    setIsFetchingMatches(true);
    setError('');
    try {
      const response = await matchService.getMatches();
      // El backend devuelve { data: [...] }
      setMatches(response.data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      let errorMsg = 'Error al conectar con el servidor.';
      
      if (err.response) {
        // Respuesta de error del backend (400, 401, 403, 500, etc.)
        const status = err.response.status;
        const details = err.response.data?.error || err.response.statusText;
        errorMsg = `Error del Servidor (${status}): ${details}`;
        
        if (status === 401) {
          setIsAuthenticated(false);
          setUser(null);
          setToken('');
          errorMsg = 'Tu sesión ha expirado o el token es inválido. Por favor, inicia sesión de nuevo.';
        }
      } else if (err.request) {
        // Petición hecha pero no se recibió respuesta (CORS o Servidor apagado)
        errorMsg = 'Error de Red o CORS. Verifica si el backend está corriendo en http://127.0.0.1:8000 y si CORS está habilitado.';
      }
      setError(errorMsg);
    } finally {
      setIsFetchingMatches(false);
    }
  };

  // Manejador del Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const loggedUser = await authService.login(email.trim(), password);
      const activeToken = authService.getToken();
      
      setUser(loggedUser);
      setToken(activeToken);
      setIsAuthenticated(true);
      setSuccessMessage('¡Inicio de sesión exitoso! Token obtenido e inyectado.');
      
      // Limpiar inputs
      setEmail('');
      setPassword('');
      
      // Obtener partidos automáticamente
      await fetchMatches();
    } catch (err) {
      console.error('Login error:', err);
      let errorMsg = 'Credenciales incorrectas o error en el servidor.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador del Logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setToken('');
    setMatches([]);
    setSuccessMessage('Sesión cerrada correctamente. Token eliminado.');
    setError('');
  };

  return (
    <div className={styles.container}>
      {/* Encabezado */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandHighlight}>VoleyHub</span>
          <span>Integración</span>
        </div>
        <div className={styles.badge} style={{ backgroundColor: '#002F87', color: 'white' }}>
          Next.js + Django REST
        </div>
      </header>

      {/* Mensajes de Alerta */}
      {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
      {successMessage && <div className={`${styles.alert} ${styles.alertSuccess}`}>{successMessage}</div>}

      {/* Si no está autenticado, renderizar Formulario de Login */}
      {!isAuthenticated ? (
        <div className={styles.authCard}>
          <h2 className={styles.cardTitle}>Iniciar Sesión</h2>
          <p className={styles.cardSubtitle}>
            Conéctate al backend de Django utilizando autenticación JWT
          </p>
          
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Usuario / Email / DNI</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ej: admin@voleyhub.com o 35.123.456"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña</label>
              <input
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <button type="submit" className={styles.btn} disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
            </button>
          </form>
        </div>
      ) : (
        /* Si está autenticado, renderizar Panel Principal de Pruebas */
        <div>
          {/* Faja de Sesión de Usuario */}
          <div className={styles.userPanel}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'VH'}
              </div>
              <div>
                <h3 className={styles.userName}>{user?.name || user?.username}</h3>
                <p className={styles.userRole}>
                  {user?.role} | DNI: {user?.dni || 'No provisto'}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className={styles.btnOutline}>
              Cerrar Sesión
            </button>
          </div>

          <div className={styles.dashboardGrid}>
            {/* Columna Izquierda: Listado de Partidos consumidos */}
            <div>
              <h2 className={styles.sectionTitle}>
                <span>Partidos Programados</span>
                <button 
                  onClick={fetchMatches} 
                  className={styles.btnOutline} 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  disabled={isFetchingMatches}
                >
                  {isFetchingMatches ? 'Cargando...' : 'Actualizar'}
                </button>
              </h2>

              {isFetchingMatches && <div className={styles.spinner} />}

              {!isFetchingMatches && matches.length === 0 && (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No se encontraron partidos</p>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>
                    La base de datos de Django puede no tener partidos creados en esta etapa o el filtro no coincide.
                  </p>
                </div>
              )}

              {!isFetchingMatches && matches.length > 0 && (
                <div className={styles.matchList}>
                  {matches.map((match) => (
                    <div key={match.id} className={styles.matchCard}>
                      <div className={styles.matchTeams}>
                        <div className={`${styles.teamName} ${styles.localTeam}`}>
                          {match.local_team_name}
                        </div>
                        
                        <div className={styles.vsContainer}>
                          <span className={styles.vsText}>VS</span>
                          {match.score_summary && (
                            <span className={styles.score}>{match.score_summary}</span>
                          )}
                        </div>
                        
                        <div className={`${styles.teamName} ${styles.visitorTeam}`}>
                          {match.visitor_team_name}
                        </div>
                      </div>
                      
                      <div className={styles.matchFooter}>
                        <div className={styles.refereeInfo}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span>Árbitro: {match.referee_name || 'Sin asignar'}</span>
                        </div>
                        
                        <span className={`${styles.statusBadge} ${
                          match.status === 'FINISHED' ? styles.statusFinished : 
                          match.status === 'IN_PROGRESS' ? styles.statusLive : styles.statusPending
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna Derecha: Estado Técnico del Token */}
            <div>
              <h2 className={styles.sectionTitle}>Depuración de JWT</h2>
              
              <div className={styles.tokenBox}>
                <div className={styles.tokenBoxTitle}>Token JWT Activo (Inyectado en Authorization header)</div>
                <div className={styles.tokenContent}>
                  {token}
                </div>
              </div>
              
              <div className={styles.alert} style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af', marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <p style={{ marginTop: 0, marginBottom: '0.5rem', fontWeight: 800 }}>¿Cómo funciona la integración?</p>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.4' }}>
                  <li>El servicio <code>authService.login()</code> hace POST al backend y recibe el token.</li>
                  <li>El token se guarda en <code>localStorage</code>.</li>
                  <li>El cliente <code>apiClient</code> intercepta cada petición e inyecta el header <code>Authorization: Bearer [token]</code>.</li>
                  <li>El backend Django valida el token y autoriza el acceso a los datos.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
