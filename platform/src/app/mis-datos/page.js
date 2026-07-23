'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authService from '../../services/authService';
import userService from '../../services/userService';
import {
  PageHeader,
  Button,
  Alert,
  LoadingState,
} from '../../components/ui';
import chrome from '../../components/ui/PageChrome.module.css';
import styles from './page.module.css';

export default function MisDatosPage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [username, setUsername] = useState('');
  const [file, setFile] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.role === 'ADMIN') {
        router.push('/');
      } else {
        setIsAuthenticated(true);
        loadUserProfile();
      }
    }
  }, [router]);

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

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
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('phone', phone.trim());

      if (file) {
        if (user.role === 'PLAYER') {
          formData.append('medical_clearance', file);
        } else if (user.role === 'COACH') {
          formData.append('coach_certificate', file);
        }
      }

      await userService.updateProfile(user.id, formData);
      setSuccessMsg('Perfil actualizado con éxito.');
      setFile(null);

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
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={`${chrome.page} ${styles.page}`}>
        <PageHeader
          title={
            <>
              <span className={styles.titleHighlight}>Mis</span> Datos
            </>
          }
          actions={
            <Link href="/" className={styles.backLink}>
              <i className="bi bi-arrow-left" aria-hidden="true" />
              Volver
            </Link>
          }
        />

        {(errorMsg || successMsg) && (
          <div className={styles.alerts}>
            {errorMsg && (
              <Alert variant="error">
                <div className={styles.alertContent}>
                  <span>{errorMsg}</span>
                  <Button variant="ghost" size="sm" onClick={() => setErrorMsg('')} aria-label="Cerrar alerta">
                    ×
                  </Button>
                </div>
              </Alert>
            )}
            {successMsg && (
              <Alert variant="success">
                <div className={styles.alertContent}>
                  <span>{successMsg}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSuccessMsg('')} aria-label="Cerrar alerta">
                    ×
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}

        <section className={chrome.card}>
          <h2 className={chrome.sectionTitle}>Editar Perfil Personal</h2>

          <form onSubmit={handleSubmit} className={chrome.form}>
            <div className={chrome.formGroup}>
              <label className={chrome.label} htmlFor="profile-username">
                Usuario
              </label>
              <input
                id="profile-username"
                type="text"
                className={chrome.input}
                value={username}
                disabled
              />
            </div>

            <div className={chrome.formGroup}>
              <label className={chrome.label} htmlFor="profile-dni">
                DNI / Documento
              </label>
              <input
                id="profile-dni"
                type="text"
                className={chrome.input}
                value={dni}
                disabled
              />
            </div>

            <div className={chrome.formGroup}>
              <label className={chrome.label} htmlFor="profile-first-name">
                Nombre
              </label>
              <input
                id="profile-first-name"
                type="text"
                className={chrome.input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className={chrome.formGroup}>
              <label className={chrome.label} htmlFor="profile-last-name">
                Apellido
              </label>
              <input
                id="profile-last-name"
                type="text"
                className={chrome.input}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className={chrome.formGroup}>
              <label className={chrome.label} htmlFor="profile-phone">
                Teléfono de Contacto
              </label>
              <input
                id="profile-phone"
                type="text"
                className={chrome.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {user && user.role === 'PLAYER' && (
              <div className={chrome.formGroup}>
                <label className={chrome.label} htmlFor="profile-medical">
                  Apto Médico (Archivo PDF o Imagen)
                </label>
                <input
                  id="profile-medical"
                  type="file"
                  className={styles.fileInput}
                  accept=".pdf, image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {user && user.role === 'COACH' && (
              <div className={chrome.formGroup}>
                <label className={chrome.label} htmlFor="profile-certificate">
                  Certificado de Entrenador (Archivo PDF o Imagen)
                </label>
                <input
                  id="profile-certificate"
                  type="file"
                  className={styles.fileInput}
                  accept=".pdf, image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <Button type="submit" block disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
