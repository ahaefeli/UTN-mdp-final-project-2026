import json
from datetime import timedelta

import pytest
from django.utils import timezone

from tests.factories import (
    make_club,
    make_court,
    make_match,
    make_stage,
    make_team,
    make_tournament,
)


@pytest.mark.django_db
class TestMatchReschedule:
    def test_reschedule_rejects_collision(
        self, api_client, auth_header, stage, team_a, team_b, team_c, club_b, court, court_b
    ):
        dt = timezone.now() + timedelta(days=2)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt)
        team_d = make_team(club_b, name='Equipo D')
        m = make_match(stage, team_c, team_d, court=court_b, match_datetime=dt)
        res = api_client.post(
            '/internal/torneos/partidos/reprogramar/',
            data=json.dumps({
                'match_id': str(m.id),
                'court_id': court.id,
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'cancha' in res.json()['error']
        m.refresh_from_db()
        assert m.court_id == court_b.id

    def test_reschedule_finished_rejected(self, api_client, auth_header, match_prep, court_b):
        match_prep.status = 'FINISHED'
        match_prep.save(update_fields=['status'])
        res = api_client.post(
            '/internal/torneos/partidos/reprogramar/',
            data=json.dumps({'match_id': str(match_prep.id), 'court_id': court_b.id}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'reprogramar' in res.json()['error']

    def test_reschedule_other_org_forbidden(
        self, api_client, auth_header, other_organization
    ):
        oclub = make_club(other_organization)
        oa = make_team(oclub, name='OA')
        ob = make_team(oclub, name='OB')
        ocourt = make_court(oclub)
        ot = make_tournament(other_organization)
        os_ = make_stage(ot)
        m = make_match(os_, oa, ob, court=ocourt)
        new_court = make_court(oclub, name='Otra')
        res = api_client.post(
            '/internal/torneos/partidos/reprogramar/',
            data=json.dumps({'match_id': str(m.id), 'court_id': new_court.id}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 404

    def test_reschedule_parses_iso_datetime(self, api_client, auth_header, match_prep, court_b):
        new_dt = timezone.now() + timedelta(days=5)
        res = api_client.post(
            '/internal/torneos/partidos/reprogramar/',
            data=json.dumps({
                'match_id': str(match_prep.id),
                'court_id': court_b.id,
                'match_datetime': new_dt.isoformat(),
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        match_prep.refresh_from_db()
        assert match_prep.court_id == court_b.id
        assert abs((match_prep.match_datetime - new_dt).total_seconds()) < 1
