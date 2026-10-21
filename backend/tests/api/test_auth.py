import json
import uuid

import jwt
import pytest
from django.conf import settings

from tests.factories import auth_header_for, make_club, make_team, make_user


@pytest.mark.django_db
class TestLoginView:
    def test_login_success(self, api_client, admin_user):
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': 'admin@test.com', 'password': 'testpass123'}),
            content_type='application/json',
        )
        assert res.status_code == 200
        body = res.json()
        assert 'token' in body
        assert body['user']['email'] == 'admin@test.com'
        assert body['user']['role'] == 'ADMIN'
        payload = jwt.decode(body['token'], settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['user_id'] == str(admin_user.id)

    def test_invalid_credentials(self, api_client, admin_user):
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': 'admin@test.com', 'password': 'wrong'}),
            content_type='application/json',
        )
        assert res.status_code == 401

    def test_invalid_json(self, api_client):
        res = api_client.post('/auth/login/', data='{bad', content_type='application/json')
        assert res.status_code == 400

    def test_missing_fields(self, api_client):
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': 'admin@test.com'}),
            content_type='application/json',
        )
        assert res.status_code == 400

    def test_deleted_user_cannot_login(self, api_client, organization):
        make_user(
            organization=organization,
            role='ADMIN',
            email='gone@test.com',
            username='gone',
            is_deleted=True,
        )
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': 'gone@test.com', 'password': 'testpass123'}),
            content_type='application/json',
        )
        assert res.status_code == 401
        assert res.json()['error'] == 'Credenciales inválidas'

    def test_login_with_dni(self, api_client, organization):
        make_user(
            organization=organization,
            role='COACH',
            email='coach-dni@test.com',
            username='coach_dni',
            dni='35123456',
        )
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': '35.123.456', 'password': 'testpass123'}),
            content_type='application/json',
        )
        assert res.status_code == 200
        assert res.json()['user']['username'] == 'coach_dni'

    def test_login_with_username(self, api_client, admin_user):
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': admin_user.username, 'password': 'testpass123'}),
            content_type='application/json',
        )
        assert res.status_code == 200
        assert res.json()['user']['email'] == 'admin@test.com'

    def test_missing_fields_message_in_spanish(self, api_client):
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({}),
            content_type='application/json',
        )
        assert res.status_code == 400
        assert 'obligatorios' in res.json()['error']


@pytest.mark.django_db
class TestJwtRequired:
    def test_missing_header(self, api_client):
        res = api_client.get('/internal/torneos/partidos/')
        assert res.status_code == 401
        assert 'Falta iniciar sesión' in res.json()['error']

    def test_bad_format(self, api_client, admin_user):
        res = api_client.get(
            '/internal/torneos/partidos/',
            HTTP_AUTHORIZATION='Token abc',
        )
        assert res.status_code == 401

    def test_expired_token(self, api_client, admin_user):
        headers = auth_header_for(admin_user, expired=True)
        res = api_client.get('/internal/torneos/partidos/', **headers)
        assert res.status_code == 401
        assert 'venció' in res.json()['error'].lower()

    def test_invalid_token(self, api_client):
        res = api_client.get(
            '/internal/torneos/partidos/',
            HTTP_AUTHORIZATION='Bearer not.a.jwt',
        )
        assert res.status_code == 401

    def test_deleted_user_token_rejected(self, api_client, organization):
        user = make_user(organization=organization, role='ADMIN', email='del@test.com', username='del')
        headers = auth_header_for(user)
        user.is_deleted = True
        user.save(update_fields=['is_deleted'])
        res = api_client.get('/internal/torneos/partidos/', **headers)
        assert res.status_code == 401

    def test_valid_token_allows_access(self, api_client, auth_header):
        res = api_client.get('/internal/torneos/partidos/', **auth_header)
        assert res.status_code == 200
        assert 'data' in res.json()

    def test_token_with_missing_user_id(self, api_client):
        token = jwt.encode(
            {'email': 'x@test.com', 'role': 'ADMIN'},
            settings.SECRET_KEY,
            algorithm='HS256',
        )
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        res = api_client.get(
            '/internal/torneos/partidos/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        assert res.status_code == 401

    def test_token_for_nonexistent_user(self, api_client):
        token = jwt.encode(
            {'user_id': str(uuid.uuid4()), 'email': 'x@test.com', 'role': 'ADMIN'},
            settings.SECRET_KEY,
            algorithm='HS256',
        )
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        res = api_client.get(
            '/internal/torneos/partidos/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        assert res.status_code == 401


@pytest.mark.django_db
class TestLoginExtras:
    def test_login_includes_club_id(self, api_client, organization, club):
        club.logo_url = 'https://cdn.example/club.png'
        club.save(update_fields=['logo_url'])
        make_user(
            organization=organization,
            role='CLUB_ADMIN',
            email='withclub@test.com',
            username='withclub',
            club=club,
        )
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': 'withclub@test.com', 'password': 'testpass123'}),
            content_type='application/json',
        )
        assert res.status_code == 200
        body = res.json()['user']
        assert body['club_id'] == str(club.id)
        assert body['club_name'] == club.name
        assert body['club_logo_url'] == 'https://cdn.example/club.png'

    def test_login_resolves_club_logo_from_player_team(self, api_client, organization):
        club = make_club(organization, name='Club Huracán')
        club.logo_url = 'https://cdn.example/huracan.png'
        club.save(update_fields=['logo_url'])
        player = make_user(
            organization=organization,
            role='PLAYER',
            email='player@test.com',
            username='player_team',
            club=None,
        )
        team = make_team(club, name='Primera')
        team.players.add(player)

        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': 'player@test.com', 'password': 'testpass123'}),
            content_type='application/json',
        )
        assert res.status_code == 200
        body = res.json()['user']
        assert body['club_id'] == str(club.id)
        assert body['club_name'] == 'Club Huracán'
        assert body['club_logo_url'] == 'https://cdn.example/huracan.png'

    def test_login_username_fallback_when_email_missing_as_username(self, api_client, organization):
        # User whose username equals the login email string but email field differs —
        # LoginView looks up by email first; if not found uses email as username.
        make_user(
            organization=organization,
            role='ADMIN',
            email='unique_email@test.com',
            username='fallback_login@test.com',
        )
        res = api_client.post(
            '/auth/login/',
            data=json.dumps({'email': 'fallback_login@test.com', 'password': 'testpass123'}),
            content_type='application/json',
        )
        # email lookup fails → username=email fallback → authenticate by username succeeds
        assert res.status_code == 200
