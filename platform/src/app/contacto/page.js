"use client";

import React, { useState } from "react";
import { PageHeader, Button, Alert } from "../../components/ui";
import { emailError } from "../../utils/identity";
import chromeStyles from "../../components/ui/PageChrome.module.css";
import styles from "./page.module.css";

export default function ContactoPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [club, setClub] = useState("");
  const [asunto, setAsunto] = useState("Consulta General");
  const [mensaje, setMensaje] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !mensaje.trim()) {
      setFormError("Completá el nombre y el mensaje.");
      setIsSubmitted(false);
      return;
    }
    const invalidEmail = emailError(email);
    if (invalidEmail) {
      setFormError(invalidEmail);
      setIsSubmitted(false);
      return;
    }
    setFormError("");
    setIsSubmitted(true);
    
    // Limpiar campos del formulario
    setNombre("");
    setEmail("");
    setClub("");
    setAsunto("Consulta General");
    setMensaje("");

    // Ocultar el mensaje de éxito después de unos segundos si es necesario,
    // pero mantengámoslo en pantalla como confirmación visual hasta el siguiente envío.
  };

  return (
    <div className="appShell">
      <div className={chromeStyles.page}>
        <PageHeader
          title="Contacto"
          subtitle="Estamos para ayudarte. Envianos tu consulta sobre inscripciones, torneos o afiliaciones."
        />

        <div className={styles.twoCol}>
          <div className={chromeStyles.card}>
            <h2 className={chromeStyles.sectionTitle}>Envianos un mensaje</h2>
            <p className={chromeStyles.muted}>
              Completá los campos y te respondemos a la brevedad.
            </p>

            {formError && <Alert variant="error">{formError}</Alert>}
            {isSubmitted && (
              <Alert variant="success">
                ¡Mensaje enviado con éxito! Nos pondremos en contacto a la brevedad.
              </Alert>
            )}

            <form onSubmit={handleSubmit} className={chromeStyles.form} noValidate>
              <div className={chromeStyles.formGroup}>
                <label className={chromeStyles.label} htmlFor="contacto-nombre">
                  Nombre y Apellido
                </label>
                <input
                  id="contacto-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className={chromeStyles.input}
                />
              </div>

              <div className={chromeStyles.formGroup}>
                <label className={chromeStyles.label} htmlFor="contacto-email">
                  Correo Electrónico
                </label>
                <input
                  id="contacto-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: juan.perez@email.com"
                  className={chromeStyles.input}
                />
              </div>

              <div className={chromeStyles.formGroup}>
                <label className={chromeStyles.label} htmlFor="contacto-club">
                  Club / Institución <span className={chromeStyles.muted}>(Opcional)</span>
                </label>
                <input
                  id="contacto-club"
                  type="text"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  placeholder="Ej: Club Huracán"
                  className={chromeStyles.input}
                />
              </div>

              <div className={chromeStyles.formGroup}>
                <label className={chromeStyles.label} htmlFor="contacto-asunto">
                  Asunto
                </label>
                <select
                  id="contacto-asunto"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className={chromeStyles.select}
                >
                  <option value="Consulta General">Consulta General</option>
                  <option value="Inscripción a Torneo">Inscripción a Torneo</option>
                  <option value="Afiliación de Club">Afiliación de Club</option>
                  <option value="Prensa">Prensa</option>
                </select>
              </div>

              <div className={chromeStyles.formGroup}>
                <label className={chromeStyles.label} htmlFor="contacto-mensaje">
                  Mensaje
                </label>
                <textarea
                  id="contacto-mensaje"
                  rows={5}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe tu mensaje o consulta detallada aquí..."
                  className={chromeStyles.textarea}
                />
              </div>

              <Button type="submit" block>
                <i className="bi bi-send-fill" aria-hidden="true" />
                Enviar Mensaje
              </Button>
            </form>
          </div>

          <div className={chromeStyles.stack}>
            <div className={chromeStyles.card}>
              <h2 className={chromeStyles.sectionTitle}>Información de Contacto</h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <i className="bi bi-envelope-fill" aria-hidden="true" />
                  </div>
                  <div>
                    <span className={styles.infoLabel}>Correo Electrónico</span>
                    <a href="mailto:info@liganecocheavoley.com" className={styles.infoValue}>
                      info@liganecocheavoley.com
                    </a>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <i className="bi bi-telephone-fill" aria-hidden="true" />
                  </div>
                  <div>
                    <span className={styles.infoLabel}>WhatsApp / Teléfono</span>
                    <a
                      href="https://wa.me/542262000000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.infoValue}
                    >
                      +54 2262 000000
                    </a>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                  </div>
                  <div>
                    <span className={styles.infoLabel}>Sede Social</span>
                    <span className={styles.infoText}>
                      Calle 63 N° 2800, Necochea, Buenos Aires.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.map}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3098.8105740411833!2d-58.7471243!3d-38.5566994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x958fd5be903b4131%3A0xc3cf33887f1eb7c4!2sCalle%2063%202800%2C%20Necochea%2C%2520Buenos%2520Aires!5e0!3m2!1ses!4m2!1spt!2sar"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Sede LNV - Google Maps"
              />
            </div>

            <div className={chromeStyles.card}>
              <h3 className={chromeStyles.sectionTitle}>Seguinos en nuestras redes</h3>
              <div className={styles.socialRow}>
                <a href="#" className={`${styles.socialLink} ${styles.socialInstagram}`} title="Instagram">
                  <i className="bi bi-instagram" aria-hidden="true" />
                  Instagram
                </a>
                <a
                  href="https://wa.me/542262000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.socialLink} ${styles.socialWhatsapp}`}
                  title="WhatsApp"
                >
                  <i className="bi bi-whatsapp" aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
