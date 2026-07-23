import json
from datetime import timedelta

import pytest
from django.utils import timezone

from core.models import Match
from tests.factories import make_match, make_team, make_tournament, make_user


@pytest.mark.django_db
class TestMatchViewRoleScopedList:
    def test_club_admin_sees_only_own_club_matches(
        self, api_client, club_admin_auth_header, stage, team_a, team_b, team_c, court, court_b
    ):
        mine = make_match(stage, team_a, team_b, court=court)
        other = make_match(stage, team_b, team_c, court=court_b)  # team_c is club Alpha too — use only B vs outside
        # team_b (Beta) vs team from beta only — create team on beta without Alpha
        from tests.factories import make_club, make_court

        # other match: only Beta teams
        team_d = make_team(team_b.club, name='Equipo D')
        only_beta = make_match(stage, team_b, team_d, court=court_b)
        res = api_client.get('/internal/torneos/partidos/', **club_admin_auth_header)
        assert res.status_code == 200
        ids = {str(m['id']) for m in res.json()['data']}
        assert str(mine.id) in ids
        assert str(only_beta.id) not in ids

    def test_coach_sees_coached_teams(
        self, api_client, coach_auth_header, stage, team_a, team_b, team_c, court
    ):
        mine = make_match(stage, team_a, team_b, court=court)
        other = make_match(stage, team_c, team_b, court=court)
        res = api_client.get('/internal/torneos/partidos/', **coach_auth_header)
        ids = {str(m['id']) for m in res.json()['data']}
        assert str(mine.id) in ids
        assert str(other.id) not in ids

    def test_player_sees_team_matches(
        self, api_client, player_user, player_auth_header, stage, team_a, team_b, team_c, court
    ):
        team_a.players.add(player_user)
        mine = make_match(stage, team_a, team_b, court=court)
        other = make_match(stage, team_c, team_b, court=court)
        res = api_client.get('/internal/torneos/partidos/', **player_auth_header)
        ids = {str(m['id']) for m in res.json()['data']}
        assert str(mine.id) in ids
        assert str(other.id) not in ids

    def test_referee_sees_assigned(
        self, api_client, referee_auth_header, referee_user, organization, stage, team_a, team_b, team_c, court
    ):
        mine = make_match(stage, team_a, team_b, court=court, referee=referee_user)
        other_ref = make_user(organization=organization, role='REFEREE', email='r2@t.com', username='r2')
        other = make_match(stage, team_c, team_b, court=court, referee=other_ref)
        res = api_client.get('/internal/torneos/partidos/', **referee_auth_header)
        ids = {str(m['id']) for m in res.json()['data']}
        assert str(mine.id) in ids
        assert str(other.id) not in ids

    def test_scorer_sees_assigned(
        self, api_client, scorer_auth_header, scorer_user, organization, stage, team_a, team_b, team_c, court
    ):
        mine = make_match(stage, team_a, team_b, court=court, scorer=scorer_user)
        other_sc = make_user(organization=organization, role='SCORER', email='s2@t.com', username='s2')
        other = make_match(stage, team_c, team_b, court=court, scorer=other_sc)
        res = api_client.get('/internal/torneos/partidos/', **scorer_auth_header)
        ids = {str(m['id']) for m in res.json()['data']}
        assert str(mine.id) in ids
        assert str(other.id) not in ids


@pytest.mark.django_db
class TestMatchViewFiltersAndMutations:
    def test_upcoming_and_recent(self, api_client, auth_header, stage, team_a, team_b, court):
        future = make_match(
            stage, team_a, team_b, court=court, match_datetime=timezone.now() + timedelta(days=1)
        )
        finished = make_match(
            stage,
            team_b,
            team_a,
            court=court,
            status='FINISHED',
            match_datetime=timezone.now() - timedelta(days=1),
        )
        null_dt = make_match(stage, team_a, team_b, court=court, match_datetime=None, status='PREPARATION')
        finished_null = make_match(
            stage, team_b, team_a, court=court, match_datetime=None, status='FINISHED'
        )
        up = api_client.get('/internal/torneos/partidos/?upcoming=true', **auth_header)
        up_ids = {str(m['id']) for m in up.json()['data']}
        assert str(future.id) in up_ids
        assert str(null_dt.id) in up_ids
        assert str(finished.id) not in up_ids
        assert str(finished_null.id) not in up_ids
        recent = api_client.get('/internal/torneos/partidos/?recent=true', **auth_header)
        recent_ids = {str(m['id']) for m in recent.json()['data']}
        assert str(finished.id) in recent_ids

    def test_tournament_id_other_org_forbidden(
        self, api_client, auth_header, other_organization
    ):
        ot = make_tournament(other_organization)
        res = api_client.get(f'/internal/torneos/partidos/?tournament_id={ot.id}', **auth_header)
        assert res.status_code == 403

    def test_admin_put_status_transitions(self, api_client, auth_header, match_prep):
        for status in ('SUSPENDED', 'CANCELLED', 'IN_PROGRESS', 'PREPARATION'):
            match_prep.status = 'PREPARATION'
            match_prep.save(update_fields=['status'])
            res = api_client.put(
                f'/internal/torneos/partidos/{match_prep.id}/',
                data=json.dumps({'status': status}),
                content_type='application/json',
                **auth_header,
            )
            assert res.status_code == 200
            match_prep.refresh_from_db()
            assert match_prep.status == status

    def test_put_collision(self, api_client, auth_header, stage, team_a, team_b, team_c, club_b, court, court_b):
        dt = timezone.now() + timedelta(days=3)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt)
        team_d = make_team(club_b, name='Equipo D')
        m = make_match(stage, team_c, team_d, court=court_b, match_datetime=dt + timedelta(days=1))
        res = api_client.put(
            f'/internal/torneos/partidos/{m.id}/',
            data=json.dumps({'court_id': court.id, 'match_datetime': dt.isoformat()}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'cancha' in res.json()['error']

    def test_clear_datetime_empty_string(self, api_client, auth_header, match_prep):
        match_prep.match_datetime = timezone.now()
        match_prep.save(update_fields=['match_datetime'])
        res = api_client.put(
            f'/internal/torneos/partidos/{match_prep.id}/',
            data=json.dumps({'match_datetime': ''}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        match_prep.refresh_from_db()
        assert match_prep.match_datetime is None

    def test_put_finished_rejected(self, api_client, referee_auth_header, match_prep):
        res = api_client.put(
            f'/internal/torneos/partidos/{match_prep.id}/',
            data=json.dumps({'status': 'FINISHED'}),
            content_type='application/json',
            **referee_auth_header,
        )
        assert res.status_code == 400
        assert 'finalizar' in res.json()['error']
        match_prep.refresh_from_db()
        assert match_prep.status == 'PREPARATION'

    def test_hard_delete(self, api_client, auth_header, match_prep):
        """PIN: Match delete is hard-delete."""
        mid = match_prep.id
        res = api_client.delete(f'/internal/torneos/partidos/{mid}/', **auth_header)
        assert res.status_code == 200
        assert not Match.objects.filter(id=mid).exists()
