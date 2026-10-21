import json

import pytest

from tests.factories import make_user


@pytest.mark.django_db
class TestUsersRbac:
    def test_page_size(self, api_client, auth_header, organization):
        for i in range(12):
            make_user(
                organization=organization,
                role='PLAYER',
                username=f'paged_player_{i}',
                email=f'paged_player_{i}@test.com',
            )

        page_10 = api_client.get('/internal/usuarios/?page=1&page_size=10', **auth_header)
        assert page_10.status_code == 200
        body_10 = page_10.json()
        assert len(body_10['data']) == 10
        assert body_10['pagination']['page_size'] == 10
        assert body_10['pagination']['total_items'] >= 12

        page_20 = api_client.get('/internal/usuarios/?page=1&page_size=20', **auth_header)
        assert page_20.status_code == 200
        body_20 = page_20.json()
        assert body_20['pagination']['page_size'] == 20
        assert len(body_20['data']) >= 12

        invalid = api_client.get('/internal/usuarios/?page=1&page_size=15', **auth_header)
        assert invalid.status_code == 200
        assert invalid.json()['pagination']['page_size'] == 10
        assert len(invalid.json()['data']) == 10

    def test_admin_list_excludes_admins(self, api_client, auth_header, admin_user, player_user, coach_user):
        res = api_client.get('/internal/usuarios/', **auth_header)
        assert res.status_code == 200
        roles = {u['role'] for u in res.json()['data']}
        assert 'ADMIN' not in roles
        assert 'PLAYER' in roles or 'COACH' in roles
        for u in res.json()['data']:
            assert 'password' not in u

    def test_club_admin_list_only_coach_player(
        self, api_client, club_admin_auth_header, player_user, coach_user, referee_user
    ):
        res = api_client.get('/internal/usuarios/', **club_admin_auth_header)
        roles = {u['role'] for u in res.json()['data']}
        assert roles <= {'COACH', 'PLAYER'}
        assert 'REFEREE' not in roles

    def test_coach_list_only_players(self, api_client, coach_auth_header, player_user, club_admin_user):
        res = api_client.get('/internal/usuarios/', **coach_auth_header)
        for u in res.json()['data']:
            assert u['role'] == 'PLAYER'

    def test_club_admin_cannot_create_admin(
        self, api_client, club_admin_auth_header, organization, club
    ):
        res = api_client.post(
            '/internal/usuarios/',
            data=json.dumps({
                'role': 'ADMIN',
                'user': 'badadmin',
                'password': 'x',
                'organization_id': str(organization.id),
                'dni': '999',
            }),
            content_type='application/json',
            **club_admin_auth_header,
        )
        assert res.status_code == 403

    def test_coach_can_create_player(self, api_client, coach_auth_header, organization, club):
        res = api_client.post(
            '/internal/usuarios/',
            data=json.dumps({
                'role': 'PLAYER',
                'user': 'newplayer',
                'password': 'pass1234',
                'organization_id': str(organization.id),
                'dni': '88800111',
                'name': 'Nuevo Player',
                'email': 'newplayer@test.com',
            }),
            content_type='application/json',
            **coach_auth_header,
        )
        assert res.status_code == 201
        assert res.json()['data']['role'] == 'PLAYER'
        assert 'password' not in res.json()['data']

    def test_club_admin_cannot_edit_player(
        self, api_client, club_admin_auth_header, player_user
    ):
        res = api_client.put(
            f'/internal/usuarios/{player_user.id}/',
            data=json.dumps({'name': 'Hacked'}),
            content_type='application/json',
            **club_admin_auth_header,
        )
        assert res.status_code == 403

    def test_club_admin_cannot_elevate_role(
        self, api_client, club_admin_auth_header, coach_user
    ):
        res = api_client.put(
            f'/internal/usuarios/{coach_user.id}/',
            data=json.dumps({'role': 'ADMIN'}),
            content_type='application/json',
            **club_admin_auth_header,
        )
        assert res.status_code == 403

    def test_enable_admin_only(self, api_client, club_admin_auth_header, coach_user):
        res = api_client.put(
            f'/internal/usuarios/{coach_user.id}/',
            data=json.dumps({'enable': False}),
            content_type='application/json',
            **club_admin_auth_header,
        )
        assert res.status_code == 403

    def test_club_admin_cannot_delete_player(
        self, api_client, club_admin_auth_header, player_user
    ):
        res = api_client.delete(f'/internal/usuarios/{player_user.id}/', **club_admin_auth_header)
        assert res.status_code == 403
