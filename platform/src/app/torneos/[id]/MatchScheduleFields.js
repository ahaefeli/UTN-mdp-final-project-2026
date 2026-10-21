'use client';

import dirStyles from '../../../components/ui/AdminDirectory.module.css';
import styles from './page.module.css';

export default function MatchScheduleFields({
  idPrefix,
  localTeamId,
  visitorTeamId,
  courtId,
  matchTime,
  refereeId,
  scorerId,
  onChange,
  enrolledTeams,
  courts,
  referees,
  scorers,
}) {
  return (
    <>
      <div className={styles.vsContainer}>
        <div className={dirStyles.formGroup}>
          <label className={dirStyles.label} htmlFor={`${idPrefix}-local-team`}>
            Equipo Local
          </label>
          <select
            id={`${idPrefix}-local-team`}
            value={localTeamId}
            onChange={(e) => onChange('localTeamId', e.target.value)}
            className={dirStyles.select}
            required
          >
            <option value="">Seleccione equipo...</option>
            {enrolledTeams
              .filter((enroll) => enroll.team_id !== visitorTeamId)
              .map((enroll) => (
                <option key={enroll.team_id} value={enroll.team_id}>
                  {enroll.club_name ? `${enroll.club_name} — ${enroll.team_name}` : enroll.team_name}
                </option>
              ))}
          </select>
        </div>

        <span className={styles.vsText}>VS.</span>

        <div className={dirStyles.formGroup}>
          <label className={dirStyles.label} htmlFor={`${idPrefix}-visitor-team`}>
            Equipo Visitante
          </label>
          <select
            id={`${idPrefix}-visitor-team`}
            value={visitorTeamId}
            onChange={(e) => onChange('visitorTeamId', e.target.value)}
            className={dirStyles.select}
            required
          >
            <option value="">Seleccione equipo...</option>
            {enrolledTeams
              .filter((enroll) => enroll.team_id !== localTeamId)
              .map((enroll) => (
                <option key={enroll.team_id} value={enroll.team_id}>
                  {enroll.club_name ? `${enroll.club_name} — ${enroll.team_name}` : enroll.team_name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className={dirStyles.formRow}>
        <div className={dirStyles.formGroup}>
          <label className={dirStyles.label} htmlFor={`${idPrefix}-court`}>
            Cancha
          </label>
          <select
            id={`${idPrefix}-court`}
            value={courtId}
            onChange={(e) => onChange('courtId', e.target.value)}
            className={dirStyles.select}
            required
          >
            <option value="">Seleccione cancha...</option>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name} ({court.club_name || 'Club'})
              </option>
            ))}
          </select>
        </div>

        <div className={dirStyles.formGroup}>
          <label className={dirStyles.label} htmlFor={`${idPrefix}-time`}>
            Hora del Partido
          </label>
          <input
            id={`${idPrefix}-time`}
            type="time"
            value={matchTime}
            onChange={(e) => onChange('matchTime', e.target.value)}
            className={dirStyles.input}
            required
          />
        </div>
      </div>

      <div className={dirStyles.formRow}>
        <div className={dirStyles.formGroup}>
          <label className={dirStyles.label} htmlFor={`${idPrefix}-referee`}>
            Árbitro Designado
          </label>
          <select
            id={`${idPrefix}-referee`}
            value={refereeId || ''}
            onChange={(e) => onChange('refereeId', e.target.value)}
            className={dirStyles.select}
          >
            <option value="">Sin asignar</option>
            {referees.map((ref) => (
              <option key={ref.id} value={ref.id}>
                {ref.name || ref.username}
              </option>
            ))}
          </select>
        </div>

        <div className={dirStyles.formGroup}>
          <label className={dirStyles.label} htmlFor={`${idPrefix}-scorer`}>
            Planillero Designado
          </label>
          <select
            id={`${idPrefix}-scorer`}
            value={scorerId || ''}
            onChange={(e) => onChange('scorerId', e.target.value)}
            className={dirStyles.select}
          >
            <option value="">Sin asignar</option>
            {scorers.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name || sc.username}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
