import json

import pytest

from core.models import Team
from tests.factories import make_team, make_user


@pytest.mark.django_db
class TestTeamGenderRules:
    def test_reject_player_without_gender(self, api_client, auth_header, team_a, organization, club):
        p = make_user(
            organization=organization, role='PLAYER', email='nog@t.com', username='nog', club=club, gender=None
        )
        res = api_client.put(
            f'/internal/equipos/{team_a.id}/',
            data=json.dumps({'players': [str(p.id)]}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'género' in res.json()['error']

    def test_reject_female_on_male_branch(self, api_client, auth_header, team_a, organization, club):
        p = make_user(
            organization=organization, role='PLAYER', email='f@t.com', username='fem', club=club, gender='F'
        )
        res = api_client.put(
            f'/internal/equipos/{team_a.id}/',
            data=json.dumps({'players': [str(p.id)]}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'MASCULINA' in res.json()['error']

    def test_accept_matching_gender(self, api_client, auth_header, team_a, player_user):
        res = api_client.put(
            f'/internal/equipos/{team_a.id}/',
            data=json.dumps({'players': [str(player_user.id)]}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        assert team_a.players.filter(id=player_user.id).exists()

    def test_existing_player_not_revalidated_on_delta(
        self, api_client, auth_header, team_a, organization, club, player_user
    ):
        # Pre-assign player without going through API (simulates legacy data)
        bad = make_user(
            organization=organization, role='PLAYER', email='legacy@t.com', username='legacy', club=club, gender='F'
        )
        team_a.players.add(bad)
        # Re-send same roster + new valid player — only new_ids validated
        res = api_client.put(
            f'/internal/equipos/{team_a.id}/',
            data=json.dumps({'players': [str(bad.id), str(player_user.id)]}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200


@pytest.mark.django_db
class TestTeamSoftDeleteAndScope:
    def test_soft_delete(self, api_client, auth_header, team_a):
        res = api_client.delete(f'/internal/equipos/{team_a.id}/', **auth_header)
        assert res.status_code == 200
        team_a.refresh_from_db()
        assert team_a.is_deleted is True
        assert Team.objects.filter(id=team_a.id).exists()

    def test_get_excludes_deleted(self, api_client, auth_header, team_a):
        team_a.is_deleted = True
        team_a.save(update_fields=['is_deleted'])
        res = api_client.get(f'/internal/equipos/{team_a.id}/', **auth_header)
        assert res.status_code == 404
        listed = api_client.get('/internal/equipos/', **auth_header)
        ids = {t['id'] for t in listed.json()['data']}
        assert str(team_a.id) not in ids

    def test_club_admin_cannot_see_other_club_team(
        self, api_client, club_admin_auth_header, team_b
    ):
        res = api_client.get(f'/internal/equipos/{team_b.id}/', **club_admin_auth_header)
        assert res.status_code == 403

    def test_club_admin_list_only_own_club(
        self, api_client, club_admin_auth_header, team_a, team_b
    ):
        res = api_client.get('/internal/equipos/', **club_admin_auth_header)
        ids = {t['id'] for t in res.json()['data']}
        assert str(team_a.id) in ids
        assert str(team_b.id) not in ids

    def test_club_admin_forced_club_on_create(
        self, api_client, club_admin_auth_header, club, club_b, organization
    ):
        res = api_client.post(
            '/internal/equipos/',
            data=json.dumps({
                'club_id': str(club_b.id),
                'organization_id': str(organization.id),
                'name': 'Forzado',
                'category': 'PRIMERA',
                'branch': 'MALE',
            }),
            content_type='application/json',
            **club_admin_auth_header,
        )
        assert res.status_code == 201
        assert res.json()['data']['club_id'] == str(club.id)
