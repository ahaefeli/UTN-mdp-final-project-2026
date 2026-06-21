'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import authService from '../../services/authService';
import userService from '../../services/userService';

export default function MisDatosPage() {
  const router = useRouter();

  // Estados de carga y sesión
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del formulario
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [username, setUsername] = useState('');
  const [file, setFile] = useState(null);

  // Estados de retroalimentación
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Carga inicial y validación
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      loadUserProfile();
    }
  }, [router]);

  // Cargar perfil completo de la base de datos
  const loadUserProfile = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id) {
        const response = await userService.getUserById(currentUser.id);
        const profile = response.data;
        
        setUser(profile);
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setPhone(profile.phone || '');
        setDni(profile.dni || '');
        setUsername(profile.username || '');
      }
    } catch (err) {
      console.error('Error al obtener perfil:', err);
      setErrorMsg('No se pudo cargar la información de tu perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador del archivo seleccionado
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Guardar cambios del perfil
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('El nombre y el apellido son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Construir FormData para soportar multipart/form-data
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('phone', phone.trim());

      // Lógica basada en Roles (RBAC) para el archivo adjunto
      if (file) {
        if (user.role === 'PLAYER') {
          formData.append('medical_clearance', file); // Apto Médico
        } else if (user.role === 'COACH') {
          formData.append('coach_certificate', file); // Certificado de Entrenador
        }
      }

      await userService.updateProfile(user.id, formData);
      setSuccessMsg('Perfil actualizado con éxito.');
      setFile(null); // Limpiar archivo tras subirlo
      
      // Recargar datos actualizados
      await loadUserProfile();
    } catch (err) {
      console.error('Error al actualizar datos:', err);
      let msg = 'Error al actualizar el perfil de usuario.';
      if (err.response && err.response.data && err.response.data.error) {
        msg = err.response.data.error;
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Cabecera */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          <span className={styles.headerHighlight}>Mis</span> Datos
        </h1>
        <Link href="/" className={styles.btnBack}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Link>
      </header>

      {/* Alertas */}
      {errorMsg && <div className={styles.error}>{errorMsg}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      {/* Formulario */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Editar Perfil Personal</h2>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Usuario</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              disabled={true}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>DNI / Documento</label>
            <input
              type="text"
              className={styles.input}
              value={dni}
              disabled={true}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre</label>
            <input
              type="text"
              className={styles.input}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Apellido</label>
            <input
              type="text"
              className={styles.input}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Teléfono de Contacto</label>
            <input
              type="text"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Lógica basada en Roles (RBAC) */}
          {user && user.role === 'PLAYER' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Apto Médico (Archivo PDF o Imagen)</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  className={styles.fileInput}
                  accept=".pdf, image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {user && user.role === 'COACH' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Certificado de Entrenador (Archivo PDF o Imagen)</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  className={styles.fileInput}
                  accept=".pdf, image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
