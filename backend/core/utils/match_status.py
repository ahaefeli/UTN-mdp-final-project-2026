from django.utils import timezone

def evaluate_and_update_match_status(match):
    if match.status in ['SUSPENDED', 'CANCELLED', 'FINISHED']:
        return
    if match.status in ('PREPARATION', 'SCHEDULED') and match.match_datetime and match.match_datetime <= timezone.now():
        from core.models import Match
        # Sin cancha no hay conflicto de recurso; no bloquear partidos "a confirmar" entre sí.
        if match.court_id is not None:
            if Match.objects.filter(court_id=match.court_id, status='IN_PROGRESS').exclude(id=match.id).exists():
                return
        match.status = 'IN_PROGRESS'
        match.save(update_fields=['status'])
