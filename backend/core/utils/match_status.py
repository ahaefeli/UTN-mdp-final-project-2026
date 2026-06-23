from django.utils import timezone

def evaluate_and_update_match_status(match):
    if match.status == 'PREPARATION' and match.match_datetime and match.match_datetime <= timezone.now():
        from core.models import Match
        if not Match.objects.filter(court_id=match.court_id, status='IN_PROGRESS').exclude(id=match.id).exists():
            match.status = 'IN_PROGRESS'
            match.save(update_fields=['status'])
