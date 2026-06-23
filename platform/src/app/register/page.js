'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '../../services/apiClient';
import styles from './page.module.css';

function PublicRegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get('token') : '';

  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'valid' | 'success'
  const [errorMsg, setErrorMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Logo file upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setErrorMessage(null);

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
      setStatus('success');
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

  if (status === 'success') {
    return (
      <div className={`${styles.card} ${styles.successCard}`}>
        <div className={styles.successIcon}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem' }}></i>
        </div>
        <h2 className={styles.successTitle}>¡Registro Enviado!</h2>
        <p className={styles.successDesc}>
          Los datos del club <strong>{name}</strong> y el administrador han sido guardados correctamente. La solicitud está pendiente de revisión por el administrador de VoleyHub.
        </p>
        <a href="/" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: '1.5rem' }}>
          Volver al Inicio
        </a>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.title}>Completar Registro de Club</h2>
        <p className={styles.subtitle}>Por favor verifica y completa la información de tu club para unirse a la liga.</p>
      </header>

      {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
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
        </div>

        {errorMessage && <div className={styles.errorAlert}>{errorMessage}</div>}

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
      </form>
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
