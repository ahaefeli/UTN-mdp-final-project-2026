'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authService from '../../services/authService';
import userService from '../../services/userService';
import { ROLE_TRANSLATIONS } from '../../utils/roles';
import { clubInitials } from '../../utils/clubMark';
import { phoneError } from '../../utils/phone';
import { uploadFileError } from '../../utils/uploads';
import {
  PageHeader,
  Button,
  Alert,
  LoadingState,
  StatusBadge,
} from '../../components/ui';
import chrome from '../../components/ui/PageChrome.module.css';
import styles from './page.module.css';

const ROLE_VARIANTS = {
  CLUB_ADMIN: 'primary',
  COACH: 'accent',
  PLAYER: 'success',
  REFEREE: 'neutral',
  SCORER: 'neutral',
};

function documentFor(profile) {
  if (!profile) return null;
  if (profile.role === 'PLAYER') return profile.medical_certificate || null;
  if (profile.role === 'COACH') return profile.coach_certificate || null;
  return null;
}

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
  const [fieldErrors, setFieldErrors] = useState({ firstName: '', lastName: '' });

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

  const loadUserProfile = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
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
        setFile(null);
        setFieldErrors({ firstName: '', lastName: '' });
      }
    } catch (err) {
      console.error('Error al obtener perfil:', err);
      setErrorMsg('No se pudo cargar la información de tu perfil.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const next = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    if (!next) {
      setFile(null);
      return;
    }
    const invalidFile = uploadFileError(next);
    if (invalidFile) {
      setErrorMsg(invalidFile);
      e.target.value = '';
      setFile(null);
      return;
    }
    setErrorMsg('');
    setFile(next);
  };

  const savedFirstName = user?.first_name || '';
  const savedLastName = user?.last_name || '';
  const savedPhone = user?.phone || '';
  const isDirty =
    firstName !== savedFirstName ||
    lastName !== savedLastName ||
    phone !== savedPhone ||
    file !== null;

  const needsDocument = user && (user.role === 'PLAYER' || user.role === 'COACH');
  const documentUrl = documentFor(user);
  const documentLabel = user?.role === 'PLAYER' ? 'Apto médico' : 'Certificado de entrenador';
  const displayName = `${firstName} ${lastName}`.trim() || username || 'Tu perfil';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const nextErrors = {
      firstName: firstName.trim() ? '' : 'Ingresá tu nombre para guardar.',
      lastName: lastName.trim() ? '' : 'Ingresá tu apellido para guardar.',
    };
    setFieldErrors(nextErrors);

    if (nextErrors.firstName || nextErrors.lastName) {
      setErrorMsg('El nombre y el apellido son obligatorios.');
      return;
    }

    const invalidPhone = phoneError(phone);
    if (invalidPhone) {
      setErrorMsg(invalidPhone);
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

      await loadUserProfile({ silent: true });
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

        <section className={chrome.card} aria-labelledby="profile-identity-title">
          <div className={styles.identity}>
            {user?.club_logo_url ? (
              <img
                src={user.club_logo_url}
                alt={user.club_name ? `Escudo de ${user.club_name}` : 'Escudo del club'}
                className={styles.clubMark}
              />
            ) : user?.club_name ? (
              <span className={styles.clubInitials} aria-hidden="true">
                {clubInitials(user.club_name)}
              </span>
            ) : null}
            <div>
              <h2 id="profile-identity-title" className={styles.identityName}>
                {displayName}
              </h2>
              <div className={styles.identityMeta}>
                <StatusBadge variant={ROLE_VARIANTS[user?.role] || 'neutral'}>
                  {ROLE_TRANSLATIONS[user?.role] || user?.role}
                </StatusBadge>
                {user?.club_name ? <span>{user.club_name}</span> : null}
              </div>
            </div>
          </div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Usuario</dt>
              <dd>{username || '—'}</dd>
            </div>
            <div className={styles.fact}>
              <dt>DNI / Documento</dt>
              <dd>{dni || '—'}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Rol</dt>
              <dd>{ROLE_TRANSLATIONS[user?.role] || user?.role || '—'}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Club</dt>
              <dd>
                {user?.club_name ? (
                  <span className={styles.clubFact}>{user.club_name}</span>
                ) : (
                  'Sin club'
                )}
              </dd>
            </div>
          </dl>
          <p className={chrome.muted}>Usuario, documento, rol y club los define la liga.</p>
        </section>

        <section className={chrome.card} aria-labelledby="profile-contact-title">
          <h2 id="profile-contact-title" className={chrome.sectionTitle}>
            Datos de contacto
          </h2>

          <form onSubmit={handleSubmit} className={chrome.form}>
            <div className={chrome.formRow}>
              <div className={chrome.formGroup}>
                <label className={chrome.label} htmlFor="profile-first-name">
                  Nombre <span className={styles.required}>Obligatorio</span>
                </label>
                <input
                  id="profile-first-name"
                  type="text"
                  className={`${chrome.input} ${fieldErrors.firstName ? styles.inputError : ''}`}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (fieldErrors.firstName) {
                      setFieldErrors((current) => ({ ...current, firstName: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
                  aria-describedby={fieldErrors.firstName ? 'profile-first-name-error' : undefined}
                  autoComplete="given-name"
                />
                {fieldErrors.firstName ? (
                  <p id="profile-first-name-error" className={styles.fieldError}>
                    {fieldErrors.firstName}
                  </p>
                ) : null}
              </div>

              <div className={chrome.formGroup}>
                <label className={chrome.label} htmlFor="profile-last-name">
                  Apellido <span className={styles.required}>Obligatorio</span>
                </label>
                <input
                  id="profile-last-name"
                  type="text"
                  className={`${chrome.input} ${fieldErrors.lastName ? styles.inputError : ''}`}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (fieldErrors.lastName) {
                      setFieldErrors((current) => ({ ...current, lastName: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
                  aria-describedby={fieldErrors.lastName ? 'profile-last-name-error' : undefined}
                  autoComplete="family-name"
                />
                {fieldErrors.lastName ? (
                  <p id="profile-last-name-error" className={styles.fieldError}>
                    {fieldErrors.lastName}
                  </p>
                ) : null}
              </div>
            </div>

            <div className={chrome.formGroup}>
              <label className={chrome.label} htmlFor="profile-phone">
                Teléfono de contacto
              </label>
              <input
                id="profile-phone"
                type="tel"
                className={chrome.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                autoComplete="tel"
              />
            </div>

            {needsDocument && (
              <fieldset className={styles.document}>
                <legend className={chrome.sectionTitle}>{documentLabel}</legend>
                <p className={styles.docStatus}>
                  {documentUrl ? (
                    <a
                      href={documentUrl}
                      className={styles.docLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver archivo cargado
                    </a>
                  ) : (
                    <span>Sin archivo</span>
                  )}
                </p>
                <div className={styles.fileField}>
                  <input
                    id="profile-document"
                    type="file"
                    className={styles.fileInput}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="profile-document" className={styles.fileButton}>
                    Elegir archivo
                  </label>
                  <span className={styles.fileName}>
                    {file ? file.name : 'PDF o imagen'}
                  </span>
                </div>
              </fieldset>
            )}

            <div className={`${chrome.actionsRow} ${chrome.actionsEnd}`}>
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
