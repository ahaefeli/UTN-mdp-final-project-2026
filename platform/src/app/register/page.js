'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '../../services/apiClient';
import styles from './page.module.css';

function PublicRegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get('token') : '';

  const [step, setStep] = useState(1); // 1: Datos del Club, 2: Datos de Usuario, 3: Éxito
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'valid'
  const [errorMsg, setErrorMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!name.trim()) {
      setErrorMessage('El nombre del club es obligatorio.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('El email del club es obligatorio.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validaciones de Contraseña
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
      formData.append('club_name', name.trim());
      formData.append('club_address', address.trim());
      formData.append('club_phone', phone.trim());
      formData.append('club_email', email.trim());
      formData.append('admin_first_name', firstName.trim());
      formData.append('admin_last_name', lastName.trim());
      formData.append('admin_email', adminEmail.trim());
      formData.append('password', password); // Enviar contraseña

      // Send flat fields too defensively
      formData.append('name', name.trim());
      formData.append('address', address.trim());
      formData.append('phone', phone.trim());
      formData.append('email', email.trim());
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());

      if (logoFile) {
        formData.append('logo', logoFile);
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
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Verificando enlace de invitación...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`${styles.card} ${styles.errorCard}`}>
        <div className={styles.errorIcon}>
          <i className="bi bi-x-circle-fill" style={{ fontSize: '2rem' }}></i>
        </div>
        <h2 className={styles.errorTitle}>Invitación Inválida</h2>
        <p className={styles.errorDesc}>{errorMsg || 'El enlace es inválido o ha expirado. Contacta al administrador.'}</p>
        <a href="/" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: '1rem' }}>
          Volver al Inicio
        </a>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className={`${styles.card} ${styles.successCard}`}>
        <div className={styles.successIcon}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem' }}></i>
        </div>
        <h2 className={styles.successTitle}>¡Registro Recibido!</h2>
        
        <div role="alert" className={styles.alertBox}>
          <i className="bi bi-info-circle-fill" style={{ marginRight: '0.5rem', fontSize: '1.20rem' }}></i>
          <span>Tu solicitud de registro ha sido recibida con éxito. No podrás iniciar sesión con tus credenciales hasta que el administrador de la liga apruebe la cuenta de tu club.</span>
        </div>

        <a href="/" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: '1.5rem' }}>
          Volver al Inicio
        </a>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {/* Wizard Steps Indicator */}
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

      <header className={styles.cardHeader}>
        <h2 className={styles.title}>
          {step === 1 ? 'Completar Registro de Club' : 'Datos del Administrador'}
        </h2>
        <p className={styles.subtitle}>
          {step === 1 
            ? 'Por favor verifica y completa la información de tu club para unirse a la liga.' 
            : 'Configura las credenciales de acceso para administrar la cuenta del club.'}
        </p>
      </header>

      {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}
      {errorMessage && <div className={styles.errorAlert}>{errorMessage}</div>}

      {step === 1 && (
        <form onSubmit={handleNextStep}>
          <h3 className={styles.sectionTitle}>Datos del Club</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre del Club *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email del Club *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
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
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setLogoFile(file || null);
                    if (file) {
                      setLogoPreview(URL.createObjectURL(file));
                    } else {
                      setLogoPreview('');
                    }
                  }}
                  className={styles.fileInput}
                  disabled={isSubmitting}
                />
                {logoPreview && (
                  <div className={styles.previewContainer}>
                    <img src={logoPreview} alt="Vista previa del logo" className={styles.previewImage} />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview('');
                      }}
                      className={styles.btnRemoveLogo}
                    >
                      Quitar Logo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.actionsContainer}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              <span>Siguiente</span>
              <i className="bi bi-arrow-right-short" style={{ marginLeft: '0.25rem', fontSize: '1.2rem' }}></i>
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <h3 className={styles.sectionTitle}>Datos del Administrador del Club</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={styles.input}
                required
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
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Email del Administrador *</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={styles.input}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
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
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.actionsContainer} style={{ justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              <i className="bi bi-arrow-left-short" style={{ marginRight: '0.25rem', fontSize: '1.2rem' }}></i>
              Volver
            </button>
            <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.btnPrimary}`}>
              {isSubmitting ? (
                <>
                  <div className={styles.spinner} style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderLeftColor: '#ffffff', marginRight: '0.5rem' }} />
                  Enviando...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill" style={{ marginRight: '0.25rem' }}></i>
                  Enviar Registro
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PublicRegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.brandContainer}>
        <h1 className={styles.brandText}>
          Voley<span className={styles.brandTextHighlight}>Hub</span>
        </h1>
      </div>
      <Suspense
        fallback={
          <div className={styles.card}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Cargando...</p>
            </div>
          </div>
        }
      >
        <PublicRegisterForm />
      </Suspense>
    </div>
  );
}
