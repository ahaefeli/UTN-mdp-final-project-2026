import json
import uuid
from datetime import timedelta

import pytest
from django.utils import timezone

from core.models import Match
from public.utils.standings_calculator import calculate_standings
from tests.factories import (
    auth_header_for,
    make_club,
    make_court,
    make_match,
    make_stage,
    make_team,
    make_tournament,
    make_user,
    sets_3_0_local,
    sets_3_2_local,
)


FINISH_URL = '/internal/torneos/partidos/finalizar/'


def _finish(client, headers, match_id, score_detail):
    return client.post(
        FINISH_URL,
        data=json.dumps({'match_id': str(match_id), 'score_detail': score_detail}),
        content_type='application/json',
        **headers,
    )


@pytest.mark.django_db
class TestMatchFinishViewSuccess:
    def test_admin_can_finish(self, api_client, auth_header, match_prep):
        res = _finish(api_client, auth_header, match_prep.id, sets_3_0_local())
        assert res.status_code == 200
        match_prep.refresh_from_db()
        assert match_prep.status == 'FINISHED'
        assert match_prep.score_summary == '25-20, 25-18, 25-22'
        assert match_prep.sets_data['sets'][0]['local_points'] == 25

    def test_assigned_referee_can_finish(self, api_client, referee_auth_header, match_prep):
        res = _finish(api_client, referee_auth_header, match_prep.id, sets_3_0_local())
        assert res.status_code == 200
        assert res.json()['data']['status'] == 'FINISHED'

    def test_assigned_scorer_can_finish(self, api_client, scorer_auth_header, match_prep):
        res = _finish(api_client, scorer_auth_header, match_prep.id, sets_3_2_local())
        assert res.status_code == 200
        match_prep.refresh_from_db()
        assert match_prep.status == 'FINISHED'
        assert len(match_prep.sets_data['sets']) == 5

    def test_finish_updates_standings(
        self, api_client, auth_header, enrolled_tournament, stage, team_a, team_b, court, referee_user
    ):
        m = make_match(stage, team_a, team_b, court=court, referee=referee_user, status='PREPARATION')
        res = _finish(api_client, auth_header, m.id, sets_3_0_local())
        assert res.status_code == 200
        rows = {r['team_name']: r for r in calculate_standings(enrolled_tournament.id)}
        assert rows['Equipo A']['puntos'] == 3
        assert rows['Equipo B']['puntos'] == 0

        public = api_client.get(f'/public/torneos/{enrolled_tournament.id}/posiciones/')
        assert public.status_code == 200
        public_rows = {r['team_name']: r for r in public.json()}
        assert public_rows['Equipo A']['puntos'] == 3


@pytest.mark.django_db
class TestMatchFinishViewForbidden:
    def test_player_forbidden(self, api_client, player_user, match_prep):
        res = _finish(api_client, auth_header_for(player_user), match_prep.id, sets_3_0_local())
        assert res.status_code == 403

    def test_coach_forbidden(self, api_client, coach_user, match_prep):
        res = _finish(api_client, auth_header_for(coach_user), match_prep.id, sets_3_0_local())
        assert res.status_code == 403

    def test_club_admin_forbidden(self, api_client, club_admin_user, match_prep):
        res = _finish(api_client, auth_header_for(club_admin_user), match_prep.id, sets_3_0_local())
        assert res.status_code == 403

    def test_other_referee_forbidden(self, api_client, organization, match_prep):
        other_ref = make_user(
            organization=organization, role='REFEREE', email='ref2@test.com', username='ref2'
        )
        res = _finish(api_client, auth_header_for(other_ref), match_prep.id, sets_3_0_local())
        assert res.status_code == 403

    def test_other_scorer_forbidden(self, api_client, organization, match_prep):
        other = make_user(organization=organization, role='SCORER', email='sc2@test.com', username='sc2')
        res = _finish(api_client, auth_header_for(other), match_prep.id, sets_3_0_local())
        assert res.status_code == 403


@pytest.mark.django_db
class TestMatchFinishViewErrors:
    def test_already_finished(self, api_client, auth_header, match_prep):
        match_prep.status = 'FINISHED'
        match_prep.save(update_fields=['status'])
        res = _finish(api_client, auth_header, match_prep.id, sets_3_0_local())
        assert res.status_code == 400
        assert 'finalizado' in res.json()['error']

    def test_cancelled_match(self, api_client, auth_header, match_prep):
        match_prep.status = 'CANCELLED'
        match_prep.save(update_fields=['status'])
        res = _finish(api_client, auth_header, match_prep.id, sets_3_0_local())
        assert res.status_code == 400
        assert 'cancelado' in res.json()['error']

    def test_invalid_scoresheet(self, api_client, auth_header, match_prep):
        res = _finish(
            api_client,
            auth_header,
            match_prep.id,
            [{'local_points': 25, 'visitor_points': 20}],
        )
        assert res.status_code == 400

    def test_missing_match_id(self, api_client, auth_header):
        res = api_client.post(
            FINISH_URL,
            data=json.dumps({'score_detail': sets_3_0_local()}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400

    def test_nonexistent_match(self, api_client, auth_header):
        res = _finish(api_client, auth_header, uuid.uuid4(), sets_3_0_local())
        assert res.status_code == 404

    def test_other_organization_match_not_found(self, api_client, auth_header, other_organization):
        oclub = make_club(other_organization, name='Otro Club')
        oteam_a = make_team(oclub, name='OA')
        oteam_b = make_team(oclub, name='OB')
        ocourt = make_court(oclub)
        other_tour = make_tournament(other_organization)
        other_stage = make_stage(other_tour)
        m = make_match(other_stage, oteam_a, oteam_b, court=ocourt, status='PREPARATION')
        res = _finish(api_client, auth_header, m.id, sets_3_0_local())
        assert res.status_code == 404
        assert Match.objects.get(id=m.id).status == 'PREPARATION'


@pytest.mark.django_db
class TestMatchFinishViewExtras:
    def test_scores_alias(self, api_client, auth_header, match_prep):
        res = api_client.post(
            FINISH_URL,
            data=json.dumps({'match_id': str(match_prep.id), 'scores': sets_3_0_local()}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        match_prep.refresh_from_db()
        assert match_prep.status == 'FINISHED'

    def test_finish_from_in_progress(self, api_client, auth_header, match_prep):
        match_prep.status = 'IN_PROGRESS'
        match_prep.save(update_fields=['status'])
        res = _finish(api_client, auth_header, match_prep.id, sets_3_0_local())
        assert res.status_code == 200
        match_prep.refresh_from_db()
        assert match_prep.status == 'FINISHED'

    def test_unassigned_referee_can_finish(self, api_client, organization, stage, team_a, team_b, court):
        """PIN: if referee_id is None, any REFEREE may finish."""
        ref = make_user(organization=organization, role='REFEREE', email='free_ref@test.com', username='free_ref')
        m = make_match(stage, team_a, team_b, court=court, referee=None, status='PREPARATION')
        res = _finish(api_client, auth_header_for(ref), m.id, sets_3_0_local())
        assert res.status_code == 200

    def test_unassigned_scorer_can_finish(self, api_client, organization, stage, team_a, team_b, court):
        sc = make_user(organization=organization, role='SCORER', email='free_sc@test.com', username='free_sc')
        m = make_match(stage, team_a, team_b, court=court, scorer=None, status='PREPARATION')
        res = _finish(api_client, auth_header_for(sc), m.id, sets_3_0_local())
        assert res.status_code == 200

    def test_invalid_json_body(self, api_client, auth_header):
        res = api_client.post(
            FINISH_URL,
            data='{bad',
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
