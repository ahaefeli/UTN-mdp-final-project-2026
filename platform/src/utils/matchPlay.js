export function resultBlockReason(match) {
  if (!match) return null;
  if (match.tournament_status && match.tournament_status !== 'IN_PROGRESS') {
    return 'No se puede iniciar ni cargar el resultado hasta que el torneo esté en disputa.';
  }
  if (match.match_datetime) {
    const when = new Date(match.match_datetime);
    if (!Number.isNaN(when.getTime()) && when.getTime() > Date.now()) {
      return 'No se puede iniciar ni cargar el resultado de un partido que todavía no se juega.';
    }
  }
  return null;
}

export function canRecordResult(match) {
  return !resultBlockReason(match);
}
