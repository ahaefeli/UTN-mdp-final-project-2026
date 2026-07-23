import pytest

from tests.factories import make_match, make_tournament


@pytest.mark.django_db
class TestPublicLists:
    def test_public_tournaments_filters(self, api_client, organization, tournament, other_organization):
        make_tournament(other_organization, name='Externo', year=2025, category='SUB_14')
        res = api_client.get(f'/public/torneos/?organization_id={organization.id}&year=2026')
        assert res.status_code == 200
        data = res.json()['data']
        assert all(t['organization_id'] == organization.id for t in data)
        assert all(t['year'] == 2026 for t in data)

    def test_public_tournaments_status_filter(self, api_client, tournament):
        res = api_client.get('/public/torneos/?status=PREPARATION')
        assert res.status_code == 200
        assert all(t['status'] == 'PREPARATION' for t in res.json()['data'])

    def test_public_organizations(self, api_client, organization, other_organization):
        res = api_client.get('/public/organizaciones/')
        assert res.status_code == 200
        names = {o['name'] for o in res.json()['data']}
        assert organization.name in names
        assert other_organization.name in names

    def test_public_matches_requires_tournament_id(self, api_client):
        res = api_client.get('/public/partidos/')
        assert res.status_code == 400

    def test_public_matches_list(self, api_client, tournament, stage, team_a, team_b, court):
        make_match(stage, team_a, team_b, court=court, status='FINISHED', score_summary='3-0')
        res = api_client.get(f'/public/partidos/?tournament_id={tournament.id}')
        assert res.status_code == 200
        data = res.json()['data']
        assert len(data) == 1
        assert data[0]['local_team_name'] == 'Equipo A'
        assert data[0]['score_summary'] == '3-0'
        assert 'local_club_logo_url' in data[0]
