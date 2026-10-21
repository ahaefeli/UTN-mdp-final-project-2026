'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '../../services/apiClient';
import { phoneError } from '../../utils/phone';
import { dniError, emailError, formatDni, normalizeDni } from '../../utils/identity';
import { logoFileError } from '../../utils/uploads';
import { Button, Alert, LoadingState } from '../../components/ui';
import styles from './page.module.css';

function PublicRegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get('token') : '';

  const [step, setStep] = useState(1); // 1: Datos del Club, 2: Datos de Usuario, 3: Éxito
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'valid'
  const [errorMsg, setErrorMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationRole, setInvitationRole] = useState('CLUB_ADMIN');

  // Form Fields - Paso 1 (Club)
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Form Fields - Paso 2 (Usuario Administrador)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminDni, setAdminDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('El enlace es inválido o ha expirado. Contacta al administrador.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await apiClient.get(`public/club-registration/?token=${token}`);
        const data = res.data?.data;
        if (data) {
          setName(data.club_name || '');
          setAddress(data.club_address || '');
          setPhone(data.club_phone || '');
          setEmail(data.club_email || '');
          setFirstName(data.admin_first_name || '');
          setLastName(data.admin_last_name || '');
          setAdminEmail(data.admin_email || '');
          setAdminUsername(data.admin_username || '');
          setAdminDni(formatDni(data.admin_dni));
          
          // Capturar y guardar el rol enviado por el backend
          const roleFromBackend = data.role || 'CLUB_ADMIN';
          setInvitationRole(roleFromBackend);
          
          // Si el rol es REFEREE o SCORER, omitimos el paso del Club y saltamos directamente a Datos del Usuario
          if (['REFEREE', 'SCORER'].includes(roleFromBackend)) {
            setStep(2);
          }
          
          setStatus('valid');
        } else {
          setStatus('error');
          setErrorMsg('El enlace es inválido o ha expirado. Contacta al administrador.');
        }
      } catch (err) {
        console.error('Error al verificar token:', err);
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'El enlace es inválido o ha expirado. Contacta al administrador.');
      }
    };

    verifyToken();
  }, [token]);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (['REFEREE', 'SCORER'].includes(invitationRole)) {
      setStep(2);
      return;
    }
    if (!name.trim()) {
      setErrorMessage('El nombre del club es obligatorio.');
      return;
    }
    const invalidClubEmail = emailError(email);
    if (invalidClubEmail) {
      setErrorMessage(invalidClubEmail);
      return;
    }
    const invalidPhone = phoneError(phone);
    if (invalidPhone) {
      setErrorMessage(invalidPhone);
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('El nombre y el apellido son obligatorios.');
      return;
    }
    const invalidAdminEmail = emailError(adminEmail);
    if (invalidAdminEmail) {
      setErrorMessage(invalidAdminEmail);
      return;
    }
    if (dniError(adminDni)) {
      setErrorMessage('El DNI debe tener 7 u 8 dígitos, sin letras.');
      return;
    }
    if (!adminUsername.trim()) {
      setErrorMessage('El nombre de usuario es obligatorio.');
      return;
    }
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(adminUsername)) {
      setErrorMessage('El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos (sin espacios).');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('admin_first_name', firstName.trim());
      formData.append('admin_last_name', lastName.trim());
      formData.append('admin_email', adminEmail.trim());
      formData.append('admin_username', adminUsername.trim());
      formData.append('admin_dni', normalizeDni(adminDni));
      formData.append('password', password); // Enviar contraseña

      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());

      // Solo si es CLUB_ADMIN se envían campos y logo del club
      if (!['REFEREE', 'SCORER'].includes(invitationRole)) {
        formData.append('club_name', name.trim());
        formData.append('club_address', address.trim());
        formData.append('club_phone', phone.trim());
        formData.append('club_email', email.trim());
        
        formData.append('name', name.trim());
        formData.append('address', address.trim());
        formData.append('phone', phone.trim());
        formData.append('email', email.trim());

        if (logoFile) {
          formData.append('logo', logoFile);
        }
      }

      await apiClient.post('public/club-registration/', formData, {
        headers: {
          'Content-Type': undefined
        }
      });
      setStep(3);
    } catch (err) {
      console.error('Error al registrar:', err);
      setErrorMessage(err.response?.data?.error || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <LoadingState label="Verificando enlace de invitación..." />;
  }

  if (status === 'error') {
    return (
      <div className={`${styles.card} ${styles.statusCard}`}>
        <div className={styles.errorIcon}>
          <i className="bi bi-x-circle-fill" aria-hidden="true" />
        </div>
        <h2 className={styles.errorTitle}>
          {errorMsg && errorMsg.includes('utilizado') ? 'Enlace ya utilizado' : 'Invitación Inválida'}
        </h2>
        <p className={styles.statusDesc}>
          {errorMsg || 'El enlace es inválido o ha expirado. Contacta al administrador.'}
        </p>
        <div className={styles.statusActions}>
          <a href="/" className={styles.linkButton}>
            <Button block>Volver al Inicio</Button>
          </a>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className={`${styles.card} ${styles.statusCard}`}>
        <div className={styles.successIcon}>
          <i className="bi bi-check-circle-fill" aria-hidden="true" />
        </div>
        <h2 className={styles.successTitle}>¡Registro Recibido!</h2>

        <Alert variant="warning" className={styles.alertBox}>
          {['REFEREE', 'SCORER'].includes(invitationRole) ? (
            <span>Tu solicitud de registro como {invitationRole === 'REFEREE' ? 'árbitro' : 'planillero'} ha sido recibida con éxito. No podrás iniciar sesión hasta que el administrador de la liga apruebe tu cuenta.</span>
          ) : (
            <span>Tu solicitud de registro ha sido recibida con éxito. No podrás iniciar sesión con tus credenciales hasta que el administrador de la liga apruebe la cuenta de tu club.</span>
          )}
        </Alert>

        <div className={styles.statusActions}>
          <a href="/" className={styles.linkButton}>
            <Button block>Volver al Inicio</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {/* Wizard Steps Indicator - Oculto para árbitros y planilleros */}
      {!['REFEREE', 'SCORER'].includes(invitationRole) && (
        <div className={styles.wizardIndicator}>
          <div className={`${styles.indicatorStep} ${step >= 1 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepName}>Datos del Club</span>
          </div>
          <div className={styles.indicatorLine} />
          <div className={`${styles.indicatorStep} ${step >= 2 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepName}>Datos de Usuario</span>
          </div>
        </div>
      )}

      <header className={styles.cardHeader}>
        <h2 className={styles.title}>
          {invitationRole === 'REFEREE' 
            ? 'Registro de Árbitro'
            : invitationRole === 'SCORER'
              ? 'Registro de Planillero'
              : (step === 1 ? 'Completar Registro de Club' : 'Datos del Administrador')}
        </h2>
        <p className={styles.subtitle}>
          {invitationRole === 'REFEREE'
            ? 'Completá tus datos personales para activar tu cuenta de árbitro oficial.'
            : invitationRole === 'SCORER'
              ? 'Completá tus datos personales para activar tu cuenta de planillero oficial.'
              : (step === 1 
                  ? 'Verificá y completá los datos del club para sumarte a la liga.' 
                  : 'Configurá las credenciales para administrar la cuenta del club.')}
        </p>
      </header>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {step === 1 && !['REFEREE', 'SCORER'].includes(invitationRole) && (
        <form onSubmit={handleNextStep} noValidate>
          <h3 className={styles.sectionTitle}>Datos del Club</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre del Club *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email del Club *</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Logo del Club</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const invalidFile = logoFileError(file);
                      if (invalidFile) {
                        setErrorMessage(invalidFile);
                        e.target.value = '';
                        setLogoFile(null);
                        setLogoPreview('');
                        return;
                      }
                      setErrorMessage(null);
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                    } else {
                      setLogoFile(null);
                      setLogoPreview('');
                    }
                  }}
                  className={styles.fileInput}
                  disabled={isSubmitting}
                />
                {logoPreview && (
                  <div className={styles.previewContainer}>
                    <img src={logoPreview} alt="Vista previa del logo" className={styles.previewImage} />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview('');
                      }}
                    >
                      Quitar Logo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.actionsContainer}>
            <Button type="submit">
              Siguiente
              <i className="bi bi-arrow-right-short" aria-hidden="true" />
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} noValidate>
          <h3 className={styles.sectionTitle}>
            {['REFEREE', 'SCORER'].includes(invitationRole) ? 'Datos Personales' : 'Datos del Administrador del Club'}
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Apellido *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Email del Usuario *</label>
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de Usuario *</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
                placeholder="Ej: admin_club"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>DNI *</label>
              <input
                type="text"
                value={adminDni}
                onChange={(e) => setAdminDni(formatDni(e.target.value))}
                className={styles.input}
                disabled={isSubmitting}
                placeholder="Ej: 12345678"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirmar Contraseña *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div
            className={`${styles.actionsContainer} ${
              ['REFEREE', 'SCORER'].includes(invitationRole)
                ? styles.actionsEnd
                : styles.actionsBetween
            }`}
          >
            {!['REFEREE', 'SCORER'].includes(invitationRole) && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                <i className="bi bi-arrow-left-short" aria-hidden="true" />
                Volver
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Enviando...'
              ) : (
                <>
                  <i className="bi bi-send-fill" aria-hidden="true" />
                  {['REFEREE', 'SCORER'].includes(invitationRole) ? 'Completar Registro' : 'Enviar Registro'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PublicRegisterPage() {
  return (
    <div className={styles.authShell}>
      <p className={styles.brand}>VoleyHub</p>
      <Suspense
        fallback={
          <div className={styles.card}>
            <LoadingState label="Cargando..." />
          </div>
        }
      >
        <PublicRegisterForm />
      </Suspense>
    </div>
  );
}
