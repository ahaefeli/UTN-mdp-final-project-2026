import json
from datetime import timedelta

import pytest
from django.contrib.auth.hashers import check_password
from django.utils import timezone

from core.models import Club, User
from tests.factories import auth_header_for, make_registration_request, make_user


@pytest.mark.django_db
class TestGenerateLink:
    def test_admin_creates_link(self, api_client, auth_header):
        res = api_client.post(
            '/admin/club-requests/generate-link/',
            data=json.dumps({}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        body = res.json()
        assert 'token' in body
        assert body['data']['role'] == 'CLUB_ADMIN'
        assert body['data']['status'] == 'PENDING'

    def test_admin_custom_role(self, api_client, auth_header):
        res = api_client.post(
            '/admin/club-requests/generate-link/',
            data=json.dumps({'role': 'REFEREE'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        assert res.json()['data']['role'] == 'REFEREE'

    def test_non_admin_forbidden(self, api_client, club_admin_auth_header):
        res = api_client.post(
            '/admin/club-requests/generate-link/',
            data=json.dumps({}),
            content_type='application/json',
            **club_admin_auth_header,
        )
        assert res.status_code == 403

    def test_admin_without_org_forbidden(self, api_client, db):
        orphan = make_user(organization=None, role='ADMIN', email='orphan@t.com', username='orphan')
        res = api_client.post(
            '/admin/club-requests/generate-link/',
            data=json.dumps({}),
            content_type='application/json',
            **auth_header_for(orphan),
        )
        assert res.status_code == 403


@pytest.mark.django_db
class TestPublicRegistration:
    def test_get_valid_token(self, api_client, organization):
        req = make_registration_request(organization)
        res = api_client.get(f'/public/club-registration/?token={req.token}')
        assert res.status_code == 200
        assert res.json()['message'] == 'Token is valid'

    def test_get_missing_token(self, api_client):
        assert api_client.get('/public/club-registration/').status_code == 400

    def test_get_invalid_token(self, api_client):
        res = api_client.get('/public/club-registration/?token=not-real')
        assert res.status_code == 400

    def test_get_expired(self, api_client, organization):
        req = make_registration_request(
            organization, expires_at=timezone.now() - timedelta(hours=1)
        )
        res = api_client.get(f'/public/club-registration/?token={req.token}')
        assert res.status_code == 400
        assert 'venció' in res.json()['error']

    def test_get_non_pending(self, api_client, organization):
        req = make_registration_request(organization, status='APPROVED')
        res = api_client.get(f'/public/club-registration/?token={req.token}')
        assert res.status_code == 400

    def test_post_saves_and_hashes_password(self, api_client, organization):
        req = make_registration_request(organization)
        res = api_client.post(
            '/public/club-registration/',
            data=json.dumps({
                'token': req.token,
                'club_name': 'Nuevo Club',
                'admin_email': 'newadmin@test.com',
                'admin_username': 'newadmin',
                'admin_first_name': 'Nuevo',
                'admin_last_name': 'Admin',
                'password': 'secret123',
            }),
            content_type='application/json',
        )
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.club_name == 'Nuevo Club'
        assert req.admin_email == 'newadmin@test.com'
        assert req.submitted_at is not None
        assert req.status == 'PENDING'
        assert check_password('secret123', req.password)

        again = api_client.get(f'/public/club-registration/?token={req.token}')
        assert again.status_code == 400
        assert 'utilizado' in again.json()['error']

        replay = api_client.post(
            '/public/club-registration/',
            data=json.dumps({
                'token': req.token,
                'club_name': 'Otro nombre',
                'admin_email': 'other@test.com',
                'password': 'secret123',
            }),
            content_type='application/json',
        )
        assert replay.status_code == 400
        req.refresh_from_db()
        assert req.club_name == 'Nuevo Club'

    def test_post_duplicate_email(self, api_client, organization, admin_user):
        req = make_registration_request(organization)
        res = api_client.post(
            '/public/club-registration/',
            data=json.dumps({
                'token': req.token,
                'admin_email': admin_user.email,
                'club_name': 'X',
            }),
            content_type='application/json',
        )
        assert res.status_code == 400
        assert 'Ya existe' in res.json()['error']

    def test_post_missing_admin_email(self, api_client, organization):
        req = make_registration_request(organization)
        res = api_client.post(
            '/public/club-registration/',
            data=json.dumps({'token': req.token, 'club_name': 'X'}),
            content_type='application/json',
        )
        assert res.status_code == 400


@pytest.mark.django_db
class TestReviewClubRequest:
    def test_approve_club_creates_club_and_admin(self, api_client, auth_header, organization):
        req = make_registration_request(
            organization,
            club_name='Club Aprobado',
            admin_email='approved@test.com',
            admin_username='approved',
            password_raw='pass123',
        )
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'APPROVE'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == 'APPROVED'
        assert Club.objects.filter(name='Club Aprobado', organization=organization).exists()
        assert User.objects.filter(email='approved@test.com', role='CLUB_ADMIN').exists()

    def test_approve_referee(self, api_client, auth_header, organization):
        req = make_registration_request(
            organization,
            role='REFEREE',
            admin_email='refnew@test.com',
            admin_username='refnew',
            password_raw='pass123',
        )
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'APPROVE'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        assert User.objects.filter(email='refnew@test.com', role='REFEREE').exists()
        assert not Club.objects.filter(email='refnew@test.com').exists()

    def test_approve_scorer(self, api_client, auth_header, organization):
        req = make_registration_request(
            organization,
            role='SCORER',
            admin_email='scnew@test.com',
            admin_username='scnew',
            password_raw='pass123',
        )
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'APPROVE'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        assert User.objects.filter(email='scnew@test.com', role='SCORER').exists()

    def test_reject(self, api_client, auth_header, organization):
        req = make_registration_request(organization, club_name='X', admin_email='r@t.com')
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'REJECT'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == 'REJECTED'

    def test_already_processed(self, api_client, auth_header, organization):
        req = make_registration_request(
            organization, status='REJECTED', club_name='X', admin_email='r@t.com'
        )
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'APPROVE'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400

    def test_non_admin_review_forbidden(self, api_client, club_admin_auth_header, organization):
        req = make_registration_request(organization, club_name='X', admin_email='r@t.com')
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'APPROVE'}),
            content_type='application/json',
            **club_admin_auth_header,
        )
        assert res.status_code == 403

    def test_approve_duplicate_dni(self, api_client, auth_header, organization):
        make_user(
            organization=organization,
            role='PLAYER',
            email='existing@test.com',
            username='existing_dni',
            dni='44591332',
        )
        req = make_registration_request(
            organization,
            club_name='Club Duplicado',
            admin_email='newadmin@test.com',
            admin_username='newadmin',
            password_raw='pass123',
            admin_dni='44591332',
        )
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'APPROVE'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        error = res.json()['error']
        assert '44591332' in error
        assert 'core_user_dni_key' not in error
        assert 'Transaction failed' not in error
        req.refresh_from_db()
        assert req.status == 'PENDING'
        assert not Club.objects.filter(name='Club Duplicado').exists()
        assert not User.objects.filter(email='newadmin@test.com').exists()

    def test_incomplete_club_approve(self, api_client, auth_header, organization):
        req = make_registration_request(organization, club_name=None, admin_email=None)
        res = api_client.post(
            f'/admin/club-requests/{req.id}/review/',
            data=json.dumps({'action': 'APPROVE'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400


@pytest.mark.django_db
class TestInviteRevokeAndDuplicateDni:
    def test_unused_link_can_be_revoked(self, api_client, auth_header):
        created = api_client.post(
            '/admin/club-requests/generate-link/',
            data=json.dumps({'role': 'REFEREE'}),
            content_type='application/json',
            **auth_header,
        )
        assert created.status_code == 201
        token = created.json()['token']
        req_id = created.json()['data']['id']
        listed = api_client.get(
            '/admin/club-requests/?unused=1&role=REFEREE',
            **auth_header,
        )
        assert any(item['token'] == token for item in listed.json()['data'])

        revoked = api_client.post(
            f'/admin/club-requests/{req_id}/review/',
            data=json.dumps({'action': 'REJECT'}),
            content_type='application/json',
            **auth_header,
        )
        assert revoked.status_code == 200
        again = api_client.get(f'/public/club-registration/?token={token}')
        assert again.status_code == 400
        assert 'disponible' in again.json()['error']

    def test_public_form_rejects_duplicate_dni(self, api_client, organization):
        make_user(
            organization=organization,
            role='PLAYER',
            email='dni-owner@test.com',
            username='dni_owner',
            dni='35123456',
        )
        req = make_registration_request(organization)
        res = api_client.post(
            '/public/club-registration/',
            data=json.dumps({
                'token': req.token,
                'club_name': 'Otro',
                'admin_email': 'fresh-dni@test.com',
                'admin_username': 'fresh_dni',
                'admin_dni': '35.123.456',
            }),
            content_type='application/json',
        )
        assert res.status_code == 400
        assert 'DNI' in res.json()['error']
