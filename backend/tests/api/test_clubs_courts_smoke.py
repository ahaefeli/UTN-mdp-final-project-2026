import json

import pytest

from tests.factories import make_club, make_court


@pytest.mark.django_db
class TestClubsCourtsSmoke:
    def test_create_and_list_club(self, api_client, auth_header, organization):
        res = api_client.post(
            '/internal/clubes/',
            data=json.dumps({'name': 'Club Nuevo', 'organization_id': organization.id}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        listed = api_client.get('/internal/clubes/', **auth_header)
        assert listed.status_code == 200
        assert any(c['name'] == 'Club Nuevo' for c in listed.json()['data'])

    def test_club_get_by_id_cross_org_forbidden(
        self, api_client, auth_header, other_organization
    ):
        foreign = make_club(other_organization, name='Extranjero')
        res = api_client.get(f'/internal/clubes/{foreign.id}/', **auth_header)
        assert res.status_code == 404

    def test_court_crud_and_filter(self, api_client, auth_header, club):
        res = api_client.post(
            '/internal/canchas/',
            data=json.dumps({'club_id': str(club.id), 'name': 'Cancha Nueva', 'enabled': True}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        cid = res.json()['data']['id']
        listed = api_client.get(f'/internal/canchas/?club_id={club.id}', **auth_header)
        assert any(c['id'] == cid for c in listed.json()['data'])
        toggled = api_client.put(
            f'/internal/canchas/{cid}/',
            data=json.dumps({'enabled': False}),
            content_type='application/json',
            **auth_header,
        )
        assert toggled.status_code == 200
        assert toggled.json()['data']['enabled'] is False
